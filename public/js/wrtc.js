var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;


var WRTC = {};
WRTC.pc_config = null;

WRTC.init = function(app){
    WRTC.app = app;
    WRTC.pc = null; // PeerConnection
    WRTC.localStream = null;
    WRTC.online = false;
    WRTC.hang_up = true; /*повешена ли трубка*/
    WRTC.mediaOptions = { audio: true, video: true };
    WRTC.selected_user = null; /*абонент для видеочата*/
    if (window.localStorage)
        WRTC.selected_user = window.localStorage.getItem('videochat_user');
};


/**
 * инициация вызова вызывающим абонентом,
 * отправка вызываемому абоненту приглашения к связи
 */
WRTC.call = function(){
    console.log(Date.now(), 'call', 'pc_config', WRTC.pc_config);
    if (!WRTC.hang_up) return;
    WRTC.setSelectedUser(WRTC.app.selected_user);
    WRTC.setHangUp(true);
    WRTC.sendMessage({type:'intent_call'});
    WRTC.app.au.playSound(WRTC.app.iface.call_sound);
};

/**
 * начало звонка при получении согласия вызываемого абонента
 */
WRTC.beginConnect = function(){
    if (!WRTC.hang_up) WRTC.getUserMedia(WRTC.gotStreamCaller);
};

/**
 * получение медиапотоков с камеры и микрофона
 * @param callback функция обратного вызова в которую передается stream
 */
WRTC.getUserMedia = function(callback){
    console.log(Date.now(), 'getUserMedia');
    navigator.getUserMedia(
        WRTC.mediaOptions,
        callback,
        function(error) { console.log(error) }
    );
};

/**
 * инициация ответа вызывающему абоненту
 */
WRTC.answer = function(){
    console.log(Date.now(), 'answer');
    WRTC.getUserMedia(WRTC.gotStreamCalle);
};

/**
 * обработчик получения медиапотока вызывающим абонентом
 * @param stream медиапоток
 */
WRTC.gotStreamCaller = function(stream) {
    WRTC.sendMessage({type:'call'});
    WRTC.attachStream(document.getElementById("localVideo"), stream);
    WRTC.localStream = stream;
    console.log(Date.now(), 'gotStream:', stream);
    WRTC.pc = new PeerConnection(WRTC.pc_config);
    WRTC.pc.addStream(stream);
    WRTC.pc.onicecandidate = WRTC.gotIceCandidate;
    WRTC.pc.onaddstream = WRTC.gotRemoteStream;
};

/**
 * присоединение потока к объекту video для проигрывания
 * @param el елемент DOM video
 * @param stream медиапоток
 */
WRTC.attachStream = function(el, stream) {
    var myURL = window.URL || window.webkitURL;
    if (!myURL) {
        el.src = stream;
    } else {
        //el.src = myURL.createObjectURL(stream);
        el.srcObject = stream;
    }
};

/**
 * обработчик получения медиапотока вызываемым абонентом (в соотв. с протоколом WebRTC)
 * @param stream медиапоток
 */
WRTC.gotStreamCalle = function(stream) {
    WRTC.attachStream(document.getElementById("localVideo"), stream);
    WRTC.localStream = stream;
    WRTC.pc = new PeerConnection(WRTC.pc_config);
    WRTC.pc.addStream(stream);
    WRTC.pc.onicecandidate = WRTC.gotIceCandidate;
    WRTC.pc.onaddstream = WRTC.gotRemoteStream;
    WRTC.sendMessage({type:'offer_ready'});
};


/**
 * создание Offer для инициации связи (в соотв. с протоколом WebRTC)
 */
WRTC.createOffer = function() {
    console.log(Date.now(), 'createOffer');
    document.getElementById("hangupButton").style.display = 'inline-block';
    WRTC.pc.createOffer(
        WRTC.gotLocalDescription,
        function(error) { console.log(error) },
        { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } }
    );
};


/**
 * создание Answer для инициации связи (в соотв. с протоколом WebRTC)
 */
WRTC.createAnswer = function() {
    console.log(Date.now(), 'createAnswer');
    WRTC.pc.createAnswer(
        WRTC.gotLocalDescription,
        function(error) { console.log(error) },
        { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } }
    );
};

/**
 * обработчик получения локального SDP (в соотв. с протоколом WebRTC)
 * @param description SDP
 */
WRTC.gotLocalDescription = function(description){
    console.log(Date.now(), 'gotLocalDescription:', description);
    WRTC.pc.setLocalDescription(description);
    WRTC.sendMessage(description);
};

/**
 * обработчик получения ICE Candidate объектом RTCPeerConnection (в соотв. с протоколом WebRTC)
 * @param event
 */
WRTC.gotIceCandidate = function(event){
    console.log(Date.now(), 'gotIceCandidate: ', event.candidate);
    if (event.candidate) {
        WRTC.sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        });
    }
};

/**
 * обработчик получения объектом RTCPeerConnection
 * удаленного медиапотока
 * @param event объект события
 */
WRTC.gotRemoteStream = function(event){
    console.log(Date.now(), 'gotRemoteStream: ', event.stream);
    WRTC.attachStream(document.getElementById("remoteVideo"), event.stream);
    WRTC.online = true;
    WRTC.app.au.stopSound();
    WRTC.setHangUp(true);
};

/**
 * отправка сообщений абоненту через socket.io
 * для обеспечения сигналлинга
 * @param message
 */
WRTC.sendMessage = function(message, to){
    console.log(Date.now(), 'send_message: ', message);
    if (to === undefined){
        WRTC.app.socket.send('wrtc_message', {message: message, to: WRTC.selected_user});
    }else{
        WRTC.app.socket.send('wrtc_message', {message: message, to: to});
    }
};

/**
 * завершение сеанса связи
 */
WRTC.hangup = function(){
    WRTC.sendMessage({type:'hangup'});
    WRTC.disconnect();
    WRTC.setHangUp(false);
};

/**
 * установка статуса "трубки (поднята/положена)" и видимости кнопок
 * @param up
 */
WRTC.setHangUp = function(up){
    if (up){
        WRTC.hang_up = false;
        document.getElementById("hangupButton").style.display = 'inline-block';
        document.getElementById("callButton").style.display = 'none';
    }else{
        WRTC.hang_up = true;
        document.getElementById("hangupButton").style.display = 'none';
        document.getElementById("callButton").style.display = 'inline-block';
    }
};

/**
 * завершение сеанса связи
 */
WRTC.disconnect = function(){
    WRTC.hang_up = true;
    if (WRTC.online){
        WRTC.online = false;
    }
    if(WRTC.pc != null){
        WRTC.pc.close();
        WRTC.pc = null;
    }
    if (WRTC.localStream != null){

        WRTC.localStream.getVideoTracks().forEach(function (track) {
            track.stop();
        });

        WRTC.localStream.getAudioTracks().forEach(function (track) {
            track.stop();
        });
        WRTC.localStream == null;
    }
    document.getElementById("localVideo").src = '';
    document.getElementById("remoteVideo").src = '';
    WRTC.app.au.stopSound();
    WRTC.setSelectedUser(null);
};


/**
 * обработка сообщений от абонента
 * для обеспечения сигналлинга
 */
WRTC.gotMessage = function(data){
    var message  = data.message;
    var from = data.from;
    console.log(Date.now(), 'recive_message: ', message);
    if (WRTC.pc != null && message.type === 'offer') {
        WRTC.pc.setRemoteDescription(new SessionDescription(message));
        WRTC.createAnswer();
    }
    else if (WRTC.pc != null && message.type === 'answer') {
        WRTC.pc.setRemoteDescription(new SessionDescription(message));
    }
    else if (WRTC.pc != null && message.type === 'candidate') {
        //var candidate = new IceCandidate({sdpMLineIndex: message.label, candidate: message.candidate});
        var candidate=null;
        try{
            candidate = new IceCandidate(message);
            WRTC.pc.addIceCandidate(candidate);
        }catch (e){
            try{
                candidate = new IceCandidate({sdpMLineIndex: message.label, candidate: message.candidate});
                WRTC.pc.addIceCandidate(candidate);
            }catch (e){
                console.log(e);
            }
        }

    }else if (message.type === 'hangup'){
        WRTC.disconnect();
        closeDialogConfirm();
        WRTC.setHangUp(false);
    }else if(message.type === 'call'){
        WRTC.answer();
    }else if(message.type === 'offer_ready'){
        WRTC.createOffer();
    }else if (message.type === 'intent_call'){
        WRTC.app.au.playSound(WRTC.app.iface.call_sound);
        dialogConfirm('Video chat', from + ' calling You. <br/>Answer?', function(){
            WRTC.hangup();
            WRTC.setSelectedUser(from);
            WRTC.sendMessage({type:'ready_call'});
        }, function(){
            WRTC.sendMessage({type:'reject_call'}, from);
            WRTC.app.au.stopSound();
        });
    }else if (message.type === 'ready_call'){
        WRTC.beginConnect();
    }else if (message.type === 'reject_call'){
        WRTC.setSelectedUser(null);
        WRTC.app.au.stopSound();
        WRTC.setHangUp(false);
        dialogMessage('Video chat', 'Call was rejected');
    }
};

/**
 * установка пользователя для видеочата
 * @param user
 */
WRTC.setSelectedUser = function(user){
    WRTC.selected_user = user;
    WRTC.app.iface.user_for_videochat.innerHTML = user;
    if (window.localStorage)
        if (user !== null){
            window.localStorage.setItem('videochat_user', user);
        }else{
            window.localStorage.removeItem('videochat_user');
        }
};







