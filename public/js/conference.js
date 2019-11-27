window.onload = function(){

    (function() {
        var params = {},
            r = /([^&=]+)=?([^&]*)/g;

        function d(s) {
            return decodeURIComponent(s.replace(/\+/g, ' '));
        }
        var match, search = window.location.search;
        while (match = r.exec(search.substring(1)))
            params[d(match[1])] = d(match[2]);
        window.params = params;
    })();

    $(function() {
        window.diagMess = $("#dialog-message").dialog({modal: true, autoOpen: false});
    });

    (function(){
        //init
        var connection = new RTCMultiConnection();
        connection.socketURL = '/rtcmulticonnection/';
        // keep room opened even if owner leaves
        connection.autoCloseEntireSession = true;
        connection.session = {audio: true, video: true, data: true};
        connection.sdpConstraints.mandatory = {OfferToReceiveAudio: true, OfferToReceiveVideo: true};
        connection.chunkSize = 16000;
        connection.enableFileSharing = true;
        // to make sure file-saver dialog is not invoked.
        connection.autoSaveToDisk = false;
        var videosContainer = document.getElementById('videos');
        var btnOpenOrJoin = document.getElementById('btn-open-or-join');
        var btnLeave = document.getElementById('btn-leave');
        var inputRoomId = document.getElementById('room-id-txt');
        var inputUserName = document.getElementById('user-name');
        var mediaElements = {};
        var infoBar = document.getElementById('onUserStatusChanged');
        var messagesContainer = document.getElementById('messages-list');
        var inputMessage = document.getElementById('input-message');
        var btnSendMessage = document.getElementById('btn-send-message');
        var btnAttachFile = document.getElementById('btn-select-file');
        var btnShareScreen = document.getElementById('btn-share-screen');
        var recentFile;
        var progressHelper = {};
        var localStream = null;
        var screenStream = null;
        var localUserId = null;

        var roomid = null;
        var userName = null;
        var screen_constraints = {video: true};

        // here goes canvas designer
        var designer = new CanvasDesigner();
        // you can place widget.html anywhere
        designer.widgetHtmlURL = '/vendor/canvas-designer/widget.html';
        designer.widgetJsURL = '/vendor/canvas-designer/widget.min.js';

        btnOpenOrJoin.onclick = onClickOpenRoom;
        btnLeave.onclick = onClickLeave;
        btnSendMessage.onclick = onClickSendMessage;
        btnAttachFile.onclick = onClickAttachFile;
        btnShareScreen.onclick = onClickShareScreen;

        connection.onstream = onStreamHandler;
        connection.onstreamended = onStreamendedHandler;
        connection.onmessage = onMessageHandler;
        connection.onUserStatusChanged = onUserStatusChanged;
        connection.onopen = onOpenConnectionHandler;
        connection.onFileEnd = onFileEndHandler;
        connection.onFileProgress = onFileProgressHandler;
        connection.onFileStart = onFileStartHandler;
        connection.onclose = connection.onerror = connection.onleave = function(event) {
            connection.onUserStatusChanged(event);
        };
        var socket = io.connect(window.location.host + '/');
        socket.on('ice', function (data) {
            if (data.ice){
                connection.iceServers = JSON.parse(window.atob(data.ice));
            }
        });
        socket.emit('get_ice', {});

        function onOpenConnectionHandler(event) {
            connection.onUserStatusChanged(event);
            /*
             if (designer.pointsLength <= 0) {
             // make sure that remote user gets all drawings synced.
             setTimeout(function() {
             connection.send('plz-sync-points');
             }, 1000);
             }
             */
            btnSendMessage.disabled = false;
            btnAttachFile.style.display = 'inline-block';
            btnShareScreen.style.display = 'inline-block';
        }

        /**
         * destroyChildren
         * @param node
         */
        function destroyChildren (node){
            if (!node) return;
            node.innerHTML = '';
            while (node.firstChild)
                node.removeChild(node.firstChild);
        }

        function getFullName(e) {
            if (e.type === 'local' && userName)
                return userName;
            var userid = e.userid;
            var _userFullName = userid;
            if (connection.peers[userid] && connection.peers[userid].extra.userFullName) {
                _userFullName = connection.peers[userid].extra.userFullName;
            }
            return _userFullName;
        }

        function getFullNameById(userid) {
            var _userFullName = userid;
            if (connection.peers[userid] && connection.peers[userid].extra.userFullName) {
                _userFullName = connection.peers[userid].extra.userFullName;
            }
            return _userFullName;
        }

        function onClickOpenRoom(){
            roomid = inputRoomId.value;
            userName = inputUserName.value;
            connection.extra.userFullName = userName;
            inputRoomId.style.display = 'none';
            inputUserName.style.display = 'none';
            connection.openOrJoin(roomid, function(){
                btnLeave.style.display = 'inline-block';
                btnOpenOrJoin.style.display = 'none';
            });
        }

        function onClickLeave(){
            console.log('leave');
            connection.closeEntireSession(function() {
                dialogMessage('Entire session has been closed.');
            });
            window.location.reload();
        }

        function getVideoWidget(e){
            var mediaElement = getMediaElement(e.mediaElement, {
                title: getFullName(e),
                width: (videosContainer.clientWidth / 2) - 50,
                buttons: ['mute-audio', 'mute-video', 'record-audio', 'record-video', 'full-screen', 'volume-slider', 'stop', 'take-snapshot'],
                toggle: e.type == 'local' ? ['full-screen', 'mute-audio'] : ['full-screen'],
                onMuted: function(type) {
                    // www.RTCMultiConnection.org/docs/mute/
                    connection.streamEvents[e.streamid].stream.mute({
                        audio: type == 'audio',
                        video: type == 'video'
                    });
                },
                onUnMuted: function(type) {
                    // www.RTCMultiConnection.org/docs/unmute/
                    connection.streamEvents[e.streamid].stream.unmute({
                        audio: type == 'audio',
                        video: type == 'video'
                    });
                },

                onRecordingStarted: function(type) {
                    // www.RTCMultiConnection.org/docs/startRecording/
                    connection.streamEvents[e.streamid].startRecording({
                        audio: type == 'audio',
                        video: type == 'video'
                    });
                },
                onRecordingStopped: function(type) {
                    // www.RTCMultiConnection.org/docs/stopRecording/
                    connection.streamEvents[e.streamid].stopRecording(function(blob) {
                        if (blob.audio) connection.saveToDisk(blob.audio);
                        else if (blob.video) connection.saveToDisk(blob.audio);
                        else connection.saveToDisk(blob);
                    }, type);
                },
                onStopped: function() {
                    connection.peers[e.userid].drop();
                },
                onTakeSnapshot: function() {
                    if (!e.stream.getVideoTracks().length) return;
                    var userid = e.userid;
                    if (typeof ImageCapture === 'function') {
                        var videoTrack = e.stream.getVideoTracks()[0];
                        var imageCapture = new ImageCapture(videoTrack);
                        imageCapture.takePhoto().then(function(blob) {
                            var photo = URL.createObjectURL(blob);
                            window.open(photo);
                        }).catch(function (e) {
                            imageCapture.grabFrame().then(function (bitmap) {
                                var canvas = document.createElement('canvas');
                                var video = mediaElements[userid].media;
                                canvas.width = video.videoWidth || video.clientWidth;
                                canvas.height = video.videoHeight || video.clientHeight;
                                var context = canvas.getContext('2d');
                                context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
                                canvas.toBlob(function(blob){
                                    var photo = URL.createObjectURL(blob);
                                    window.open(photo);
                                });
                            }).catch(function (e) {
                                dialogMessage(e.toString());
                            })
                        });
                    }
                }
            });
            mediaElement.id = e.streamid;
            return mediaElement;
        }


        function takePhoto(video) {
            var canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || video.clientWidth;
            canvas.height = video.videoHeight || video.clientHeight;
            var context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/png');
        }


        function onStreamHandler(e){
            console.log('e:', e);
            console.log('streamid:', e.streamid);
            console.log('whatis:', connection.streamEvents[e.streamid]);
            console.log('e.userid:', e.userid);
            console.log('peers:', connection.peers);

            if (e.stream.isScreen){
                attachStream(mediaElements[e.userid].media, e.stream);
                connection.onUserStatusChanged(e);
                return;
            }
            var mediaElement = getVideoWidget(e);
            if (e.type === 'local'){
                localStream = e.stream;
                localUserId = e.userid;
                mediaElement.type = 'local';
            }
            mediaElements[e.userid] = mediaElement;
            videosContainer.appendChild(mediaElement);
            connection.onUserStatusChanged(event);
        }

        function onStreamendedHandler(event) {
            var video = document.getElementById(event.streamid);
            if (video) {
                video.parentNode.removeChild(video);
                return;
            }
            if (video) {
                video.srcObject = null;
                video.style.display = 'none';
            }
        }

        function onMessageHandler(event){

            if(event.data.typing === true) {
                $('#key-press').show().find('span').html(event.extra.userFullName + ' is typing');
                return;
            }

            if(event.data.typing === false) {
                $('#key-press').hide().find('span').html('');
                return;
            }

            if (event.data.chatMessage) {
                appendChatMessage(event);
                return;
            }

            if (event.data.checkmark === 'received') {
                var checkmarkElement = document.getElementById(event.data.checkmark_id);
                if (checkmarkElement) {
                    checkmarkElement.style.display = 'inline';
                }
                return;
            }

            if (event.data === 'plz-sync-points') {
                //designer.sync();
                return;
            }

            //designer.syncData(event.data);
        }

        function onClickSendMessage() {
            var message = $('.emojionearea-editor').html();
            $('.emojionearea-editor').html('');
            if (!message || !message.replace(/ /g, '').length) return;
            if (!connection.peers.getLength()) return;
            var checkmark_id = connection.userid + connection.token();
            appendChatMessage(message, checkmark_id);
            connection.send({
                chatMessage: message,
                checkmark_id: checkmark_id
            });
            connection.send({
                typing: false
            });

        }

        function onUserStatusChanged(event) {
            var names = [];
            connection.getAllParticipants().forEach(function(pid) {
                console.log('onUserStatusChanged pid:', pid);
                names.push(getFullNameById(pid));
                console.log('onUserStatusChanged pid:', names);
            });

            if (!names.length) {
                names = ['Only You'];
            } else {
                names = [connection.extra.userFullName || 'You'].concat(names);
            }

            infoBar.innerHTML = '<b>Active users:</b> ' + names.join(', ');
        }

        function appendChatMessage(event, checkmark_id) {
            var div = document.createElement('li');
            div.className = 'message';
            console.log('appendChatMessage event:', event);
            if (event.data) {
                div.innerHTML = '<b>' + (event.extra.userFullName || event.userid) + ':</b><br>' + event.data.chatMessage;
                if (event.data.checkmark_id) {
                    connection.send({
                        checkmark: 'received',
                        checkmark_id: event.data.checkmark_id
                    });
                }
            } else {
                div.innerHTML = '<b>You:</b> <img class="checkmark" id="' + checkmark_id + '" title="Received" src="/img/checkmark.png"><br>' + event;
                div.style.background = '#cbffcb';
            }
            messagesContainer.appendChild(div);
            messagesContainer.scrollTop = messagesContainer.clientHeight;
            messagesContainer.scrollTop = messagesContainer.scrollHeight - messagesContainer.scrollTop;
        }

        var keyPressTimer;
        var numberOfKeys = 0;


        $('#input-message').emojioneArea({
            pickerPosition: "top",
            filtersPosition: "bottom",
            tones: false,
            autocomplete: true,
            inline: true,
            hidePickerOnBlur: true,
            events: {
                focus: function() {
                    $('.emojionearea-category').unbind('click').bind('click', function() {
                        $('.emojionearea-button-close').click();
                    });
                },
                keyup: function(e) {
                    var chatMessage = $('.emojionearea-editor').html();
                    if (!chatMessage || !chatMessage.replace(/ /g, '').length) {
                        connection.send({
                            typing: false
                        });
                    }

                    clearTimeout(keyPressTimer);
                    numberOfKeys++;

                    if (numberOfKeys % 3 === 0) {
                        connection.send({
                            typing: true
                        });
                    }

                    keyPressTimer = setTimeout(function() {
                        connection.send({
                            typing: false
                        });
                    }, 1200);
                },
                blur: function() {
                    // $('#btn-chat-message').click();
                    connection.send({
                        typing: false
                    });
                }
            }
        });

        window.onkeyup = function(e) {
            var code = e.keyCode || e.which;
            if (code == 13) {
                $('#btn-send-message').click();
            }
        };

        function onClickAttachFile() {
            var file = new FileSelector();
            file.selectSingleFile(function(file) {
                recentFile = file;

                if(connection.getAllParticipants().length >= 1) {
                    recentFile.userIndex = 0;
                    connection.send(file, connection.getAllParticipants()[recentFile.userIndex]);
                }
            });
        }

        function getFileHTML(file) {
            var url = file.url || URL.createObjectURL(file);
            var attachment = '<a href="' + url + '" target="_blank" download="' + file.name + '">Download: <b>' + file.name + '</b></a>';
            if (file.name.match(/\.jpg|\.png|\.jpeg|\.gif/gi)) {
                attachment += '<br><img crossOrigin="anonymous" src="' + url + '">';
            } else if (file.name.match(/\.wav|\.mp3/gi)) {
                attachment += '<br><audio src="' + url + '" controls></audio>';
            } else if (file.name.match(/\.pdf|\.js|\.txt|\.sh/gi)) {
                attachment += '<iframe class="inline-iframe" src="' + url + '"></iframe></a>';
            }
            return attachment;
        }

        function onFileEndHandler(file) {
            var html = getFileHTML(file);
            var div = progressHelper[file.uuid].div;

            if (file.userid === connection.userid) {
                div.innerHTML = '<b>You:</b><br>' + html;
                div.style.background = '#cbffcb';

                if(recentFile) {
                    recentFile.userIndex++;
                    var nextUserId = connection.getAllParticipants()[recentFile.userIndex];
                    if(nextUserId) {
                        connection.send(recentFile, nextUserId);
                    }
                    else {
                        recentFile = null;
                    }
                }
                else {
                    recentFile = null;
                }
            } else {
                div.innerHTML = '<b>' + getFullNameById(file.userid) + ':</b><br>' + html;
            }
        }

        function onFileProgressHandler(chunk, uuid) {
            var helper = progressHelper[chunk.uuid];
            helper.progress.value = chunk.currentPosition || chunk.maxChunks || helper.progress.max;
            updateLabel(helper.progress, helper.label);
        }

        function onFileStartHandler(file) {
            var div = document.createElement('li');
            div.className = 'message';

            if (file.userid === connection.userid) {
                var userFullName = file.remoteUserId;
                if(connection.peersBackup[file.remoteUserId]) {
                    userFullName = connection.peersBackup[file.remoteUserId].extra.userFullName;
                }

                div.innerHTML = '<b>You (to: ' + userFullName + '):</b><br><label>0%</label> <progress></progress>';
                div.style.background = '#cbffcb';
            } else {
                div.innerHTML = '<b>' + getFullNameById(file.userid) + ':</b><br><label>0%</label> <progress></progress>';
            }

            div.title = file.name;
            messagesContainer.appendChild(div);
            progressHelper[file.uuid] = {
                div: div,
                progress: div.querySelector('progress'),
                label: div.querySelector('label')
            };
            progressHelper[file.uuid].progress.max = file.maxChunks;

            messagesContainer.scrollTop = messagesContainer.clientHeight;
            messagesContainer.scrollTop = messagesContainer.scrollHeight - messagesContainer.scrollTop;
        }

        function updateLabel(progress, label) {
            if (progress.position == -1) return;
            var position = +progress.position.toFixed(2).split('.')[1] || 100;
            label.innerHTML = position + '%';
        }

        function onClickShareScreen() {
            btnShareScreen.style.display = 'none';
            if(navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia(screen_constraints).then(function (stream){
                    screenStream = stream;
                    replaceScreenTrack(stream);
                }, function(error){
                    dialogMessage('Please make sure to use Edge 17 or higher.');
                });
            } else if(navigator.getDisplayMedia) {
                navigator.getDisplayMedia(screen_constraints).then(function(stream){
                    screenStream = stream;
                    replaceScreenTrack(stream);
                }, function(error){
                    dialogMessage('Please make sure to use Edge 17 or higher.');
                });
            }
            else {
                dialogMessage('getDisplayMedia API is not available in this browser.');
            }
        }

        function addStreamStopListener(stream, callback) {
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
        }

        function getLocalMediaElement(){
            for (var k in mediaElements){
                if (mediaElements[k].type === 'local')
                    return mediaElements[k];
            }
            return null;
        }

        function replaceTrack(videoTrack, screenTrackId) {
            if (!videoTrack) return;
            if (videoTrack.readyState === 'ended') {
                dialogMessage('Can not replace an "ended" track. track.readyState: ' + videoTrack.readyState);
                return;
            }
            connection.getAllParticipants().forEach(function(pid) {
                var peer = connection.peers[pid].peer;
                if (!peer.getSenders) return;
                var trackToReplace = videoTrack;
                peer.getSenders().forEach(function(sender) {
                    if (!sender || !sender.track) return;
                    if(screenTrackId) {
                        if(trackToReplace && sender.track.id === screenTrackId) {
                            sender.replaceTrack(trackToReplace);
                            trackToReplace = null;
                        }
                        return;
                    }

                    if(sender.track.id == localStream.getTracks()[0].id) return;
                    if (sender.track.kind === 'video' && trackToReplace) {
                        sender.replaceTrack(trackToReplace);
                        trackToReplace = null;
                    }
                });
            });
        }

        function replaceScreenTrack(stream) {
            stream.isScreen = true;
            stream.streamid = stream.id;
            stream.type = 'local';
            screenStream = stream;
            console.log('replaceScreenTrack stream: ', stream);

            // connection.attachStreams.push(stream);
            connection.onstream({
                stream: stream,
                type: 'local',
                streamid: stream.id,
                userid: localUserId
                //mediaElement: getLocalMediaElement().media
            });

            var screenTrackId = stream.getTracks()[0].id;

            addStreamStopListener(stream, function() {
                replaceTrack(localStream.getVideoTracks()[0], screenTrackId);
                btnShareScreen.style.display = 'inline-block';
                screenStream = null;
                attachStream(getLocalMediaElement().media, localStream);

            });

            stream.getTracks().forEach(function(track) {
                if(track.kind === 'video' && track.readyState === 'live') {
                    //console.log('track:', track);
                    replaceTrack(track);
                }
            });

        }

         function attachStream(el, stream) {
            console.log('attachStream', stream);
            var myURL = window.URL || window.webkitURL;
            if (!myURL) {
                el.src = stream;
            } else {
                //el.src = myURL.createObjectURL(stream);
                el.srcObject = stream;
            }
        }

        function dialogMessage(title, message, ok) {
            $('#dialog-message').attr({'title': title});
            $('#dialog-message p').html('<p>' + message + '</p>');
            diagMess.dialog('option','buttons', {
                Ok: function() {
                    $( this ).dialog( "close" );
                    if (ok) ok();
                }
            });
            diagMess.dialog('open');

        }

        function closeDialogMessage(){
            if (diagMess)
                diagMess.dialog('close');
        }

    })();

};

