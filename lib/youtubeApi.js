const request = require('request');
var queryString = require('querystring');
const config = require('config');
var util = require('./../lib/util');
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var youtube = google.youtube('v3');

var async = require('async');

var oauth2Client = new OAuth2(
    '449714028966-pveigfp70p2c7hqi3tgcm30gja88rron.apps.googleusercontent.com', //CLIENT_ID
    '9pqzr2e4yNzf70N7UC4mrZAZ', //MY_CLIENT_SECRET,
    'http://localhost:3000/selfGoogleAuth/oa2callback'//YOUR_REDIRECT_URL
);

oauth2Client.setCredentials({
    access_token: "ya29.GlvdBEJ9zayP3nyy5g0FP_TUw70y5QPKIPUCEdkaEuA0gOYRaC9VxRRtauLzQ0JTdU6p7z3pZNLHw5kJ9RT43emolXtE47uodl7Coz1pDs4TAr8Nz6rD3-gjP_m5",
    refresh_token: "1/T9vC7IoD45RHWMsKYlCXNsAOee_llr1O4W9WSnSEGto"
});

var bindStream = function (data, callback) {
    var bindStreamParms = {
        "auth": oauth2Client,
        "id": data.broadcast.id,
        "part": data.binding.part,
        "streamId": data.stream.id
    };

    youtube.liveBroadcasts.bind(bindStreamParms, function (err, binding) {
        if (err) {
            console.log('Error binding broadcast to stream: ', err);
            data.error = {};
            data.error.msg = 'Error binding broadcast to stream';
            data.error.err = err;
            callback(err, data);
        } else {
            //console.log('Broadcast = ' + JSON.stringify(binding));
            data.binding.etag = binding.etag;
            data.binding.boundStreamId = binding.boundStreamId;
            data.binding.snippet = {};
            data.binding.snippet.channelId = binding.snippet.channelId;
            data.binding.status = {};
            data.binding.status.lifeCycleStatus = binding.status.lifeCycleStatus;
            data.binding.status.recordingStatus = binding.status.recordingStatus;
            callback(err, data);
        }
    });

}

var createStream = function (data, callback) {
    var streamParams = {
        "auth": oauth2Client,
        "part": data.stream.part,
        "resource": data.stream.resource
    };
    youtube.liveStreams.insert(streamParams, function (err, stream) {
        if (err) {
            console.log('Error creating stream: ', err);
            data.error = {};
            data.error.msg = 'Error creating stream';
            data.error.err = err;

            callback(err, data);
        } else {
            //console.log('Stream = ' + JSON.stringify(stream));
            data.stream.id = stream.id;
            data.stream.etag = stream.etag;
            data.stream.resource.cdn.format = stream.cdn.format;
            data.stream.resource.cdn.frameRate = stream.cdn.frameRate;
            data.stream.resource.cdn.ingestionInfo = {};
            data.stream.resource.cdn.ingestionInfo.ingestionAddress = stream.cdn.ingestionInfo.ingestionAddress;
            data.stream.resource.cdn.ingestionInfo.backupIngestionAddress = stream.cdn.ingestionInfo.backupIngestionAddress;
            data.stream.resource.cdn.ingestionInfo.streamName = stream.cdn.ingestionInfo.streamName;
            data.stream.resource.snippet.channelId = stream.snippet.channelId;
            data.stream.resource.status = {};
            data.stream.resource.status.streamStatus = stream.status.streamStatus;
            data.stream.resource.status.healthStatus = {};
            data.stream.resource.status.healthStatus.status = stream.status.healthStatus.status;

            bindStream(data, callback);
        }
    });
};

exports.createBroadcast = function (data, callback) {

    var broadcastParams = {
        "auth": oauth2Client,
        "part": data.broadcast.part,
        "resource": data.broadcast.resource
    };


    youtube.liveBroadcasts.insert(broadcastParams, function (err, broadcast) {
        if (err) {
            callback(util.convertToResponse(err, data, 'Error creating broadcast'));
        } else {
            data.broadcast.etag = broadcast.etag;
            data.broadcast.id = broadcast.id;
            data.broadcast.resource.snippet.channelId = broadcast.snippet.channelId;
            try {
                data.broadcast.resource.contentDetails.monitorStream.embedHtml = broadcast.contentDetails.monitorStream.embedHtml;
            } catch (e) {
                console.log('broadcast.resource.contentDetails.monitorStream.embedHtml not found')
            }
            createStream(data, function (err, result) {
                callback(util.convertToResponse(err, result, 'Error creating stream'))
            });
        }
    });

};

exports.getStreamStatus = function (data, callback) {

    var streamParams = {
        "auth": oauth2Client,
        "part": data.stream.part,
        "id": data.stream.id
    };

    youtube.liveStreams.list(streamParams, function (err, result) {
        if (err) {
            callback(util.convertToResponse(err, data, 'Error listing stream'));
        } else {
            var data = {};
            var item = result.items[0];
            data.id = item.id;
            data.status = {};
            data.status.streamStatus = item.streamStatus;
            data.status.healthStatus = {};
            data.status.healthStatus.status = item.status.healthStatus.status;
            callback(util.convertToResponse(err, data, 'Error listing stream'));
        }
    });
};

exports.setTransition = function (data, callback) {
    var transitionParams = {
        "auth": oauth2Client,
        "part": data.broadcast.part,
        "id": data.broadcast.id,
        "broadcastStatus": data.broadcast.broadcastStatus
    };

    youtube.liveBroadcasts.transition(transitionParams, function (err, result) {
        if (err) {
            callback(util.convertToResponse(err, data, 'Error transitioning stream'));
        } else {
            data.result = result;
            callback(util.convertToResponse(err, data, 'Error transitioning stream'));
        }
    });
};

exports.youtubeSearchDataCreator = function (data) {
    return {
        "auth": oauth2Client,
        "part": "id, snippet",
        "q": data.q,
        "maxResults": 25,
        "type": "video"
    }
};

exports.searchVideos = function (searchParams, callback) {
    youtube.search.list(searchParams, function (err, response) {
        var vidData = {};
        if (err) {
            //callback(util.convertToResponse(err, vidData, 'Error getting videos for given tags'));
            callback(null, vidData);
        } else {
            vidData.vidsArr = response.items;
            //callback(util.convertToResponse(err, vidData, 'Error getting videos for given tags'));
            callback(null, vidData);
        }
    });
};

exports.fetchVidsFromYoutubeForTags = function (tags, cb) {
    var cbs = {};
    tags.forEach(function (ele) {
        var data = module.exports.youtubeSearchDataCreator({"q": ele});
        var method = module.exports.searchVideos.bind(null, data);
        cbs[ele] = method;
    });
    // use async
    async.parallel(cbs, cb);
};