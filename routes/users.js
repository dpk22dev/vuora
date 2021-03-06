var express = require('express');
var userUtil = require('./../service/user/userService');
var loginUtil = require('./../lib/login');
var userIdUtil = require('./../lib/userIdUtil');
var util = require('./../lib/util');
var router = express.Router();
var async = require('async');
var bodyParser = require('body-parser');
var config = require('config');
var jsonwebtoken = require("jsonwebtoken");
var moment = require("moment");

var jsonParser = bodyParser.json({type: 'application/json'});

/* GET users listing. */
function setTag(tag, callback) {
    userUtil.setTags(tag.user, tag.tag, tag.rate || 0, callback);
};

router.post('/tags', jsonParser, function (req, res, next) {
    var body = req.body;
    var userId = req.headers.userId;
    var tags = body.tags;
    var tagArr = [];
    tags.forEach(function (obj) {
        var tmpTag = {};
        tmpTag.user = userId;
        tmpTag.tag = obj.tag;
        tmpTag.rate = obj.rating;
        tagArr.push(tmpTag);
    });
    async.map(tagArr, setTag, function (results) {
        res.send(results);
    });
});

router.post('/search', jsonParser, function (req, res) {
    var data = req.body;

    userUtil.search(data, function (result) {
        res.send(result);
    })
});

router.put('/colleges', jsonParser, function (req, res) {
    var body = req.body;
    var id = req.headers.userId;
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
    var id = req.headers.userId;
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

router.get(['/tags', '/public/tags'], function (req, res) {
    var userId = req.query.userId || req.headers.userId;
    userUtil.getTags(userId, function (result) {
        res.send(result);
    })
});

router.get(['/getuser', '/public/getuser' ], function (req, res, next) {
    var passUser = req.query.id;
    var userId = passUser || req.headers.userId;

    userUtil.getUser(userId, function (response) {
        res.send(response);
    })
});


router.get(['/getusers', '/public/getusers'], function (req, res, next) {
    var passUser = req.query.id;
    var userArr = passUser.split(",") || [];

    userUtil.getUsers(userArr, function (response) {
        res.send(response);
    })
});

router.get(['/suggestions/tag', '/public/suggestions/tag'], function (req, res, next) {
    var tag = req.query.t;
    userUtil.getTagSuggestion(tag, function (result) {
        res.send(result);
    })
});

router.post('/signup', jsonParser, function (req, res) {
    var user = req.body;
    user.fid = req.headers.fId;
    loginUtil.signUp(user, function (response) {
        var token = jsonwebtoken.sign({
            auth: user,
            agent: req.headers['user-agent'],
            exp: Math.floor(new Date().getTime() / 1000) + 7 * 24 * 60 * 60
        }, config.get('jwtsecret'));

	userIdUtil.getUID( user.id, function (err, result) {
                if (err) {
                    var response = { status : 401, message : "User doesn't exist" }
                    res.status(200).send( response );
                } else {
        	    res.cookie('user', token, {domain: '.intelverse.com', maxAge: 900000000, httpOnly: true});
		    res.cookie('userId', result.uid, {domain: '.intelverse.com', maxAge: 900000000});
	            res.send(response);
                }
        });
    })
});

router.get('/signout', function (req, res) {
    var day = moment("1970-01-01");
    res.cookie('user', '', {domain: '.intelverse.com', httpOnly: true,  expires: new Date(Date.now() - 900000) });
    res.cookie('userId', '', {domain: '.intelverse.com',  expires: new Date(Date.now() - 900000)});
    res.send('expired cookies');
});

router.post('/signin', jsonParser, function (req, res) {
    var user = req.body;
    loginUtil.signIn(user, function (response) {
        var token = jsonwebtoken.sign({
            auth: user,
            agent: req.headers['user-agent'],
            exp: Math.floor(new Date().getTime() / 1000) + 7 * 24 * 60 * 60
        }, config.get('jwtsecret'));

        userIdUtil.getUID( user.id, function (err, result) {
                if (err) {
                    var response = { status : 401, message : "User doesn't exist" }
                    res.status(200).send( response );
                } else {
                    res.cookie('user', token, {domain: '.intelverse.com', maxAge: 900000000, httpOnly: true});
                    res.cookie('userId', result.uid, {domain: '.intelverse.com', maxAge: 900000000});
                    res.send(response);
                }
        });

    })
})
;

router.get('/forgotpassword', function (req, res) {
    var id = req.headers.userId;
    loginUtil.forgotPassword(id, function (result) {
        res.send(result);
    })
});

router.post('/passwordreset', jsonParser, function (req, res) {
    var user = req.body;
    loginUtil.resetPassword(user.token, user.password, function (err, res) {
        res.send(err);
    })
});

router.put('/', jsonParser, function (req, res) {
    var id = req.headers.userId;
    var user = req.body;
    userUtil.updateUser(id, user, function (result) {
        res.send(result);
    })
});

router.post('/activity', jsonParser, function (req, res) {
    var data = req.body;
    userUtil.saveUserActivity(data, function (err, result) {
        res.send(util.convertToResponse(err, result, 'Error occured while storing user activity'))
    })
});

router.get( ['/isfollows', '/public/isfollows'], function (req, res) {
    var follows = req.query.id;
    var follower = req.headers.userId;
    userUtil.isFollows(follower, follows, function (result) {
        res.send(result);
    })
});

router.get('/follows', function (req, res) {
    var follows = req.query.id;
    var follower = req.headers.userId;
    userUtil.follows(follower, follows, function (result) {
        res.send(result);
    })
});

router.get('/unfollows', function (req, res) {
    var follows = req.query.id;
    var follower = req.headers.userId;
    userUtil.unfollows(follower, follows, function (result) {
        res.send(result);
    })
});


router.get('/followers', function (req, res) {
    var user = req.headers.userId;
    userUtil.getFollowers(user, function (result) {
        res.send(result);
    })
});

router.get('/unauth/getuid', function (req, res) {
    var ids = req.query.ids;
    var idArr = ids.split(",");
    userIdUtil.getUIDArray(idArr, function (err, result) {
        res.send(util.convertToResponse(err, result, 'Error occured while getting uids'));
    })
});

module.exports = router;
