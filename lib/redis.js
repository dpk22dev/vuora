/**
 * Created by vinay.sahu on 10/3/17.
 */
var config = require('./../config/config');
var redis = require("redis"),
    client = redis.createClient(config.redis.port, config.redis.host);

exports.init = function (callback) {
    if (client == null) {
        client = redis.createClient(config.redis.port, config.redis.host);
        callback(null, client);
    } else {
        callback(null, client);
    }
};
exports.redisClient = client;
