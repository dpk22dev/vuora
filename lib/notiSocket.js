var usData = require('../models/userSocketData');
var notiData = require('../models/notiData');

var notiSocket = {};

//data is already comming with userid
function notiSocketCreator( io, data ) {

    var notiNsp = io;
    notiNsp.on('connection', function (socket) {
        // no meaning of doing beow
        //data.socketId = socket.id;
        /*usData.addUserSocket( data, function( err, ret ){ if(err)  console.log('error in setting notification key in redis'); } );*/
        /*usData.addUserSocket( data, function( err, ret ){ if(err)  { console.log('error in setting notification key in redis'); } else { console.log( data.userId + ' got socket id ' + data.socketId ) } } );
        */
        notiSocket = socket;
        socket.userId = data.userId;
        socket.on("error", function (err) {
            console.log("Caught server socket error: ");
            console.log(err.stack);
        });

        socket.on("getNoti", function () {
            var inpNotiData = notiData.dummyNotiData;
            inpNotiData.to = data.userId;
            notiData.getPendingNotifications( inpNotiData ).toArray( function (err, docs) {
                if( err ){
                    socket.emit('sentNoti', { 'error': 'error in getting notifications from db' });
                } else {
                    socket.emit('sentNoti', docs);
                }
            });
        });

        socket.on('notifyTo', function (data) {
            msg = 'hi';
            usData.getUserSocket( data, function ( err, socketId ) {
                socket.to(socketId).emit( 'sentNoti', msg );
            })
        });

        socket.on("disconnect", function ( reason ) {
            //understand disconnection, ping, pong timouts, try reconnect
            //maybe we don't need to worry about it, on reconnection same key will be
            //overritten
            /*data.expire = 0;
            usData.removeUserSocket( data, function ( err ) {
                console.log( "disconnected " + reason );
            } );*/
        })

        socket.on('ping', function ( data ) {
            notiData.insertNotifications(data);
        });
    });
}

module.exports = { notiSocket: notiSocket, notiSocketCreator: notiSocketCreator };