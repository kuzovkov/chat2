/**
* модуль обработки http запросов к серверу
**/
var fs = require('fs');
var path = require('path');
var urlencode = require('urlencode');


/**
* обработчик GET запроса на '/'
**/
function index(req,res){
    var nicname = req.cookies.nicname;
    if ( nicname == undefined || nicname == 'undefined'){
        res.redirect('/choosenicname');
        res.end();
    }else{
        var userlist = global.chat.getUsersOnline();
        res.render('index', {nicname:nicname, userlist: userlist});
    }

}

/**
* обработчик GET запроса на '/choosenicname'
**/
function choosenicname(req, res){
    res.render('choosenicname');
}

/**
 * обработчик POST запроса на '/choosenicname'
 *  @param req
 * @param res
 */
function newUser(req,res){
    var nicname = req.body.nicname;
    if (!global.chat.addUser(nicname)){
        var message = 'This NicName is busy';
        res.render('choosenicname', {message:message});
    }else{
        res.cookie('nicname', nicname);
        res.redirect('/');
        res.end();
    }
}

/**
* обработчик GET запроса на '/file/:secret'
**/
function download_file(req, res){
    var secret = req.params.secret;
    var file_meta = global.chat.getFileMetadataBySecret(secret);
    if (file_meta != null){
        var fname = fs.realpathSync(global.chat.USERS_FILES_DIR + path.sep + file_meta.encname);
        console.log(fname);
        if (fs.existsSync(fname)){
            res.header('Content-Disposition', 'attachment; filename=' + urlencode(file_meta.origname));
            res.header('Content-Type', 'application/octet-stream');
            res.sendFile(fname);
        }else{
            console.log('not found');
            res.redirect('/');
            res.end();
        }
    }else{
        res.redirect('/');
        res.end();
    }
}

/**
 * обработчик GET запроса на '/file-del/:secret'
 **/
function remove_file(req, res){
    var secret = req.params.secret;
    var file_meta = global.chat.getFileMetadataBySecret(secret);
    if (file_meta != null) {
        var fname = fs.realpathSync(global.chat.USERS_FILES_DIR + path.sep + file_meta.encname);
        if (fs.existsSync(fname)) {
            fs.unlink(fname, function(){
                global.chat.delFileMetadataBySecret(secret);
            });
        }
    }
    res.send(true);
    res.end();

}


/**
 * загрузка файла на сервер
 * @param req
 * @param res
 */
function upload_file(req,res){
    var to = req.body.to;
    var from = req.body.from;
    //console.log(to, from);
    if (!req.files) {
        res.send('No files were uploaded.');
        res.end();
    }
    var fdata = req.files.myfile.data;
    var buffer = new Buffer(fdata, req.files.myfile.encoding);
    var fname = req.files.myfile.name;
    global.chat.saveFile(from, to, fname, buffer, function(fsize){
        var socketTo = global.chat.getSocket(to);
        var socketFrom = global.chat.getSocket(from);
        if (fsize === false){
            socketFrom.emit('upload_error', {fname: fname});
        }else{
            socketTo.emit('have_file', {from: from, fname: fname, fsize: fsize});
            socketFrom.emit('file_accepted', {to: to, fname: fname});
        }
    });

}


function test(req, res){
    res.render('test');
}

function conference(req, res){
    res.render('conference');
}

function conference2(req, res){
    res.render('conference2');
}

function test_design(req, res){
    res.render('test_design');
}

exports.index = index;
exports.download_file = download_file;
exports.remove_file = remove_file;
exports.choosenicname = choosenicname;
exports.newUser = newUser;
exports.upload_file = upload_file;
/*debug handlers*/
exports.test = test;
exports.conference = conference;
exports.conference2 = conference2;
exports.test_design = test_design;