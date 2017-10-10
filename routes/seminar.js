var express = require('express');
var router = express.Router();
var youtubeApi = require('../lib/youtubeApi');
const seminarModel= require('../models/seminarData');

/* GET users listing. */
router.get('/create', function(req, res, next) {
    var seminarData = seminarModel.seminarDummyData;
    //seminarModel.insertSeminar( seminarData );


    youtubeApi.createBroadcast( seminarData, function ( err, data ) {
        if( err ){
            res.send('Error while integraing with youtube');
        }
        seminarModel.insertSeminar( data ).then( function ( ok ) {
            res.send('inserted seminar in mongo');
        }, function ( err ) {
            res.send('error while inserting in mongo!');
        });

    });

});

router.get('/stream/status', function(req, res, next) {
    var streamData = seminarModel.dummyStreamFetchData;
    youtubeApi.getStreamStatus( streamData, function ( err, data ) {
        if( err ){
            res.send('error in getting stream status');
        }
        res.send('got status');
    });
    
} );

module.exports = router;

router.get( '/preview', function ( req, res, next ) {
    //assuming stream status check was sucesful
    var streamData = seminarModel.dummyTransitionData;
    streamData.broadcast.broadcastStatus = 'testing';
    youtubeApi.setTransition( streamData, function ( err, data ) {
        if( err ){
            res.send('error in getting preview');
        }
        res.send('got preview');
    });
});

router.get( '/live', function ( req, res, next ) {
    //assuming stream status check was sucesful, preview was successful
    var streamData = seminarModel.dummyTransitionData;
    streamData.broadcast.broadcastStatus = 'live';
    youtubeApi.setTransition( streamData, function ( err, data ) {
        if( err ){
            res.send('error in getting preview');
        }
        res.send('got preview');
    });
});

router.get( '/complete', function ( req, res, next ) {
    //assuming stream status check was sucesful, preview was successful
    var streamData = seminarModel.dummyTransitionData;
    streamData.broadcast.broadcastStatus = 'complete';
    youtubeApi.setTransition( streamData, function ( err, data ) {
        if( err ){
            res.send('error in getting preview');
        }
        res.send('got preview');
    });
});
