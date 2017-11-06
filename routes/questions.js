/**
 * Created by vinay.sahu on 11/5/17.
 */
var express = require('express');
var router = express.Router();
var path = require('path');
var bodyParser = require('body-parser');
var timelineUtil = require('./../lib/timelineService');
var jsonParser = bodyParser.json({type: 'application/json'});
var qService = require('./../lib/questionService');
var qRService = require('./../lib/questionRedisService');

router.post('/save', jsonParser, function (req, res) {
    var body = req.body;
    qRService.save(body, function (result) {
        res.send(result);
    })
});

router.get('/', function (req, res) {
    var data = {};
    data.user = req.params.user;
    data.videoId = req.query.videoid;
    qRService.getCompleteInfo(data, function (result) {
        res.send(result);
    })
});

router.get('/questions', function (req, res) {
    var videoId = req.query.videoid;
    var questionId = req.query.questionid;
    if (videoId) {
        qService.getAllQuestions(videoId, function (result) {
            res.send(result);
        })
    } else {
        qService.getQuestion(questionId, function (result) {
            res.send(result);
        })
    }
});

router.post('/vote', jsonParser, function (req, res) {
    var data = req.body;
    qRService.vote(data, function (result) {
        res.send(result);
    })
});

router.post('/votecount', jsonParser, function (req, res) {
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
    var data = {};
    data.videoId = videoId;
    qRService.getTopQuestions(data, function (result) {
        res.send(result);
    })
});
module.exports = router;