var express = require('express');
var router = express.Router();
var path = require('path');
var f2fData = require('../models/f2fData');

var multer  = require('multer')
var upload = multer({ dest: 'videos/' })
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
router.post( '/saveBlob', upload.array(), function ( req, res, next ) {

    req['video-filename'];
    req['video-blob'];
    var stream = fs.createWriteStream("my_file.txt");
    stream.once('open', function(fd) {
        stream.write("My first row\n");
        stream.write("My second row\n");
        stream.end();
    });

});

module.exports = router;