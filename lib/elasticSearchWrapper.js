/**
 * Created by vinay.sahu on 10/9/17.
 */
var esUtil = require('./elasticSearchUtil');
// Set ElasticSearch location and port

var esUtils = {};


// Function to create body for loading to ElasticSearch

esUtils.executeBulk = function (index, type, data) {
    esUtil.executeBulk(index, type, data)
};

esUtils.search = function (index, type, query, callback) {
    esUtil.search(index, type, query, callback);
};

esUtils.index = function (index, type, body, callback) {
    esUtil.index(index, type, body, callback);
};

esUtils.update = function (index, type, id, body, callback) {
    esUtil.update(index, type, id, body, callback);
};

esUtils.delete = function (index, type, id, callback) {
    esUtil.delete(index, type, id, callback);
};

esUtils.aggregation = function (index, type, field, size, callback) {
    esUtil.aggregation(index, type, field, size, callback);

};
module.exports = esUtils;