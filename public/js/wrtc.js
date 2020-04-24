var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mediaDevices.getUserMedia || navigator.webkitGetUserMedia;


var WRTC = {};
WRTC.pc_config = null;

WRTC.init = function(app){
    WRTC.app = app;
    WRTC.pc = null; // PeerConnection
    WRTC.localStream = null;
    WRTC.screenStream = null;
    WRTC.online = false;
    WRTC.chat_datachannel = null; /*RTCDataChannel для чата*/
    WRTC.file_datachannel = null; /*RTCDataChannel для файлов*/
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
    WRTC.addStreamToRTCPeerConnection(stream);
    WRTC.pc.onicecandidate = WRTC.gotIceCandidate;
    WRTC.pc.onaddstream = WRTC.gotRemoteStream;
    WRTC.chat_datachannel = WRTC.pc.createDataChannel("chat", {negotiated: true, id: 0, ordered: true});
    WRTC.file_datachannel = WRTC.pc.createDataChannel("file", {negotiated: true, id: 1, ordered: true});
    WRTC.chat_datachannel.onopen = WRTC.chatDataChannelOnOpen;
    WRTC.chat_datachannel.onmessage = WRTC.chatDataChannelOnMessage;
    WRTC.file_datachannel.onopen = WRTC.fileDataChannelOnOpen;
    WRTC.file_datachannel.onmessage = WRTC.fileDataChannelOnMessage;
};

/**
 * присоединение потока к объекту video для проигрывания
 * @param el елемент DOM video
 * @param stream медиапоток
 */
WRTC.attachStream = function(el, stream) {
    console.log('attachStream', stream);
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
    WRTC.addStreamToRTCPeerConnection(stream);
    WRTC.pc.onicecandidate = WRTC.gotIceCandidate;
    WRTC.pc.onaddstream = WRTC.gotRemoteStream;
    WRTC.pc.ontrack = WRTC.gotRemoteTracks;
    WRTC.sendMessage({type:'offer_ready'});
    WRTC.chat_datachannel = WRTC.pc.createDataChannel("chat", {negotiated: true, id: 0, ordered: true});
    WRTC.file_datachannel = WRTC.pc.createDataChannel("file", {negotiated: true, id: 1, ordered: true});
    WRTC.chat_datachannel.onopen = WRTC.chatDataChannelOnOpen;
    WRTC.chat_datachannel.onmessage = WRTC.chatDataChannelOnMessage;
    WRTC.file_datachannel.onopen = WRTC.fileDataChannelOnOpen;
    WRTC.file_datachannel.onmessage = WRTC.fileDataChannelOnMessage;
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
    console.log(Date.now(), 'signalingState', WRTC.pc.signalingState);
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
    console.log(Date.now(), 'gotRemoteStream(audio tracks): ', event.stream.getAudioTracks());
    WRTC.attachStream(document.getElementById("remoteVideo"), event.stream);
    WRTC.online = true;
    WRTC.app.au.stopSound();
    WRTC.setHangUp(true);
    document.getElementById("screenshareButton").style.display = 'inline-block';
    document.getElementById("videoOff").style.display = 'inline-block';
    document.getElementById("audioOff").style.display = 'inline-block';
};

/**
 * обработчик получения объектом RTCPeerConnection
 * удаленного трека медиапотока
 * На событие "track", вместо обработчика устаревшего события "addstream"
 * @param event объект события
 */
WRTC.gotRemoteTracks = function(event){
    console.log(Date.now(), 'gotRemoteStream: ', event.streams);
    console.log(Date.now(), 'gotRemoteStream(audio tracks): ', event.streams[0].getAudioTracks());
    WRTC.attachStream(document.getElementById("remoteVideo"), event.streams[0]);
    WRTC.online = true;
    WRTC.app.au.stopSound();
    WRTC.setHangUp(true);
    document.getElementById("screenshareButton").style.display = 'inline-block';
    document.getElementById("videoOff").style.display = 'inline-block';
    document.getElementById("audioOff").style.display = 'inline-block';
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
    document.getElementById("screenshareButton").style.display = 'none';
    document.getElementById("videoOff").style.display = 'none';
    document.getElementById("videoOn").style.display = 'none';
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
    if(WRTC.chat_datachannel != null){
        WRTC.chat_datachannel.close();
        WRTC.chat_datachannel = null;
    }
    if(WRTC.file_datachannel != null){
        WRTC.file_datachannel.close();
        WRTC.file_datachannel = null;
    }
    if (WRTC.localStream != null){

        WRTC.localStream.getVideoTracks().forEach(function (track) {
            track.stop();
        });

        WRTC.localStream.getAudioTracks().forEach(function (track) {
            track.stop();
        });
        WRTC.localStream = null;
    }
    document.getElementById("localVideo").src = '';
    document.getElementById("remoteVideo").src = '';
    document.getElementById("screenshareButton").style.display = 'none';
    document.getElementById("videoOff").style.display = 'none';
    document.getElementById("videoOn").style.display = 'none';
    document.getElementById("audioOff").style.display = 'none';
    document.getElementById("audioOn").style.display = 'none';
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

/**
 * Обработчик кнопки расшаривания экрана
 */
WRTC.screenShare = function(){
    if(navigator.getDisplayMedia || navigator.mediaDevices.getDisplayMedia) {
        if(navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia({video: true}).then(function (stream) {
                WRTC.onGettingScreenSteam(stream);
            }, WRTC.getDisplayMediaError).catch(WRTC.getDisplayMediaError);
        } else if(navigator.getDisplayMedia) {
            navigator.getDisplayMedia({video: true}).then(function (stream) {
                WRTC.onGettingScreenSteam(stream);
            }, getDisplayMediaError).catch(getDisplayMediaError);
        }
    } else {
        if (DetectRTC.browser.name === 'Chrome') {
            if (DetectRTC.browser.version == 71) {
                dialogMessage('Please enable "Experimental WebPlatform" flag via chrome://flags.');
            } else if (DetectRTC.browser.version < 71) {
                dialogMessage('Please upgrade your Chrome browser.');
            } else {
                dialogMessage('Please make sure that you are not using Chrome on iOS.');
            }
        }

        if (DetectRTC.browser.name === 'Firefox') {
            dialogMessage('Please upgrade your Firefox browser.');
        }

        if (DetectRTC.browser.name === 'Edge') {
            dialogMessage('Please upgrade your Edge browser.');
        }

        if (DetectRTC.browser.name === 'Safari') {
            dialogMessage('Safari does NOT supports getDisplayMedia API yet.');
        }
    }
};

/**
 * Обработка ошибок получения медия потока с экрана
 * @param error
 */
WRTC.getDisplayMediaError = function(error){
    if (location.protocol === 'http:') {
        dialogMessage('Please test this WebRTC experiment on HTTPS.');
    } else {
        console.log(error);
        dialogMessage(error.toString());
    }
};

/**
 * Обработка получения потока с экрана
 * @param stream
 */
WRTC.onGettingScreenSteam = function(stream){
    WRTC.screenStream = stream;
    WRTC.addStreamStopListener(stream, WRTC.onScreenShareEnded);
    document.getElementById("screenshareButton").style.display = 'none';
    WRTC.removeStreamFromRTCPeerConnection(WRTC.localStream);
    var audiotracks = WRTC.localStream.getAudioTracks();
    console.log('audio tracks', audiotracks);
    if (audiotracks.length > 0){
        console.log('add audio track', audiotracks[0]);
        WRTC.screenStream.addTrack(audiotracks[0]);
    }
    WRTC.addStreamToRTCPeerConnection(WRTC.screenStream);
    WRTC.createOffer();
};

/**
 * Установка обработчика прекращения расшаривания экрана
 * @param stream
 * @param callback
 */
WRTC.addStreamStopListener = function (stream, callback) {
    stream.addEventListener('ended', function() {
        callback();
        callback = function() {};
    }, false);
    stream.addEventListener('inactive', function() {
        callback();
        callback = function() {};
    }, false);
    stream.getTracks().forEach(function(track) {
        track.addEventListener('ended', function() {
            callback();
            callback = function() {};
        }, false);
        track.addEventListener('inactive', function() {
            callback();
            callback = function() {};
        }, false);
    });
};

/**
 * Обработка прекращения расшаривания экрана
 */
WRTC.onScreenShareEnded = function(){
    console.log('Screen share stopped');
    document.getElementById("screenshareButton").style.display = 'inline-block';
    WRTC.removeStreamFromRTCPeerConnection(WRTC.screenStream);
    WRTC.addStreamToRTCPeerConnection(WRTC.localStream);
    WRTC.screenStream = null;
    WRTC.createOffer();
};

/**
 * Wrap over ToRTCPeerConnection.addStream to avoid
 * deprecated issues
 * @param stream
 */
WRTC.addStreamToRTCPeerConnection = function(stream){
    try{
        WRTC.pc.addStream(stream);
    }catch (e){
        stream.getTracks().forEach(function(track) {
            WRTC.pc.addTrack(track, stream);
        });
    }
};

/**
 * Wrap over ToRTCPeerConnection.removeStream to avoid
 * deprecated issues
 * @param stream
 */
WRTC.removeStreamFromRTCPeerConnection = function(stream){
    try{
        WRTC.pc.removeStream(stream);
    }catch (e){
        WRTC.pc.getSenders().forEach(function(sender){
            stream.getTracks().forEach(function(track){
                if(track == sender.track){
                    WRTC.pc.removeTrack(sender);
                }
            })
        });
    }
};

/**
 * Обработчик кнопки выключения видео
 */
WRTC.videoOff = function(){
    WRTC.localStream.getVideoTracks().forEach(function(track){
       track.enabled = false;
    });
    document.getElementById("videoOn").style.display = 'inline-block';
    document.getElementById("videoOff").style.display = 'none';
    WRTC.createOffer();
};

/**
 * Обработчик кнопки включения видео
 */
WRTC.videoOn = function(){
    WRTC.localStream.getVideoTracks().forEach(function(track){
        track.enabled = true;
    });
    document.getElementById("videoOff").style.display = 'inline-block';
    document.getElementById("videoOn").style.display = 'none';
    WRTC.createOffer();
};

/**
 * Обработчик кнопки выключения звука
 */
WRTC.audioOff = function(){
    WRTC.localStream.getAudioTracks().forEach(function(track){
        track.enabled = false;
    });
    document.getElementById("audioOn").style.display = 'inline-block';
    document.getElementById("audioOff").style.display = 'none';
    WRTC.createOffer();
};

/**
 * Обработчик кнопки включения звука
 */
WRTC.audioOn = function(){
    WRTC.localStream.getAudioTracks().forEach(function(track){
        track.enabled = true;
    });
    document.getElementById("audioOff").style.display = 'inline-block';
    document.getElementById("audioOn").style.display = 'none';
    WRTC.createOffer();
};

/**
 * Обработчик создания chat datachannel
 * @param event
 */
WRTC.chatDataChannelOnOpen = function(event) {
    WRTC.chat_datachannel.send(['Hi ', WRTC.selected_user, '!'].join(' '));
};

/**
 * Обработчик приема данных через chat datachannel
 * @param event
 */
WRTC.chatDataChannelOnMessage = function(event) {
    var timestamp = (new Date()).getTime();
    var message = {created: timestamp, from:WRTC.selected_user, to: WRTC.app.nicname, message:event.data};
    console.log(message);
    WRTC.app.iface.addMessage(message);
};

/**
 * Обработчик создания file datachannel
 * @param event
 */
WRTC.fileDataChannelOnOpen = function(event) {
    console.log('file datachannel open');
};

/**
 * Обработчик приема данных через file datachannel
 * @param event
 */
WRTC.fileDataChannelOnMessage = function(event) {
    if( typeof event.data === 'string') {
        WRTC.app.filesp2p.startDownload(event.data);
    } else {
        WRTC.app.filesp2p.progressDownload(event.data);
    }
};








