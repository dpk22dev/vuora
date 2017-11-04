var express = require('express');
var userUtil = require('./../service/user/userService');
var loginUtil = require('./../lib/login');
var router = express.Router();
var async = require('async');
var bodyParser = require('body-parser');
var config = require('./../config/config');
var jsonwebtoken = require("jsonwebtoken");

var jsonParser = bodyParser.json({type: 'application/json'});

/* GET users listing. */
function setTag(tag, callback) {
    userUtil.setTags(tag.user, tag.tag, tag.rate || 0, callback);
};

router.post('/tags', jsonParser, function (req, res, next) {
    var body = req.body;
    var userId = body.id;
    var tags = body.tags;
    var tagArr = [];
    tags.forEach(function (tag) {
        var tmpTag = {};
        tmpTag.user = userId;
        tmpTag.tag = tag;
        tagArr.push(tmpTag);
    });
    async.map(tagArr, setTag, function (err, results) {
        res.stausCode = 202;
        res.send();
    });
});

router.get('/getuser', function (req, res, next) {
    var userId = req.query.id;
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
            var token = jsonwebtoken.sign({
                auth: user,
                agent: req.headers['user-agent'],
                exp: Math.floor(new Date().getTime() / 1000) + 7 * 24 * 60 * 60
            }, config.jwtsecret);
            res.cookie('user', token, {domain: '.intelverse.com', maxAge: 900000, httpOnly: true});
            res.send(response);
        }
    })
});

router.get('/forgotpassword', function (req, res) {
    var id = req.query.id;
    loginUtil.forgotPassword(id, function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    })
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

router.put('/users', jsonParser, function (req, res) {
    var user = req.body;
    userUtil.updateUser(user, function (err, result) {
        if (err) {
            res.send(err)
        } else {
            res.send(result);
        }
    })
});

router.post('/activity', jsonParser, function (req, res) {
    var data = req.body;
    userUtil.saveUserActivity(data, function (err, result) {
        if (err) {
            res.statusCode = 500;
            res.send(err);
        } else {
            res.send();
        }
    })
});
module.exports = router;
