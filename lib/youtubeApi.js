const request = require('request');
var queryString = require('querystring');
const config = require('config');

var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var youtube = google.youtube('v3');

var oauth2Client = new OAuth2(
    '449714028966-pveigfp70p2c7hqi3tgcm30gja88rron.apps.googleusercontent.com', //CLIENT_ID
    '9pqzr2e4yNzf70N7UC4mrZAZ', //MY_CLIENT_SECRET,
    'http://localhost:3000/selfGoogleAuth/oa2callback'//YOUR_REDIRECT_URL
);

oauth2Client.setCredentials({
    access_token: "ya29.GlvdBEJ9zayP3nyy5g0FP_TUw70y5QPKIPUCEdkaEuA0gOYRaC9VxRRtauLzQ0JTdU6p7z3pZNLHw5kJ9RT43emolXtE47uodl7Coz1pDs4TAr8Nz6rD3-gjP_m5",
    refresh_token: "1/T9vC7IoD45RHWMsKYlCXNsAOee_llr1O4W9WSnSEGto"
});

var bindStream = function ( data, callback ) {
    var bindStreamParms = {
        "auth": oauth2Client,
        "id" : data.broadcast.resource.id,
        "part": data.binding.part,
        "streamId": data.stream.resource.id
    }

    youtube.liveBroadcasts.bind( bindStreamParms, function(err,binding) {
        if (err) {
            console.log('Error binding broadcast: ', err);
            callback( err );
        }
        console.log('Broadcast = ' + JSON.stringify(binding));
        data.binding.etag = binding.etag;
        data.binding.boundStreamId = binding.boundStreamId;
        data.binding.snippet = {};
        data.binding.snippet.channelId = binding.snippet.channelId;
        data.binding.status = {};
        data.binding.status.lifeCycleStatus = binding.status.lifeCycleStatus;
        callback( err, data );
    });

}

var createStream = function ( data, callback ) {
     var streamParams = {
        "auth": oauth2Client,
        "part": data.stream.part,
         "resource": data.stream.resource
     };
    youtube.liveStreams.insert(streamParams,  function(err,stream) {
        if (err) {
            console.log('Error creating broadcast: ', err);
            callback( err );
        }
        console.log('Stream = ' + JSON.stringify(stream));
        data.stream.resource.id = stream.id;
        data.stream.resource.etag = stream.etag;
        data.stream.resource.cdn.format = stream.cdn.format;
        data.stream.resource.cdn.frameRate = stream.cdn.frameRate;
        data.stream.resource.cdn.ingestionInfo = {};
        data.stream.resource.cdn.ingestionInfo.ingestionAddress = stream.cdn.ingestionInfo.ingestionAddress;
        data.stream.resource.cdn.ingestionInfo.streamName = stream.cdn.ingestionInfo.streamName;
        data.stream.resource.snippet.channelId = stream.snippet.channelId;
        data.stream.resource.status = {};
        data.stream.resource.status.streamStatus = stream.status.streamStatus;
        data.stream.resource.status.healthStatus = {};
        data.stream.resource.status.healthStatus.status = stream.status.healthStatus.status;

        bindStream( data, callback );
    });
}

exports.createBroadcast = function ( data, callback ) {

    var broadcastParams = {
        "auth": oauth2Client,
        "part": data.broadcast.part,
        "resource": data.broadcast.resource
    };


    youtube.liveBroadcasts.insert(broadcastParams,  function(err,broadcast) {
        if (err) {
            console.log('Error creating broadcast: ', err);
            callback( err );
        }
        console.log('Broadcast = ' + JSON.stringify(broadcast));
        data.broadcast.resource.etag = broadcast.etag;
        data.broadcast.resource.id = broadcast.id;
        data.broadcast.resource.snippet = {};
        data.broadcast.resource.snippet.channelId = broadcast.snippet.channelId;

        createStream( data, callback );
    });

}



