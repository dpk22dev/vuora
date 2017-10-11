/**
 * Created by vinay.sahu on 10/3/17.
 */
var config = require('./../config/config');
var redis = require("redis"),
    client = redis.createClient(config.redis);

exports.redisClient = client;
