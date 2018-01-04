/**
 * Created by vinay.sahu on 11/5/17.
 */
var async = require('async');
var mongo = require('./mongo');
var util = require('./util');
var config = require('./redis');
var qService = require('./questionService');
var tService = require('./eventService');
var ES_QUESTION_TYPE = 'questions';
var redisClient = config.redisClient;

var PREFIX = "ZSET";
function getQuestion(qId, callback) {
    qService.getQuestion(qId, function (result) {
        if (result.data) {
            callback(null, result.data);
        } else {
            callback(result.message, null);
        }
    })
}

function getKey(key) {
    return PREFIX + '_' + key;
}
var qRedisService = {};
qRedisService.getTopQuestions = function (data, callback) {
    var max = '+inf', min = '-inf', offset = 0, count = data.count;
    var args2 = [getKey(data.videoId), max, min, 'WITHSCORES', 'LIMIT', offset, count];
    redisClient.zrevrangebyscore(args2, function (err, response) {
        if (err || !response) {
            callback(util.convertToResponse(err, response, 'No question found'));
        } else {
            if (response && response.length > 0) {
                var qids = [];
                for (var i = 0; i < response.length; i = i + 2) {
                    qids.push(response[i]);
                }
                async.map(qids, getQuestion, function (err, results) {
                    callback(util.convertToResponse(err, results, 'Error occured while fetching questions'));
                });
            } else {
                callback(util.convertToResponse( null, response, 'No question found'))
            }
        }
    });
};


qRedisService.save = function (data, callback) {
    var videoId = data.videoId;
    data.orphan = videoId ? false : true;
    var qId = util.getId();
    data.qId = qId;
    qService.save(data, function (result) {
        if (result.data) {
            if (videoId) {
                redisClient.zadd(getKey(videoId), 0, qId);
            }
        }
        callback(result);
    });
};

qRedisService.addQuestionToRedis = function (data, callback) {
    var videoId = data.videoId;
    var qId = data.qId;
    var vote = data.vote;
    redisClient.zadd(getKey(videoId), vote, qId, function (err, result) {
        callback(err, result);
    });
};

qRedisService.vote = function (data, callback) {
    var videoId = data.videoId;
    var qId = data.qId;
    qService.vote(data, function (result) {
        if (result.data) {
            if (videoId) {
                if (data.vote === 'upvote') {
                    redisClient.zincrby(getKey(videoId), 1, qId);
                } else {
                    redisClient.zincrby(getKey(videoId), -1, qId);
                }
            }
        }
        callback(result);
    });

};

qRedisService.voteCountByVideoId = function (data, callback) {
    var voteCount = [];
    redisClient.zscan(getKey(data), 0, 'MATCH', '*', function (err, data) {
        if (data && data.length > 2) {
            var scoreData = data[1];
            for (var i = 0; i < scoreData.length; i) {
                var ques = {};
                ques.qId = scoreData[i++];
                ques.score = scoreData[i++];
                voteCount.push(ques);
            }
        }
        callback(util.convertToResponse(err, voteCount, 'Unable to get vote count from redis'));
    })
};

qRedisService.voteCountByQuestionId = function (data, callback) {
    var res = {};
    redisClient.zscore(getKey(data.videoId), data.qId, function (err, result) {
        res.qId = data.qId;
        res.vote = result || 0;
        callback(util.convertToResponse(err, res, 'Error occured while getting vote count'));
    })
};

qRedisService.getCompleteInfo = function (data, callback) {
    qRedisService.voteCountByVideoId(getKey(data.videoId), function (results) {
        var qIds = [];
        if (results.data) {
            var data = results.data || [];
            data.forEach(function (result) {
                qIds.push(result.qId);
            });
            async.map(qIds, getQuestion, function (err, result) {
                callback(util.convertToResponse(err, result, 'Error occured whilr creating timeline'));
            })
        } else {
            callback(results);
        }
    })
};

qRedisService.status = function (data, callback) {
    var vId = data.videoId;
    var qId = data.qId;
    qService.status(data, function (res) {
        if (!res.data) {
            redisClient.zrem(getKey(vId), qId, function (err, result) {
                callback(res);
            })
        } else {
            callback(res);
        }
    })
};

qRedisService.updateQuestion = function (qId, videoId, callback) {
    var vIDs = [];
    vIDs.push(videoId);
    var mongoDB = mongo.getInstance();
    var questionCollection = mongoDB.collection(ES_QUESTION_TYPE);
    questionCollection.updateOne({_id: qId}, {$addToSet: {videoIds: vIDs}}, function (err, res) {
        if (res) {
            qService.getVoteCountForQuestion(qId, function (err, result) {
                var data = {};
                data.videoId = videoId;
                data.qId = qId;
                data.vote = result || 0;
                qRedisService.addQuestionToRedis(data, function (err, result) {
                    callback(err, qId);
                })
            })
        } else {
            callback(err, null);
        }
    })
};
module.exports = qRedisService;