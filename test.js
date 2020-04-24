/**
 * Created by user1 on 10.12.16.
 */
var fs = require('fs');
var filename = 'readme.txt';
var md5 = require('./modules/md5');


//var s = 'admin';
//console.log(md5(s));

var fname = fs.realpathSync('readme.txt');
console.log(fname);

console.log(fs.existsSync(fname));
