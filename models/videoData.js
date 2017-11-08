const mongo = require('../lib/mongo');
var util = require('./../lib/util');
const config = require('config');

exports.videoSocialData = {
    videoId: '',
    userId: '',
    status: ''
};

var socialStatus = {"upvoted": "U", "downvoted": "D"};
function VideoSocialData(inpData) {
    this.videoId = inpData.videoId;
    this.userId = inpData.userId;
    this.status = inpData.status;
}

//status: Liked, Disliked,
/*
 data = {
 videoId: '',
 userId: '',
 status: ''
 }
 */
exports.insertVideoSocialStatus = function (inpData) {
    var vidCol = config.get("mongodb.vidSocialStatusCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(vidCol);
    var promise = collection.insertOne(inpData);
    return promise;
}

/*
 data = {
 videoId: '',
 userId: '',
 status: ''
 }
 */

exports.updateVideoSocialStatus = function (inpData) {
    var vidCol = config.get("mongodb.vidSocialStatusCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(vidCol);

    var videoSocialData = new VideoSocialData(inpData);
    var promise = collection.updateOne({videoId: inpData.videoId}, videoSocialData, {upsert: true});
    return promise;
}

exports.getUpvotesForVideoId = function (inpData, cb) {
    var vidCol = config.get("mongodb.vidSocialStatusCol");
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(vidCol);

    //var videoSocialData = new VideoSocialData( inpData );
    collection.aggregate([{"$match": {videoId: inpData.videoId}}, {
        $group: {
            _id: "$status",
            count: {$sum: 1}
        }
    }, {$project: {count: 1}}], function (err, result) {
        cb(util.convertToResponse(err, result, 'Error occured while getting upvote'));
    });

}