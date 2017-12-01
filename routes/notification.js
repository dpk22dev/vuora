/**
 * Created by vinay.sahu on 11/30/17.
 */
var express = require('express');
var router = express.Router();
var path = require('path');
var Long = require('mongodb').Long;
var bodyParser = require('body-parser');
var notificationService = require('./../lib/notificationService');
var jsonParser = bodyParser.json({type: 'application/json'});

router.post('/save', jsonParser, function (req, res) {
    var data = req.body;
    notificationService.save(data, function (err, result) {
        res.send(result);
    })
});

router.get('/', function (req, res) {
    var uid = req.headers.userId;
    notificationService.get(uid, function (result) {
        res.send(result);
    })
});

router.get('/mark', function (req, res) {
    var data = {};
    data.notificationId = req.query.id;
    notificationService.markRead(data, function (result) {
        res.send(result);
    })
});

module.exports = router;