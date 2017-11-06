/**
 * Created by vinay.sahu on 11/6/17.
 */
var redis = require('./redis');
var redisClient = redis.redisClient;

var USER_ID = 'userid';
var ID_MAP = 'idtouid';
var UID_MAP = 'uidtoid';

function getNewUserId(id, callback) {
    redisClient.incr(USER_ID, function (err, result) {
        redisClient.hset(ID_MAP, id, result);
        redisClient.hset(UID_MAP, result, id);
        callback(err, {uid: result});
    });
}

var uidUtil = {};

uidUtil.getUID = function (id, callback) {
    redisClient.hget(ID_MAP, id, function (err, data) {
        console.log(data);
        if (err) {
            callback(err, null);
        } else {
            var newUid = null;
            if (!data) {
                getNewUserId(id, callback);
            } else {
                newUid = data;
                callback(null, {uid: newUid});
            }

        }
    })
};

module.exports = uidUtil;