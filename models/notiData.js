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
exports.getPendingNotifications = function ( inpData ) {
    var notiCol = config.get("mongodb.notificationCol");
    var mongoDB = mongo.getInstance( );
    var collection = mongoDB.collection( notiCol );
    var cursor = collection.find( { to: inpData.to } );
    return cursor;
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
    var mongoDB = mongo.getInstance( );
    var collection = mongoDB.collection( notiCol );

    var promise = collection.insertMany(data);
    return promise;
}

/*
    data.objIds: []
    data.status
 */
exports.setStatus = function ( data ) {
    var notiCol = config.get("mongodb.notificationCol");
    var mongoDB = mongo.getInstance( );
    var collection = mongoDB.collection( notiCol );

    var promise = collection.updateMany( { _id : { $in : data.objIds } }, { $set : { status:  data.status} } );
    return promise;

}


/*
data:{
    socket
    socketId
    dataToSend
    dataToInsert
}
*/
exports.sendNotificationToSocket = function ( data, cb ){
    var socket = data.socket;
    socket.to(data.socketId).emit( 'sentNoti', data.dataToSend );
    //@todo put below code in callback
    var notiCol = config.get("mongodb.notificationCol");
    var mongoDB = mongo.getInstance( );
    var collection = mongoDB.collection( notiCol );

    var promise = collection.insert( data.dataToInsert );
    return promise;

}