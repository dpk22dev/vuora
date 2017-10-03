var express = require('express')
    , app = express()
    , http = require('http')
    , server = http.createServer(app)
    , io = require('socket.io').listen(server);

var HashMap = require('hashmap');

server.listen(8080);

// routing
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

app.get('/qmap/:vconf', function (req, res) {
    res.send(getQuestionMap(req.params.vconf));
});
var vconfs = {};
var questionmap = new HashMap();
var questionvaluemap = new HashMap();

// rooms which are currently available in chat
var rooms = ['room1', 'room2', 'room3'];
var usernames = [];
var getQuestionMap = function (vconf) {
    var response = [];
    var questions = vconfs[vconf];
    if (questions) {
        questions.forEach(function (questionId) {
            var question = {};
            question.id = questionId;
            question.question = questionmap.get(questionId);
            question.value = questionvaluemap.get(questionId);
            response.push(question);
        });
    }
    return response;
};
io.sockets.on('connection', function (socket) {

    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', function (username) {
        // store the username in the socket session for this client
        socket.username = username;
        // store the room name in the socket session for this client
        socket.room = 'room1';
        // add the client's username to the global list
        usernames[username] = username;
        // send client to room 1
        socket.join('room1');
        // echo to client they've connected
        socket.emit('updatechat', 'SERVER', 'you have connected to room1');
        // echo to room 1 that a person has connected to their room
        socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this room');
        socket.emit('updaterooms', rooms, 'room1');
    });

    // when the client emits 'sendchat', this listens and executes
    function addQuestionToVConf(vconf, id) {
        var questions;
        if (vconfs[vconf]) {
            questions = vconfs[vconf];
            questions.push(id);
        } else {
            questions = [];
            questions.push(id);
        }
        vconfs[vconf] = questions;
    }

    socket.on('sendchat', function (data) {
        // we tell the client to execute 'updatechat' with 2 parameters
        var vconf = socket.room;
        var cid = socket.username;
        var id = vconf + "_" + cid + "_" + Date.now();
        questionmap.set(id, data);
        questionvaluemap.set(id, 0);
        addQuestionToVConf(vconf, id);
        io.sockets.in(socket.room).emit('updatechat', socket.username, data);
    });

    socket.on('vote', function (data) {
        if (data) {
            var id = data.id;
            var value = questionvaluemap.get(id) || 0;
            if ('upvote' === data.action.trim().toString()) {
                value++;
            } else {
                value--;
            }
        }
        questionvaluemap.set(id, value);
    });

    socket.on('switchRoom', function (newroom) {
        socket.leave(socket.room);
        socket.join(newroom);
        socket.emit('updatechat', 'SERVER', 'you have connected to ' + newroom);
        // sent message to OLD room
        socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has left this room');
        // update socket session room title
        socket.room = newroom;
        socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username + ' has joined this room');
        socket.emit('updaterooms', rooms, newroom);
    });


// when the user disconnects.. perform this
    socket.on('disconnect', function () {
        // remove the username from global usernames list
        delete usernames[socket.username];
        // update list of users in chat, client-side
        io.sockets.emit('updateusers', usernames);
        // echo globally that this client has left
        socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        socket.leave(socket.room);
    });
});
