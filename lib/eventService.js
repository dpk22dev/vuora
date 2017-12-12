/**
 * Created by vinay.sahu on 10/7/17.
 */
var mongo = require('./mongo');
var esUtil = require('./elasticSearchWrapper');
var async = require('async');
var util = require('./util');
var userUtil = require('./../service/user/userService');
var userIdUtil = require('./../lib/userIdUtil');
var seminarModel = require('../models/seminarData');
var qRService = require('./../lib/questionRedisService');
var notificationService = require('./../lib/notificationService');
var youtubeApi = require('../lib/youtubeApi');
var Long = require('mongodb').Long;
var eb = require('es-builder');
var Q = eb.Q;
var BROADCAST = "broadcast";
var EVENTS = "userevents";
var ES_INDEX = 'vuora';
var ES_EVENT_TYPE = 'events';
var ES_QUESTION_TYPE = 'questions';
var ES_ANALYZER = 'synonyms_filt';
var ES_QUESTION_TYPE = 'questions';

var meetingType = {
    CONF: "CONFERENCE",
    SEM: "SEMINAR"
};

var meetingReq = {
    URG: "URGENT",
    MOD: "MODERATE",
    LOW: "LOW"
};

var status = {
    REQ: "REQUESTED",
    ACC: "ACCEPTED",
    PCC: "PARTIALLY_ACCEPTED",
    DEC: "DECLINED",
    FSH: "FINISHED"
};

function Event(mType, mReq, from, to, description, tag, requestor, requestee) {
    this._id = util.getId();
    this.videoId = null;
    this.mType = mType;
    this.mReq = mReq || meetingReq.MOD;
    this.from = Long.fromNumber(from);
    this.to = Long.fromNumber(to);
    this.description = description;
    this.tags = tag || [];
    this.aTags = [];
    this.requestor = Long.fromNumber(requestor);
    this.requestee = Long.fromNumber(requestee);
    this.state = status.REQ;
    this.createdAt = Long.fromNumber(new Date().getTime());
    this.updatedAt = Long.fromNumber(new Date().getTime());
}

var getUser = function (id, callback) {
    userUtil.getUser(id, function (res) {
        if (res.data) {
            callback(null, res);
        } else {
            callback({err: res.message}, null);
        }
    });
};

function updateToElastic(id, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    meeting.getEvent(id, function (result) {
        if (result.data) {
            esUtil.update(ES_INDEX, ES_EVENT_TYPE, id, result.data, function (err, eresult) {
                callback(err, result.data);
            });
        } else {
            callback({err: 'data not found in DB'}, null);
        }
    })
}

function getColor(user, requestor, requestee) {
    if (user === requestor) {
        return 'green';
    } else if (user === requestee) {
        return 'blue';
    } else {
        return 'white';
    }
}

function sendNotification(data, callback) {

    var notification = {};
    notification.from = data.requestee;
    notification.to = data.requestor;
    notification.valid = data.to;
    notification.type = 0;
    notification.videoId = data.videoId;

    notificationService.save(notification, function (err, result) {
        callback(err, result);
    })
}
function updateSeminarStatus(result, tags, callback) {
    var resultTags = result.tags;
    var finalTags = resultTags;
    var atags = [];
    resultTags.forEach(function (rTags) {
        if (tags.indexOf(rTags) >= 0) {
            atags.push(rTags);
            var index = finalTags.indexOf(rTags);
            if (index >= 0) {
                finalTags.splice(index, 1);
            }
        }
    });
    var stat = null;
    if (resultTags.length == 0) {
        stat = status.ACC
    } else {
        stat = status.PCC
    }
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);

    collection.updateOne({_id: result._id}
        , {$set: {state: stat, aTags: atags, tags: finalTags, videoId: result.videoId}}, function (err, res) {
            sendNotification(result, function (err, result) {
                callback(err, result);
            })
        });
}

function setStatus(result, stat, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.updateOne({_id: result._id}
        , {$set: {state: stat}}, callback);
}

var revokeRequest = function (result, tags, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.updateOne({_id: result._id},
        {
            $pull: {aTags: {$in: tags}},
            $pushAll: {tags: tags},
            $set: {state: status.REQ, videoid: null}
        },
        {multi: true}, callback);

};

var acceptRequest = function (id, tags, videoId, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.updateOne({_id: id},
        {
            $pull: {tags: {$in: tags}},
            $pushAll: {aTags: tags},
            $set: {state: status.ACC, videoid: videoId}
        },
        {multi: true}, callback);

};

function requestEvent(data, mType, callback) {
    var users = [];
    users.push(data.requestor);
    users.push(data.requestee);
    async.map(users, getUser, function (err, results) {
        var okToCreate = true;
        if (results) {
            results.forEach(function (result) {
                if (!result.data) {
                    okToCreate = false;
                }
            });
            if (okToCreate) {
                var seminar = new Event(mType, data.meetingReq, data.from, data.to,
                    data.description, data.tags, data.requestor, data.requestee);

                var mongoDB = mongo.getInstance();
                var collection = mongoDB.collection(EVENTS);
                collection.insertOne(seminar, function (err, data) {
                    if (err) {
                        callback(util.convertToResponse(err, null, 'unable to update in mongo'));
                    } else {
                        updateToElastic(seminar._id, function (err, result) {
                            callback(util.convertToResponse(err, result, 'unable to update in elastic'));
                        });
                    }
                })
            } else {
                callback(util.convertToResponse({err: 'User not found'}, null, 'User not found'));
            }
        } else {
            callback(util.convertToResponse({err: 'Error occured please try again later'}, null, 'Error occured please try again later'));
        }
    });
};


function getQuery(data) {

    /*var query = eb.QueryBuilder();
     query
     .filter(Q('range', 'to').gt(data.from))
     .filter(Q('range', 'from').lt(data.to));

     var shouldQuery = eb.BoolQuery()
     .should(eb.MatchQuery('tags', data.tag))
     .should(eb.MatchQuery('atags', data.tag));

     query.filter(shouldQuery);

     var fQuery = {
     query: query
     };*/
    var query =
        {
            "query": {
                "bool": {
                    "filter": [{
                        "range": {
                            "to": {
                                "gt": data.from
                            }
                        }
                    }, {
                        "range": {
                            "from": {
                                "lt": data.to
                            }
                        }
                    }, {
                        "bool": {
                            "should": [{

                                "terms": {
                                    "tags": data.tags
                                }

                            }, {

                                "tags": {
                                    "atags": data.tags
                                }

                            }]
                        }
                    }]
                }
            }
        };
    return query;
}


var meeting = {};

meeting.getEventsByRange = function (id, from, to, callback) {
    id = Long.fromNumber(id);
    var query = {
        '$and': [
            {
                from: {
                    $gt: Long.fromNumber(from)
                }
            },
            {
                to: {
                    $lt: Long.fromNumber(to)
                }
            },
            {
                '$or': [
                    {
                        requestor: id
                    }, {
                        requestee: id
                    }
                ]
            }
        ]
    };
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.find(query).toArray(function (err, result) {
        var iResult = [];
        if (result) {
            result.forEach(function (res) {
                res.color = getColor(id, res.requestor, res.requestee);
                iResult.push(res)
            })
        }
        callback(util.convertToResponse(err, iResult, "Error occured while getting event for user"));
    });
};

meeting.getEvent = function (id, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.findOne({_id: id}, function (err, result) {
        callback(util.convertToResponse(err, result, 'Error occured while getting event'));
    });
};

meeting.requestEvent = function (data, type, callback) {
    switch (type) {
        case 'seminar': {
            requestEvent(data, meetingType.SEM, callback);
            break;
        }
        case 'conference': {
            requestEvent(data, meetingType.CONF, callback);
            break;
        }
        default: {
            callback(util.convertToResponse({err: 'not able to recognize provided type'}, null, 'not able to recognize provided type'));
        }
    }
};

meeting.acceptEvent = function (data, callback) {
    data.user = Long.fromNumber(data.user);
    var user = data.user;
    var eventid = data.eventId;
    var query = {
        requestee: user,
        _id: eventid
    };
    console.log(query);
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    var broadcastCollection = mongoDB.collection(BROADCAST);
    collection.findOne(query, function (err, event) {
        if (event) {
            var id = event._id;
            var requestee = event.requestee;

            seminarModel.createF2f({userId: user}, function (result) {
                if (result.data) {
                    result = result.data;
                    var videoid = result.videoId;
                    acceptRequest(id, event.tags, videoid, function (err, result) {
                        if (result && result.ok == 1) {
                            //send mail to requestee of acceptance;
                            updateToElastic(id, function (err, result) {
                                callback(util.convertToResponse(err, result, 'unable to update event in mongo'));
                            });
                        } else {
                            callback(util.convertToResponse(err, result, 'event updated in mongo'));
                        }
                    })
                } else {
                    callback(util.convertToResponse({err: result.message}, null, result.message));
                }
            })
        } else {
            callback(util.convertToResponse({err: 'metting doesnot exists'}, null, 'metting doesnot exists'));
        }
    })
};

meeting.declineEvent = function (data, callback) {
    var eventid = data.eventId;
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.findOne({_id: eventid}, function (err, data) {
        if (err) {
            callback(util.convertToResponse({err: 'some error occured while updating status'}, null, 'some error occured while updating status'));
        } else {
            if (data) {
                var videoid = data.videoId;
                var tags = data.aTags || [];
                var ids = [];
                collection.find({videoId: videoid}).toArray(function (err, results) {
                    async.map(results, function (result, callback) {
                        ids.push(result._id);
                        revokeRequest(result, tags, callback);
                    }, function (err, results) {
                        async.map(ids, updateToElastic, function (err, results) {
                            if (err) {
                                callback(util.convertToResponse({err: 'Error occured while updating elastic'}, null, 'Error occured while updating elastic'));
                            } else {
                                callback(util.convertToResponse(err, results, ''));
                            }
                        })
                    })
                })
            } else {
                callback(util.convertToResponse({err: 'meeting not found in DB'}, null, 'meeting not found in DB'));
            }
        }
    });
};

function getSeminarInputData(data) {
    var seminarDataInp = {
        userId: data.userId,
        bTitle: data.bTitle,
        bDescription: data.bDescription,
        bStartDateTime: data.bStartDateTime,
        bEndDateTime: data.bEndDateTime,
        streamTitle: 'stream for' + data.bTitle,
        streamDesc: 'stream desc for' + data.bDescription
    };
    return seminarDataInp;
}

function save(collection, data, callback) {
    collection.insertOne(data, function (err, result) {
        callback(err, result);
    })
}

function updateRequestedSeminarStatus(qIds, id, videoId, tags, callback) {
    collection.find({
        tags: {$in: tags},
        requestee: Long.fromNumber(id),
        state: status.REQ,
        mType: meetingType.SEM
    }).toArray(function (err, results) {
        if (err) {
            //error occured while updating status of users
            callback(util.convertToResponse(err, null, ''));
        } else {
            async.map(results, function (result, callback) {
                result.videoId = videoId;
                updateSeminarStatus(result, tags, callback);
            }, function (err, results) {
                if (err) {
                    callback(util.convertToResponse({err: 'unable to connect to mongo'}, null, 'unable to connect to mongo'));
                } else {
                    var ids = [];
                    results.forEach(function (result) {
                        ids.push(result._id);
                    });
                    async.map(qIds, function (qId, callback) {
                        qRService.updateQuestion(qId, videoId, callback);
                    }, function (err, results) {
                        async.map(ids, updateToElastic, function (err, result) {
                            callback(util.convertToResponse(err, seminar, 'Error occured while updating to elastic'));
                        });
                    });

                }
            });
        }
    })
}

function sendNtificationToFollowers(id, videoId, callback) {
    userUtil.getFollowers(id, function (result) {
        var toSendNoti = [];
        if (result.data) {
            var followers = result.data || [];
            followers.forEach(function (res) {
                var noti = {};
                noti.from = id;
                noti.to = res.follower;
                noti.type = 0;
                data.videoId = videoId;
                data.valid = 999999;
                toSendNoti.push(noti);
            });
        }
        async.map(toSendNoti, notificationService.save, function (err, results) {
            callback(util.convertToResponse(err, results, 'not able to send notification to followers'));
        })
    })
}
meeting.createSeminar = function (data, callback) {
    var qIds = data.qIds || [];
    var tags = data.bTags || [];
    var from = new Date(data.bStartDateTime).getTime();
    var to = new Date(data.bEndDateTime).getTime();
    var seminar = new Event(meetingType.SEM, null, from, to,
        data.bDescription, tags, null, data.requestee);
    seminar.state = status.ACC;

    var seminarDataInp = getSeminarInputData(data);
    var seminarData = seminarModel.createSeminarData(seminarDataInp);

    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    var broadCastCollection = mongoDB.collection(BROADCAST);
    youtubeApi.createBroadcast(seminarData, function (result) {
        if (result.data) {
            seminar.videoId = result.data.videoId;
            async.parallel([
                    save.bind(null, broadCastCollection, result.data),
                    updateRequestedSeminarStatus.bind(null, qIds, data.requestee, result.data.videoId, tags),
                    sendNtificationToFollowers(data.requestee, result.data.videoId)
                ],
                function (err, results) {
                    callback(util.convertToResponse(err, seminar, 'Unable to create/process all operations to create seminar'));
                });
        } else {
            callback(util.convertToResponse({err: 'Unable to create seminar please try again later'}, null, 'Unable to create seminar please try again later'));
        }
    });
};

meeting.endSeminar = function (data, callback) {
    var eventId = data.eventId;
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    var endTime = Long.fromNumber(new Date().getTime());
    meeting.getEvent(eventId, function (eventRes) {
        if (eventRes && eventRes.data.state != status.FSH) {
            collection.updateOne({_id: eventId}, {$set: {to: endTime, state: status.FSH}}, function (err, result) {
                updateToElastic(eventId, function (err, result) {
                    callback(util.convertToResponse(err, result, 'Error occured while updating event'));
                });
            })
        } else {
            if (eventRes) {
                callback(util.convertToResponse(null, {status: 'state of seminar is ' + eventRes.data.state}, ''))
            } else {
                callback(eventRes);
            }
        }
    });

};
//TO-DO decide to delete or not
/*meeting.deleteEvent = function (data, type, callback) {

 switch (type) {
 case 'seminar': {
 deleteEvent(data, meetingType.SEM, function (err, result) {
 callback(err, result);
 });
 break;
 }
 case 'conference': {
 deleteEvent(data, meetingType.CONF, function (err, result) {
 callback(err, result);
 });
 break;
 }
 default: {
 callback({err: 'not able to recognize provided type'}, null);
 }
 }
 };*/

meeting.searchEvent = function (data, callback) {
    var query = getQuery(data);
    esUtil.search(ES_INDEX, ES_EVENT_TYPE, query, function (err, result) {
        callback(util.convertToResponse(err, result, 'Error occured while searching event'));
    });
};

meeting.getEventByVideoId = function (data, callback) {

    var videoId = data.videoId;
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.find({videoId: videoId}).toArray(function (err, results) {
        callback(util.convertToResponse(err, results, 'Error occured while getting events from mongo'));
    });
};

meeting.isOrganiser = function (data, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.findOne({requestee: data.user, videoId: data.videoId}, function (err, result) {
        var data = {};
        data.isOrganiser = false;
        if (result) {
            data.isOrganiser = true;
        }
        callback(util.convertToResponse(err, data, 'Error occured while getting data from mongo'));
    })
};

meeting.isConflict = function (data, callback) {
    var testFrom = Long.fromNumber(data.from);
    var testTo = Long.fromNumber(data.to);
    var uid = Long.fromNumber(data.user);
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);

    var query = {
        $and: [{requestee: uid},
            {
                $or: [
                    {$or: [{to: {$gt: testFrom}}, {from: {$lt: testTo}}]},
                    {$and: [{to: {$eq: testTo}}, {from: {$eq: testFrom}}]}
                ]
            }
        ]
    };
    console.log(query);
    collection.findOne(query, function (err, result) {
        if (err) {
            callback(util.convertToResponse(err, null, "Error occured while connecting to mongo"));
        } else {
            if (result) {
                callback(util.convertToResponse(err, {conflict: true}, ''));
            } else {
                callback(util.convertToResponse(err, {conflict: false}, ''));
            }
        }
    });
}
;
module.exports = meeting;