/**
 * Created by vinay.sahu on 10/9/17.
 */
var esUtil = require('./elasticSearchUtil');
// Set ElasticSearch location and port

var esUtils = {};


// Function to create body for loading to ElasticSearch

esUtils.executeBulk = function (index, type, data) {
};

esUtils.search = function (index, type, query, callback) {
    callback(null, null);
};

esUtils.index = function (index, type, body, callback) {
    callback(null, null);
};

esUtils.update = function (index, type, id, body, callback) {
    callback(null, null);
};

esUtils.delete = function (index, type, id, callback) {
    callback(null, null);
};

esUtils.aggregation = function (index, type, field, size, callback) {
    callback(null, null)

};
module.exports = esUtils;