/**
 * Created by vinay.sahu on 10/11/17.
 */

var express = require('express');
var router = express.Router();
var path = require('path');
var bodyParser = require('body-parser');
var timelineUtil = require('./../lib/timelineService');
var jsonParser = bodyParser.json({type: 'application/json'});

router.get('/', function (req, res) {
    var uid = req.query.uid;
    var from = req.query.from;
    var to = req.query.to;
    timelineUtil.getEventsByRange(uid, from, to, function (err, results) {
        if (err) {
            res.send(err);
        } else {
            res.send(results);
        }
    })
});

router.post('/events/request', jsonParser, function (req, res) {
    var body = req.body;
    var type = req.body.type;
    timelineUtil.requestEvent(body, type, function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result)
        }
    });
});

router.post('/events/accept', jsonParser, function (req, res) {
    var body = req.body;
    timelineUtil.acceptEvent(body, function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result)
        }
    });
});

router.post('/events/decline', jsonParser, function (req, res) {
    var body = req.body;
    timelineUtil.declineEvent(body, function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result)
        }
    });
});

router.post('/seminar/create', jsonParser, function (req, res) {
    var body = req.body;
    var type = req.query.type;
    timelineUtil.createSeminar(body, function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result)
        }
    });
});

router.delete('/events/:mid', function (req, res) {
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
});

router.get('/events/:eid', function (req, res) {
    var eventId = req.params.eid;
    timelineUtil.getEvent(eventId, function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    })
});
router.post('/events/search', jsonParser, function (req, res) {
    var body = req.body;
    var type = req.query.type;
    timelineUtil.searchEvent(body, function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result)
        }
    })
});
module.exports = router;