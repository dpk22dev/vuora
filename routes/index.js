var express = require('express');
var router = express.Router();
var path = require('path');
var notiData = require('../models/notiData');
var mongo = require('mongodb');
var util = require('./../lib/util');


/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

router.get('/notiTest', function (req, res, next) {
    res.sendFile('notiTest.html', {root: path.join(__dirname, '../public/html')});
});

router.get('/notiTestM', function (req, res, next) {
    /*data = [
     { to : "4", fromTime: new Date('2017-10-14T05:00:00'), toTime :new Date('2017-10-14T06:00:00'), status :"Q" },
     { to : "4", fromTime: new Date('2017-10-15T05:00:00'), toTime :new Date('2017-10-15T06:00:00'), status :"Q" },
     { to : "4", fromTime: new Date('2017-10-16T05:00:00'), toTime :new Date('2017-10-16T06:00:00'), status :"Q" } ];

     notiData.insertNotifications( data ).then( function (resp) {
     res.send('ok');
     }, function (err) {
     res.send('err' + err);
     });
     */

    /*
     var data = {};
     data.objIds = [ mongo.ObjectId("59e1eba0cef9ba1e76a5d4a2"), mongo.ObjectId("59e1eba0cef9ba1e76a5d4a3") ];
     data.status = 'T';

     notiData.setStatus(data).then( function (resp) {
     res.send('ok');
     }, function (err) {
     res.send('err' + err);
     });
     */

    var data = {};
    data.userId = "123";
    data.dataToSend = {v: "val"};
    data.dataToInsert = {
        to: 123,
        fromTime: new Date('2017-10-14T05:00:00'),
        toTime: new Date('2017-10-14T05:00:00'),
        status: 'W'
    };
    var usData = require('../models/userSocketData');
    usData.getUserSocket(data, function (err, socketId) {
        data.socketId = socketId;
        data.socket = req.notiIo.sockets;
        notiData.sendNotificationToSocket(data).then(function (result) {
            res.send(util.convertToResponse(null, {data: 'send notification'}, 'not able to send notification'));
        });
    });


});


module.exports = router;
