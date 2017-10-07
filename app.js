var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var chat = require('./routes/chat');

var app = express();

var server = require('http').Server(app);
var io = require('socket.io')(server);

// socket io start
var HashMap = require('hashmap');
var vconf = require('./lib/vconf');
io.sockets.on('connection', function (socket) {

  socket.on('adduser', function (user) {
    socket.username = user.username;
    socket.room = user.conf;
    vconf.addUser(socket.username);
    socket.join(user.conf);
    socket.emit('updatechat', 'SERVER', 'you have connected to' + user.conf);
    socket.broadcast.to(user.conf).emit('updatechat', 'SERVER', user.username + ' has connected to this conf');
    //socket.emit('updaterooms', rooms, user.conf);
  });

  socket.on('sendchat', function (data) {
    var vconfRoom = socket.room;
    var cid = socket.username;
    var id = vconfRoom + "_" + cid + "_" + Date.now();
    vconf.addQuestionToVConf(vconfRoom, id, data);
    io.sockets.in(socket.room).emit('updatechat', socket.username, data);
  });

  socket.on('vote', function (data) {
    vconf.vote(data);
  });

  socket.on('switchRoom', function (newconf) {
    socket.leave(socket.room);
    socket.join(newconf);
    socket.emit('updatechat', 'SERVER', 'you have connected to ' + newconf);
    socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has left this room');
    socket.room = newconf;
    socket.broadcast.to(newconf).emit('updatechat', 'SERVER', socket.username + ' has joined this room');
    socket.emit('updaterooms', rooms, newconf);
  });

  /*
   socket.on('disconnect', function () {
   vconf.disconnectUser(socket.username);
   io.sockets.emit('updateusers', usernames);
   socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
   socket.leave(socket.room);
   }); */
});
// socket io ends

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// try it
app.use(function(req, res, next){
  res.io = io;
  next();
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/chat', chat);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = {app: app, server: server};
