/**
 * Created by vinay.sahu on 10/11/17.
 */

var express = require('express');
var uidUtil = require('./../lib/userIdUtil');
var router = express.Router();
var path = require('path');
var Long = require('mongodb').Long;
var bodyParser = require('body-parser');
var timelineUtil = require('./../lib/eventService');
var jsonParser = bodyParser.json({type: 'application/json'});

router.get('/list', function (req, res) {
    var uid = req.headers.userId;
    var from = req.query.from || new Date().getTime();
    var to = req.query.to || new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).getTime();
    timelineUtil.getEventsByRange(uid, from, to, function (result) {
        res.send(result);
    })
});

router.post('/request', jsonParser, function (req, res) {
    var body = req.body;
    var type = req.body.type;
    uidUtil.getUIDArray([req.body.requestor, req.body.requestee], function (err, result) {
        body.requestor = Long.fromNumber(result[body.requestor]);
        body.requestee = Long.fromNumber(result[body.requestee]);
        timelineUtil.requestEvent(body, type, function (result) {
            res.send(result)
        });
    });
});

router.post('/accept', jsonParser, function (req, res) {
    var body = req.body;
    uidUtil.getUIDArray([body.user], function (err, result) {
        body.user = result[body.user];
        timelineUtil.acceptEvent(body, function (result) {
            res.send(result)
        });
    });
});

router.post('/decline', jsonParser, function (req, res) {
    var body = req.body;
    timelineUtil.declineEvent(body, function (result) {
        res.send(result)
    });
});

router.post('/seminar/create', jsonParser, function (req, res) {
    var body = req.body;
    var type = req.query.type;
    req.body.userId = !req.params.userId ? 101 : req.params.userId;
    uidUtil.getUIDArray([body.requestee], function (err, result) {
        body.requestee = Long.fromNumber(result[body.requestee]);
        timelineUtil.createSeminar(body, function (result) {
            res.send(result)
        });
    });
});

/*router.delete('/events/:mid', function (req, res) {
 var type = req.query.type;
 var data = {
 user: req.query.user,
 tag: req.query.tag,
 mid: req.params.mid
 };
 timelineUtil.deleteEvent(data, type, function (err, result) {
 if (err) {
 res.send(err);
 } else {
 res.send(result)
 }
 })
 });*/

router.get('/', function (req, res) {
    var eventId = req.query.eventId;
    timelineUtil.getEvent(eventId, function (result) {
        res.send(result);
    })
});

router.get('/videos', function (req, res) {
    var userId = req.headers['userId'];
    var videoId = req.query.videoId;
    timelineUtil.getEventByVideoId({videoId: videoId}, function (result) {
        res.send(result);
    })
});

router.post('/search', jsonParser, function (req, res) {
    var body = req.body;
    var type = req.query.type;
    timelineUtil.searchEvent(body, function (result) {
        res.send(result)
    });
});
module.exports = router;