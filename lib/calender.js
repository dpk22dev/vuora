/**
 * Created by vinay.sahu on 10/7/17.
 */
var config = require('./../config/mongo');
var util = require('./../util');
var mongoDB = config.mongoDb;

var USER_CALENDER = "usercalender";

var collection = mongoDB.collection(USER_CALENDER);
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

calender.addEvent = function (from, to, type, description, requestor, requestee) {
    var event = new Event(from, to, type, description, requestor, requestee);
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
