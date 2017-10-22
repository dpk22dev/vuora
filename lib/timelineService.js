/**
 * Created by vinay.sahu on 10/7/17.
 */
var mongo = require('./mongo');
var esUtil = require('./elasticSearchUtil');
var async = require('async');
var util = require('./util');
var userUtil = require('./../service/user/userService');
var Long = require('mongodb').Long;
var USER_CALENDER = "usercalender";
var EVENTS = "userevents";
var ES_INDEX = 'vuora';
var ES_EVENT_TYPE = 'events';
var ES_QUESTION_TYPE = 'questions';
var ES_ANALYZER = 'synonyms_filt';

var meetingType = {
    CONF: "CONFERENCE",
    SEM: "SEMINAR"
};

function SeminarQues(bcId, question, vote, time) {
    this.bcid = bcId;
    this.question = question;
    this.time = time;
    this.vote = vote;
}

var meetingReq = {
    URG: "URGENT",
    MOD: "MODERATE",
    LOW: "LOW"
};

var status = {
    REQ: "REQUESTED",
    ACC: "ACCEPTED",
    DEC: "DECLINED"
};

function Event(mType, mReq, from, to, description, tag, requestor, requestee) {
    this._id = util.getId();
    this.mid = util.getId();
    this.mtype = mType;
    this.mreq = mReq || meetingReq.MOD;
    this.from = Long.fromNumber(from);
    this.to = Long.fromNumber(to);
    this.description = description;
    this.tags = tag || [];
    this.requestor = requestor;
    this.requestee = requestee;
    this.state = status.REQ;
    this.createdAt = Long.fromNumber(new Date().getTime());
    this.updatedAt = Long.fromNumber(new Date().getTime());
}

function updateToElastic(id, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    meeting.getEvent(id, function (err, result) {
        if (result) {
            esUtil.update(ES_INDEX, ES_EVENT_TYPE, id, result, function (err, result) {
                callback(err, result);
            });
        } else {
            callback({err: 'data not found in DB'}, null);
        }
    })
}

function requestEvent(data, mType, callback) {
    var users = [];
    users.push(data.requestor);
    users.push(data.requestee);
    async.map(users, getUser, function (err, results) {
        var okToCreate = true;
        if (results) {
            results.forEach(function (result) {
                if (!result) {
                    okToCreate = false;
                }
            });
            if (okToCreate) {
                var seminar = new Event(mType, data.meetingReq, data.from, data.to,
                    data.description, data.tag, data.requestor, data.requestee);
                var mongoDB = mongo.getInstance();
                var collection = mongoDB.collection(EVENTS);
                collection.insertOne(seminar, function (err, data) {
                    if (err) {
                        callback(err, null);
                    } else {
                        updateToElastic(seminar._id, function (err, result) {
                            callback(err, result);
                        });
                    }
                })
            } else {
                callback({err: 'User not found'}, null);
            }
        } else {
            callback({err: 'Error occured please try again later'}, null);
        }
    });
};

function updateAcceptStatus(result, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.updateOne({_id: result._id}
        , {$set: {state: status.ACC}}, callback);
}

function setStatus(result, stat, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.updateOne({_id: result._id}
        , {$set: {state: stat}}, callback);
}

function deleteEvent(data, mType, callback) {
    var eid = '';
    var mid = data.mid;
    var tag = data.tag;
    var user = data.user;
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.findOne({mid: mid, requestee: user}, function (err, res) {
        if (err || !res) {
            callback({err: 'you dont have permission to cancel seminar'}, null);
        } else {
            eid = res._id;
            collection.find({
                tag: tag,
                requestee: user,
                mtype: mType
            }).toArray(function (err, results) {
                if (err) {
                    //error occured while updating status of users
                    callback(err, null);
                } else {
                    async.map(results, updateStatus, function (err, upresults) {
                        if (err) {
                            callback({err: 'Unable to update request please try again later'}, null);
                        } else {
                            var ids = [];
                            results.forEach(function (result) {
                                ids.push(result._id);
                            });
                            async.map(ids, updateToElastic, function (err, results) {
                                collection.deleteOne({mid: mid}, function (err, result) {
                                    if (result) {
                                        esUtil.delete(ES_INDEX, ES_EVENT_TYPE, eid, callback);
                                    } else {
                                        callback({err: 'unable to delete event'}, null);
                                    }
                                });
                            });
                        }
                    })
                }
            })
        }
    })
};

function getQuery(data) {
    var query = {};
    query =
        {
            "query": {
                "bool": {
                    "must": {
                        "range": {
                            "to": {
                                "gt": data.from
                            }
                        }
                    },
                    "must": {
                        "range": {
                            "from": {
                                "lt": data.to
                            }
                        }
                    },
                    "should": [{
                        "match": {
                            "tags": {
                                "query": data.value,
                                "analyzer": ES_ANALYZER
                            }
                        }
                    },
                        {
                            "match": {
                                "requestee": {
                                    "query": data.value,
                                    "analyzer": ES_ANALYZER
                                }
                            }
                        }
                    ]
                }
            }
        };
    return query;
}

var getUser = function (id, callback) {
    userUtil.getUser(id, callback);
};

var updateStatus = function (result, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.updateOne({_id: result._id}
        , {$set: {state: status.DEC}}, callback);

};
var meeting = {};

meeting.getEventsByRange = function (id, from, to, callback) {
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
        callback(err, result);
    });
};

meeting.getEvent = function (id, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.findOne({_id: id}, callback);
};

meeting.requestEvent = function (data, type, callback) {
    switch (type) {
        case 'seminar': {
            requestEvent(data, meetingType.SEM, function (err, result) {
                callback(err, result);
            });
            break;
        }
        case 'conference': {
            requestEvent(data, meetingType.CONF, function (err, result) {
                callback(err, result);
            })
        }
        default: {
            callback({err: 'not able to recognize provided type'}, null);
        }
    }
};

meeting.acceptEvent = function (data, callback) {
    var user = data.user;
    var mid = data.mid;
    var query = {
        requestee: user,
        mid: mid
    };
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.findOne(query, function (err, result) {
        if (result) {
            var id = result._id;
            var requestee = result.requestee;
            collection.updateOne({_id: id}
                , {$set: {state: status.ACC}}, function (err, result) {
                    if (result && result.ok == 1) {
                        //send mail to requestee of acceptance;
                    }
                    callback(err, result);
                });
        } else {
            callback({err: 'metting doesnot exists'}, null);
        }
    })
};

meeting.declineEvent = function (data, callback) {
    var mid = data.mid;
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.find({mid: mid}).toArray(function (err, results) {
        if (results) {
            ayncs.map(results, function (result, callback) {
                setStatus(result, status.DEC, callback);
            }, function (err, results) {
                callback(err, results);
            });
        } else {
            callback({err: 'error occered while updating status'}, null);
        }
    });
};

meeting.createSeminar = function (data, callback) {
    var tag = data.tag;
    var seminar = new Event(meetingType.SEM, null, data.from, data.to,
        data.description, data.tag, null, data.requestee);
    seminar.state = status.ACC;
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.insertOne(seminar, function (err, result) {
        if (result) {
            collection.find({
                tag: tag,
                requestee: data.requestee,
                state: status.REQ,
                mtype: meetingType.SEM
            }).toArray(function (err, results) {
                if (err) {
                    //error occured while updating status of users
                    callback(err, null);
                } else {
                    async.map(results, updateAcceptStatus, function (err, upresult) {
                        if (err) {
                            callback({err: 'unable to connect to mongo'}, null);
                        } else {
                            var ids = [];
                            results.forEach(function (result) {
                                ids.push(result._id);
                            });
                            async.map(ids, updateToElastic, callback);
                        }
                    })

                }
            })
        } else {
            callback({err: 'Unable to create seminar please try again later'}, null);
        }
    });

};

meeting.deleteEvent = function (data, type, callback) {

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
};

meeting.insertSeminarQuestion = function (data, callback) {
    var broadcastId = data.bdctid;
    var question = data.question;
    var vote = data.vote;
    var time = data.time;
    var seminarQuestion = new SeminarQues(broadcastId, question, vote, time);
    esUtil.index(ES_INDEX, ES_QUESTION_TYPE, seminarQuestion, function (err, result) {
        if (err) {
            callback({err: 'Error occured while indexing doc'}, null);
        } else {
            callback(null, 'Successfully inserted');
        }
    })
};


meeting.searchEvent = function (data, callback) {
    var query = getQuery(data);
    esUtil.search(ES_INDEX, ES_EVENT_TYPE, query, callback);
};

meeting.getUsersForMid = function ( mid, cb ) {
    //return requestor / requestee doe mid
    cb( err, { requestor: 1, requestee: 2 } );
};

module.exports = meeting;