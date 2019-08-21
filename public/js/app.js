var A = {};
A.nicname = null;
A.selected_user = null;

/**
 * инициализация приложения
 **/
A.init = function(){
    A.socket = Socket;
    A.io = io;
    A.socket.init(A);
    A.files = F;
    A.files.init(A);
    A.filesp2p = Fp2p;
    A.filesp2p.init(A);
    A.wrtc = WRTC;
    A.wrtc.init(A);
    A.setEventHandlers();
    A.iface = I;
    A.iface.init(A);
    A.au = AU;
    A.au.init(A);

};

/**
 * Установка обработчиков на события рассылаемые сервером
 **/
A.setEventHandlers= function(){
    A.socket.setEventHandler('connect', A.connect);
    A.socket.setEventHandler('disconnect', A.disconnect);
    A.socket.setEventHandler('new_message', A.newMessage);
    A.socket.setEventHandler('new_user', A.newUser);
    A.socket.setEventHandler('user_disconnected', A.userLost);
    A.socket.setEventHandler('users_online', A.refreshUsersOnline);
    A.socket.setEventHandler('last_messages', A.lastMessages);
    A.socket.setEventHandler('have_file', A.haveFile);
    A.socket.setEventHandler('file_accepted', A.fileAccepted);
    A.socket.setEventHandler('you_files', A.incomingFiles);
    A.socket.setEventHandler('wrtc_message', A.gotWRTCMessage);
    A.socket.setEventHandler('upload_error', A.uploadError);
};

/**
 * обработчик события connect
 **/
A.connect = function(){
    A.socket.send('user_connect', {nicname: A.nicname});
};

/**
 * обработчик события disconnect
 * перезагрузка страницы
 **/
A.disconnect = function(){
    window.location.reload(true);
};

/**
 * отправка сообщения в чат
 * @param message
 */
A.sendUserMessage = function(message){
    if (A.selected_user == null) return;
    /**если сообщение пользователю с которым на созвоне посылаем сообщение через p2p иначе через сервер**/
    if (A.wrtc.chat_datachannel != null && A.selected_user == A.wrtc.selected_user){
        var timestamp = (new Date()).getTime();
        var messageObject = {created: timestamp, from: WRTC.app.nicname, to: WRTC.selected_user, message:message};
        A.iface.addMessage(messageObject);
        A.wrtc.chat_datachannel.send(message);
        console.log('send message p2p');
    }else{
        A.socket.send('user_message', {message: message, to:A.selected_user});
        console.log('send message across server');
    }
};

/**
 * обработка приема нового сообщения чата
 * @param data
 */
A.newMessage = function(data){
    A.iface.addMessage(data.message);
};

/**
 * обработка события присоединения нового пользователя к чату
 * @param data
 */
A.newUser = function(data){
    var mess = 'New user ' + data.user + ' was connected!';
    A.serverMessage(mess);
};

/**
 * обработка события отключения пользователя от чата
 * @param data
 */
A.userLost = function(data){
    var mess = 'User ' + data.user + ' was disconnected!';
    if (A.wrtc.selected_user === data.user){
        A.wrtc.hangup();
    }
    A.serverMessage(mess);
};

/**
 * обновление списка пользователей online
 * @param data
 */
A.refreshUsersOnline = function(data){
    console.log(data.users_online);
    console.log(data.ice);
    if (data.ice){
        A.wrtc.pc_config = JSON.parse(window.atob(data.ice));
    }
    A.iface.refreshUsersOnline(data.users_online);
};

/**
 * установка значения выбранного пользователя
 * @param user
 */
A.setSelectedUser = function(user){
    A.selected_user = user;
    if (window.localStorage){
        window.localStorage.setItem('selected_user', user);
    }
};


/**
 * показ заметки с сообщением сервера
 */
A.serverMessage = function(mess){
    A.iface.hideNote();
    A.iface.showNote(mess);
};

/**
 * запрос истории сообщений у сервера
 */
A.requestMessagesHistory = function(){
    A.socket.send('message_history', {user1:A.nicname, user2:A.selected_user, lefttime: A.iface.HISTORY_LEFTTIME});
};

/**
 * отображение полученной истории сообщений
 * @param data
 */
A.lastMessages = function(data){
    A.iface.refreshMessages(data.messages);
    A.requestFiles();
};

/**
 * отправка файла на сервер
 * @param fname
 * @param fdata
 */
A.sendFile = function(f, progressbar){
    if (A.wrtc.file_datachannel != null && A.selected_user == A.wrtc.selected_user){
        console.log('send file p2p');
        Fp2p.sendFile(f, A.wrtc.file_datachannel);
    }else{
        console.log('send file to server');
        F.sendFile(f, '/upload', A.selected_user, A.nicname, progressbar);
    }

};

/**
 * обработка сообщения от сервера что нам передали файлы
 * @param data
 */
A.haveFile = function(data){
    var note = ['User ', data.from, ' send for you file ', data.fname, ' size: ', data.fsize].join('');
    A.iface.showNote(note);
    A.requestFiles();
};

/**
 * обработка сообщения от сервера что отправленный файл принят
 */
A.fileAccepted = function(data){
    A.files.fileAccepted(data.fname);
};

/**
 * обработка сообщения от сервера что при отправке файла произошла ошибка
 */
A.uploadError = function(data){
    A.files.uploadError(data.fname);
};

/**
 * запрос имеющихся присланных файлов
 */
A.requestFiles = function(){
    A.socket.send('request_files');
};


/**
 * обработка данных от сервера об имеющихся файлах
 * @param data
 */
A.incomingFiles = function(data){
    A.iface.refreshFilesLinks(data);
};

/**
 * обработка получения сообщения для сигналлинга в WebRTC
 * @param data
 */
A.gotWRTCMessage = function(data){
    A.wrtc.gotMessage(data);
};

