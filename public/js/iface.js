var I = {};

I.app = null;
I.messages = [];
I.MAX_MESSAGES_LEN = 500;
I.NOTE_TIME = 30000; /*время показа заметки*/
I.timeout = null;
I.HISTORY_LEFTTIME = 48; /*длина истории сообщений в часах*/
I.CHAT_ENABLE = false; /*доступна ли отправка сообщений*/
I.call_sound = 'call.wav';

/**
 * Список элементов интерфейса
 */
I.elements = {
    messages_block: 'messages',
    note_block: 'note',
    note_text: 'note-text',
    note_close: 'note-close',
    input: 'input',
    send_btn: 'send-btn',
    exit_btn: 'exit-btn',
    nicname: 'nicname',
    clear_btn: 'clear-btn',
    user_for_chat: 'user-for-chat',
    user_for_videochat: 'user-for-videochat',
    list_users_online: 'users-online',
    test: 'test',
    files_list: 'files-list',
    files_input: 'files-input',
    files_wrap: 'files-wrap',
    send_files_btn: 'send-files-btn',
    files_preload: 'files-preload',
    incoming_files: 'incoming-files',
    local_video: 'localVideo',
    video_wrap: 'video-wrap',
    remote_video: 'remoteVideo',
    call_button: 'callButton',
    hangup_button: 'hangupButton',
    cancel_button: 'cancel-btn',
    chat_preload: 'chat-preload',
    screenshare_button: 'screenshareButton',
    video_off_button: 'videoOff',
    video_on_button: 'videoOn',
    audio_off_button: 'audioOff',
    audio_on_button: 'audioOn'
};

/**
 * инициализация объекта интерфейса
 * @param app
 */
I.init = function(app){
    I.app = app;
    I.initElements();
    I.setInterfaceHandlers();
    if (!I.app.files.FILE_API){
        I.files_wrap.innerHTML = ('<p>You browser does not supported File API</p>');
    }
    I.showMessages();
    if (window.localStorage) I.app.selected_user = window.localStorage.getItem('selected_user');
};

/**
 * тестовая функция
 */
I.testf = function(){
    console.log('test');
    //dialogConfirm('title','message', function(){console.log('ok');}, function(){console.log('cancel');});
    //setTimeout(closeDialogConfirm, 5000);
     //dialogMessage('title','message wqseqw', function(){console.log('ok');});
    //setTimeout(closeDialogMessage, 5000);
};

/**
 * отправка выбранных файлов на сервер
 */
I.sendFiles = function(){
    if (!I.CHAT_ENABLE) return;
    if (F.choosen_files.length == 0){
        I.showNote('No files was been choosed');
        return;
    }
    I.hideElem(I.send_files_btn);
    I.hideElem(I.cancel_button);
    I.hideElem(I.files_input);
    for (var i = 0,f; f = F.choosen_files[i]; i++){
        var progress = document.createElement('div');
        progress.className = 'progress';
        var progressbar = document.createElement('div');
        progressbar.className = 'progress-bar';
        progress.appendChild(progressbar);
        var li = document.getElementById('fl-' + i);
        li.appendChild(progress);
        I.app.sendFile(f, progressbar);
    }
};

/**
 * заполнение списка выбранных для отправки файлов
 * @param list массив параметров файлов
 * @param el елемент DOM куда выводить
 */
I.fillFilesList = function(list) {
    I.showElem(I.send_files_btn);
    I.showElem(I.cancel_button);
    I.showElem(I.files_input);
    if (list.length == 0){
        if (I.files_list != null) I.files_list.innerHTML = '';
        return;
    }
    var html = ['<ul class="files-list">'];
    for (var i in list){
        if (typeof(list[i]) !== 'object') continue;
        html.push('<li id="fl-', i,'">', list[i].name, '</li>');
    }
    html.push('</ul>');
    if (I.files_list != null) I.files_list.innerHTML = html.join('');
}

/**
 * обновление списка ссылок на присланные файлы
 * @param data
 */
I.refreshFilesLinks = function(data){
    var html = [];
    for (var i = 0; i < data.files.length; i++){
        var fname = data.files[i].origname;
        var secret = data.files[i].secret;
        html.push('<li>');
        html.push(['<img id="/file-del/', secret, '" title="Delete" class="icon-small delete-file" src="/img/cancel-circle.svg"/>'].join(''));
        html.push('&nbsp;');
        html.push(['<a href="/file/', secret, '" title="Download" target="_blank">', fname, '</a>'].join(''));
        html.push('</li>');
    }
    I.incoming_files.innerHTML = html.join('');
    var icons = document.getElementsByClassName('delete-file');
    for (var i = 0; i < icons.length; i++){
        icons[i].addEventListener('click', F.deleteFile, false);
    }
};

/**
 * очистка выбранных файлов
 */
I.clearSelectedFiles = function(){
    I.files_input.value = null;
    F.choosen_files = [];
    I.files_list.innerHTML = '';
};

/**
 * инициализация элементов интерфейса
 */
I.initElements = function(){
    for (var name in I.elements){
        I[name] = document.getElementById(I.elements[name]);
    }
    if (I.messages_block != null) I.messages_block.scrollTop = 9999;
    if (I.nicname != null) I.app.nicname = I.nicname.innerHTML;
};

/**
 * установка обработчиков событий элементов интерфейса
 */
I.setInterfaceHandlers = function(){
    var handlers = {
        note_close: {event:'click', handler: I.hideNote },
        send_btn: {event:'click', handler: I.btnSendHandler},
        exit_btn: {event:'click', handler: I.exit},
        test: {event:'click', handler: I.testf},
        files_input: {event:'change', handler: F.handlerFileSelect},
        send_files_btn: {event:'click', handler: I.sendFiles},
        call_button: {event: 'click', handler: I.app.wrtc.call},
        hangup_button: {event: 'click', handler: I.app.wrtc.hangup},
        cancel_button: {event: 'click', handler: I.clearSelectedFiles},
        screenshare_button: {event: 'click', handler: I.app.wrtc.screenShare},
        video_off_button: {event: 'click', handler: I.app.wrtc.videoOff},
        video_on_button: {event: 'click', handler: I.app.wrtc.videoOn},
        audio_off_button: {event: 'click', handler: I.app.wrtc.audioOff},
        audio_on_button: {event: 'click', handler: I.app.wrtc.audioOn}
    };
    for (var el in handlers){
        if (I[el] != null && I[el] != undefined){
            I[el].addEventListener(handlers[el]['event'], handlers[el]['handler'], false);
        }
    }
    window.onkeypress = I.keyPressHandler;
};



/**
 * добавление сообщения в список сообщений
 * @param message
 */
I.addMessage = function(message){
    I.messages.push(message);
    if (I.messages.length > I.MAX_MESSAGES_LEN){
        I.messages.splice(0, I.messages.length - I.MAX_MESSAGES_LEN);
    }
    I.showMessages();
};

/**
 * обработка нажатия кнопки Send
 */
I.btnSendHandler = function(){
    if (!I.CHAT_ENABLE) return;
    I.app.sendUserMessage(I.input.value);
    I.input.value = '';
};

/**
 * Обработка нажатий клавиш
 * @param e
 */
I.keyPressHandler = function(e){
    if (e.keyCode == 13){
        I.btnSendHandler();
    }
};

/**
 * обновление истории сообщений при получении ее от серовера
 * @param messages
 */
I.refreshMessages = function(messages){
    I.messages = messages;
    I.showMessages();
};

/**
 * запрос истории сообщений у сервера в соответствии с выбранныи пользователем
 */
I.requestHistory = function(){
    if (I.messages_block == null) return;
    I.showElem(I.chat_preload);
    I.app.requestMessagesHistory();
};

/**
 * показ списка сообщений
 */
I.showMessages = function(){
    if (I.messages_block == null) return;
    var html = ['<ul class="messages-list">'];
    for (var i = 0; i < I.messages.length; i++){
        if ((I.messages[i]['from'] != I.app.selected_user) &&
            (I.messages[i]['from'] != I.app.nicname))
                continue;
        html.push('<li><span class="created">[');
        html.push(I.timestamp2date(I.messages[i]['created']));
        html.push(']</span>')
        if (I.messages[i]['from'] == I.app.nicname){
            html.push('<span class="author-out">');
        }else{
            html.push('<span class="author-in">');
        }
        html.push(I.messages[i]['from']);
        html.push('</span>: <span class="text">');
        html.push(I.messages[i]['message']);
        html.push('</span></li>');
    }
    html.push('</ul>');
    I.hideElem(I.chat_preload);
    I.messages_block.innerHTML = html.join('');
}


/**
 * выход из чата
 */
I.exit = function(){
    deleteCookie('nicname');
    I.reloadPage('/');
};

/**
 * перезагрузка страницы
 * @param url
 */
I.reloadPage = function(url){
    window.location.replace(url);
};

/**
 * заполнение списка пользователей online
 * @param user_list
 */
I.refreshUsersOnline = function(user_list){
    if (I.list_users_online == null) return;
    I.destroyChildren(I.list_users_online);
    if (user_list.indexOf(I.app.selected_user) == -1){
        I.app.setSelectedUser(null);
    }
    for (var i = 0; i< user_list.length; i++){
        if (user_list[i] == I.app.nicname) continue;
        var li = document.createElement('li');
        li.id = 'chat-' + user_list[i];
        li.className = 'user-list';
        console.log(I.app.selected_user +':'+user_list[i]);
        if (I.app.selected_user == user_list[i]){
            li.className = 'user-list selected';
        }

        if (I.app.selected_user == null){
            li.className = 'user-list selected';
            I.app.setSelectedUser(user_list[i]);
        }
        li.innerHTML = user_list[i];
        I.list_users_online.appendChild(li);
    }
    var list = document.getElementsByClassName('user-list');
    for (var i = 0; i < list.length; i++){
        list[i].addEventListener('click', I.clickOnUser);
    }
    if (I.user_for_chat != null) I.user_for_chat.innerHTML = I.app.selected_user;
    if (I.user_for_videochat != null) I.user_for_videochat.innerHTML = I.app.selected_user;
    if (I.app.selected_user != null){
        I.chat_enable(true);
    }else{
        I.chat_enable(false);
    }
    I.requestHistory();
};

/**
 * удаление дочерних узлов у DOM элемента
 * @param node DOM элемент
 **/
I.destroyChildren = function(node){
    if (!node) return;
    node.innerHTML = '';
    while (node.firstChild)
        node.removeChild(node.firstChild);
}

/**
 * Обработка выбора пользователя для общения
 * @param user
 */
I.selectUser = function(user){
    console.log(user);
    var list = document.getElementsByClassName('user-list');
    for (var i = 0; i < list.length; i++){
        list[i].className = 'user-list';
        if (list[i].id.split('-').pop() == user) list[i].className = 'user-list selected';
    }
    I.app.setSelectedUser(user);
    if (I.user_for_chat != null) I.user_for_chat.innerHTML = I.app.selected_user;
    if (I.user_for_videochat != null) I.user_for_videochat.innerHTML = I.app.wrtc.selected_user;
    I.requestHistory();
};

/**
 * обработчик клика на пользователе
 * @param e
 */
I.clickOnUser = function(e){
    var user = this.id.split('-').pop();
    I.selectUser(user);
};

/**
 * показ заметки
 */
I.showNote = function(text){
    if (I.note_block == null) return;
    I.note_text.innerHTML = text;
    I.note_block.style.display = 'block';
    I.timeout = setTimeout(I.hideNote, I.NOTE_TIME);
};

/**
 * сокрытие заметки
 */
I.hideNote = function(){
    if (I.timeout != null){
        clearTimeout(I.timeout);
        I.timeout = null;
    }
    if (I.note_block == null || I.note_text == null) return;
    I.note_text.innerHTML = '';
    I.note_block.style.display = 'none';
};

/**
* преобразование timestamp в строку даты-времени
*/
I.timestamp2date = function(timestamp){
    var date = new Date(timestamp);
    return date.toLocaleString();
};



/**
 * сокрытие элемента интерфейса
 * @param el
 */
I.hideElem = function(el){
    if (el != null && el != undefined){
        el.style.display = 'none';
    }
};

/**
 * показ элемента интерфейса
 * @param el элемент DOM
 */
I.showElem = function(el){
    //console.log(el);
    if (el != null && el != undefined){
        el.style.display = 'block';
    }
};

/**
 * управление состоянием чата (true-включен, false-выключен)
 * @param status
 */
I.chat_enable = function(status){
    I.CHAT_ENABLE = status;
    if (status){
        if (I.input.hasAttribute('disabled'))
            I.input.removeAttribute('disabled');
    }else{
        I.input.disabled = true;
    }
};





