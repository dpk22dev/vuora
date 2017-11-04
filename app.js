var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
//var bodyParser = require('body-parser');
var jsonwebtoken = require("jsonwebtoken");

var cors = require('cors');

var routes = require('./routes/index');
var users = require('./routes/users');
var chat = require('./routes/chat');
var f2f = require('./routes/f2f');
var selfGoogleAuth = require('./routes/selfGoogleAuth');
var timeline = require('./routes/timeline');
var seminar = require('./routes/seminar');
var video = require('./routes/video');
var config = require('./config/config');
var cookieParser = require('cookie-parser');

var app = express();
app.use(cookieParser());

process.env.NODE_CONFIG_DIR = '../config';

var server = require('http').Server(app);
//var io = require('socket.io')(server);

//chat socket start
var chatIo = require('socket.io')(server, {
    path: '/chatNsp',
    serveClient: false,
    transports: ['polling', 'websocket']
});
var chatIoData = {};
chatIo.set('authorization', function (handshakeData, cb) {
    console.log('Auth: ', handshakeData._query.userId);

    chatIoData.userId = handshakeData._query.userId;
    cb(null, true);
});
var chatSocketObj = require('./lib/chatSocket');
chatSocketObj.chatSocketCreator(chatIo, chatIoData);

//var chatSocket = require('./lib/chatSocket')(io);
// chat socket ends

var f2fIo = require('socket.io')(server, {
    path: '/f2fNsp',
    serveClient: false,
    transports: ['polling', 'websocket']
});
var f2fIoData = {};
f2fIo.set('authorization', function (handshakeData, cb) {
    console.log('Auth: ', handshakeData._query.userId);

    f2fIoData.userId = handshakeData._query.userId;
    cb(null, true);
});
var f2fSocketObj = require('./lib/f2fSocket');
f2fSocketObj.f2fSocketCreator(f2fIo, f2fIoData);

//
var notiIo = require('socket.io')(server, {
    path: '/notiNsp',
    serveClient: false,
    transports: ['polling', 'websocket']
});
var notiIoData = {};
notiIo.set('authorization', function (handshakeData, cb) {
    console.log('Auth: ', handshakeData._query.userId);

    notiIoData.userId = handshakeData._query.userId;
    cb(null, true);
});
var notiSocketObj = require('./lib/notiSocket');
notiSocketObj.notiSocketCreator(notiIo, notiIoData);
//var notiSocket = notiSocketObj.notiSocket;
//app.set('notiSocket', notiSocket);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// try it
app.use(function (req, res, next) {
    //res.io = io; //comment this after trry
    req.notiIo = notiIo;
    next();
});

app.use(function (req, res, next) {
    var url = req.url;
    if (url === '/users/signin') {
        next();
    } else {
        var user = req.headers.user;
        var token = req.cookies.jarvis;
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
    }
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(cors());

app.use(logger('dev'));
// app.use(bodyParser.urlencoded());
// app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/chat', chat);
app.use('/selfGoogleAuth', selfGoogleAuth);
app.use('/seminar', seminar);
app.use('/timeline', timeline);
app.use('/f2f', f2f);
app.use('/video', video);

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
