const mongo = require('../lib/mongo');
const config = require('config');
var utils = require('../lib/util');

// try to store and query in standard resource way described by google
// resource representation is to hit api, otherwise everything is in open json format
// be careful id and etag are outside resource when accesing them
var dummyData = {
    "userID" : "123456",
    "broadcast" : {
        "part": "snippet,status,contentDetails",
        "resource": {
            "snippet": {
                "title": "7pm event 21 1",
                "description" : "broadcast is about...",
                "scheduledStartTime": "2017-10-12T18:40:00.000Z",
                "scheduledEndTime": "2017-10-12T21:00:00.000Z",
            },
            "status": {
                "privacyStatus": "private",
            },
            "contentDetails": {
                "monitorStream": {
                    "enableMonitorStream": true,
                }
            }
        }
    },
    "stream" : {
        "part": "snippet, status, cdn",
        "resource": {
            "snippet": {
                "title": "s 360 p2",
                "desc": "for broadcast id"
            },
            "cdn": {
                "format": "360p",
                "ingestionType": "rtmp"
            }
        }
    },
    "binding" : {
        "part": "id, snippet,status,contentDetails",
    },
    "mid" : "",
    "videoId" : "",
    "url" : ""
}

var dummyF2fData = {
    "userId"  : "",
    "mid" : "meetingid",
    "videoId" : "videoId",
    "url" : ""
}

var dummyStreamFetchData = {
    "userID" : "123456",
    "stream" : {
        "part": "status, id",
        "id" : "E2PSHxrfCp2mLk733eOGYw1507734472010207"
    }

}

var dummyTransitionData = {
    "userID": "123456",
    "broadcast": {
        "part": "snippet,status,contentDetails",
        "id" : "JTNdWjpFHcY",
        "broadcastStatus" : "testing",
    }
}
/*
{
    "title" :  "test seminar 1 title",
    "desc" : "test seminar 1 desc",
    "tags" : [ 'tag1', 'tag2', 'tag3' ],
    "startTime" : "",
    "endTime" : "",
    "thumbnailUrl" : ""
};
*/



exports.seminarDummyData = dummyData;
exports.dummyStreamFetchData = dummyStreamFetchData;
exports.dummyTransitionData = dummyTransitionData;
exports.dummyF2fData = dummyF2fData

exports.convertModel2UserData = function ( data ) {

}


exports.convertUser2ModelData = function ( data ) {

}

exports.insertSeminar = function ( data ) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    mongo.getInstance( function( mongoDB ){
        var collection = mongoDB.collection( broadcastCol );

        var promise = collection.insertOne(data);
        return promise;
    } );

}

exports.updateBindings = function ( data ) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection( broadcastCol );

    var promise = collection.updateOne( { "broadcast.id" : data.id }
        , {$set: {"binding.status.lifeCycleStatus": data.status.lifeCycleStatus }} );
    return promise;

};

exports.updateSeminar = function () {
    
}

exports.deleteSeminar =function ( data ) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    mongo.getInstance( function( mongoDB ){
        var collection = mongoDB.collection( broadcastCol );
        var promise = collection.deleteOne( { "broadcast.id" : data.id } );
        return promise;
    });


}

exports.getSeminar = function ( data ) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection( broadcastCol );

    var promise = collection.findOne( { "broadcast.id" : data.id } );
    return promise;
}

exports.findSeminars = function ( data ) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection( broadcastCol );

    var promise = collection.findOne( data );
    return promise;
}

function F2fData( data ) {

    var obj = {
      userId: data.userId,
      mid: data.userId,
      videoId: data.videoId
    };

    if( !obj.videoId ){
        obj.videoId = utils.getId();
    }
    return obj;
}

exports.createF2f = function ( data ) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection( broadcastCol );

    var f2fData = new F2fData( data );
    var promise = collection.insertOne( f2fData );
    return promise;

}

exports.getUsersInEvent = function ( data ) {
    return { requestor : 1, requestee : 2 };
}

exports.getBroadcastIdForMid = function ( data ) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection( broadcastCol );

    var promise = collection.findOne( { mid: data.mid }, { broadcastId : 1} );
    return promise;
}