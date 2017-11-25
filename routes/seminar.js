var express = require('express');
var router = express.Router();
var util = require('./../lib/util');
var youtubeApi = require('../lib/youtubeApi');
const seminarModel = require('../models/seminarData');
var timelineUtil = require('./../lib/eventService');
var qRService = require('./../lib/questionRedisService');

var bodyParser = require('body-parser');

var jsonParser = bodyParser.json({type: 'application/json'});

const customLogger = require('../config/logger');

function isSeminarValidForInsertion(semData) {
    var obj = {};
    if (!seminarModel.checkIfSeminarDatesAreInRange(semData)) {
        obj.status = false;
        obj.msg = "dates are not valid";
    } else {
        obj.status = true;
        obj.msg = "ok";
    }
    return obj;
}

/* GET users listing. */
router.post('/create', jsonParser, function (req, res, next) {

    //var seminarData = req.body;
    var seminarData = seminarModel.seminarDummyData;
    var test = isSeminarValidForInsertion(seminarData);
    if (test.status == false) {
        res.send(util.convertToResponse(null, test, null));
    } else {
        youtubeApi.createBroadcast(seminarData, function (result) {
            if (!result.data) {
                res.send(result);
            } else {
                seminarModel.insertSeminar(result.data).then(function (ok) {
                    res.send(result);
                }, function (err) {
                    res.send(util.convertToResponse(err, null, 'error while inserting in mongo'));
                });
            }
        });
    }
});


router.post('/stream/status', jsonParser, function (req, res, next) {
    var data = req.body;
    data.userId = req.headers.userId;

    var streamData = seminarModel.createStreamStatusData(data);
    youtubeApi.getStreamStatus(streamData, function (result) {
        res.send(result);
    });
});

router.post('/preview', jsonParser, function (req, res, next) {
    //assuming stream status check was sucesful
    var streamData = seminarModel.createPreviewTransitionData( req.body );
    //var streamData = seminarModel.dummyTransitionData;
    //streamData.broadcast.broadcastStatus = 'testing';

    /*
     var data = {};
     data.id = streamData.broadcast.id;
     data.status = {};
     data.status.lifeCycleStatus  = streamData.broadcast.broadcastStatus;
     seminarModel.updateBindings( data, function(){} );*/

    youtubeApi.setTransition(streamData, function (result) {
            if (!result.data) {
                res.send(result);
            } else {
                //@todo save to db after binding
                //streamData.updateBindings();

                seminarModel.updateBindings(result.data).then(function (ok) {
                    res.send(result);
                }, function (err) {
                    res.send(util.convertToResponse(err, null, 'error while inserting in mongo'));
                });
            }
        }
    );
});

router.post('/live', jsonParser, function (req, res, next) {
    //assuming stream status check was sucesful, preview was successful
    //var seminarData = req.body;
    //var streamData = seminarModel.dummyTransitionData;
    //streamData.broadcast.broadcastStatus = 'live';

    var streamData = seminarModel.createLiveTransitionData( req.body );

    youtubeApi.setTransition(streamData, function (result) {
        if (!result.data) {
            res.send(result);
        }
        seminarModel.updateBindings(data).then(function (ok) {
            res.send(result)
        }, function (err) {
            res.send(util.convertToResponse(err, null, 'error while inserting in mongo'));
        });


    });
});

router.post('/complete', jsonParser, function (req, res, next) {
    //assuming stream status check was sucesful, preview was successful
    //var streamData = req.body;
    //var streamData = seminarModel.dummyTransitionData;
    //streamData.broadcast.broadcastStatus = 'complete';
    
    var streamData = seminarModel.createBroadcastCompleteTransitionData( req.body );
    
    youtubeApi.setTransition(streamData, function (result) {
        if (!result.data) {
            res.send(result);
        } else {
            seminarModel.updateBindings(data).then(function (ok) {
                res.json(result);
            }, function (err) {
                res.send(util.convertToResponse(err, null, 'error while inserting in mongo'));
            });
        }
    });
});


//@todo
//delete broadcast
router.delete('/:broadCastId', function (req, res, next) {
    var data = {};
    data.id = req.params.broadCastId;
    seminarModel.deleteSeminar(data).then(function (ok) {
        res.send(util.convertToResponse(null, {"deleted": "ok"}, ''));
    }, function (err) {
        res.json(util.convertToResponse(err, null, "deleted failed"));
    });
});

// /broadcast with broadcast id to get all info from db
router.get('/:broadCastId', function (req, res, next) {
    var data = {};
    data.id = req.params.broadCastId;
    seminarModel.getSeminar(data).then(function (ok) {
        res.send(util.convertToResponse(null, ok, ''));
    }, function (err) {
        res.send(util.convertToResponse(err, null, 'unable to get seminar with this id'))
    });
});

// get seminar info based on videodid
router.get('/', function (req, res, next) {
    var data = {};
    data.videoId = req.query.videoId;
    seminarModel.getSeminarByVideoId(data).then(function (ok) {
        res.send(util.convertToResponse(null, ok, ''));
    }, function (err) {
        res.send(util.convertToResponse(err, null, 'unable to get seminar with this id'))
    });
});

// /search to get data from db
// send broadcastId
router.post('/search', jsonParser, function (req, res, next) {
    var data = {};
    data.id = req.params.broadcastId;
    seminarModel.findSeminars(data).then(function (ok) {
        res.send(util.convertToResponse(null, ok, ''));
    }, function (err) {
        res.send(util.convertToResponse(err, null, 'Error occured while searching data'));
    });
});

// @todo will pass videoId instead of broadcastId, need to change same in
// events or timeline service
router.post('/broadcast/question', jsonParser, function (req, res, next) {
    var data = req.body;
    qRService.save(data, function (result) {
        res.send(result);
    })
});

// post /broadcasts, get mapping of broadcastid to videoids and update
// not required as youtube uses same videoId as broadcastId
router.post('/broadcasts', function (req, res, next) {
    var data = {};
    data.id = req.params.broadcastId;

});
// update /broadcasts for video ids


// get broadcast id for given mid
router.get('/broadcastId/:mid', function (req, res, next) {
    var data = {};
    data.mid = req.params.mid;
    seminarModel.getBroadcastIdForMid(data).then(function (ok) {
        res.send(util.convertToResponse(null, ok, ''));
    }, function (err) {
        res.send(util.convertToResponse(err, null, 'error occured while getting bid fom mid'));
    });
});

module.exports = router;