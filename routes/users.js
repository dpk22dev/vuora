var express = require('express');
var userUtil = require('./../lib/userUtil');
var router = express.Router();

var bodyParser = require('body-parser');

var jsonParser = bodyParser.json({type: 'application/json'});

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.post('/:uid/tags', jsonParser, function (req, res) {
    var body = req.body;
    var userId = req.params.uid;
    var tags = body.tags;
    tags.forEach(function (tag) {
        userUtil.setTags(userId, tag.tag, tag.rate || 0);
    });
    res.stausCode = 202;
    res.send();
});

router.get('/:uid', function (req, res) {
    var userId = req.params.uid;
    userUtil.getUser(userId, function (err, response) {
        res.send(response);
    })
});

module.exports = router;
