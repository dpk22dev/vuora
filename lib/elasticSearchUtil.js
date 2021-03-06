/**
 * Created by vinay.sahu on 10/9/17.
 */
var _ = require('underscore');
var es = require('elasticsearch');
var http = require('./util');
var config = require('config');
// Set ElasticSearch location and port
var esPort = config.get('es.port');
var esHost = config.get('es.host');
var client = new es.Client({
    host: esHost + ":" + esPort
});

var esUtils = {};

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
        bulk_request.push({index: {_index: index, _type: type}});
        bulk_request.push(obj);
    }
    return bulk_request;
};


esUtils.executeBulk = function (index, type, data) {
    var br = [];
    create_bulk(index, type, data, br);
    client.bulk(
        {
            body: br
        }, function (err, resp) {
            console.log(err);
        });
};

esUtils.search = function (index, type, query, callback) {
    var results = [];
    client.search({
        index: index,
        type: type,
        body: query
    }).then(function (resp) {
        var hits = resp.hits.hits || [];
        hits.forEach(function (hit) {
            results.push(hit._source);
        });
        callback(null, results);
    }, function (err) {
        console.trace(err.message);
        callback(err, null);
    });
};

esUtils.index = function (index, type, body, callback) {
    client.index({
        index: index,
        type: type,
        body: body
    }, callback);
};

esUtils.update = function (index, type, id, body, callback) {
    if (body._id) {
        body.id = body._id;
        delete body['_id'];
    }
    var param = {
        index: index, type: type, id: id, body: {
            doc: body, doc_as_upsert: true
        }
    };
    client.update(param, callback);
};

esUtils.delete = function (index, type, id, callback) {
    client.deleteOne({
        index: index,
        type: type,
        id: id
    }, callback);
};

esUtils.aggregation = function (index, type, field, size, callback) {
    var query = {
        "aggs": {
            "term_aggs": {
                "terms": {
                    "field": field,
                    "size": size || 0
                }
            }
        }
    };
    client.search({
        index: index,
        type: type,
        body: query
    }).then(function (result) {
        if (result) {
            var terms = result.aggregations.term_aggs;
            var buckets = [];
            if (terms && terms.buckets) {
                buckets = terms.buckets;
            }
            callback(null, buckets);
        }
    }, function (err) {
        callback(err, null);
    });
};
module.exports = esUtils;