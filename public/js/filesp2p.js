Fp2p = {};

Fp2p.BYTES_PER_CHUNK = 12*1024;
Fp2p.app = null;
Fp2p.p2pConnection = null;
Fp2p.incomingFiles = {};

Fp2p.init = function (app) {
    Fp2p.app = app;
};

Fp2p.getFileObject = function(file, p2pConnection){
    return {
        file: file,
        fileReader: new FileReader(),
        p2pConnection: p2pConnection,
        currentChunk: 0,
        uuid: UUID4()
    };
};

Fp2p.sendFile = function(file, p2pConnection){
    var fileObj = Fp2p.getFileObject(file, p2pConnection);
    fileObj.fileReader.onload = function(){ Fp2p.sendNextChunk(fileObj)};
    Fp2p.startUpload(fileObj);
};

Fp2p.startDownload = function (data) {
    console.log(data);
    Fp2p.incomingFiles[data.uuid] = {};
    Fp2p.incomingFiles[data.uuid].incomingFileInfo = data;
    Fp2p.incomingFiles[data.uuid].incomingFileData = [];
    Fp2p.incomingFiles[data.uuid].bytesReceived = 0;
    Fp2p.incomingFiles[data.uuid].downloadInProgress = true;
    console.log( 'incoming file <b>' + Fp2p.incomingFiles[data.uuid].incomingFileInfo.fileName + '</b> of ' + Fp2p.incomingFiles[data.uuid].incomingFileInfo.fileSize + ' bytes' );
};


Fp2p.progressDownload = function(data) {
    console.log(data);
    if (data.data === undefined)
        return;
    if( data.data == -1 ) {
        Fp2p.endDownload(data.uuid);
        return;
    }
    var bytes = (new TextEncoder()).encode(data.data);
    console.log(bytes);
    Fp2p.incomingFiles[data.uuid].bytesReceived += bytes.byteLength;
    Fp2p.incomingFiles[data.uuid].incomingFileData.push( bytes );
    console.log(Fp2p.incomingFiles[data.uuid].bytesReceived);
    console.log(Fp2p.incomingFiles[data.uuid].incomingFileInfo.fileSize);
    console.log( 'progress: ' +  ((Fp2p.incomingFiles[data.uuid].bytesReceived / Fp2p.incomingFiles[data.uuid].incomingFileInfo.fileSize ) * 100).toFixed( 2 ) + '%' );
    if( Fp2p.incomingFiles[data.uuid].bytesReceived === Fp2p.incomingFiles[data.uuid].incomingFileInfo.fileSize ) {
        Fp2p.endDownload(data.uuid);
    }

};

Fp2p.endDownload = function (uuid) {
    Fp2p.incomingFiles[uuid].downloadInProgress = false;
    var blob = new window.Blob(Fp2p.incomingFiles[uuid].incomingFileData);
    var anchor = document.createElement('a');
    anchor.innerHTML = Fp2p.incomingFiles[uuid].incomingFileInfo.fileName;
    anchor.href = URL.createObjectURL( blob );
    anchor.download = Fp2p.incomingFiles[uuid].incomingFileInfo.fileName;
    Fp2p.app.iface.appendIncomingFile(anchor);
    if( anchor.click ) {
        anchor.click();
    } else {
        var evt = document.createEvent('MouseEvents');
        evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        anchor.dispatchEvent(evt);
    }
    delete Fp2p.incomingFiles[uuid];
};

Fp2p.startUpload = function(fileObj){
    console.log( 'sending ' + fileObj.file.name + ' of ' + fileObj.file.size + ' bytes' );
    fileObj.currentChunk = 0;
    fileObj.p2pConnection.send(JSON.stringify({
        fileName: fileObj.file.name,
        fileSize: fileObj.file.size,
        uuid: fileObj.uuid,
        data: null
    }));
    Fp2p.readNextChunk(fileObj);
};

Fp2p.readNextChunk = function (fileObj){
    var start = Fp2p.BYTES_PER_CHUNK * fileObj.currentChunk;
    var end = Math.min( fileObj.file.size, start + Fp2p.BYTES_PER_CHUNK );
    fileObj.fileReader.readAsArrayBuffer( fileObj.file.slice( start, end ) );
};

Fp2p.sendNextChunk = function (fileObj) {
    fileObj.p2pConnection.send(JSON.stringify({uuid: fileObj.uuid, data: (new TextDecoder()).decode(fileObj.fileReader.result)}));
    console.log({uuid: fileObj.uuid, data: fileObj.fileReader.result});
    fileObj.currentChunk++;
    if( Fp2p.BYTES_PER_CHUNK * fileObj.currentChunk < fileObj.file.size ) {
        Fp2p.readNextChunk(fileObj);
    }else{
        fileObj.p2pConnection.send(JSON.stringify({
            uuid: fileObj.uuid,
            data: -1
        }));
        Fp2p.app.files.fileAccepted(fileObj.file.name);
        Fp2p.init(Fp2p.app);
        fileObj = null;
    }
};