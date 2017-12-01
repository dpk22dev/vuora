/**
 * Created by vinay.sahu on 11/30/17.
 */
var mongo = require('./../lib/mongo');
var uidUtil = require('./../lib/userIdUtil');
var utils = require('./../lib/util');
var async = require('async');
var Long = require('mongodb').Long;
var NOTIFICATION = "notification";

function Notification(from, to, status, type, data, valid) {
    this.notId = utils.getId();
    this.from = from;
    this.to = to;
    this.status = status;
    this.type = type;
    this.data = data;
    this.valid = Long.fromNumber(valid);
}

var status = {
    NEW: "NEW",
    SEEN: "SEEN"
};

var type = {
    SEM_CRE: "SEMINAR_CREATED",
    SEM_PRE: "SEMINAR_PREVIEW",
    SEM_END: "SEMINAR_ENDED"
};

function getType(t) {
    t = Number(t);
    var result = '';
    switch (t) {
        case 0:
            result = type.SEM_CRE;
            break;
        case 1:
            result = type.SEM_PRE;
            break;
        case 2:
            result = type.SEM_END;
            break;
        default:
            result = "NA";
            break;
    }
    return result;
}

function getText(data) {
    var text = "";
    switch (data.type) {
        case "SEMINAR_CREATED":
            text = data.from + " has created seminar ";
            break;
        case "SEMINAR_PREVIEW":
            text = data.from + " has created seminar you can preview by clicking at " + data.data;
            break;
        case "SEMINAR_ENDED":
            text = "seminar created by " + data.from + "has been ended you can view it by clicking at " + data.data;
            break;
        default :
            text = "NA";
            break;
    }
    return text;
}
var notification = {};

notification.save = function (data, callback) {
    var from = data.from;
    var to = data.to;
    var type = getType(data.type);
    var vId = data.videoId;
    var valid = data.valid;

    var notification = new Notification(from, to, status.NEW, type, vId, valid);
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(NOTIFICATION);
    collection.insertOne(notification, function (err, res) {
        callback(err, res);
    });
};

notification.get = function (id, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(NOTIFICATION);
    var query = {
        to: Number(id),
        valid: {$gte: Long.fromNumber(new Date().getTime())},
        $or: [{status: status.NEW}]
    };

    collection.find(query).toArray(function (err, results) {
        var response = [];
        results.forEach(function (result) {
            result.text = getText(result);
            response.push(result);
        });
        callback(utils.convertToResponse(err, response, 'Error occured while getting notification'))
    })
};

notification.markRead = function (data, callback) {
    var notId = data.notificationId;
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(NOTIFICATION);

    collection.updateOne({notId: notId}, {$set: {status: status.SEEN}}, {
        upsert: false,
        safe: false
    }, function (err, result) {
        callback(utils.convertToResponse(err, {status: 'updated'}, 'Error occured while updating notification'));
    })
};

module.exports = notification;