var rc = require('../lib/redis');

var redisClient = rc.redisClient;
var DEFAULTTTL = 86400;
const USER_SOCKET_ID_HASH = 'user_socket_map';
/*

var dummySocketData = {
    userId : '',
    socketId : ""
}
*/

exports.addUserSocket = function ( data, cb ) {
    redisClient.hset(USER_SOCKET_ID_HASH, data.userId, data.socketId, cb );
};

exports.getUserSocket = function ( data, cb) {
    redisClient.hget( USER_SOCKET_ID_HASH, data.userId, cb );
};

exports.removeUserSocket = function ( data, cb) {
    redisClient.expire( USER_SOCKET_ID_HASH, data.userId, data.expire, cb );
};
