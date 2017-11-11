/**
 * Created by vinay.sahu on 10/3/17.
 */
var config = require('config');
var redis = require("redis");
var redisPort = config.get('redis.port');
var redisHost = config.get('redis.host');
var client = redis.createClient(redisPort, redisHost);

exports.init = function (callback) {
    if (client == null) {
        client = redis.createClient(redisPort, redisHost);
        callback(null, client);
    } else {
        callback(null, client);
    }
};
exports.redisClient = client;
