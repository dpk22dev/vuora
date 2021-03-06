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
    linkedin.getProfile(code, function(user){
        var id = user.id;
        res.cookie('jarvis', id);
        res.writeHead(301,
            {Location: 'http://localhost:8080'}
        );
        res.end();
    });
});

router.get('/gclbk', function (req, res) {
    var params = req.query;
    var code = params.code;
    linkedin.getProfile(code, function (response) {
        var id = response.id;
        res.cookie('jarvis', id, {maxAge: 900000, httpOnly: true});
        res.writeHead(301,
            {Location: 'http://localhost:8080'}
        );
        res.end();
    });
});

router.get('/unauth/allClients', function (req, res) {
    console.log( chatIo );
    res.end();
});

module.exports = router;