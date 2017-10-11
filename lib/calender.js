/**
 * Created by vinay.sahu on 10/7/17.
 */
var config = require('./../config/mongo');
var mongo = config.mongoDb;
var async = require('async');

var USER_CALENDER = "usercalender";

function Event(from, to, type, description, requestor, requestee) {
    this._id = util.getId();
    this.from = from;
    this.to = to;
    this.type = type;
    this.description = description;
    this.requestor = requestor;
    this.requestee = requestee;
    this.status = "REQUESTED";
}

var calender = {};

var checkForConfict = function (requestor, requestee, from, to) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_CALENDER);
    async.parallel([
        lieFromInMid(requestor, from, to, callback),
        lieToInMid(requestor, from, to, callback),
        overlayInRange(requestor, from, to, callback),
        lieFromInMid(requestee, from, to, callback),
        lieToInMid(requestee, from, to, callback),
        overlayInRange(requestee, from, to, callback)
    ], function (err, result) {
        console.log(result);
    });
};

var lieFromInMid = function (user, from, to, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_CALENDER);
    collection.findOne({
            requestor: user,
            to: {"$gt": from, "$lt": to}
        }, callback
    );
};
var lieToInMid = function (user, from, to, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_CALENDER);
    collection.findOne({
        requestor: requestor,
        from: {"$gt": from, "$lt": to}
    }, callback);
};
var overlayInRange = function (user, from, to, callback) {
    collection.findOne({
        requestor: requestor,
        from: {$lt: from},
        to: {$gt: to}
    }, callback);
};

var getUser = function (user, from, to) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_CALENDER);

    collection.findOne({
        requestor: user,
        from: {"$gt": from, "$lt": to}
    }, function (err, result) {
        if (err) throw err;
        console.log(result.name);
        db.close();
    });
};
calender.addEvent = function (from, to, type, description, requestor, requestee) {
    var isConflict = checkForConfict(requestor, requestee, from, to);
    var event = new Event(from, to, type, description, requestor, requestee);
    checkForConfict(requestor, requestee, from, to);
    collection.insertOne(event);
    return event;
};

calender.updateEvent = function (id, status) {
    collection.updateOne({_id: id}
        , {$set: {status: status}}, function (err, result) {
            callback(result);
        });
};

calender.deleteEvent = function (id) {
    collection.deleteOne({_id: id}, function (err, result) {

    });
};

calender.getEvents = function (user, from, to) {
    var cursor = collection.find({
        requestor: user,
        from: {"$gte": from, "$lt": to}
    });
    cursor.limit(500);
    cursor.forEach(function (err, doc) {
        console.log(doc);
    });
};

module.exports = calender;