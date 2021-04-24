var I = {};

I.app = null;
I.messages = [];
I.MAX_MESSAGES_LEN = 1000;
I.NOTE_TIME = 30000; /*время показа заметки*/
I.timeout = null;
I.HISTORY_LEFTTIME = 48; /*длина истории сообщений в часах*/
I.CHAT_ENABLE = false; /*доступна ли отправка сообщений*/
I.call_sound = 'call.wav';
var getById = (id, parent) => parent ? parent.getElementById(id) : getById(id, document);
var getByClass = (className, parent) => parent ? parent.getElementsByClassName(className) : getByClass(className, document);
var mClassList = (element) => {
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
        toString:() => {
            return date.toString().substr(4, 20);
        },
    };
};

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

I.DOM = {
    chatListArea: getById("chat-list-area"),
    messageArea: getById("message-area"),
    inputArea: getById("input-area"),
    chatList: getById("chat-list"),
    messages: getById("messages"),
    chatListItem: getByClass("chat-list-item"),
    messageAreaName: getById("name", this.messageArea),
    messageAreaPic: getById("pic", this.messageArea),
    messageAreaNavbar: getById("navbar", this.messageArea),
    messageAreaDetails: getById("details", this.messageAreaNavbar),
    messageAreaOverlay: getByClass("overlay", this.messageArea)[0],
    messageInput: getById("input"),
    profileSettings: getById("profile-settings"),
    profilePic: getById("profile-pic"),
    profilePicInput: getById("profile-pic-input"),
    inputName: getById("input-name"),
    username: getById("username"),
    displayPic: getById("display-pic")
};

I.DOM = null;

/**
 * инициализация объекта интерфейса
 * @param app
 */
I.init = function(app){
    I.app = app;
    I.initElements();
    I.DOM = {
        chatListArea: getById("chat-list-area"),
        messageArea: getById("message-area"),
        inputArea: getById("input-area"),
        chatList: getById("chat-list"),
        messages: getById("messages"),
        chatListItem: getByClass("chat-list-item"),
        messageAreaName: getById("name", this.messageArea),
        messageAreaPic: getById("pic", this.messageArea),
        messageAreaNavbar: getById("navbar", this.messageArea),
        messageAreaDetails: getById("details", this.messageAreaNavbar),
        messageAreaOverlay: getByClass("overlay", this.messageArea)[0],
        messageInput: getById("input"),
        profileSettings: getById("profile-settings"),
        profilePic: getById("profile-pic"),
        profilePicInput: getById("profile-pic-input"),
        inputName: getById("input-name"),
        username: getById("username"),
        displayPic: getById("display-pic")
    };
    I.setInterfaceHandlers();
    if (!I.app.files.FILE_API){
        I.files_wrap.innerHTML = ('<p>You browser does not supported File API</p>');
    }
    // I.showMessages();
    if (window.localStorage) I.app.selected_user = window.localStorage.getItem('selected_user');

    I.DOM.username.innerHTML = A.nicname;
    I.DOM.displayPic.src = I.getUserProfile()['pic'];
    I.DOM.profilePic.stc = I.getUserProfile()['pic'];
    I.DOM.profilePic.addEventListener("click", () => I.DOM.profilePicInput.click());
    I.DOM.profilePicInput.addEventListener("change", () => console.log(I.DOM.profilePicInput.files[0]));
    I.DOM.inputName.addEventListener("blur", (e) => A.nicname = e.target.value);
    I.generateChatList();

    console.log("Click the Image at top-left to open settings.");
};

I.getUserProfile = function () {
   return {
       'pic': "/vendor/whatsapp/images/0923102932_aPRkoW.jpg"
   };
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
    //I.hideElem(I.cancel_button);
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
    //I.showElem(I.cancel_button);
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
 * добавление в список загруженных файлов при загрузке их p2p
 * @param anchor
 */
I.appendIncomingFile = function(anchor){
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
    I.files_list.innerHTML = '';
    I.fillFilesList(F.choosen_files);
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
    window.localStorage.setItem('messages', JSON.stringify(I.messages));
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
        if (!((I.messages[i]['from'] == I.app.selected_user && I.messages[i]['to'] == I.app.nicname) ||
            (I.messages[i]['to'] == I.app.selected_user && I.messages[i]['from'] == I.app.nicname)))
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


//from whatsapp
// 'areaSwapped' is used to keep track of the swapping
// of the main area between chatListArea and messageArea
// in mobile-view
I.areaSwapped = false;

// 'chat' is used to store the current chat
// which is being opened in the message area
I.chat = null;

// this will contain all the chats that is to be viewed
// in the chatListArea
I.chatList = [];

// this will be used to store the date of the last message
// in the message area
I.lastDate = "";

// 'populateChatList' will generate the chat list
// based on the 'messages' in the datastore
I.populateChatList = () => {
    I.chatList = [];

    // 'present' will keep track of the chats
    // that are already included in chatList
    // in short, 'present' is a Map DS
    let present = {};

    MessageUtils.getMessages()
        .sort((a, b) => mDate(a.time).subtract(b.time))
        .forEach((msg) => {
            let chat = {};

            chat.isGroup = msg.recvIsGroup;
            chat.msg = msg;

            if (msg.recvIsGroup) {
                chat.group = groupList.find((group) => (group.id === msg.recvId));
                chat.name = chat.group.name;
            } else {
                chat.contact = contactList.find((contact) => (msg.sender !== user.id) ? (contact.id === msg.sender) : (contact.id === msg.recvId));
                chat.name = chat.contact.name;
            }

            chat.unread = (msg.sender !== user.id && msg.status < 2) ? 1: 0;

            if (present[chat.name] !== undefined) {
                I.chatList[present[chat.name]].msg = msg;
                I.chatList[present[chat.name]].unread += chat.unread;
            } else {
                present[chat.name] = I.chatList.length;
                I.chatList.push(chat);
            }
        });
};

I.viewChatList = () => {
    I.DOM.chatList.innerHTML = "";
    I.chatList
        .sort((a, b) => mDate(b.msg.time).subtract(a.msg.time))
        .forEach((elem, index) => {
            let statusClass = elem.msg.status < 2 ? "far" : "fas";
            let unreadClass = elem.unread ? "unread" : "";

            I.DOM.chatList.innerHTML += `
		<div class="chat-list-item d-flex flex-row w-100 p-2 border-bottom ${unreadClass}" onclick="I.generateMessageArea(this, ${index})">
			<img src="${elem.isGroup ? elem.group.pic : elem.contact.pic}" alt="Profile Photo" class="img-fluid rounded-circle mr-2" style="height:50px;">
			<div class="w-50">
				<div class="name">${elem.name}</div>
				<div class="small last-message">${elem.isGroup ? contactList.find(contact => contact.id === elem.msg.sender).number + ": " : ""}${elem.msg.sender === user.id ? "<i class=\"" + statusClass + " fa-check-circle mr-1\"></i>" : ""} ${elem.msg.body}</div>
			</div>
			<div class="flex-grow-1 text-right">
				<div class="small time">${mDate(elem.msg.time).chatListFormat()}</div>
				${elem.unread ? "<div class=\"badge badge-success badge-pill small\" id=\"unread-count\">" + elem.unread + "</div>" : ""}
			</div>
		</div>
		`;
        });
};

I.generateChatList = () => {
    I.populateChatList();
    I.viewChatList();
};

I.addDateToMessageArea = (date) => {
    I.DOM.messages.innerHTML += `
	<div class="mx-auto my-2 bg-primary text-white small py-1 px-2 rounded">
		${date}
	</div>
	`;
};

I.addMessageToMessageArea = (msg) => {
    let msgDate = mDate(msg.time).getDate();
    if (lastDate != msgDate) {
        I.addDateToMessageArea(msgDate);
        lastDate = msgDate;
    }

    let htmlForGroup = `
	<div class="small font-weight-bold text-primary">
		${contactList.find(contact => contact.id === msg.sender).number}
	</div>
	`;

    let sendStatus = `<i class="${msg.status < 2 ? "far" : "fas"} fa-check-circle"></i>`;

    I.DOM.messages.innerHTML += `
	<div class="align-self-${msg.sender === user.id ? "end self" : "start"} p-1 my-1 mx-3 rounded bg-white shadow-sm message-item">
		<div class="options">
			<a href="#"><i class="fas fa-angle-down text-muted px-2"></i></a>
		</div>
		${I.chat.isGroup ? htmlForGroup : ""}
		<div class="d-flex flex-row">
			<div class="body m-1 mr-2">${msg.body}</div>
			<div class="time ml-auto small text-right flex-shrink-0 align-self-end text-muted" style="width:75px;">
				${mDate(msg.time).getTime()}
				${(msg.sender === user.id) ? sendStatus : ""}
			</div>
		</div>
	</div>
	`;

    I.DOM.messages.scrollTo(0, I.DOM.messages.scrollHeight);
};

I.generateMessageArea = (elem, chatIndex) => {
    I.chat = I.chatList[chatIndex];

    mClassList(I.DOM.inputArea).contains("d-none", (elem) => elem.remove("d-none").add("d-flex"));
    mClassList(I.DOM.messageAreaOverlay).add("d-none");

    [...I.DOM.chatListItem].forEach((elem) => mClassList(elem).remove("active"));

    mClassList(elem).contains("unread", () => {
        MessageUtils.changeStatusById({
            isGroup: I.chat.isGroup,
            id: I.chat.isGroup ? I.chat.group.id : I.chat.contact.id
        });
        mClassList(elem).remove("unread");
        mClassList(elem.querySelector("#unread-count")).add("d-none");
    });

    if (window.innerWidth <= 575) {
        mClassList(I.DOM.chatListArea).remove("d-flex").add("d-none");
        mClassList(I.DOM.messageArea).remove("d-none").add("d-flex");
        I.areaSwapped = true;
    } else {
        mClassList(elem).add("active");
    }

    I.DOM.messageAreaName.innerHTML = I.chat.name;
    I.DOM.messageAreaPic.src = I.chat.isGroup ? I.chat.group.pic : I.chat.contact.pic;

    // Message Area details ("last seen ..." for contacts / "..names.." for groups)
    if (I.chat.isGroup) {
        let groupMembers = groupList.find(group => group.id === I.chat.group.id).members;
        let memberNames = contactList
            .filter(contact => groupMembers.indexOf(contact.id) !== -1)
            .map(contact => contact.id === user.id ? "You" : contact.name)
            .join(", ");

        I.DOM.messageAreaDetails.innerHTML = `${memberNames}`;
    } else {
        I.DOM.messageAreaDetails.innerHTML = `last seen ${mDate(I.chat.contact.lastSeen).lastSeenFormat()}`;
    }

    let msgs = I.chat.isGroup ? MessageUtils.getByGroupId(I.chat.group.id) : MessageUtils.getByContactId(I.chat.contact.id);

    I.DOM.messages.innerHTML = "";

    lastDate = "";
    msgs
        .sort((a, b) => mDate(a.time).subtract(b.time))
        .forEach((msg) => I.addMessageToMessageArea(msg));
};

I.showChatList = () => {
    if (I.areaSwapped) {
        mClassList(I.DOM.chatListArea).remove("d-none").add("d-flex");
        mClassList(I.DOM.messageArea).remove("d-flex").add("d-none");
        I.areaSwapped = false;
    }
};

I.sendMessage = () => {
    let value = I.DOM.messageInput.value;
    I.DOM.messageInput.value = "";
    if (value === "") return;

    let msg = {
        sender: user.id,
        body: value,
        time: mDate().toString(),
        status: 1,
        recvId: I.chat.isGroup ? I.chat.group.id : I.chat.contact.id,
        recvIsGroup: I.chat.isGroup
    };

    I.addMessageToMessageArea(msg);
    MessageUtils.addMessage(msg);
    I.generateChatList();
};

I.showProfileSettings = () => {
    I.DOM.profileSettings.style.left = 0;
    I.DOM.profilePic.src = user.pic;
    I.DOM.inputName.value = user.name;
};

I.hideProfileSettings = () => {
    I.DOM.profileSettings.style.left = "-110%";
    I.DOM.username.innerHTML = user.name;
};

window.addEventListener("resize", e => {
    if (window.innerWidth > 575) I.showChatList();
});


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





