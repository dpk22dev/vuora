const mongo = require('../lib/mongo');
const config = require('config');

exports.dummyF2fData = {
    eventId: '',
    f2fId: ''
};

/*
 data = {
 eventId: '',
 }
 */
exports.getF2fId = function ( data ) {
    var f2fCol = config.get("mongodb.f2fCol");
    var mongoDB = mongo.getInstance( );
    var collection = mongoDB.collection( f2fCol );

    var promise = collection.find( { eventId : data.eventId } );
    return promise;
}