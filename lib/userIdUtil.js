/**
 * Created by vinay.sahu on 11/6/17.
 */
var redis = require('./redis');
var redisClient = redis.redisClient;
var async = require('async');

var USER_ID = 'userid';
var ID_MAP = 'idtouid';
var UID_MAP = 'uidtoid';

function createResponse(id, uid) {
    var res = {};
    res.id = id;
    res.uid = uid;
    return res;
}

function getUid(id, callback) {
    redisClient.hget(ID_MAP, id, function (err, data) {
        if (data) {
            callback(null, createResponse(id, data));
        } else {
            callback({err: 'key not present'}, createResponse(id, data));
        }
    })
}

function getNewUserId(id, callback) {
    redisClient.incr(USER_ID, function (err, result) {
        redisClient.hset(ID_MAP, id, result);
        redisClient.hset(UID_MAP, result, id);
        callback(err, createResponse(id, result));
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
                callback(null, createResponse(id, newUid));
            }

        }
    })
};

uidUtil.getUIDArray = function (ids, callback) {
    var obj = {};
    async.map(ids, getUid, function (err, results) {
        results.forEach(function (result) {
            obj[result.id] = result.uid;
        });
        callback(err, obj);
    })
};

module.exports = uidUtil;