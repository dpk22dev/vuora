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
        "id" : data.broadcastId,
        "part": "id, snippet,status,contentDetails",
        "streamId": data.streamId
    }

    youtube.liveBroadcasts.bind( bindStreamParms, function(err,broadcast) {
        if (err) {
            return console.log('Error binding broadcast: ', err);
            callback( err );
        }
        console.log('Broadcast = ' + JSON.stringify(broadcast));
        callback('stream connected to broadcast');
    });

}

var createStream = function ( data, callback ) {
     var streamParams = {
        "auth": oauth2Client,
        "part": "snippet, status, cdn",
         "resource": {
             "snippet": {
                 "title": "s 360 p2"
             },
             "cdn": {
                 "format": "360p",
                 "ingestionType": "rtmp"
             }
         }
     };
    youtube.liveStreams.insert(streamParams,  function(err,stream) {
        if (err) {
            return console.log('Error creating broadcast: ', err);
            callback( err );
        }
        console.log('Stream = ' + JSON.stringify(stream));
        data.streamId = stream.id;
        bindStream( data, callback );
    });
}

exports.createBroadcast = function ( broadCastParams, callback ) {

    var broadcastParams = {
        "auth": oauth2Client,
        "part": "snippet,status,contentDetails",
        "resource": {
            "snippet": {
                "title": "7pm event 21",
                "scheduledStartTime": "2017-10-08T18:40:00.000Z",
                "scheduledEndTime": "2017-10-08T21:00:00.000Z",
            },
            "status": {
                "privacyStatus": "private",
            },
            "contentDetails": {
                "monitorStream": {
                    "enableMonitorStream": true,
                }
            }
        }
    };


    youtube.liveBroadcasts.insert(broadcastParams,  function(err,broadcast) {
        if (err) {
            return console.log('Error creating broadcast: ', err);
            callback( err );
        }
        console.log('Broadcast = ' + JSON.stringify(broadcast));
        broadcastParams.broadcastId = broadcast.id;
        createStream( broadcastParams, callback );
    });

}



