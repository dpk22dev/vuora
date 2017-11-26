/**
 * Created by vinay.sahu on 10/7/17.
 */
var shortid = require('shortid');
var http = require('https');
var request = require('request');
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZßΩ');


exports.getId = function () {
    return shortid.generate();
};

exports.get = function (url, callback) {
    http.get(url, function (res) {
        res.setEncoding('utf8');
        var postData = '';

        res.on('data', function (chunk) {
            postData += chunk;
        });

        res.on('end', function () {
            callback(null, postData);
        });
    }).on('error', function (e) {
        callback(e, null);
    });
};

exports.post = function (url, data, callback) {
    http.post(url, data, function (res) {
        res.setEncoding('utf8');
        var postData = '';

        res.on('data', function (chunk) {
            postData += chunk;
        });
        res.on('end', function () {
            callback(null, postData);
        });
    }).on('error', function (e) {
        callback(e, null);
    });
};

exports.convertToResponse = function (err, data, message) {
    var result = {
        status: "success",
        data: null,
        message: null
    };
    if (err) {
        result.status = "ERROR";
        result.message = message;
    } else {
        result.status = "SUCCESS";
        result.data = data;
    }
    return result;
};
//https://stackoverflow.com/questions/2631001/javascript-test-for-existence-of-nested-object-key
// var level3 = (((test || {}).level1 || {}).level2 || {}).level3;
exports.checkNested = function (obj) {
    var args = Array.prototype.slice.call(arguments, 1);

    for (var i = 0; i < args.length; i++) {
        if (!obj || !obj.hasOwnProperty(args[i])) {
            return false;
        }
        obj = obj[args[i]];
    }
    return true;
};
