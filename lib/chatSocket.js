var HashMap = require('hashmap');
var vconf = require('./vconf');
var usData = require('../models/userSocketData');

var chatSocket = {};

//data is already comming with userid
function chatSocketCreator( io, data ) {
    var chatNsp = io;
    chatNsp.on('connection', function (socket) {
        data.socketId = socket.id;
        usData.addUserSocket( data, function( err, ret ){ if(err)  { console.log('error in setting chat key in redis'); } else { console.log( data.userId + ' got socket id ' + data.socketId ) } } );
        chatSocket = socket;

        socket.on("error", function(err) {
            console.log("Caught server socket error: ");
            console.log(err.stack);
        });

        escapeHyphen = function( str ){
            var newStr = str.replace(/-/g, "\\-");
            return newStr;
        }

        socket.on('adduser', function (user) {
            //console.log('got request to add user' + user );
            socket.username = user.username;
            socket.room = user.conf;
            //escaping - for redis name
            var room = escapeHyphen( user.conf );
            vconf.addUser(room, user.username, function( err, result ){
                if( err ){
                    
                } else {
                    socket.join(user.conf);
                    socket.room = user.conf;
                }
                
            });
            
            
        });
/*

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

*/
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

        socket.on( 'questionAdded', function ( data ) {
            console.log( data );
            socket.broadcast.to(socket.room).emit('questionAdded', data );
        } )

        socket.on( 'questionAddedAjaxNow', function ( data ) {
            console.log( data );
            socket.broadcast.to(socket.room).emit('questionAdded', data );
        } )
        
    });


}

module.exports = { chatSocket: chatSocket, chatSocketCreator: chatSocketCreator };