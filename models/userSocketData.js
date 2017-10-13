var rc = require('../lib/redis');

var redisClient = rc.redisClient;
var DEFAULTTTL = 86400;

/*

var dummySocketData = {
    userId : '',
    socketId : ""
}
*/

exports.addUserSocket = function ( data, cb ) {
    redisClient.set(data.userId, data.socketId, cb );
};

exports.getUserSocket = function ( data, cb) {
    redisClient.get( data.userId, cb );
};
