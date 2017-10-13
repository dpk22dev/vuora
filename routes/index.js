var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/notiTest', function(req, res, next) {
  res.sendFile('notiTest.html', {root: path.join(__dirname, '../public/html')});
});

module.exports = router;
