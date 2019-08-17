var fs = require('fs');
var md5 = require('./md5');

var Chat = {};

Chat.users = {}; /*объект для хранения ников и id сокетов*/
Chat.messages = []; /*массив для хранения сообщений*/
Chat.MAX_COUNT_MESS = 1000; /*максимальное количество хранимых сообщений*/
Chat.MSEC_IN_HOUR = 3600000; /*миллисекунд в часах*/
Chat.files_meta = []; /*массив для хранения метаданных файлов*/
Chat.USERS_FILES_DIR = 'users_files'; /*каталог пересылаемых файлов*/

/**
 * добавление нового пользователя к чату
 * @param nicname
 * @returns {boolean}
 */
Chat.addUser = function(nicname){
    for(key in Chat.users){
        if (key == nicname){
            return false;
        }
    }
    Chat.users[nicname] = {'socket': null};
    return true;
}

/**
 * обновление socket id при переподключениии пользователя
 * @param nicname
 * @param socketId
 */
Chat.refreshSocket = function(nicname, socket){
    Chat.users[nicname] = {'socket': null};
    Chat.users[nicname].socket = socket;
}

/**
 * получение ника по socket id
 * @param socketId
 * @returns {*}
 */
Chat.getNicname = function(socketId){
    for (nicname in Chat.users){
        if (Chat.users[nicname].socket.id == socketId){
            return nicname;
        }
    }
    return null;
}

/**
 * удаление пользователя с заданным socket id из чата
 * @param socketId
 */
Chat.removeUser = function(socketId){
    for (nicname in Chat.users){
        if (Chat.users[nicname].socket.id == socketId){
            delete Chat.users[nicname];
        }
    }
}

/**
 * получение массива ников подключенных к чату пользователей
 * @returns {Array}
 */
Chat.getUsersOnline = function(){
    users = [];
    for(nicname in Chat.users){
        users.push(nicname);
    }
    return users;
}

/**
 * получение socket id по нику пользователя
 * @param nicname
 * @returns {*}
 */
Chat.getSocketId = function(nicname){
    if (Chat.users[nicname] != undefined){
        return Chat.users[nicname].socket.id;
    }else{
        return null;
    }
};

/**
 * получение объекта socket по нику пользователя
 * @param nicname
 * @returns {*}
 */
Chat.getSocket = function(nicname){
    if (Chat.users[nicname] != undefined){
        return Chat.users[nicname].socket;
    }else{
        return null;
    }
};



/**
 * добавление сообщения в массив
 * @param from
 * @param to
 * @param message
 */
Chat.addMessage = function(from, to, message){
    var timestamp = (new Date()).getTime();
    var message = {created: timestamp, from:from,to:to,message:message};
    Chat.messages.push(message);
    if (Chat.messages.length > Chat.MAX_COUNT_MESS){
        Chat.splice(0, Chat.messages.length - Chat.MAX_COUNT_MESS)
    }
    return message;
};

/**
 * получение массива сообщений между двумя пользователями
 * @param user1
 * @param user2
 * @param lefttime ширина временного интервала сообщений в часах
 * @returns {Array}
 */
Chat.getLastMessages = function(user1, user2, lefttime){
    var messages = [];
    var now = (new Date).getTime();
    for (var i = 0; i < Chat.messages.length; i++){
        if (Chat.messages[i]['created'] < (now - lefttime * Chat.MSEC_IN_HOUR)) continue;
        if (
            (Chat.messages[i]['from'] == user1 && Chat.messages[i]['to'] == user2) ||
            (Chat.messages[i]['from'] == user2 && Chat.messages[i]['to'] == user1)
        ){
            messages.push(Chat.messages[i]);
        }
    }
    return messages;
}

/**
 * запись пересылаемого файла
 * @param from от кого
 * @param to кому
 * @param fname имя файла
 * @param fdata тело файла
 * @param callback функция обратного вызова в которую передается результат
 */
Chat.saveFile = function(from, to, fname, buffer, callback){
    var encname = new Buffer(fname);
    encname = encname.toString('base64');
    encname = encname.replace('/', '-');
    var filename = Chat.USERS_FILES_DIR + '/' + encname;

    fs.writeFile(filename, buffer, function(err){
        if (!err){
            fs.stat(filename, function(err, info){
                if (err){
                    callback(false);
                    return;
                }
                var timestamp = (new Date()).getTime();
                var fsize = info['size'];
                var secret = md5([from, to, encname, fsize].join(''));
                if (!Chat.isFileMetadataExists(from, to, encname, fsize)){
                    Chat.files_meta.push({from:from, to:to, origname: fname, encname: encname, created: timestamp, fsize:fsize, secret: secret});
                }
                callback(fsize);
            });
        }else{
            console.log(err);
            callback(false);
            return;
        }
    });
}

/**
 * есть ли уже запись с такими метаданными
 * @param from
 * @param to
 * @param encname
 * @param fsize
 * @returns {boolean}
 */
Chat.isFileMetadataExists = function(from, to, encname, fsize){
    for(var i = 0; i < Chat.files_meta; i++){
        if (Chat.files_meta[i]['from'] == from &&
            Chat.files_meta[i]['to'] == to &&
            Chat.files_meta[i]['encname'] == encname &&
            Chat.files_meta[i]['fsize'] == fsize) return true;
    }
    return false;
};

/**
 * получение метаданных файлов для юзера с заданным Nicname
 * @param nicname
 * @returns {Array}
 */
Chat.getFilesMetadataByNicname = function(nicname){
    var res = [];
    for (var i = 0; i < Chat.files_meta.length; i++){
        if (Chat.files_meta[i]['to'] == nicname){
            if (fs.existsSync(Chat.USERS_FILES_DIR + '/' + Chat.files_meta[i]['encname'])){
                res.push(Chat.files_meta[i]);
            }
        }
    }
    return res;
};

/**
 * получение метаданных файла с заланным secret
 * @param secret
 * @returns file_metadata
 */
Chat.getFileMetadataBySecret = function(secret){
    for (var i = 0; i < Chat.files_meta.length; i++){
        if (Chat.files_meta[i]['secret'] == secret){
            return Chat.files_meta[i];
        }
    }
    return null;
};

/**
 * удаление метаданных файла с заланным secret
 * @param secret
 * @returns file_metadata
 */
Chat.delFileMetadataBySecret = function(secret){
    var i = 0;
    while(i < Chat.files_meta.length){
        if (Chat.files_meta[i]['secret'] == secret){
            Chat.files_meta.splice(i,1);
        }else{
            i++;
        }
    }
};


exports.addUser = Chat.addUser;
exports.refreshSocket = Chat.refreshSocket;
exports.getNicname = Chat.getNicname;
exports.removeUser = Chat.removeUser;
exports.getUsersOnline = Chat.getUsersOnline;
exports.getSocketId = Chat.getSocketId;
exports.getSocket = Chat.getSocket;
exports.addMessage = Chat.addMessage;
exports.getLastMessages = Chat.getLastMessages;
exports.saveFile = Chat.saveFile;
exports.getFilesMetadataByNicname = Chat.getFilesMetadataByNicname;
exports.getFileMetadataBySecret = Chat.getFileMetadataBySecret;
exports.USERS_FILES_DIR = Chat.USERS_FILES_DIR;
exports.delFileMetadataBySecret = Chat.delFileMetadataBySecret;
