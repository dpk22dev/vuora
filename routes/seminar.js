var express = require('express');
var router = express.Router();
var youtubeApi = require('../lib/youtubeApi');
const seminarModel= require('../models/seminarData');

var bodyParser = require('body-parser');

var jsonParser = bodyParser.json({type: 'application/json'});

/* GET users listing. */
router.post('/create', jsonParser, function(req, res, next) {

    //var seminarData = req.body;
    var seminarData = seminarModel.seminarDummyData;

    //seminarModel.insertSeminar( seminarData );

    youtubeApi.createBroadcast( seminarData, function ( err, data ) {
        res.setHeader('Content-Type', 'application/json');
        if( err ){
            res.json( data.error );
        }
        seminarModel.insertSeminar( data ).then( function ( ok ) {
            console.log('inserted seminar in mongo');
            //res.send(JSON.stringify({ a: 1 }, null, 3));
            res.json( data );
        }, function ( err ) {
            data.error = {};
            data.error.msg = 'error while inserting in mongo';
            data.error.err = err;
            console.log('error while inserting in mongo!');
            res.json( data );
        });

    });

});


router.post('/stream/status', jsonParser, function(req, res, next) {
    //var streamData = req.body;
    var streamData = seminarModel.dummyStreamFetchData;
    youtubeApi.getStreamStatus( streamData, function ( err, data ) {
        if( err ){
            console.log('error in getting stream status');
            res.json( err );
        }
    });
    
} );

module.exports = router;

router.post( '/preview', jsonParser , function ( req, res, next ) {
    //assuming stream status check was sucesful
    //var seminarData = req.body;
    var streamData = seminarModel.dummyTransitionData;
    streamData.broadcast.broadcastStatus = 'testing';
    youtubeApi.setTransition( streamData, function ( err, data ) {
        if( err ){
            console.log('error in getting preview');
            res.json( data );
        }

        //@todo save to db after binding
        //streamData.updateBindings();

        /*seminarModel.update(data).then(function (ok) {
            console.log('inserted seminar in mongo');
            res.send(JSON.stringify({a: 1}, null, 3));
            res.json(data);
        }, function (err) {
            data.error = {};
            data.error.msg = 'error while inserting in mongo';
            data.error.err = err;
            console.log('error while inserting in mongo!');
            res.json(data);
        });*/

    });
});

router.post( '/live', jsonParser, function ( req, res, next ) {
    //assuming stream status check was sucesful, preview was successful
    //var seminarData = req.body;
    var streamData = seminarModel.dummyTransitionData;
    streamData.broadcast.broadcastStatus = 'live';
    youtubeApi.setTransition( streamData, function ( err, data ) {
        if( err ){
            console.log('error in going live');
            res.json( data );
        }
        res.json( data );
    });
});

router.post( '/complete', jsonParser, function ( req, res, next ) {
    //assuming stream status check was sucesful, preview was successful
    //var streamData = req.body;
    var streamData = seminarModel.dummyTransitionData;
    streamData.broadcast.broadcastStatus = 'complete';
    youtubeApi.setTransition( streamData, function ( err, data ) {
        if( err ){
            console.log('error in completing stream');
            res.json( data );
        }
        res.json( data );
    });
});


//@todo
//delete broadcast
// /broadcast with broadcast id to get all info from db
// /search to get data from db
// post /broadcasts
// update /broadcasts for video ids
