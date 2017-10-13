var usData = require('../models/userSocketData');
var notiData = require('../models/notiData');

//data is already comming with userid
function notiSocket( io, data ) {

    var notiNsp = io;
    notiNsp.on('connection', function (socket) {

        data.socketId = socket.id;
        usData.addUserSocket( data );

        socket.on("error", function (err) {
            console.log("Caught server socket error: ");
            console.log(err.stack);
        });
        
        socket.on("helo", function ( data ) {
            //remove entry from redis
            console.log('got helo from', data.id );
            socket.emit('oleh');
        })

        socket.on("getNoti", function () {
            var inpNotiData = notiData.dummyNotiData;
            inpNotiData.to = data.userId;
            notiData.getPendingNotifications( inpNotiData ).then( function ( res ) {
                socket.emit('sentNoti', res );
            }, function ( err ) {
                socket.emit('sentNoti', { 'error': 'error in getting notifications from db' });
            });
        });
        
    }); 
}

module.exports = notiSocket;