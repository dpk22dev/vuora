/**
 * Created by vinay.sahu on 10/11/17.
 */

var express = require('express');
var router = express.Router();
var path = require('path');
var bodyParser = require('body-parser');
var calender = require('./../lib/seminar');
var jsonParser = bodyParser.json({type: 'application/json'});

router.post('/seminar/request', jsonParser, function (req, res) {
    var body = req.body;
    calender.requestSeminar(body, function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result)
        }
    });
});

router.post('/seminar/accept', jsonParser, function (req, res) {
    var body = req.body;
    calender.acceptSeminar(body, function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result)
        }
    });
});

router.post('/seminar/create', jsonParser, function (req, res) {
    var body = req.body;
    calender.createSeminar(body, function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result)
        }
    });
});

router.delete('/seminar/:mid', function (req, res) {
    var data = {
        user: req.query.user,
        tag: req.query.tag,
        mid: req.params.mid
    };
    calender.deleteSeminar(data, function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result)
        }
    })
});

router.post('/seminar/search', jsonParser, function (req, res) {
    var body = req.body;
    calender.searchSeminar(body, function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result)
        }
    })
});
module.exports = router;