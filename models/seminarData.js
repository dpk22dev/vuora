const mongo = require('../lib/mongo');
const config = require('config');
var utils = require('../lib/util');
const customLogger = require('../config/logger');

/*
broadcast.id will be used as youtube id for which
youtube url: https://youtu.be/broadcast.id
youtube embed: <iframe width="640" height="360" src="https://www.youtube.com/embed/broadcast.id" frameborder="0" allowfullscreen></iframe>

videoId will be used for /video/show/videoId

for f2f, id for videostored on youtube will be inserted in broadcast.id field
 */

//console = customLogger;
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
                "scheduledStartTime": "2017-10-23T18:40:00.000Z",
                "scheduledEndTime": "2017-10-23T21:00:00.000Z",
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
        "id" : "E2PSHxrfCp2mLk733eOGYw1508655035432891"
    }

}

var dummyTransitionData = {
    "userID": "123456",
    "broadcast": {
        "part": "snippet,status,contentDetails",
        "id" : "v_E3MqWZYJ8",
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


function F2fData( data ) {

    var obj = {
        userId: data.userId,
        mid: data.userId,
        videoId: data.videoId
    };

    if( !obj.videoId ){
        obj.videoId = utils.getId();
    }
    if( !obj.url ){
        obj.url = "video/show/"+obj.videoId;
    }
    return obj;
}


exports.convertModel2UserData = function ( data ) {

}


exports.convertUser2ModelData = function ( data ) {

}

exports.insertSeminar = function ( data ) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection( broadcastCol );
    var promise = collection.insertOne(data);
    return promise;
}

exports.updateBindings = function ( data ) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection( broadcastCol );

    var promise = collection.updateOne( { "broadcast.id" : data.id }
        , {$set: {"binding.status.lifeCycleStatus": data.result.status.lifeCycleStatus }} );
    return promise;

};

exports.updateSeminar = function () {
    
}

exports.deleteSeminar =function ( data ) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection( broadcastCol );
    var promise = collection.deleteOne( { "broadcast.id" : data.id } );
    return promise;
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

exports.createF2f = function ( data ) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection( broadcastCol );

    var f2fData = new F2fData( data );
    var promise = collection.insertOne( f2fData );
    return promise;

}

exports.getBroadcastIdForMid = function ( data ) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection( broadcastCol );

    var promise = collection.findOne( { mid: data.mid }, { broadcastId : 1} );
    return promise;
}

exports.getMidForVideoId = function ( data ) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection( broadcastCol );

    var promise = collection.findOne( { videoId: data.videoId }, { mid : 1} );
    return promise;
}

exports.checkIfSeminarDatesAreInRange = function ( data ) {
    var currentTime = new Date();
    var endTime = new Date(data.broadcast.resource.snippet.scheduledEndTime);
    var startTime = new Date( data.broadcast.resource.snippet.scheduledStartTime );
    if( endTime > startTime && startTime > currentTime )
        return true;
    else
        return false;
}

exports.getDataForVideoId = function ( data ) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection( broadcastCol );

    var promise = collection.findOne( { videoId: data.videoId } );
    return promise;
}