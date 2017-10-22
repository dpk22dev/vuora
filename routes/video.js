var express = require('express');
var router = express.Router();

const videoModel = require('../models/videoData');
var customLogger = require('./../config/logger');

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json({type: 'application/json'});

const seminarModel = require('../models/seminarData');
const mustache = require('mustache');

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

module.exports = router;
