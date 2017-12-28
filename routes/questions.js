/**
 * Created by vinay.sahu on 11/5/17.
 */
var express = require('express');
var router = express.Router();
var path = require('path');
var bodyParser = require('body-parser');
var timelineUtil = require('./../lib/eventService');
var jsonParser = bodyParser.json({type: 'application/json'});
var qService = require('./../lib/questionService');
var qRService = require('./../lib/questionRedisService');

router.post('/save', jsonParser, function (req, res) {
    var body = req.body;
    var userId = req.headers.userId;
    body.user = userId;
    qRService.save(body, function (result) {
        res.send(result);
    })
});

router.get('/', function (req, res) {
    var data = {};
    var userId = req.headers.userId;
    data.user = userId;
    data.videoId = req.query.videoid;
    qRService.getCompleteInfo(data, function (result) {
        res.send(result);
    })
});

router.get(['/find', '/public/find'], function (req, res) {
    var videoId = req.query.videoid;
    var questionId = req.query.questionid;
    var page = req.query.page || 1;
    var size = req.query.size || 10;
    if (videoId) {
        qService.getAllQuestions(videoId, page, size, function (result) {
            res.send(result);
        })
    } else {
        qService.getQuestion(questionId, function (result) {
            res.send(result);
        })
    }
});

router.get(['/questionbytag', '/public/questionbytag'], function (req, res) {
    var page = req.query.page;
    var tags = req.query.tags;
    var limit = req.query.limit;
    var tagsArr = tags.split(",") || [];
    var data = {};
    data.page = page;
    data.tags = tagsArr;
    data.limit = limit;
    qService.getQuestionByTag(data, function (result) {
        res.send(result);
    })
});
router.post('/vote', jsonParser, function (req, res) {
    var data = req.body;
    qRService.vote(data, function (result) {
        res.send(result);
    })
});

router.post(['/votecount', '/public/votecount'], jsonParser, function (req, res) {
    var data = req.body;
    if (data.type === 'question') {
        qRService.voteCountByQuestionId(data.id, function (result) {
            res.send(result);
        })
    } else {
        qRService.voteCountByVideoId(data.id, function (result) {
            res.send(result);
        })
    }
});

router.get('/topquestion', function (req, res) {
    var videoId = req.query.videoid;
    var count = req.query.n;
    var data = {};
    data.videoId = videoId;
    data.count = count || 1;
    qRService.getTopQuestions(data, function (result) {
        res.send(result);
    })
});

router.post('/status', jsonParser, function (req, res) {
    var userId = req.headers.userId;
    var data = req.body;
    data.user = userId;
    qRService.status(data, function (result) {
        res.send(result);
    })
});

router.post('/search', jsonParser, function (req, res) {
    var data = req.body;
    qService.searchByTagsOrQuestion(data, function (result) {
        res.send(result);
    });
});

module.exports = router;
