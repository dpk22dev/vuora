var express = require('express');
var router = express.Router();
var youtubeApi = require('../lib/youtubeApi');
const seminarModel= require('../models/seminarData');

/* GET users listing. */
router.get('/create', function(req, res, next) {
    var seminarData = require( '../models/seminarData' ).seminarDummyData;
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

module.exports = router;
