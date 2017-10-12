/**
 * Created by vinay.sahu on 10/7/17.
 */
var mongo = require('./mongo');
var async = require('async');
var util = require('./util');
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

var checkForConfict = function (requestor, requestee, from, to, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_CALENDER);
    async.parallel({
        one: function (callback) {
            lieFromInMid('requestor', requestor, from, to, callback)
        },
        two: function (callback) {
            lieToInMid('requestor', requestor, from, to, callback)
        },
        three: function (callback) {
            overlayInRange('requestor', requestor, from, to, callback)
        },
        four: function (callback) {
            lieFromInMid('requestor', requestee, from, to, callback)
        },
        five: function (callback) {
            lieToInMid('requestor', requestee, from, to, callback)
        },
        six: function (callback) {
            overlayInRange('requestor', requestee, from, to, callback)
        },
        seven: function (callback) {
            lieFromInMid('requestee', requestor, from, to, callback)
        },
        eight: function (callback) {
            lieToInMid('requestee', requestor, from, to, callback)
        },
        nine: function (callback) {
            overlayInRange('requestee', requestor, from, to, callback)
        },
        ten: function (callback) {
            lieFromInMid('requestee', requestee, from, to, callback)
        },
        eleven: function (callback) {
            lieToInMid('requestee', requestee, from, to, callback)
        },
        twelve: function (callback) {
            overlayInRange('requestee', requestee, from, to, callback)
        }
    }, function (err, result) {
        var conflict = true;
        if (result.one == null && result.two == null && result.three == null
            && result.four == null && result.five == null && result.six == null
            && result.seven == null && result.eight == null && result.nine == null
            && result.ten == null && result.eleven == null && result.twelve == null) {
            conflict = false;
        }
        callback(err, conflict);
    });
};

var lieFromInMid = function (type, user, from, to, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_CALENDER);
    var query = {};
    query[type] = user;
    query.to = {"$gte": from, "$lte": to};
    console.log(query);
    collection.findOne(query, callback);
};

var lieToInMid = function (type, user, from, to, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_CALENDER);
    var query = {};
    query[type] = user;
    query.from = {"$gte": from, "$lte": to};
    collection.findOne(query, callback);
};
var overlayInRange = function (type, user, from, to, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_CALENDER);
    var query = {};
    query[type] = user;
    query.from = {$lte: from};
    query.to = {$gte: to}
    collection.findOne(query, callback);
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
calender.addEvent = function (from, to, type, description, requestor, requestee, callback) {
    checkForConfict(requestor, requestee, from, to, function (err, conflict) {
        if (!(err || conflict)) {
            var mongoDB = mongo.getInstance();
            var collection = mongoDB.collection(USER_CALENDER);
            var event = new Event(from, to, type, description, requestor, requestee);
            collection.insertOne(event, callback);
        } else {
            callback({err: 'Not able to create meeting'}, null);
        }
    });
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
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_CALENDER);
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