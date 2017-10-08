const request = require('request');
var queryString = require('querystring');
const config = require('config');

var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var youtube = google.youtube('v3');


exports.createBroadcast = function ( data, callback ) {

    var oauth2Client = new OAuth2(
        '449714028966-pveigfp70p2c7hqi3tgcm30gja88rron.apps.googleusercontent.com', //CLIENT_ID
        '9pqzr2e4yNzf70N7UC4mrZAZ', //MY_CLIENT_SECRET,
        'http://localhost:3000/selfGoogleAuth/oa2callback'//YOUR_REDIRECT_URL
    );

    oauth2Client.setCredentials({
        access_token: "ya29.GlvdBEJ9zayP3nyy5g0FP_TUw70y5QPKIPUCEdkaEuA0gOYRaC9VxRRtauLzQ0JTdU6p7z3pZNLHw5kJ9RT43emolXtE47uodl7Coz1pDs4TAr8Nz6rD3-gjP_m5",
        refresh_token: "1/T9vC7IoD45RHWMsKYlCXNsAOee_llr1O4W9WSnSEGto"
    });

    broadcastParams = {
        "auth": oauth2Client,
        "part": "snippet,status,contentDetails",
        "resource": {
            "snippet": {
                "title": "Tesing NodeJS 123",
                "scheduledStartTime": "2017-12-20T14:00:00.000Z",
                "scheduledEndTime": "2017-12-20T15:00:00.000Z",
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
        }
        console.log('Broadcast = ' + JSON.stringify(broadcast));
    });

    /*var params = queryString.stringify({
        part: "id, snippet, cdn, contentDetails, status",
        alt : "json",
        key: "AIzaSyD6SIisseIhXbcsJnH8ncJt9V4Pg9Zaxfg"
    });

    var bUrl = config.get( 'youtube.broadcastApi' ).url + '?' + params;
    var bScope = config.get( 'youtube.broadcastApi' ).scope;

/!*    var oauth =
    {   consumer_key: ''
        , consumer_secret: CONSUMER_SECRET
        , token: perm_data.oauth_token
        , token_secret: perm_data.oauth_token_secret
    }*!/

    var qs = {"snippet":{"title":"test3"},"cdn":{"format":"1080p","ingestionType":"dash"}};
    var authStr = "Bearer ya29.GlvdBFETHSiPi_OhxIzVDVWA1fHsSnoNliUqmgta0iRk15lPu7XRfYYRiw3kF0h-abfo1VE0kWyKc0YG47GQkWD9WJv3oWSeXf1_Ht2vm3rusjTYoLPhzHu71ww7";
    /!*request.post( { url: bUrl, qs: qs, json : true } , function( e, r, data ){
        console.log( e);
        console.log( r);
        console.log( data);
        callback( e, data );
    } );
*!/
    request({
        url: bUrl,
        method: "POST",
        json: true,   // <--Very important!!!
        body: qs,
        headers: {
            "authorization" : authStr
        },
    }, function (error, response, body){
        console.log(response);
        callback( e, response );
    });*/

}



