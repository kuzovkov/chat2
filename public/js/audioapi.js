////////////////////////////////////////////
// AudioAPI

var AU = {};
AU.app = null;

AU.init = function(app){
    AU.app = app;
    AU.audioCtx;
    AU.audioSource = null;
    try {
        // Fix up for prefixing
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        AU.audioCtx = new AudioContext();
    }
    catch(e) {
        console.log('Web Audio API is not supported in this browser');
    }

    AU.buffers = {}; /*объект для хранения буферов для звука вызова*/
    /*загружаем звук с сервера*/
    AU.loadSound('/sounds/' + AU.app.iface.call_sound);
};


/**
 * загрузка звукового файла с сервера и формирование из него буфера
 * @param url URL файла
 * @param buffer буфер в который помещается результат
 */
AU.loadSound = function(url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // Decode asynchronously
    request.onload = function() {
        AU.audioCtx.decodeAudioData(request.response, function(buffer) {
            AU.buffers[url.split('/').pop()] = buffer;
        }, function(err){console.log(err);});
    };
    request.send();
};

/**
 * проигрывание звука
 * @param buffer
 */
AU.playSound = function(file) {
    var buffer = AU.buffers[file];
    AU.audioSource = AU.audioCtx.createBufferSource();    // creates a sound audioSource
    AU.audioSource.buffer = buffer;                    // tell the audioSource which sound to play
    AU.audioSource.loop = true;
    AU.audioSource.connect(AU.audioCtx.destination);      // connect the audioSource to the context's destination (the speakers)
    AU.audioSource.start(0);                           // play the audioSource now// note: on older systems, may have to use deprecated noteOn(time);
};

/**
 * останов проигывания звука
 */
AU.stopSound = function(){
    if (AU.audioSource != null){
        AU.audioSource.stop(0);
        AU.audioSource = null;
    }
};

