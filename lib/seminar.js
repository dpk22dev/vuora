/**
 * Created by vinay.sahu on 10/7/17.
 */
var mongo = require('./mongo');
var async = require('async');
var util = require('./util');
var userUtil = require('./userUtil');
var Long = require('mongodb').Long;
var USER_CALENDER = "usercalender";
var EVENTS = "userevents";
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
    this.tag = tag;
    this.requestor = requestor;
    this.requestee = requestee;
    this.state = status.REQ;
    this.createdAt = new Date();
    this.updatedAt = new Date();
}

var meeting = {};

meeting.requestSeminar = function (data, callback) {
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
                var seminar = new Event(meetingType.SEM, data.meetingReq, null, null,
                    data.description, data.tag, data.requestor, data.requestee);
                var mongoDB = mongo.getInstance();
                var collection = mongoDB.collection(EVENTS);
                collection.insertOne(seminar, function (err, data) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, seminar.mid);
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


meeting.acceptSeminar = function (data, callback) {
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
                    results.forEach(function (result) {
                        collection.updateOne({_id: result._id}
                            , {$set: {state: status.ACC}}, function (err, result) {
                                if (result && result.ok == 1) {
                                    //send mail to requestee of acceptance;
                                }
                            });
                    });
                    callback(err, result);
                }
            })
        } else {
            callback({err: 'Unable to create seminar please try again later'}, null);
        }
    });

};

meeting.deleteSeminar = function (data, callback) {
    var mid = data.mid;
    var tag = data.tag;
    var user = data.user;
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.findOne({mid: mid, requestee: user}, function (err, res) {
        if (err || !res) {
            callback({err: 'you dont have permission to cancel seminar'}, null);
        } else {
            collection.find({
                tag: tag,
                requestee: user,
                state: status.ACC,
                mtype: meetingType.SEM
            }).toArray(function (err, results) {
                if (err) {
                    //error occured while updating status of users
                    callback(err, null);
                } else {
                    async.map(results, updateStatus, function (err, results) {
                        collection.deleteOne({mid: mid}, callback);
                    })
                }
            })
        }
    })
};

function getQuery(data) {
    var type = data.type;
    var query = {};
    switch (type) {
        case 'tag':
            query.tag = {$regex: '.*' + data.value + '.*'};
            break;
        case 'user':
            query.requestee = {$regex: '.*' + data.value + '.*'};
            break;
        case 'range':
            query.from = {$lt: Long.fromNumber(data.to)};
            query.to = {$gt: Long.fromNumber(data.from)};
            break;
        default:
            //error occured;
            query.tag = data.value;
    }
    return query;
}
meeting.searchSeminar = function (data, callback) {
    var query = getQuery(data);
    console.log(query);
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.find(query).toArray(function (err, response) {
        callback(err, response);
    })
};
var getUser = function (id, callback) {
    userUtil.getUser(id, callback);
};

var updateStatus = function (result, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(EVENTS);
    collection.updateOne({_id: result._id}
        , {$set: {state: status.DEC}}, callback);

};
module.exports = meeting;