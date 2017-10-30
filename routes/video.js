var express = require('express');
var router = express.Router();

const videoModel = require('../models/videoData');
var customLogger = require('./../config/logger');

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json({type: 'application/json'});

const seminarModel = require('../models/seminarData');
const mustache = require('mustache');
var youtubeApi = require('../lib/youtubeApi');

router.post('/setSocialStatus', jsonParser, function (req, res, next) {
    var vidSocialData = req.body;
    videoModel.updateVideoSocialStatus(vidSocialData).then(
        function (result) {
            res.send('updated');
        }, function (err) {
            customLogger.log('error while updating' + err);
            res.send('error while updating');
        }
    );
});

router.post('/votes', jsonParser, function (req, res, next) {
    var vidData = req.body;
    videoModel.getUpvotesForVideoId(vidData, function (err, result) {
        if (err) {
            customLogger.log('error while fetching' + err);
            res.send('error while fetching');
        }
        var votes = {};
        result.forEach(function (e) {
            votes[e._id] = e.count;
        });

        res.send(votes);
    });
});

router.get('/show/:videoId', function (req, res, next) {
    //get url for that videoid, embed that in page and show thaat to user with other suggestions
    var inpData = {};
    inpData.videoId = req.params.videoId;
    seminarModel.getDataForVideoId(inpData).then(function (resolve) {
        /*var html = mustache.render( "videoShow.mustache", resolve );
         res.send( html );*/
    }, function (reject) {
        res.send("error occured in videoshow");
    });
});

router.post('/suggest/recommendation', jsonParser, function (req, res, next) {
    //var recData = seminarModel.dummyRecommendationPageBackFillApiData;
    var recData = req.body;

    // get tags to search from
    var tags = getTagsForRecommendations(recData);
    _internal( tags, res , processVidsBeforeSendingResultForRecommendationPage );

});

router.post('/suggest/videoShow', jsonParser, function (req, res, next) {
    //var recData = seminarModel.dummyVideoShowBackFillApiData;
    var recData = req.body;

    // get tags to search from
    var tags = getTagsForVidShow(recData);
    _internal( recData, tags, res , processVidsBeforeSendingResultForVidShowPage  );

});

router.post('/suggest/searchPages', jsonParser, function (req, res, next) {
    //var recData = seminarModel.dummyVideoSearchBackFillApiData;
    var recData = req.body;

    if( recData.query && recData.query.length > 0 ){
        var data = youtubeApi.youtubeSearchDataCreator( { "q" : recData.query } );
        youtubeApi.searchVideos( data, function ( err, resolve ) {
            if( resolve.error ){
                var error = {"msg": "error in fetching videos for query", "err": resolve.error.err };
                res.send({"error": error});
            }
            res.send( resolve.vidsArr );
        } )
        return ;
    }

    // get tags to search from
    var tags = getTagsForVidShow(recData);
    _internal( recData, tags, res , processVidsBeforeSendingResultForVidShowPage  );

});

module.exports = router;

var getTagsForRecommendations = function (data) {
    //@todo add logic
    return data.recentlySearched;
}

var getTagsForVidShow = function ( data ) {
    //@todo add logic
    return data.recentlySearched;
}

var processVidsBeforeSendingResultForRecommendationPage = function (tagObjPair, recData) {
    return tagObjPair;
}

var processVidsBeforeSendingResultForVidShowPage = function ( tagObjPair, recData ) {
    return tagObjPair;
}

var _internal = function ( recData, tags, res, processVidsBeforeSendingResult ) {
    // get vids for tags
    seminarModel.fetchVidsForTags(tags).then(function (ok) {

        //@todo format ok into tag : videos object format, will be required while merging
        var tagObjPair = seminarModel.getTagObjPairs(ok);

        // get tags for which video is not returned, correct below
        //var emptyTags = seminarModel.tagsForWhichVidsAreNotInDbBasedOnArr(ok, tags);
        var emptyTags = seminarModel.tagsForWhichVidsAreNotInDbBasedOnTagObjPair(tagObjPair, tags);
        if (emptyTags.length > 0) {
            youtubeApi.fetchVidsFromYoutubeForTags(emptyTags, function (err, data) {
                if (!err) {
                    // wrong happened, nothing to do
                }

                var semVidArr = [];
                emptyTags.forEach(function (ele) {
                    var tagDataObj = data[ele];
                    var tagVidArr = tagDataObj.vidsArr;
                    if (tagVidArr.length > 0) {
                        var arr = seminarModel.createDataForMultipleVids(tagVidArr, ele);
                        semVidArr = semVidArr.concat(arr);
                    }
                })

                if( semVidArr.length > 0 ) {
                    //insert videodata to seminarmodel for these tags,
                    // might need to change structure accordingly
                    seminarModel.insertMultipleVids(semVidArr).then(function (resolve) {
                        // its ok

                        var insertedVidsTagObjPair = seminarModel.getTagObjPairs( resolve.ops );
                        // data is tagged object with videos,semVidArr is merged array of vids
                        // combination of data and resolve or fetch data from db for remaining tags
                        tagObjPair = mergeTagVids( tagObjPair, insertedVidsTagObjPair );
                        // prepare result
                        //filter out videos already watched
                        var tagObjPairProcessed = processVidsBeforeSendingResult(tagObjPair, recData);
                        //return results
                        res.json(tagObjPairProcessed);
                    }, function (reject) {
                        // its ok, log it
                    });
                } else {
                    // prepare result
                    //filter out videos already watched
                    var tagObjPairProcessed = processVidsBeforeSendingResult(tagObjPair, recData);
                    //return results
                    res.json(tagObjPairProcessed);
                }
            });
        } else {
            // got all videos from db itself
            // create result and return
            var tagObjPairProcessed = processVidsBeforeSendingResult(tagObjPair, recData);
            res.json(tagObjPairProcessed);

        }

    }, function (err) {
        var error = {"msg": "error in fetching videos for tags", "err": err};
        res.send({"error": error});
    });
}

var mergeTagVids = function( tobj1, tobj2 ){
    for (var attrname in tobj2) {
        tobj1[attrname] = tobj2[attrname];
    }
    return tobj1;
}