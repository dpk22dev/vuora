const mongo = require('../lib/mongo');
const config = require('config');

exports.dummyNotiData = {
        to: '',
        fromTime: '',
        toTime: '',
        status: ''
};

//status: q(ueue), s(ent),
/*
    data = {
        to: userId,
        fromTime: '',
        toTime: '',
        status:
    }
 */
exports.getPendingNotifications = function ( data ) {
    var notiCol = config.get("mongodb.notificationCol");
    /*mongo.getInstance( function( mongoDB ){
        var collection = mongoDB.collection( notiCol );

        var promise = collection.find(data);
        return promise;
    } );*/
    var mongoDB = mongo.getInstance( );
    var collection = mongoDB.collection( notiCol );
    var promise = collection.find(data);
    return promise;     
}

/*
 data = [{
 to: userId,
 fromTime: '',
 toTime: '',
 status:
 }, ... ]
 */

exports.insertNotifications = function ( data ) {
    var notiCol = config.get("mongodb.notificationCol");
    mongo.getInstance( function( mongoDB ){
        var collection = mongoDB.collection( notiCol );

        var promise = collection.insertMany(data);
        return promise;
    } );
}

/*
    data.objectIds: []
    data.status
 */
exports.setStatus = function ( data ) {
    var notiCol = config.get("mongodb.notificationCol");
    mongo.getInstance( function( mongoDB ){
        var collection = mongoDB.collection( notiCol );

        var promise = collection.update( { _id : { $in : data.objIds } }, { $set : { status:  data.status} } );
        return promise;
    } );
}

