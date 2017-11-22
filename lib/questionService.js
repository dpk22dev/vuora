/**
 * Created by vinay.sahu on 11/5/17.
 */

var mongo = require('./mongo');
var esUtil = require('./elasticSearchWrapper');
//var qRService = require('./questionRedisService');
var async = require('async');
var util = require('./util');
var EVENTS = "userevents";
var ES_INDEX = 'vuora';
var ES_QUESTION_TYPE = 'questions';
var QUESTION_VOTE = 'qvote';

function Question(qId, tags, videoIds, question, user, answered, time) {
    this._id = qId;
    this.tags = tags || [];
    this.videoIds = videoIds || [];
    this.question = question;
    this.user = user;
    this.answered = answered;
    this.time = time;
    this.createdAt = new Date().getTime();
}

function QVote(questionId, vote, user) {
    this.qId = questionId;
    this.vote = vote;
    this.user = user;
}

function updateToElastic(id, collectionName, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(collectionName);
    question.getQuestion(id, function (result) {
        if (result.data) {
            esUtil.update(ES_INDEX, ES_QUESTION_TYPE, id, result.data, function (err, result) {
                callback(err, result);
            });
        } else {
            callback({err: 'data not found in DB'}, null);
        }
    })
}

function getVoteCountForQuestion(data, callback) {
    if (data) {
        var mongoDB = mongo.getInstance();
        var questionCollection = mongoDB.collection(QUESTION_VOTE);
        questionCollection.count({qId: data._id, vote: 1}, function (err, result) {
            var upvote = result || 0;
            questionCollection.count({qId: data._id, vote: -1}, function (err, result) {
                var downvote = result || 0;
                data.upvote = upvote;
                data.downvote = downvote;
                callback(err, data);
            })
        })
    }
    else {
        callback({err: 'Question not found'}, null);
    }
}

function insertVote(id, qVote, user, callback) {
    var mongoDB = mongo.getInstance();
    var questionCollection = mongoDB.collection(QUESTION_VOTE);
    var qVoteObj = new QVote(id, qVote, user);
    questionCollection.insertOne(qVoteObj, function (err, res) {
        if (res) {
            updateToElastic(id, QUESTION_VOTE, function (err, res) {
                if (err) {
                    questionCollection.deleteOne({
                        qId: id,
                        user: user,
                        vote: qVote
                    }, function (err, result) {
                        callback(util.convertToResponse(err, 'Successfully ' + qVote, 'Error occured while connecting to ES... rolling back'))
                    })
                } else {
                    callback(util.convertToResponse(err, 'Successfully ' + qVote, 'Error occured while connecting to ES'))
                }
            })
        } else {
            callback(util.convertToResponse(err, 'Successfully ' + qVote, 'Error occured while connecting to mongo'))
        }

    })
}
var question = {};

question.getQuestion = function (id, callback) {
    var mongoDB = mongo.getInstance();
    var questionCollection = mongoDB.collection(ES_QUESTION_TYPE);
    questionCollection.findOne({_id: id}, function (err, result) {
        if (err) {
            callback(util.convertToResponse(err, result, 'Error occured while getting question from mongo'));
        } else {
            getVoteCountForQuestion(result, function (err, result) {
                callback(util.convertToResponse(err, result, 'Error occured while getting question from mongo'));
            })
        }
    });
};

question.getQuestionByTag = function (data, callback) {
    var tags = data.tags;
    var page = data.page || 1;
    var limit = data.limit || 10;
    var mongoDB = mongo.getInstance();
    var questionCollection = mongoDB.collection(ES_QUESTION_TYPE);
    questionCollection.find({tags: {$in: tags}}).sort({createdAt: -1}).skip(Number(page)).limit(Number(limit)).toArray(function (err, results) {
        var ids = [];
        if (results) {
            results.forEach(function (result) {
                ids.push(result._id);
            });
            if (ids.length > 0) {
                async.map(ids, question.getQuestion, function (results) {
                    callback(results);
                })
            } else {
                callback(util.convertToResponse(null, 'No data found', ''));
            }
        } else {
            callback(util.convertToResponse(err, null, 'Error occured while getting questions from DB'));
        }
    })
};
question.getAllQuestions = function (id, callback) {
    var mongoDB = mongo.getInstance();
    var questionCollection = mongoDB.collection(ES_QUESTION_TYPE);
    questionCollection.find({videoIds: id}).toArray(function (err, results) {
        if (err) {
            callback(util.convertToResponse(err, results, 'Error occured while getting question from mongo'));
        } else {
            async.map(results, getVoteCountForQuestion, function (err, fResults) {
                callback(util.convertToResponse(err, results, 'Error occured while getting vote count from mongo'));
            });
        }
    });
};

question.save = function (data, callback) {
    var videoId = data.videoId;
    var mongoDB = mongo.getInstance();
    var eventCollection = mongoDB.collection(EVENTS);
    var questionCollection = mongoDB.collection(ES_QUESTION_TYPE);
    if (data.orphan) {
        var question = new Question(data.qId, data.tags, [], data.question, data.user, false, -1);
        questionCollection.insertOne(question, function (err, mongoResult) {
            if (mongoResult) {
                updateToElastic(question._id, ES_QUESTION_TYPE, function (err, esResult) {
                    if (err) {
                        questionCollection.deleteOne({_id: data.qId}, function (err, res) {
                            callback(util.convertToResponse(res, null, 'Error occured while inserting to ES..rollong back'))
                        })
                    } else {
                        callback(util.convertToResponse(err, question, "Error occured while inserting to elastic"));
                    }
                })
            } else {
                callback(util.convertToResponse(err, null, "Error occured while inserting to mongo"));
            }
        })
    } else {
        eventCollection.findOne({videoId: videoId}, function (err, result) {
            if (result) {
                var to = result.to;
                if (to < new Date().getTime()) {
                    callback(util.convertToResponse({err: 'Meeting ended'}, null, 'Cant add once meeting is ended'))
                } else {
                    var question = new Question(data.qId, data.tags, [videoId], data.question, data.user, false, -1);
                    questionCollection.insertOne(question, function (err, mongoResult) {
                        if (mongoResult) {
                            updateToElastic(question._id, ES_QUESTION_TYPE, function (err, esResult) {
                                if (err) {
                                    questionCollection.deleteOne({_id: data.qId}, function (err, res) {
                                        callback(util.convertToResponse(err, null, 'Error occured while inserting to ES..rollong back'))
                                    })
                                } else {
                                    callback(util.convertToResponse(err, {qId: question._id}, "Error occured while inserting to elastic"));
                                }
                            })
                        } else {
                            callback(util.convertToResponse(err, null, "Error occured while inserting to mongo"));
                        }
                    })
                }
            } else {
                callback(util.convertToResponse({err: 'Not found in DB'}, null, "Not found in DB"));
            }


        })
    }
};

question.vote = function (data, callback) {
    var id = data.qId;
    var qVote = data.vote === 'upvote' ? 1 : -1;
    var mongoDB = mongo.getInstance();
    var questionCollection = mongoDB.collection(QUESTION_VOTE);
    var query = {
        $and: [
            {"qId": id},
            {"user": data.user},
            {vote: qVote}
        ]
    };
    console.log(query);
    questionCollection.findOne(query, function (err, result) {
        if (result && result.vote == qVote) {
            callback(util.convertToResponse({err: 'already done'}, null, 'dude you already ' + data.vote + 'ed'));
        } else {
            insertVote(id, qVote, data.user, function (result) {
                callback(result);
            });
        }
    });

};

question.status = function (data, callback) {
    var qId = data.qId;
    var answered = data.answered == true ? true : false;
    var time = data.time || -1;

    var mongoDB = mongo.getInstance();
    var questionCollection = mongoDB.collection(ES_QUESTION_TYPE);
    questionCollection.update({_id: qId}
        , {$set: {answered: answered, time: time}}, {upsert: true, safe: false}, function (err, result) {
            if (result) {
                updateToElastic(qId, ES_QUESTION_TYPE, function (err, esResult) {
                    callback(util.convertToResponse(err, 'status updated', 'unable to update status on ES'))
                });
            }
            else {
                callback(util.convertToResponse(err, '', 'unable to update status'));
            }
        }
    )
};

question.updateQuestion = function (qId, videoId, callback) {
    var mongoDB = mongo.getInstance();
    var questionCollection = mongoDB.collection(ES_QUESTION_TYPE);
    questionCollection.updateOne({_id: qId}, {$addToSet: {videoIds: videoId}}, function (err, res) {
        if (res) {
            getVoteCountForQuestion(qId, function (err, result) {
                var data = {};
                data.videoIds = videoId;
                data.qId = qId;
                data.vote = result || 0;
                qRService.addQuestionToRedis(data, function (err, result) {
                    callback(err, qId);
                })
            })
        } else {
            callback(err, null);
        }
    })
};

question.getVoteCountForQuestion = function (qId, callback) {
    var count = 0;
    var data = {};
    data._id = qId;
    getVoteCountForQuestion(data, function (err, result) {
        if (result) {
            count = result.upvote + result.downvote;
        }
        callback(err, count);
    });
};
module.exports = question;