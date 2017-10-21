var express = require('express');
var router = express.Router();

const videoModel = require('../models/videoData');
var customLogger = require('./../config/logger');

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json({type: 'application/json'});

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
    videoModel.getUpvotesForUserId( vidData, function( err, result ){
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

module.exports = router;
