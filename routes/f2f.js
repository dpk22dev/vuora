var express = require('express');
var router = express.Router();
var path = require('path');
var f2fData = require('../models/f2fData');


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

module.exports = router;