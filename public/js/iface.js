let getById = (id, parent) => parent ? parent.getElementById(id) : getById(id, document);
let getByClass = (className, parent) => parent ? parent.getElementsByClassName(className) : getByClass(className, document);
var mDate = (dateString) => {

    let date = dateString ? new Date(dateString) : new Date();

    let dualize = (x) => x < 10 ? "0" + x : x;
    let getTime = () => dualize(date.getHours()) + ":" + dualize(date.getMinutes());
    let getDate = () => dualize(date.getDate()) + "/" + dualize(date.getMonth()) + "/" + dualize(date.getFullYear());

    return {
        subtract: (otherDateString) => {
            return date - new Date(otherDateString);
        },
        lastSeenFormat: () => {
            let dateDiff = Math.round(new Date() - date) / (1000 * 60 * 60 * 24);
            let value = (dateDiff === 0) ? "today" : (dateDiff === 1) ? "yesterday" : getDate();
            return value + " at " + getTime();
        },
        chatListFormat: () => {
            let dateDiff = Math.round((new Date() - date) / (1000 * 60 * 60 * 24));
            if (dateDiff === 0) {
                return getTime();
            } else if (dateDiff === 1) {
                return "Yesterday";
            } else {
                return getDate();
            }
        },
        getDate: () => {
            return getDate();
        },
        getTime: () => {
            return getTime();
        },
        toString: () => {
            return date.toString().substr(4, 20);
        },
    };
};

let DOM = {};

let mClassList = (element) => {
    return {
        add: (className) => {
            element.classList.add(className);
            return mClassList(element);
        },
        remove: (className) => {
            element.classList.remove(className);
            return mClassList(element);
        },
        contains: (className, callback) => {
            if (element.classList.contains(className))
                callback(mClassList(element));
        }
    };
};



var I = {};

I.app = null;
I.messages = [];
I.MAX_MESSAGES_LEN = 1000;
I.NOTE_TIME = 10000; /*время показа заметки*/
I.timeout = null;
I.HISTORY_LEFTTIME = 48; /*длина истории сообщений в часах*/
I.CHAT_ENABLE = false; /*доступна ли отправка сообщений*/
I.call_sound = 'call.wav';
I.user = {}; //текущий пользователь
I.files_list = [];
I.files_list_id = '';

/**
 * Список элементов интерфейса
 */
I.elements = {
    messages_block: 'message-area',
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
    audio_on_button: 'audioOn',
    attach_file: 'attach-file',
    open_select_files: 'open-select-files',
    files_list_view: 'files-list',
    incoming_files_div: 'incoming-files-div',
    video_open_btn: 'video-open'
};

I.DOM = null;

/**
 * инициализация объекта интерфейса
 * @param app
 */
I.init = function(app){
    I.app = app;
    I.initElements();
    I.app.me();
    if (!I.app.files.FILE_API){
        I.files_wrap.innerHTML = ('<p>You browser does not supported File API</p>');
    }
    // I.showMessages();
    if (window.localStorage) I.app.selected_user = window.localStorage.getItem('selected_user');
    DOM = {
        chatListArea: getById("chat-list-area"),
        messageArea: getById("message-area"),
        inputArea: getById("input-area"),
        chatList: getById("chat-list"),
        messages: getById("messages"),
        chatListItem: getByClass("chat-list-item"),
        messageAreaName: getById("name", DOM.messageArea),
        messageAreaPic: getById("pic", DOM.messageArea),
        messageAreaNavbar: getById("navbar", DOM.messageArea),
        messageAreaDetails: getById("details", DOM.messageAreaNavbar),
        messageAreaOverlay: getByClass("overlay", DOM.messageArea)[0],
        messageInput: getById("input"),
        profileSettings: getById("profile-settings"),
        profilePic: getById("profile-pic"),
        profilePicInput: getById("profile-pic-input"),
        inputName: getById("input-name"),
        username: getById("username"),
        displayPic: getById("display-pic"),
        filesPanel: getById("files-panel"),
        videoPanel: getById("video-panel"),
    };
    I.setInterfaceHandlers();
};

I.getUserProfile = function (data) {
   console.log('getUserProfile', data);
    I.user = {
       pic: "/vendor/whatsapp/images/0923102932_aPRkoW.jpg",
       name: data.nicname,
       id: data.id
    };
    window.user = I.user;
    document.getElementById('display-pic').src = "/vendor/whatsapp/images/0923102932_aPRkoW.jpg";
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
    if (!A.selected_user){
        I.showNote('User not selected yet!');
        return;
    }
    if (F.choosen_files.length == 0){
        I.showNote('No files was been choosed');
        return;
    }
    I.hideElem(getById('send-files'));
    I.hideElem(getById('cancel-files'));
    I.hideElem(I.files_input);
    for (var i = 0,f; f = F.choosen_files[i]; i++){
        var progress = document.createElement('div');
        progress.className = 'progress';
        var progressbar = document.createElement('div');
        progressbar.className = 'progress-bar';
        progress.appendChild(progressbar);
        var li = document.getElementById('fl-' + i);
        li.appendChild(progress);
        progressbar.className = 'progress-bar';
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
    I.hideElem(I.open_select_files);
    //I.showElem(I.files_input);

    if (list.length == 0){
        if (I.files_list.length > 0) I.files_list.length = 0;
        return;
    }
    console.log(list);
    var html = [`<div class="align-self-end self p-1 my-1 mx-3 rounded bg-white shadow-sm message-item"><ul class="files-list">`];
    for (var i in list){
        if (typeof(list[i]) !== 'object') continue;
        html.push('<li id="fl-', i,'">', list[i].name, '</li>');
        I.files_list.push(list[i]);
    }
    html.push('</ul></div>');
    if (I.files_list.length > 0) {
        I.files_list_view.innerHTML = html.join('');
    }
};

/**
 * обновление списка ссылок на присланные файлы
 * @param data
 */
I.refreshFilesLinks = function(data){
    I.hideElem(I.incoming_files_div);
    var html = [];
    for (var i = 0; i < data.files.length; i++){
        var fname = data.files[i].origname;
        var secret = data.files[i].secret;
        html.push('<tr>');
        html.push('<td>');
        html.push(['<span class="file-name">', fname, '</span>'].join(''));
        html.push('</td>');
        html.push('<td>');
        html.push(['<i id="/file-del/', secret, '" title="Delete" class="fa fa-trash mx-3 text-black d-none d-md-block delete-file"></i>'].join(''));
        //html.push('&nbsp;');
        html.push('</td>');
        html.push('<td>');
        html.push(['<a href="/file/', secret, '" title="Download" target="_blank">', '<i class="fa fa-download"></i>', '</a>'].join(''));
        html.push('</td>');
        html.push('</tr>');
    }
    if (html.length){
        I.showElem(I.incoming_files_div);
        I.incoming_files.innerHTML = html.join('');
        var icons = document.getElementsByClassName('delete-file');
        for (var i = 0; i < icons.length; i++){
            icons[i].addEventListener('click', F.deleteFile, false);
        }
    }
};

/**
 * добавление в список загруженных файлов при загрузке их p2p
 * @param anchor
 */
I.appendIncomingFile = function(anchor){
    I.showElem(I.incoming_files_div);
    var ul = document.querySelector('#incoming-files');
    var img = document.createElement('img');
    img.src = "/img/cancel-circle.svg";
    img.className = "icon-small delete-file";
    img.title = "Double click to delete";
    var li = document.createElement('li');
    li.id = UUID4();
    li.appendChild(img);
    li.appendChild(anchor);
    li.ondblclick = function(e){ ul.removeChild(document.getElementById(this.id));};
    ul.appendChild(li);
};

/**
 * очистка выбранных файлов
 */
I.clearSelectedFiles = function(){
    I.files_input.value = null;
    F.choosen_files = [];
    I.fillFilesList(F.choosen_files);
    I.files_list = [];
    I.destroyChildren(I.files_list_view);
    I.hideElem(I.send_files_btn);
    I.hideElem(I.cancel_button);
    I.showElem(I.open_select_files);
};

/**
 * инициализация элементов интерфейса
 */
I.initElements = function(){
    for (var name in I.elements){
        I[name] = document.getElementById(I.elements[name]);
    }
    //if (I.messages_block != null) I.messages_block.scrollTop = 9999;
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
        call_button: {event: 'click', handler: I.startCall},
        hangup_button: {event: 'click', handler: I.app.wrtc.hangup},
        cancel_button: {event: 'click', handler: I.clearSelectedFiles},
        screenshare_button: {event: 'click', handler: I.app.wrtc.screenShare},
        video_off_button: {event: 'click', handler: I.app.wrtc.videoOff},
        video_on_button: {event: 'click', handler: I.app.wrtc.videoOn},
        audio_off_button: {event: 'click', handler: I.app.wrtc.audioOff},
        audio_on_button: {event: 'click', handler: I.app.wrtc.audioOn},
        attach_file: {event: 'click', handler: I.showFilesPanel},
        open_select_files: {event: 'click', handler: I.openFileSelect},
        video_open_btn: {event: 'click', handler: I.showVideoPanel},
    };
    for (var el in handlers){
        if (I[el] != null && I[el] != undefined){
            I[el].addEventListener(handlers[el]['event'], handlers[el]['handler'], false);
        }
    }
    window.onkeypress = I.keyPressHandler;
};

/**
 * открыть диалог выбора файлов
 */
I.openFileSelect = function () {
    I.files_input.click();
};


/**
 * Начало видео звонка
 */
I.startCall = function () {
    if (A.selected_user){
        I.app.wrtc.call();
    }else{
        I.showNote('User not selected yet!');
    }
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
    window.localStorage.setItem('messages', JSON.stringify(I.messages));
    I.showMessages();
};

/**
 * обработка нажатия кнопки Send
 */
I.btnSendHandler = function(){
    if (!I.CHAT_ENABLE) return;
    let value = DOM.messageInput.value;
    DOM.messageInput.value = "";
    if (value === "") return;
    I.app.sendUserMessage(value);
    //I.refreshUsersOnline();
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
 * обновление истории сообщений при получении ее от сервера
 * @param messages
 */
I.refreshMessages = function(messages){
    var localMessages = JSON.parse(window.localStorage.getItem('messages')) || [];
    for (var i = 0; i < messages.length; i++){
        if (localMessages.find(function(element, index, array){ return !!(element.created == messages[i].created && element.from == messages[i].from && element.to == messages[i].to);}) === undefined)
            localMessages.push(messages[i]);
    }
    localMessages.sort(function(a, b){if (a === null || b === null) return -1; return a.created - b.created;});
    I.messages = localMessages.filter(function(item){return !!item;});
    window.localStorage.setItem('messages', JSON.stringify(I.messages));
    console.log(messages);
    I.showMessages();
    I.check_chat();
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
    mClassList(DOM.inputArea).contains("d-none", (elem) => elem.remove("d-none").add("d-flex"));
    mClassList(DOM.messageAreaOverlay).add("d-none");

    if (window.innerWidth <= 575) {
        mClassList(DOM.chatListArea).remove("d-flex").add("d-none");
        mClassList(DOM.messageArea).remove("d-none").add("d-flex");
        areaSwapped = true;
    }
    //console.log(DOM.messageAreaName);
    DOM.messageAreaName.innerHTML = I.app.selected_user;
    DOM.messageAreaPic.src = '/vendor/whatsapp/images/0923102932_aPRkoW.jpg';
    DOM.messages.innerHTML = "";

    lastDate = "";
    I.messages
        .sort((a, b) => mDate(a.created).subtract(b.created))
        .forEach((msg) => I.addMessageToMessageArea(msg));

};

I.addMessageToMessageArea = function(msg){
    let msgDate = mDate(msg.created).getDate();
    if (lastDate != msgDate) {
        I.addDateToMessageArea(msgDate);
        lastDate = msgDate;
    }

    let htmlForGroup = `
	<div class="small font-weight-bold text-primary">
		${msg.from}
	</div>
	`;
    let sendStatus = `<i class="fas fa-check-circle"></i>`;

    DOM.messages.innerHTML += `
	<div class="align-self-${msg.from === I.user.name ? "end self" : "start"} p-1 my-1 mx-3 rounded bg-white shadow-sm message-item">
		<div class="options">
			<a href="#"><i class="fas fa-angle-down text-muted px-2"></i></a>
		</div>
		<div class="d-flex flex-row">
			<div class="body m-1 mr-2">${msg.message}</div>
			<div class="time ml-auto small text-right flex-shrink-0 align-self-end text-muted" style="width:75px;">
				${mDate(msg.created).getTime()}
				${(msg.from === I.user.name) ? sendStatus : ""}
			</div>
		</div>
	</div>
	`;
    DOM.messages.scrollTo(0, DOM.messages.scrollHeight);
};

I.addDateToMessageArea = function(date){
    DOM.messages.innerHTML += `
	<div class="mx-auto my-2 bg-primary text-white small py-1 px-2 rounded">
		${date}
	</div>
	`;
};

I.showProfileSettings = function(){
    DOM.profileSettings.style.left = 0;
    DOM.profilePic.src = I.user.pic;
    DOM.inputName.value = I.user.name;
};

I.hideProfileSettings = function(){
    DOM.profileSettings.style.left = "-110%";
    DOM.username.innerHTML = I.user.name;
};

I.showFilesPanel = function(){
    DOM.filesPanel.style.left = 0;
};

I.hideFilesPanel = function(){
    DOM.filesPanel.style.left = "-110%";
};

I.showVideoPanel = function(){
    DOM.videoPanel.style.left = 0;
};

I.hideVideoPanel = function(){
    DOM.videoPanel.style.left = "110%";
};
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
    I.list_users_online = getById('chat-list');
    if (I.list_users_online == null) return;
    I.destroyChildren(I.list_users_online);
    if (user_list.indexOf(I.app.selected_user) == -1){
        I.app.setSelectedUser(null);
    }
    //console.log(user_list);
    for (var i = 0; i< user_list.length; i++){
        if (user_list[i] == I.app.nicname) continue;
        //console.log(user_list[i]);
        I.list_users_online.innerHTML += `
		<div class="chat-list-item d-flex flex-row w-100 p-2 border-bottom" id="user-${user_list[i]}">
			<img src="/vendor/whatsapp/images/0923102932_aPRkoW.jpg" alt="Profile Photo" class="img-fluid rounded-circle mr-2" style="height:50px;">
			<div class="w-50">
				<div class="name">${user_list[i]}</div>
				<div class="small last-message"><i class=" fa-check-circle mr-1"></i></div>
			</div>
			<div class="flex-grow-1 text-right">
				<div class="small time"></div>
			</div>
		</div>
		`;
    }
    var list = document.getElementsByClassName('chat-list-item d-flex flex-row w-100 p-2 border-bottom');
    for (var i = 0; i < list.length; i++){
        list[i].addEventListener('click', I.clickOnUser);
    }
    I.check_chat();
    I.requestHistory();
};

I.check_chat = function(){
    if (I.app.selected_user != null){
        I.chat_enable(true);
    }else{
        I.chat_enable(false);
    }
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
    var list = document.getElementsByClassName('user-list');
    for (var i = 0; i < list.length; i++){
        list[i].className = 'chat-list-item d-flex flex-row w-100 p-2 border-bottom';
        if (list[i].id.split('-').pop() == user) list[i].className = list[i].className + ' selected';
    }
    I.app.setSelectedUser(user);
    //if (I.user_for_chat != null) I.user_for_chat.innerHTML = I.app.selected_user;
    if (I.user_for_videochat != null) I.user_for_videochat.innerHTML = I.app.wrtc.selected_user;
    I.requestHistory();
};

/**
 * обработчик клика на пользователе
 * @param e
 */
I.clickOnUser = function(e){
    console.log(e);
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

/**
 * generation UUID4 code
 * @returns {string}
 * @constructor
 */
UUID4 = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};





