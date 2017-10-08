var express = require('express');
var router = express.Router();
var youtubeApi = require('../lib/youtubeApi');

/* GET users listing. */
router.get('/create', function(req, res, next) {
    var seminarData = require( '../models/seminarData' ).seminarDummyData;
    youtubeApi.createBroadcast( seminarData, function ( err, data ) {
        res.send('youtube respond with a resource');
    });
});

module.exports = router;
