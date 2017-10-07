/**
 * Created by vinay.sahu on 10/3/17.
 */
var redis = require("redis"),
    client = redis.createClient();

exports.redisClient = client;
