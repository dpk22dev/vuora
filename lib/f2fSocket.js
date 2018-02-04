var usData = require('../models/userSocketData');
var f2fData = require('../models/f2fData');
var uuid = require('node-uuid'),
    crypto = require('crypto');
const nodeConfig = require('config');

var f2fSocket = {};

//data is already comming with userid
function f2fSocketCreator( io, data ) {

    var config = nodeConfig.get('signalMaster');
    var f2fNsp = io;
    f2fNsp.on('connection', function (socket) {

        //data.socketId = socket.id;
        /*
         usData.getUserSocket( data, function ( err, ret ) {
         if( err || !ret ){
         usData.addUserSocket( data, function( e, r ){ if(e)  console.log('error in setting notification key in redis'); } );
         }
         } );
         */
        notiSocket = socket;
        socket.userId = data.userId;

// signal master code begins
        socket.resources = {
            screen: false,
            video: true,
            audio: false
        };

// pass a message to another id
        socket.on('message', function (details) {
            if (!details) return;

            var otherClient = io.to(details.to);
            if (!otherClient) return;

            details.from = socket.id;
            otherClient.emit('message', details);
        });

        socket.on('shareScreen', function () {
            socket.resources.screen = true;
        });

        socket.on('unshareScreen', function (type) {
            socket.resources.screen = false;
            removeFeed('screen');
        });

        socket.on('join', join);

        function removeFeed(type) {
            if (socket.room) {
                io.sockets.in(socket.room).emit('remove', {
                    id: socket.id,
                    type: type
                });
                if (!type) {
                    socket.leave(socket.room);
                    socket.room = undefined;
                }
            }
        }

        function join(name, cb) {
            // sanity check
            if (typeof name !== 'string') return;
            // check if maximum number of clients reached
            if (config.rooms && config.rooms.maxClients > 0 &&
                clientsInRoom(name) >= config.rooms.maxClients) {
                safeCb(cb)('full');
                return;
            }
            // leave any existing rooms
            removeFeed();
            safeCb(cb)(null, describeRoom(name));
            socket.join(name);
            socket.room = name;
        }

// we don't want to pass "leave" directly because the
// event type string of "socket end" gets passed too.
        socket.on('disconnect', function () {
            removeFeed();
        });
        socket.on('leave', function () {
            removeFeed();
        });

        socket.on('create', function (name, cb) {
            if (arguments.length == 2) {
                cb = (typeof cb == 'function') ? cb : function () {};
                name = name || uuid();
            } else {
                cb = name;
                name = uuid();
            }
            // check if exists
            var room = io.nsps['/'].adapter.rooms[name];
            if (room && room.length) {
                safeCb(cb)('taken');
            } else {
                join(name);
                safeCb(cb)(null, name);
            }
        });

// support for logging full webrtc traces to stdout
// useful for large-scale error monitoring
        socket.on('trace', function (data) {
            console.log('trace', JSON.stringify(
                [data.type, data.session, data.prefix, data.peer, data.time, data.value]
            ));
        });


// tell client about stun and turn servers and generate nonces
        socket.emit('stunservers', config.stunservers || []);

// create shared secret nonces for TURN authentication
// the process is described in draft-uberti-behave-turn-rest
        var credentials = [];
// allow selectively vending turn credentials based on origin.
        var origin = socket.handshake.headers.origin;
        if (!config.turnorigins || config.turnorigins.indexOf(origin) !== -1) {
            config.turnservers.forEach(function (server) {
                var hmac = crypto.createHmac('sha1', server.secret);
                // default to 86400 seconds timeout unless specified
                var username = Math.floor(new Date().getTime() / 1000) + (parseInt(server.expiry || 86400, 10)) + "";
                hmac.update(username);
                credentials.push({
                    username: username,
                    credential: hmac.digest('base64'),
                    urls: server.urls || server.url
                });
            });
        }
        socket.emit('turnservers', credentials);

// signal master code ends



        socket.on("error", function (err) {
            console.log("Caught server socket error: ");
            console.log(err.stack);
        });

        socket.on("disconnect", function ( reason ) {
            //understand disconnection, ping, pong timouts, try reconnect
            //maybe we don't need to worry about it, on reconnection same key will be
            //overritten
            /*data.expire = 0;
             usData.removeUserSocket( data, function ( err ) {
             console.log( "disconnected " + reason );
             } );*/
        });

        socket.on('ping', function ( data ) {
            notiData.insertNotifications(data);
        });
    });


    function describeRoom(name) {
        var adapter = io.nsps['/'].adapter;
        // https://github.com/andyet/SimpleWebRTC/issues/400
        // commenting below with new line
        //var clients = adapter.rooms[name] || {};
        var clients = adapter.rooms[name] ? adapter.rooms[name].sockets : {};
        var result = {
            clients: {}
        };
        Object.keys(clients).forEach(function (id) {
            result.clients[id] = adapter.nsp.connected[id].resources;
        });
        return result;
    }

    function clientsInRoom(name) {
        return io.sockets.clients(name).length;
    }

}

function safeCb(cb) {
    if (typeof cb === 'function') {
        return cb;
    } else {
        return function () {};
    }
}

module.exports = { f2fSocket: f2fSocket, f2fSocketCreator: f2fSocketCreator };
