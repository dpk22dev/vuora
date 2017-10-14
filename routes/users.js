var express = require('express');
var userUtil = require('./../lib/userService');
var loginUtil = require('./../lib/login');
var router = express.Router();
var async = require('async');
var bodyParser = require('body-parser');

var jsonParser = bodyParser.json({type: 'application/json'});

/* GET users listing. */
router.post('/:id/tags', jsonParser, function (req, res, next) {
    var body = req.body;
    var userId = req.params.id;
    var tags = body.tags;
    tags.forEach(function (tag) {
        userUtil.setTags(userId, tag.tag, tag.rate || 0);
    });
    res.stausCode = 202;
    res.send();
});

router.get('/getuser/:id', function (req, res, next) {
    var userId = req.params.id;
    userUtil.getUser(userId, function (err, response) {
        res.send(response);
    })
});

router.get('/suggestions/tag', function (req, res, next) {
    var tag = req.query.t;
    var tags = [];
    tags.push(tag);
    tags.push(tag + ".*");
    async.map(tags, userUtil.getTagSuggestion, function (err, response) {
        res.send(response);
    });
});

router.post('/signup', jsonParser, function (req, res) {
    var user = req.body;
    loginUtil.signUp(user, function (err, response) {
        if (err) {
            res.send(err);
        } else {
            res.send(response);
        }
    })
});

router.post('/signin', jsonParser, function (req, res) {
    var user = req.body;
    loginUtil.signIn(user, function (err, response) {
        if (err) {
            res.send(err);
        } else {
            res.send(response);
        }
    })
});

router.get('/forgotpassword', function (req, res) {
    var id = req.query.id;
    loginUtil.forgotPassword(id, function (err, res) {
        if (err) {
            res.send(err);
        } else {
            res.send(res);
        }
    })
});

router.get('/passwordreset/:token', function (req, res, next) {
    var token = req.params.token;
});

router.post('/passwordreset', jsonParser, function (req, res) {
    var user = req.body;
    loginUtil.resetPassword(user.token, user.password, function (err, res) {
        if (res) {
            res.send('password reset successfully');
        } else {
            res.send(err);
        }
    })
});
module.exports = router;
