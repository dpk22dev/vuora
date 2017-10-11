/**
 * Created by vinay.sahu on 10/7/17.
 */
var shortid = require('shortid');
var http = require('https');
var request = require('request');

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