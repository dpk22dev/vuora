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
    videoModel.updateVideoSocialStatus( vidSocialData ).then(
        function ( result ) {
            res.send('updated');
        }, function ( err ) {
            customLogger.log( 'error while updating' + err );
            res.send('error while updating');
        }
    );
} );

router.post('/votes', jsonParser, function (req, res, next) {
    var vidData = req.body;
    videoModel.getUpvotesForVideoId( vidData, function( err, result ){
        if( err ){
            customLogger.log( 'error while fetching' + err );
            res.send('error while fetching');
        }
        var votes = {};
        result.forEach( function ( e ) {
            votes[e._id] = e.count;
        });

        res.send( votes );
    } );
} );

router.get( '/show/:videoId', function (req, res, next) {
    //get url for that videoid, embed that in page and show thaat to user with other suggestions
    var inpData = {};
    inpData.videoId = req.params.videoId;
    seminarModel.getDataForVideoId( inpData ).then( function ( resolve ) {
        /*var html = mustache.render( "videoShow.mustache", resolve );
        res.send( html );*/
    }, function ( reject ) {
        res.send("error occured in videoshow");
    });
});

var getTagsForRecommendations = function ( data ) {
    //@todo add logic
    return data.recentlySearched;
}

router.post('/suggest/recommendation', jsonParser, function (req, res, next) {
    var recData = seminarModel.dummyRecommendationPageBackFillApiData;
    //var recData = req.body;
    
    // get tags to search from
    var tags = getTagsForRecommendations( recData );
    
    // get vids for tags
    seminarModel.fetchVidsForTags( tags ).then( function ( ok ) {
        // get tags for which video is not returned, correct below
        var emptyTags = tags;

        youtubeApi.fetchVidsFromYoutubeForTags( emptyTags, function ( err, data ) {
            if( !err ){
                // wrong happened, nothing to do
            }

            var semVidArr = [];
            emptyTags.forEach( function ( ele ) {
                var tagDataObj = data[ele];
                var tagVidArr = tagDataObj.vidsArr;
                if( tagVidArr.length > 0 ) {
                    var arr = seminarModel.createDataForMultipleVids(tagVidArr, ele);
                    semVidArr = semVidArr.concat(arr);
                }
            })

            //insert videodata to seminarmodel for these tags,
            // might need to change structure accordingly
            seminarModel.insertMultipleVids( semVidArr ).then( function ( resolve ) {
                // its ok
            }, function ( reject ) {
                // its ok, log it
            });

            // data is tagged object with videos,semVidArr is merged array of vids
            // prepare result
            //filter out videos already watched
            //return results
        } )

    }, function ( err ) {

    });

});

router.post('/suggest/videoShow', jsonParser, function (req, res, next) {
    
});

router.post('/suggest/searchPages', jsonParser, function (req, res, next) {
    
});
module.exports = router;
