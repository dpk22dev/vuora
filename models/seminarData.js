const mongo = require('../lib/mongo');
const config = require('config');

var dummyData = {
    "userID" : "123456",
    "broadcast" : {
        "part": "snippet,status,contentDetails",
        "resource": {
            "snippet": {
                "title": "7pm event 21",
                "description" : "broadcast is about...",
                "scheduledStartTime": "2017-10-10T18:40:00.000Z",
                "scheduledEndTime": "2017-10-10T21:00:00.000Z",
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
    }
}

var dummyStreamFetchData = {
    "userID" : "123456",
    "stream" : {
        "part": "status, id",
        "id" : "E2PSHxrfCp2mLk733eOGYw1507575524482784"
    }

}

var dummyTransitionData = {
    "userID": "123456",
    "broadcast": {
        "part": "snippet,status,contentDetails",
        "id" : "INaW2Pxng1o",
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

exports.updateSeminar = function () {
    
}

exports.deleteSeminar =function () {
    
}

exports.getSeminar = function () {
    
}