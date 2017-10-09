/**
 * Created by vinay.sahu on 10/7/17.
 */
var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');
var _db = null;
var url = 'mongodb://localhost:27017/vuora';


exports.closeMongo = function () {
    _db.close();
};

exports.getInstance = function(){
    return _db;
};

MongoClient.connect(url, function (err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
    _db = db;
});

