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
    res.sendFile('index.html', { root: path.join(__dirname, '../public/html') });

});

router.get('/qmap/:vconf', function (req, res) {
    res.send(vconf.getQuestionMap(req.params.vconf));
});

module.exports = router;