var express = require('express');
var router = express.Router();
var path = require('path');
var url = require('url');

var f2fData = require('../models/f2fData');

var multer  = require('multer')

var storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, '../public/videos/')
    },
    filename: function(req, file, callback) {
        //@todo change filename while storing, possible cause of attack
        callback(null, file.originalname)
    }
})

var upload = multer({
    storage: storage
}).fields([{ name: 'video-filename', maxCount: 1 }, { name: 'video-blob', maxCount: 1 }]);

/*

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json({type: 'application/json'});
*/

/*
 working with http://localhost:3000/f2f/alpha/?userId=1
 */
router.get('/:f2fId', function(req, res, next) {
    var f2fId = req.params.f2fId;
    var userId = req.query.userId;
    var users = f2fData.getUsersInEvent({});
    if(  users.requestor == userId || users.requestee == userId ){
        res.sendFile('f2f.html', {root: path.join(__dirname, '../public/html')});
    } else {
        res.send('Access denied');
    }
});

//todo this should go in its own service
router.post( '/saveBlob', upload, function ( req, res, next ) {

    //@todo change filename while storing, possible cause of attack
    var fileName = req.body['video-filename'];
    var blob = req.files['video-blob'][0].filename;
    var filePath = '/videos' + '/' + fileName;
    var fileUrl = url.format({ protocol: req.protocol, host: req.get('host'), pathname: filePath });
    res.send( fileUrl );
});

module.exports = router;