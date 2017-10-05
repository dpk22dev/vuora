/*
var express = require('express')
    , app = express()
    , http = require('http')
    , server = http.createServer(app)
    , io = require('socket.io').listen(server);
*/
var express = require('express')
    , app = express()
    , http = require('http')
    , server = http.createServer(app);
io = require('socket.io').listen(server);
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


router.get('/', function (req, res) {
    //res.sendfile('/public/html/index.html');
    res.sendFile('index.html', { root: path.join(__dirname, '../public/html') });
});

router.get('/qmap/:vconf', function (req, res) {
    res.send(vconf.getQuestionMap(req.params.vconf));
});

io.sockets.on('connection', function (socket) {

    socket.on('adduser', function (user) {
        socket.username = user.username;
        socket.room = user.conf;
        vconf.addUser(socket.username);
        socket.join(user.conf);
        socket.emit('updatechat', 'SERVER', 'you have connected to' + user.conf);
        socket.broadcast.to(user.conf).emit('updatechat', 'SERVER', user.username + ' has connected to this conf');
        //socket.emit('updaterooms', rooms, user.conf);
    });

    socket.on('sendchat', function (data) {
        var vconfRoom = socket.room;
        var cid = socket.username;
        var id = vconfRoom + "_" + cid + "_" + Date.now();
        vconf.addQuestionToVConf(vconfRoom, id, data);
        io.sockets.in(socket.room).emit('updatechat', socket.username, data);
    });

    socket.on('vote', function (data) {
        vconf.vote(data);
    });

    socket.on('switchRoom', function (newconf) {
        socket.leave(socket.room);
        socket.join(newconf);
        socket.emit('updatechat', 'SERVER', 'you have connected to ' + newconf);
        socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has left this room');
        socket.room = newconf;
        socket.broadcast.to(newconf).emit('updatechat', 'SERVER', socket.username + ' has joined this room');
        socket.emit('updaterooms', rooms, newconf);
    });

    /*
     socket.on('disconnect', function () {
     vconf.disconnectUser(socket.username);
     io.sockets.emit('updateusers', usernames);
     socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
     socket.leave(socket.room);
     }); */
});

module.exports = router;