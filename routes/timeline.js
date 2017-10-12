/**
 * Created by vinay.sahu on 10/11/17.
 */

var express = require('express');
var router = express.Router();
var path = require('path');
var bodyParser = require('body-parser');
var calender = require('./../lib/calender');
var jsonParser = bodyParser.json({type: 'application/json'});

router.post('/addevent', jsonParser, function (req, res) {
    var body = req.body;
    calender.addEvent(body.from, body.to, body.type, body.description, body.requestor, body.requestee, function (err, result) {
        res.stausCode = 202;
        res.send();
    });
});

module.exports = router;