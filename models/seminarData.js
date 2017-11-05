const mongo = require('../lib/mongo');
const config = require('config');
var utils = require('../lib/util');
const customLogger = require('../config/logger');

// put this value from config
const perTagLimit = 25;
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
    "userID": "123456",
    "broadcast": {
        "part": "snippet,status,contentDetails",
        "resource": {
            "snippet": {
                "title": "7pm event 21 1",
                "description": "broadcast is about...",
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
    "stream": {
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
    "binding": {
        "part": "id, snippet,status,contentDetails",
    },
    "mid": "",
    "videoId": "",
    "url": ""
}

var dummyF2fData = {
    "userId": "",
    "mid": "meetingid",
    "videoId": "videoId",
    "url": ""
}

var dummyStreamFetchData = {
    "userID": "123456",
    "stream": {
        "part": "status, id",
        "id": "E2PSHxrfCp2mLk733eOGYw1508655035432891"
    }

}

var dummyTransitionData = {
    "userID": "123456",
    "broadcast": {
        "part": "snippet,status,contentDetails",
        "id": "v_E3MqWZYJ8",
        "broadcastStatus": "testing",
    }
}

var youtubeSearchParams = {
    "part": "id, snippet",
    "q": "tag",
    "maxResults": 25,
    "type": "video"
}

var dummyRecommendationPageBackFillApiData = {
    "part": "id, snippet",
    "recentlySearched": ["nodejs", "mongodb"],
    "recentlyWatchedVideoIds": [],
    "userInterestedTags": [],
}

var dummyVideoShowBackFillApiData = {
    "recentlySearched": [],
    "recentlyWatchedVideoIds": [],
    "userInterestedTags": [],
    "targetTags": []
}

var dummyVideoSearchBackFillApiData = {
    "recentlySearched": ['php', 'angular', 'react', 'node'],
    "recentlyWatchedVideoIds": [],
    "userInterestedTags": [],
    "targetTags": [],
    "query": ""
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
exports.youtubeSearchParams = youtubeSearchParams;
exports.dummyRecommendationPageBackFillApiData = dummyRecommendationPageBackFillApiData;
exports.dummyVideoShowBackFillApiData = dummyVideoShowBackFillApiData;
exports.dummyVideoSearchBackFillApiData = dummyVideoSearchBackFillApiData;


function F2fData(data) {

    var obj = {
        userId: data.userId,
        mid: data.userId,
        videoId: data.videoId
    };

    if (!obj.videoId) {
        obj.videoId = utils.getId();
    }
    if (!obj.url) {
        obj.url = "video/show/" + obj.videoId;
    }
    return obj;
}

exports.createSeminarData = function (data) {

    var semData = {
        "userID": data.userId,
        "broadcast": {
            "part": "snippet,status,contentDetails",
            "resource": {
                "snippet": {
                    "title": data.bTitle,
                    "description": data.bDescription,
                    "scheduledStartTime": data.bStartDateTime,
                    "scheduledEndTime": data.bEndDateTime,
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
        "stream": {
            "part": "snippet, status, cdn",
            "resource": {
                "snippet": {
                    "title": data.streamTitle,
                    "desc": data.streamDesc
                },
                "cdn": {
                    "format": "360p",
                    "ingestionType": "rtmp"
                }
            }
        },
        "binding": {
            "part": "id, snippet,status,contentDetails",
        },
        "mid": "",
        "videoId": "",
        "url": ""
    };

    if (!semData.videoId) {
        semData.videoId = utils.getId();
    }
    if (!semData.url) {
        semData.url = "video/show/" + semData.videoId;
    }

    return semData;
}

exports.convertModel2UserData = function (data) {

}


exports.convertUser2ModelData = function (data) {

}

exports.insertSeminar = function (data) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(broadcastCol);
    var promise = collection.insertOne(data);
    return promise;
}

exports.updateBindings = function (data) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(broadcastCol);

    var promise = collection.updateOne({"broadcast.id": data.id}
        , {$set: {"binding.status.lifeCycleStatus": data.result.status.lifeCycleStatus}});
    return promise;

};

exports.updateSeminar = function () {

}

exports.deleteSeminar = function (data) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(broadcastCol);
    var promise = collection.deleteOne({"broadcast.id": data.id});
    return promise;
}

exports.getSeminar = function (data) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(broadcastCol);

    var promise = collection.findOne({"broadcast.id": data.id});
    return promise;
}

exports.findSeminars = function (data) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(broadcastCol);

    var promise = collection.findOne(data);
    return promise;
}

exports.createF2f = function (data, callback) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(broadcastCol);

    var f2fData = new F2fData(data);
    collection.insertOne(f2fData, function (err, result) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, f2fData);
        }
    });

};

exports.getBroadcastIdForMid = function (data) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(broadcastCol);

    var promise = collection.findOne({mid: data.mid}, {broadcastId: 1});
    return promise;
}

exports.getMidForVideoId = function (data) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(broadcastCol);

    var promise = collection.findOne({videoId: data.videoId}, {mid: 1});
    return promise;
}

exports.checkIfSeminarDatesAreInRange = function (data) {
    var currentTime = new Date();
    var endTime = new Date(data.broadcast.resource.snippet.scheduledEndTime);
    var startTime = new Date(data.broadcast.resource.snippet.scheduledStartTime);
    if (endTime > startTime && startTime > currentTime)
        return true;
    else
        return false;
}

exports.getDataForVideoId = function (data) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(broadcastCol);

    var promise = collection.findOne({videoId: data.videoId});
    return promise;
}

//array returned from youtube api
exports.createDataForMultipleVids = function (vidArr, tag) {
    //extract only required fields and return array
    var retArr = [];
    vidArr.forEach(function (ele) {
        var temp = {};
        temp.broadcast = {};
        temp.broadcast.id = ele.id.videoId;
        temp.snippet = ele.snippet;
        temp.videoId = utils.getId();
        temp.mid = "";
        temp.userId = "";
        temp.tag = tag;
        retArr.push(temp);
    });
    return retArr;
}

exports.insertMultipleVids = function (data) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(broadcastCol);

    var promise = collection.insertMany(data);
    return promise;
}

exports.fetchVidsForTags = function (tags) {
    var broadcastCol = config.get("mongodb.broadcastCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(broadcastCol);

    var promise = collection.find({tag: {$in: tags}}).limit(tags.length * perTagLimit).toArray();
    return promise;
}

exports.tagsForWhichVidsAreNotInDbBasedOnArr = function (arr, tags) {

    arr.forEach(function (ele) {
        var t = ele.tag;
        //remove t from tags
        var inx = tags.indexOf(t);
        if (inx > -1) {
            tags.splice(inx, 1);
        }
    });
    return tags;
}

exports.tagsForWhichVidsAreNotInDbBasedOnTagObjPair = function (obj, tags) {
    var retArr = [];
    tags.forEach(function (ele) {
        if (!obj[ele]) {
            retArr.push(ele);
        }
    });
    return retArr;
}

exports.getTagObjPairs = function (vids) {
    var retObj = {};
    vids.forEach(function (ele) {
        if (!retObj[ele.tag]) {
            retObj[ele.tag] = {};
            retObj[ele.tag].vidsArr = [];
        }
        retObj[ele.tag].vidsArr.push(ele);
    });
    return retObj;
}