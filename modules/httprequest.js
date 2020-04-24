var http = require('http');
var Url = require('url');


/**
 * Отправка запроса методом HTTP GET
 * @param url URL  http://site.com:8000/path?param1=value1&param2=value2
 * @param callback функция обратного вызова в которую передается результат
 **/
function get( url, callback  ){
    var urlObject = Url.parse(url);
    var path = urlObject.path;
    var hostname = urlObject.hostname;
    var port = urlObject.port;
    var results = [];
    var options = {
        hostname: hostname,
        port: port,
        path: path,
        method: 'GET'
    };

    var req = http.request(options, function(res){
        if ( res.statusCode === 200 ){
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                results.push(chunk);
            });
            res.on('end',function(){
                result = JSON.parse(results.join(''));
                callback(result);
            });
        }
        else{
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                callback(undefined);
            });
        }

    });

    req.on('error', function(e) {
        console.log('httprequest.get: problem with request: ' + e.message);
    });

    req.end();
}


/**
 * Отправка запроса методом HTTP POST
 * @param url URL http://site.com:8000/path
 * @param data параметры param1=value1&param2=value2...
 * @param callback функция обратного вызова в которую передается результат
 **/
function post( url, data, callback ){
    var urlObject = Url.parse(url);
    var path = urlObject.pathname;
    var params = 'data=' + data;
    var hostname = urlObject.hostname;
    var port = urlObject.port;
    var results = [];
    var options = {
        hostname: hostname,
        port: port,
        path: path,
        method: 'POST',
        headers: {'Content-type': 'application/x-www-form-urlencoded'}
    };

    var req = http.request(options, function(res){
        if ( res.statusCode === 200 ){
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                results.push(chunk);
            });
            res.on('end',function(){
                var result = JSON.parse(results.join(''));
                callback(result);
            });
        }
        else{
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                //console.log(chunk);
                callback(undefined);
            });
        }

    });

    req.on('error', function(e) {
        console.log('httprequest.post: problem with request: ' + e.message);
    });

    // write data to request body
    req.write(params);
    req.end();
}

exports.get = get;
exports.post = post;
