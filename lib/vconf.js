var HashMap = require('hashmap');
var async = require('async');
var config = require('./../config/redis');

var redisClient = config.redisClient;
var vconfs = {};
var questionmap = new HashMap();
var questionvaluemap = new HashMap();
var usernames = [];
var confs = [];
var DEFAULTTTL = 86400;

var QUESTION_MAP = "questionmap";
var QUESTION_VAL_MAP = "questionvaluemap";
var USERS_SET = "usersname";


exports.getQuestionMap = function (vconf, callback) {
    redisClient.smembers(vconf, function (err, data) {
        async.map(data, questionArr, callback);
    });
};

var questionArr = function (qId, callback) {
    var question = {};
    question.id = qId;
    redisClient.hget(QUESTION_MAP, qId, function (err, data) {
        question.question = data;
        redisClient.hget(QUESTION_VAL_MAP, qId, function (err, data) {
            question.value = data;
            callback(null, question);
        })
    });
};

exports.addUser = function (userName) {
    redisClient.sadd(USERS_SET, userName);
};

exports.addQuestionToVConf = function (vconf, id, data) {
    redisClient.hmset(QUESTION_MAP, id, data);
    redisClient.hmset(QUESTION_VAL_MAP, id, 0);
    redisClient.sadd(vconf, id);

};

exports.vote = function (data) {
    if (data) {
        var id = data.id;
        redisClient.hget(QUESTION_VAL_MAP, id, function (err, data) {
            var value = parseInt(data) || 0;
            if ('upvote' === data.action.trim().toString()) {
                value++;
            } else {
                value--;
            }
            redisClient.hmset(QUESTION_VAL_MAP, id, value);
        });

    }
};

exports.disconnectUser = function (userName) {
    delete usernames[userName];
};