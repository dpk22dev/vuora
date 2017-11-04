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
    tags.forEach(function (obj) {
        var tmpTag = {};
        tmpTag.user = userId;
        tmpTag.tag = obj.tag;
        tmpTag.rate = obj.rating;
        tagArr.push(tmpTag);
    });
    async.map(tagArr, setTag, function (err, results) {
        res.stausCode = 202;
        res.send();
    });
});

router.put('/colleges', jsonParser, function (req, res) {
    var body = req.body;
    var id = body.id;
    var colleges = body.colleges;
    var collArr = [];
    colleges.forEach(function (coll) {
        var college = {};
        college.title = coll.title || "";
        college.degree = coll.degree || "";
        college.tags = coll.tags || [];
        college.grades = coll.grades || "";
        college.from = coll.from || 0;
        college.to = coll.to || 0;
        collArr.push(college);
    });
    userUtil.setCollege(id, collArr, function (result) {
        res.send(result);
    })
});

router.put('/orgs', jsonParser, function (req, res) {
    var body = req.body;
    var id = body.id;
    var companies = body.companies;
    var orgArr = [];
    companies.forEach(function (company) {
        var org = {};
        org.title = company.title || "";
        org.company = company.company || "";
        org.location = company.location || "";
        org.current = company.current || false;
        org.from = company.from || 0;
        org.to = company.to || 0;
        orgArr.push(org);
    });
    userUtil.setOrganisation(id, orgArr, function (result) {
        res.send(result);
    })
});

router.get('/tags', function (req, res) {
    var userId = req.query.id;
    userUtil.getTags(userId, function (result) {
        res.send(result);
    })
});

router.get('/getuser', function (req, res, next) {
    var userId = req.query.id;
    userUtil.getUser(userId, function (err, response) {
        res.send(response);
    })
});

router.get('/suggestions/tag', function (req, res, next) {
    var tag = req.query.t;
    userUtil.getTagSuggestion(tag, function (result) {
        res.send(result);
    })
});

router.post('/signup', jsonParser, function (req, res) {
    var user = req.body;
    loginUtil.signUp(user, function (err, response) {
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

router.post('/signin', jsonParser, function (req, res) {
    var user = req.body;
    loginUtil.signIn(user, function (response) {
        var token = jsonwebtoken.sign({
            auth: user,
            agent: req.headers['user-agent'],
            exp: Math.floor(new Date().getTime() / 1000) + 7 * 24 * 60 * 60
        }, config.jwtsecret);
        res.cookie('user', token, {domain: '.intelverse.com', maxAge: 900000, httpOnly: true});
        res.send(response);
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
    userUtil.updateUser(user, function (result) {
        res.send(result);
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
