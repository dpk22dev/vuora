/**
 * Created by vinay.sahu on 11/5/17.
 */
var async = require('async');
var util = require('./util');
var config = require('./redis');
var qService = require('./questionService');
var tService = require('./timelineService');

var redisClient = config.redisClient;

function getQuestion(qId, callback) {
    qService.getQuestion(qId, function (result) {
        if (result.data) {
            callback(null, result.data);
        } else {
            callback(result.message, null);
        }
    })
}

var qRedisService = {};
qRedisService.getTopQuestions = function (data, callback) {
    var max = '+inf', min = '-inf', offset = 0, count = 3;
    var args2 = [data.videoId, max, min, 'WITHSCORES', 'LIMIT', offset, count];
    redisClient.zrevrangebyscore(args2, function (err, response) {
        if (response.length > 0) {
            var qId = response[0];
            qService.getQuestion(qId, callback);
        } else {
            callback(util.convertToResponse({err: 'No question found'}, response, 'No question found'))
        }
    });
};

qRedisService.save = function (data, callback) {
    var videoId = data.videoId;
    var qId = util.getId();
    data.qId = qId;
    redisClient.zadd(videoId, 0, qId);
    qService.save(data, callback);
};

qRedisService.vote = function (data, callback) {
    var videoId = data.videoId;
    var qId = data.qId;
    qService.vote(data, function (result) {
        if (result.data) {
            if (data.vote === 'upvote') {
                redisClient.zincrby(videoId, 1, qId);
            } else {
                redisClient.zincrby(videoId, -1, qId);
            }
        }
        callback(result);
    });

};

qRedisService.voteCountByVideoId = function (data, callback) {
    var voteCount = [];
    redisClient.zscan(data, 0, 'MATCH', '*', function (err, data) {
        var scoreData = data[1];
        for (var i = 0; i < scoreData.length; i) {
            var ques = {};
            ques.qId = scoreData[i++];
            ques.score = scoreData[i++];
            voteCount.push(ques);
        }
        callback(util.convertToResponse(err, voteCount, 'Unable to get vote count from redis'));
    })
};

qRedisService.voteCountByQuestionId = function (data, callback) {
    var res = {};
    redisClient.zscore(data.videoId, data.qId, function (err, result) {
        res.qId = data.qId;
        res.vote = result || 0;
        callback(util.convertToResponse(err, res, 'Error occured while getting vote count'));
    })
};

qRedisService.getCompleteInfo = function (data, callback) {
    qRedisService.voteCountByVideoId(data.videoId, function (results) {
        var qIds = [];
        var data = results.data;
        data.forEach(function (result) {
            qIds.push(result.qId);
        });
        async.map(qIds, getQuestion, function (err, result) {
            callback(util.convertToResponse(err, result, 'Error occured whilr creating timeline'));
        })
    })
};
module.exports = qRedisService;

