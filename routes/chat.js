/*
 var express = require('express')
 , app = express()
 , http = require('http')
 , server = http.createServer(app)
 , io = require('socket.io').listen(server);
 */
/*var express = require('express')
 , app = express()
 , http = require('http')
 , server = http.createServer(app);
 io = require('socket.io').listen(server);*/
var express = require('express');
var router = express.Router();
var path = require('path');
var linkedin = require('./../lib/linkedIn');

/* GET users listing. */
/*
 router.get('/', function(req, res, next) {
 res.send('respond with a resource');
 });
 */


var HashMap = require('hashmap');
var vconf = require('../lib/vconf');
//server.listen(3001);


router.get('/', function (req, res, next) {
    //res.sendfile('/public/html/index.html');
    res.sendFile('index.html', {root: path.join(__dirname, '../public/html')});

});

router.get('/glogin', function (req, res, next) {
    //res.sendfile('/public/html/index.html');
    res.sendFile('glogin.html', {root: path.join(__dirname, '../public/html')});

});

router.get('/lclbk', function (req, res) {
    var params = req.query;
    var code = params.code;
    linkedin.getProfile(code);
    res.writeHead(301,
        {Location: 'http://localhost:3000'}
    );
    res.end();
});

router.get('/gclbk', function (req, res) {
    var params = req.query;
    var code = params.code;
    linkedin.getProfile(code);
    res.sendFile('thanks.html', {root: path.join(__dirname, '../public/html')});
});

router.get('/qmap/:vconf', function (req, res) {
    vconf.getQuestionMap(req.params.vconf, function (err, response) {
        res.send(response);
    });
});

module.exports = router;