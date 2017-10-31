var HashMap = require('hashmap');
var vconf = require('./vconf');
var usData = require('../models/userSocketData');

var chatSocket = {};

//data is already comming with userid
function chatSocketCreator( io, data ) {
    var chatNsp = io;
    chatNsp.on('connection', function (socket) {
        data.socketId = socket.id;
        usData.addUserSocket( data, function( err, ret ){ if(err)  console.log('error in setting chat key in redis'); } );
        chatSocket = socket;

        socket.on("error", function(err) {
            console.log("Caught server socket error: ");
            console.log(err.stack);
        });

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
            chatNsp.sockets.in(socket.room).emit('updatechat', socket.username, data);
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
         chatNsp.sockets.emit('updateusers', usernames);
         socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
         socket.leave(socket.room);
         }); */

        socket.on( 'receiveNoti', function () {
            //get all events in which user is receiver
            var chatData = [];
            socket.emit('serverPushchat', chatData );
        });

        //

    });


}

module.exports = { chatSocket: chatSocket, chatSocketCreator: chatSocketCreator };