var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
// cookie is just cookie-parser deps; we can use it
var cookieStrParser = require('cookie');
//var bodyParser = require('body-parser');
var jsonwebtoken = require("jsonwebtoken");
var uidUtil = require('./lib/userIdUtil');
var fs = require('fs');

var cors = require('cors');

var routes = require('./routes/index');
var users = require('./routes/users');
var chat = require('./routes/chat');
var f2f = require('./routes/f2f');
var selfGoogleAuth = require('./routes/selfGoogleAuth');
var timeline = require('./routes/event');
var notification = require('./routes/notification');
var seminar = require('./routes/seminar');
var video = require('./routes/video');
var questions = require('./routes/questions');
var config = require('config');
var cookieParser = require('cookie-parser');
var mustacheExpress = require('mustache-express');

var app = express();
app.use(cookieParser());

process.env.NODE_CONFIG_DIR = '../config';

var httpServer = require('http').Server(app);

var sslOptions = {
    key: fs.readFileSync( path.join( __dirname, 'ssl/server.key') ),
    cert: fs.readFileSync( path.join( __dirname, 'ssl/server.crt' ) )
};
var httpsServer = require('https').Server( sslOptions, app);

var server = httpsServer;
//var io = require('socket.io')(server);

// cors code begins
var whitelist = ['http://local.intelverse.com:9090', 'http://api.intelverse.com', 'http://apis.intelverse.com', 'http://intelverse.com/', 'http://www.intelverse.com/'];
/* var corsOptions = {
 origin: function (origin, callback) {
 if (whitelist.indexOf(origin) !== -1) {
 callback(null, true)
 } else {
 callback(new Error('Not allowed by CORS'))
 }
 },
 optionsSuccessStatus: 200,
 credentials: true
 }*/

var corsOptions = {
    //origin : "http://local.intelverse.com:9090",
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    optionsSuccessStatus: 200,
    credentials: true
};
//app.use(cors(corsOptions));

var unAuthUrls = ['/users/unauth/getuid'];
var isThisUnAuthAllowed = function (req) {
    if (( req.url ).includes('unauth'))
        return true;
    else
        return false;
};
/*
 app.use( function ( req, res, next ) {
 if( isThisUnAuthAllowed( req ) ){
 next();
 } else {
 app.use(cors(corsOptions));
 next();
 }
 });
 */

var corsOptionsDelegate = function (req, callback) {
    var corsOptions = {};
    var err = null;

    if (isThisUnAuthAllowed(req)) {
        corsOptions.origin = false;
    } else if (whitelist.indexOf(req.header('Origin')) !== -1) {
        corsOptions.origin = true;// reflect (enable) the requested origin in the CORS response
        corsOptions.optionsSuccessStatus = 200;
        corsOptions.credentials = true;
    } else {
        err = new Error('Not allowed by CORS')
    }
    callback(err, corsOptions) // callback expects two parameters: error and options
};
//app.use(cors(corsOptionsDelegate));

// cors code ends


/*
hack to run sockets
 ioUserIdData.userId contains userId used in sockets
*/
var ioUserIdData ={};
var tokenCheckCb = function ( req, cb ) {

    var cookieStr = req.headers.cookie ? req.headers.cookie : null;
    var cookieArr = cookieStrParser.parse( cookieStr );
    var token = cookieArr['user'];
    if (token) {
        try {
            var decoded = jsonwebtoken.verify(token, config.get('jwtsecret'));
        }catch( e ){
            cb( e.message );
            return;
        }
        //userId = decoded.auth.emailId || 'aws.user101@gmail.com';
        userId = decoded.auth.id;
        uidUtil.getUID(userId, function (err, result) {
            if (err) {
                cb( new Error('JWT token not authorized in ws switch') )
            } else {
                ioUserIdData.userId = result.uid;
                cb(null, true);
            }
        });
    } else {
        console.log('JWT token not found');
        //console.log('still passing....by user aws.user101@gmail.com');
        //userId = 'vinaysahuhbti@gmail.com';
        cb( new Error('JWT token not found in ws switch') )
    }
}

//chat socket start
var chatIo = require('socket.io')(server, {
    path: '/chatNsp',
    serveClient: false,
    transports: ['polling', 'websocket']
});
//var chatIoData = {};
//chatIo.set('authorization', tokenCheckCb );
var chatSocketObj = require('./lib/chatSocket');
chatSocketObj.chatSocketCreator(chatIo, ioUserIdData);

//var chatSocket = require('./lib/chatSocket')(io);
// chat socket ends

var f2fIo = require('socket.io')(server, {
    path: '/f2fNsp',
    serveClient: false,
    transports: ['polling', 'websocket']
});
//var f2fIoData = {};
//f2fIo.set('authorization', tokenCheckCb );
var f2fSocketObj = require('./lib/f2fSocket');
f2fSocketObj.f2fSocketCreator(f2fIo, ioUserIdData);

//
var notiIo = require('socket.io')(server, {
    path: '/notiNsp',
    serveClient: false,
    transports: ['polling', 'websocket']
});
//var notiIoData = {};
//notiIo.set('authorization', tokenCheckCb );
var notiSocketObj = require('./lib/notiSocket');
notiSocketObj.notiSocketCreator(notiIo, ioUserIdData);
//var notiSocket = notiSocketObj.notiSocket;
//app.set('notiSocket', notiSocket);

// setting socket ios to be used in routers
app.use(function (req, res, next) {
    //res.io = io; //comment this after trry
    res.chatIo = chatIo;
    res.notiIo = notiIo;
    res.f2fIo = f2fIo;
    next();
});
app.use(express.static(path.join(__dirname, '/public')));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
//app.set('view engine', 'jade');

/*app.use(function (req, res, next) {

    if (req.url === '/users/signin' || req.url === '/users/signup' || (req.url).includes('unauth') || req.url === '/users/signout' || (req.url).includes('public') ) {
        next();
    } else if (req.method != 'OPTIONS') {
        //check this only for non css, js, images: these should be cookieless
        var token = req.cookies ? req.cookies.user : null;
        var userId = null;
        if (token) {
            try {
                var decoded = jsonwebtoken.verify(token, config.get('jwtsecret'));
            }catch( e ){
//                res.status(404).send( e.message );
                var response = { status : 401, message : "Unauthorized access" }
                res.status(200).send( response );
                return;
            }
            //userId = decoded.auth.emailId || 'aws.user101@gmail.com';
            userId = decoded.auth.id;
            uidUtil.getUID(userId, function (err, result) {
                if (err) {
		    var response = { status : 401, message : "Unauthorized access" }
	            res.status(200).send( response );
                } else {
                    req.headers.fId = userId;
                    req.headers.userId = result.uid;
                    next();
                }
            });
        } else {
            console.log('JWT token not found');
            //console.log('still passing....by user aws.user101@gmail.com');
            //userId = 'vinaysahuhbti@gmail.com';
	    var response = { status : 401, message : "Unauthorized access" }
            res.status(200).send( response );
        }
    } else {
        next();
    }
    /!* var url = req.url;
     if (true) {
     next();
     } else {
     var user = req.headers.user;
     var token = req.cookies.user;
     if (token) {
     var decoded = jsonwebtoken.verify(token, config.jwtsecret);
     if (!decoded || decoded.auth != user) {
     res.status(401).send('Unauthorized access detected');
     } else {
     next();
     }
     } else {
     var token = jsonwebtoken.sign({
     auth: user,
     agent: req.headers['user-agent'],
     exp: Math.floor(new Date().getTime() / 1000) + 7 * 24 * 60 * 60
     }, config.jwtsecret);
     res.cookie('jarvis', token, {maxAge: 900000, httpOnly: true});
     res.status(401).send('autorization token is missing new token created!!!');
     }
     }*!/
});*/

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
// app.use(bodyParser.urlencoded());
// app.use(bodyParser.json());
//app.use(cookieParser());

app.use('/', routes);
app.use('/users', users);
app.use('/chat', chat);
app.use('/selfGoogleAuth', selfGoogleAuth);
app.use('/seminar', seminar);
app.use('/event', timeline);
app.use('/f2f', f2f);
app.use('/video', video);
app.use('/questions', questions);
app.use('/notification', notification);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

process.on('uncaughtException', function (err) {
    console.log('error', 'UNCAUGHT EXCEPTION - keeping process alive:', err);
});

module.exports = {app: app, server: server};
