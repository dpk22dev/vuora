var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/oa2callback', function(req, res, next) {
    res.send('Got key for user. paste in script console!');
});

module.exports = router;
