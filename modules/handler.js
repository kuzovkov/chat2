/*серверный модуль обработчиков событий при взаимодействии клиентов и сервера*/
var httpRequest = require('./httprequest');
var fs = require('fs');

function getIce(){
    var b = (fs.existsSync('ice.json'))? new Buffer(fs.readFileSync('ice.json', 'utf8')) : new Buffer('null');
    return b.toString('base64');
}

function user_connect(socket, chat){
    socket.on('user_connect', function(data){
        var nicname = data.nicname;
        chat.refreshSocket(nicname, socket);
        var users_online = chat.getUsersOnline();
        console.log(users_online);
        socket.broadcast.emit('new_user', {'user':nicname});
        socket.broadcast.emit('users_online', {users_online:users_online});
        socket.emit('users_online', {users_online:users_online, ice: getIce()});
    });
}


function user_disconnect(socket, chat){
    socket.on('disconnect', function(){
        var nicname = chat.getNicname(socket.id);
        console.log('user '+ nicname + ' was disconnected');
        chat.removeUser(socket.id);
        socket.broadcast.emit('user_disconnected', {user: nicname});
        var users_online = chat.getUsersOnline();
        socket.emit('users_online', {users_online:users_online});
        socket.broadcast.emit('users_online', {users_online:users_online});
    });
}

function user_message(socket, chat){
    socket.on('user_message', function(data){
        console.log(data);
        var nicname = chat.getNicname(socket.id);
        var adresat_id = chat.getSocketId(data.to);
        var messageObject = chat.addMessage(nicname, data.to, data.message);
        socket.broadcast.to(adresat_id).emit('new_message', {message:messageObject});
        socket.emit('new_message', {message:messageObject});
    });
}

function message_history(socket, chat){
    socket.on('message_history', function(data){
        var messages = chat.getLastMessages(data.user1, data.user2, data.lefttime);
        socket.emit('last_messages', {messages:messages});
    });
}


function request_files(socket, chat){
    socket.on('request_files', function(data){
        var nicname = chat.getNicname(socket.id);
        var files_meta = chat.getFilesMetadataByNicname(nicname);
        socket.emit('you_files', {files: files_meta});
    });
}

function wrtc_message(socket, chat){
    socket.on('wrtc_message', function(data){
        var nicname = chat.getNicname(socket.id);
        var adresat_id = chat.getSocketId(data.to);
        var message = data.message;
        socket.broadcast.to(adresat_id).emit('wrtc_message', {message:message, from: nicname});
    });
}



exports.user_connect = user_connect;
exports.user_disconnect = user_disconnect;
exports.user_message = user_message;
exports.message_history = message_history;
exports.request_files = request_files;
exports.wrtc_message = wrtc_message;