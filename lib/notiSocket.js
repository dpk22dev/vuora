function notiSocket( io ) {

    var notiNsp = io.of('/notiNsp');
    notiNsp.on('connection', function (socket) {

        socket.on("error", function (err) {
            console.log("Caught server socket error: ");
            console.log(err.stack);
        });
        
        socket.on("helo", function ( data ) {
            //remove entry from redis
            console.log('got helo from', data.username);
            socket.emit('oleh');
        })
        
    });
}

module.exports = notiSocket;