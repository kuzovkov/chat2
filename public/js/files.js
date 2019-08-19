/**
 * Created by user1 on 10.12.16.
 */

F = {};
F.app = null;
F.FILE_API = false;
F.choosen_files = [];

/**
 * инициализация
 * @param app
 */
F.init = function(app){
    F.app = app;
    if (window.File && window.FileReader && window.FileList && window.Blob){
        F.FILE_API = true;
        console.log('File API is supported');
    }else{
        F.FILE_API = false;
        console.log('File API is not supported');
    }
};

/**
 * обработчик выбора файлов
 * @param ev
 */
F.handlerFileSelect = function(ev){
    var files = ev.target.files;
    F.choosen_files = Array.from(files);
    F.app.iface.fillFilesList(F.choosen_files);
};

/**
 * чтение файла
 * @param f объект File
 * @param callback функция обратного вызова в которую
 * передается объект File и прочитанное содержимое файла
 */
F.readFile = function(f, callback){
    var reader = new FileReader();
    reader.onload = function(e){
        callback(f, e.target.result);
    };
    reader.readAsBinaryString(f);
};


/**
 * обработка сообщения от сервера что файл принят
 * @param fname
 */
F.fileAccepted = function(fname){
    for( var i in F.choosen_files){
        if (F.choosen_files[i].name == fname)
        {
            F.choosen_files.splice(i,1);
        }
    }
    if (F.choosen_files.length == 0){
        F.app.iface.fillFilesList(F.choosen_files);
        F.app.iface.files_input.value = null;
    }

};

/**
 * обработка сообщения от сервера что что при отправке файла произошла ошибка
 * @param fname
 */
F.uploadError = function(fname){
    for( var i in F.choosen_files){
        if (F.choosen_files[i].name == fname)
        {
            F.choosen_files.splice(i,1);
        }
    }
    F.app.iface.fillFilesList(F.choosen_files);
    dialogMessage('Chat1', 'Ошибка при отправке файла ' + fname);
};

/**
 * удаление присланного файла
 * @param e
 */
F.deleteFile = function(e){
    var url = this.id;
    Ajax.sendRequest('GET', url, null, A.requestFiles);
};

/**
 * загрузка файла на сервер
 * @param f объект File
 * @param url URL обработчика загрузки
 * @param to адресат
 * @param from отправитель
 * @param progressbar элемент в котором будет отображаться прогресс загрузки
 */
F.sendFile = function(f, url, to, from, progressbar){
    //console.log(f);
    var formData = new FormData();
    formData.append('myfile', f, f.name);
    formData.append('to', to);
    formData.append('from', from);
    $.ajax({
        url: url,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(data){
            console.log('upload successful!\n' + data);
        },
        xhr: function() {
            // create an XMLHttpRequest
            var xhr = new XMLHttpRequest();

            // listen to the 'progress' event
            xhr.upload.addEventListener('progress', function(evt) {

                if (evt.lengthComputable) {
                    // calculate the percentage of upload completed
                    var percentComplete = evt.loaded / evt.total;
                    percentComplete = parseInt(percentComplete * 100);
                    // update the progressbar with the new percentage
                    progressbar.innerText = percentComplete + '%';
                    progressbar.textContent = percentComplete + '%';
                    progressbar.style.width = percentComplete + '%';

                    // once the upload reaches 100%, set the progress bar text to done
                    if (percentComplete === 100) {
                        progressbar.innerText = 'Done';
                        progressbar.textContent = 'Done';
                    }
                }

            }, false);

            return xhr;
        }
    });
}


