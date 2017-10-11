/**
 * Created by vinay.sahu on 10/9/17.
 */
var _ = require('underscore');
var es = require('elasticsearch');
var http = require('./util');
// Set ElasticSearch location and port
var client = new es.Client({
    host: 'localhost:9200'
});


function readJson(data) {
    var obj = JSON.parse(data);
    return (obj)
};


// Function to create body for loading to ElasticSearch
function create_bulk(index, type, finaljson, bulk_request) {
    var obj;

    for (i = 0; i < finaljson.length; i++) {
        obj = finaljson[i];
        // Insert header of record
        bulk_request.push({index: {_index: 'vuora', _type: 'tags'}});
        bulk_request.push(obj);
    }
    return bulk_request;
};


exports.executeBulk = function (index, type, data) {
    var br = [];
    create_bulk(index, type, data, br);
    client.bulk(
        {
            body: br
        }, function (err, resp) {
            console.log(err);
        });
};

exports.search = function (index, type, query, callback) {
    client.search({
        index: index,
        type: type,
        body: query
    }).then(function (resp) {
        var hits = resp.hits.hits;
        callback(null, hits);
    }, function (err) {
        console.trace(err.message);
        callback(err, null);
    });
};