/**
 * Created by vinay.sahu on 10/9/17.
 */
var es = require('./elasticSearchWrapper');
var http = require('http');
var zlib = require("zlib");
var request = require('request');
var page = 300;

var url = 'http://api.stackexchange.com/2.2/tags?page=1&pagesize=100&order=desc&sort=popular&site=stackoverflow';

function getGzipped(url, callback) {
    // buffer to store the streamed decompression
    var buffer = [];

    http.get(url, function (res) {
        // pipe the response into the gunzip to decompress
        var gunzip = zlib.createGunzip();
        res.pipe(gunzip);

        gunzip.on('data', function (data) {
            // decompression chunk ready, add it to the buffer
            buffer.push(data.toString())

        }).on("end", function () {
            // response and decompression complete, join the buffer and return
            callback(null, buffer.join(""));

        }).on("error", function (e) {
            callback(e);
        })
    }).on('error', function (e) {
        callback(e)
    });
}

var getTags = function () {
    var url = 'http://api.stackexchange.com/2.2/tags?page=' + page++ + '&pagesize=100&order=desc&sort=popular&site=stackoverflow';
    getGzipped(url, function (err, data) {
        if (err) {
            console.log('Page till done is :'+page)
            console.error(err);
        }
        else {
            data = JSON.parse(data);
            var items = data.items;
            es.executeBulk("voura", "tags", items);
            console.log(data);
        }
    });

    //300
};

setInterval(getTags, 5000);
