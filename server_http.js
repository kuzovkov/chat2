#!/usr/bin/env node

/*сервер*/

var fs = require('fs');
var express = require('express');
var app = express();
var fileUpload = require('express-fileupload');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);
var port_default = 80;
var port = (process.argv.length > 2)? parseInt(process.argv[2]) : port_default;
var cons = require('consolidate');
const RTCMultiConnectionServer = require('rtcmulticonnection-server');


server.listen(port,function(){
    console.log('Server start at port '+port+ ' ' + (new Date()).toISOString());
    /*сброс привилегий*/
    if (process.getuid && process.setuid) {
        console.log('Current uid: ' + process.getuid());
        if (process.geteuid)
            console.log('Current euid: ' + process.geteuid());
        try {
            process.setuid('www-data');
            console.log('New uid: ' + process.getuid());
            if (process.geteuid && process.seteuid){
                process.seteuid('www-data');
                console.log('New euid: ' + process.geteuid());
            }
        }
        catch (err) {
            console.log('Failed to set uid: ' + err);
        }
    }
});



/* настройки для рендеринга шаблонов*/
app.engine('html', cons.swig);
app.set('view engine', 'html');
app.set('views',__dirname+'/views');

/* подключение каталога статических файлов, cookies, bodyParser */
app.use(express.static(__dirname+'/public'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));

io.of('/rtcmulticonnection/').on('connection', function(socket) {
    RTCMultiConnectionServer.addSocket(socket);
});



