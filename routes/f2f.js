var express = require('express');
var router = express.Router();
var path = require('path');
var url = require('url');
var util = require('./../lib/util');

var customLogger = require('./../config/logger');

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json({type: 'application/json'});

//var f2fData = require('../models/f2fData');
const seminarModel = require('../models/seminarData');
const timeLineSrv = require('../lib/eventService');

var multer = require('multer');
const customConfig = require('config');
const uploadPath = customConfig.get('f2f.uploadsPath');

try {
    var storage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, uploadPath)
        },
        filename: function (req, file, callback) {
            //@todo change filename while storing, possible cause of attack
            callback(null, file.originalname)
        }
    })
} catch (e) {
    console.log("Error :\n" + e);
}

var upload = multer({
    storage: storage
}).fields([{name: 'video-filename', maxCount: 1}, {name: 'video-blob', maxCount: 1}]);

/*

 var bodyParser = require('body-parser');
 var jsonParser = bodyParser.json({type: 'application/json'});
 */

/*
 working with http://localhost:3000/f2f/alpha/?userId=1
 */
router.get('/:videoId', function (req, res, next) {

    var videoId = req.params.videoId;
    var userId = req.query.userId;

    var inpData = {};
    inpData.videoId = videoId;
    //now poppa deals with videoid, use that
    //seminarModel.getMidForVideoId( inpData ).then( function ( ok ) {
    timeLineSrv.getEventByVideoId(inpData, function (result) {
        if (!result.data) {
            res.send(result);
        }
        if (result.data.requestor == userId || result.data.requestee == userId) {
            res.sendFile('f2f.html', {root: path.join(__dirname, '../public/html')});
        } else {
            res.send(util.convertToResponse({err: 'Access denied'}, null, 'Access denied'));
        }
    });
    /* }, function ( err ) {
     res.send('Error while fetching users for video');
     });*/

});

//todo this should go in its own service
router.post('/saveBlob', upload, function (req, res, next) {

    //@todo change filename while storing, possible cause of attack
    var fileName = req.body['video-filename'];
    var blob = req.files['video-blob'][0].filename;
    var filePath = '/videos' + '/' + fileNasemime;
    var fileUrl = url.format({protocol: req.protocol, host: req.get('host'), pathname: filePath});
    res.send(util.convertToResponse(null, fileUrl, ''));
});

router.post('/create', jsonParser, function (req, res, next) {
    var data = req.body;
    seminarModel.createF2f(data, function (result) {
        res.send(result);
    })
});
/*

 router.post('/', jsonParser, function ( req, res, next ) {
 var data = req.body;
 seminarModel.createF2f( data ).then( function ( result ) {
 res.send( result );
 }, function ( err ) {
 customLogger.log('error occured in creating f2f');
 });
 });
 */

module.exports = router;