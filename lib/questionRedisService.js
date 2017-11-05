/**
 * Created by vinay.sahu on 11/5/17.
 */
var async = require('async');
var util = require('./util');
var config = require('./redis');
var qService = require('./questionService');

var redisClient = config.redisClient;

function getVotes(qId, callback) {
    var data = {};
    var upvoteKey = qId + "_UPVOTE";
    var downvoteKey = qId + "_DOWNVOTE";
    redisClient.scard(upvoteKey, function (err, upvotes) {
        var upvotes = upvotes || 0;
        redisClient.scard(downvoteKey, function (err, downvotes) {
            var downvotes = downvotes || 0;
            data.qId = qId;
            data.upvotes = upvotes;
            data.downvotes = downvotes;
            callback(null, data);
        })
    })
}
var qRedisService = {};

qRedisService.save = function (data, callback) {
    var videoId = data.videoId;
    var qId = util.getId();
    data.qId = qId;
    var key = videoId + "_QUESTION";
    redisClient.sadd(key, qId);
    qService.save(data, callback);
};

qRedisService.vote = function (data, callback) {
    var qId = data.id;
    var vote = data.vote === 'upvote' ? 'UPVOTE' : 'DOWNVOTE';
    var key = qId + "_" + vote;
    redisClient.sadd(key, data.user);
    qService.vote(data, callback);
};

qRedisService.voteCountByVideoId = function (id, callback) {
    var result = {};
    var key = id + "_QUESTION";

    redisClient.smembers(key, function (err, qIds) {
        async.map(qIds, getVotes, function (err, results) {
            console.log(results);
            callback(util.convertToResponse(err, results, 'Error occured while getting vote count from redis'))
        })
    })
};

qRedisService.voteCountByQuestionId = function (id, callback) {
    getVotes(id, function (err, data) {
        callback(util.convertToResponse(err, data, 'Error occured while getting vote count from redis'))
    });
};

module.exports = qRedisService;


