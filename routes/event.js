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
    var userId = req.headers.userId;
    body.userId = userId;

    var data = {};
    data.user = userId;
    data.from = new Date(body.bStartDateTime).getTime();
    data.to = new Date(body.bEndDateTime).getTime();

    body.requestee = Long.fromNumber(userId);
    timelineUtil.isConflict(data, function (result) {
        if (result.data && !result.data.conflict) {
            body.requestee = Long.fromNumber(userId);
            timelineUtil.createSeminar(body, function (seminarResult) {
                res.send(seminarResult);
            });
        } else {
            res.send(result);
        }
    });

    uidUtil.getUIDArray([body.requestee], function (err, result) {

    });
});

router.put('/seminar/update', jsonParser, function (req, res) {
    var body = req.body;

    var data = {};
    data.from = new Date(body.bStartDateTime).getTime();
    data.to = new Date(body.bEndDateTime).getTime();
    data.id = body.eventId;
    timelineUtil.updateSeminar(data, function (result) {
        res.send(result);
    })
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
    var videoIds = req.query.videoId.split(",") || [];
    timelineUtil.getEventsByVideoIds({videoIds: videoIds}, function (result) {
        res.send(result);
    })
});

router.post('/search', jsonParser, function (req, res) {
    var body = req.body;
    body.from = body.from || 0;
    body.to = body.to || 1893436200000;
    body.tags = body.tags || [];
    var type = req.query.type;
    timelineUtil.searchEvent(body, function (result) {
        res.send(result)
    });
});

router.post('/conflict', jsonParser, function (req, res) {
    var uid = req.headers.userId;
    var body = req.body;
    body.user = uid;
    timelineUtil.isConflict(body, function (result) {
        res.send(result);
    });
});


router.get('/upcoming', function (req, res) {
    var data = {};
    data.userId = req.headers.userId;
    timelineUtil.upcomingSeminar(data, function (result) {
        res.send(result);
    })
});

router.get('/close/seminar', function (req, res) {
    var data = {};
    data.eventId = req.query.id;
    timelineUtil.endSeminar(data, function (result) {
        res.send(result);
    })
});

module.exports = router;