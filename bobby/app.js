
var express = require('express')
  , http = require('http');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//var session = require('client-sessions');
//cidermics
var session = require('express-session');
var debug = require('debug')('cidermics:server');
var passportFB = require('passport'), FacebookStrategy = require('passport-facebook').Strategy;
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
var mysql = require("./routes/model/mysql");
var flash = require('req-flash');

var app = express();

// route add
var bobby = require('./routes/bobby');
var admin = require('./routes/admin');

// all environments
app.set('port', process.env.PORT || 80);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(cookieParser());

app.use(logger('dev'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'fortt', resave: true, saveUninitialized: true}));

app.use(passport.initialize());
app.use(passport.session());


app.use('/bobby',express.static(__dirname+'/views/bobby'));

app.use(flash());

app.use(bodyParser.json({limit: '1000mb'}));
app.use(bodyParser.urlencoded({limit: '1000mb', extended: true }));


//controller route

app.use('/adm', admin);
app.use('/',bobby);

app.get('/login_success/:mem_id', ensureAuthenticated, function(req, res){
    var sets = {mem_id : req.user.id, mem_name : req.user.displayName };
    mysql.select('select * from cider.cid_member where mem_id ="'+req.user.id+'" and mem_name = "'+req.user.displayName+'"', function (err, data){
    //console.log(req.user.id);
    //console.log(req.user.photos[0].value);
    //var profilephoto = req.user.photos[0].value;

    if(data.length < 1){
      mysql.insert('insert into cider.cid_member set ?', sets, function(err,data){
      console.log('회원가입 완료');
      });
    }
    //res.send(req.user);
    res.redirect('/');
    //res.render('front/facebooklogin_success', {member:data,profilephoto:profilephoto});
  });
});

app.get('/login_fail', ensureAuthenticated, function(req, res){
    res.redirect('/');
});
app.get('/logout', function(req, res){

  req.session.destroy(function (err) {
    res.redirect('/'); //Inside a callback… bulletproof!
  });
    //req.logout();
    //res.send('<script>alert("로그아웃되었습니다.");location.href="/main_old";</script>');
    //res.redirect('/');
});
function ensureAuthenticated(req, res, next) {
    // 로그인이 되어 있으면, 다음 파이프라인으로 진행
    console.log("로그인이 되어 있음");
    if (req.isAuthenticated()) { return next(); }
    // 로그인이 안되어 있으면, login 페이지로 진행
     console.log("로그인이 안되어 있음");
    res.redirect('/');
}

//관리자
passport.use('local', new LocalStrategy({
    usernameField : 'email',
    passwordField : 'pw',
    passReqToCallback : true
}
,

function(req, email, pw, done) {

  mysql.select('select * from bobbyDB.user where user_email ="'+email+'" and user_password = "'+pw+'"', function (err, data){
    if(data.length < 1){
      console.log('fail');
      return done(null, false);
    }else {
      console.log('success');
      return done(null, data);
    }
    if(err){
      res.redirect('back');
    }
    
    });
  
}
));


passport.serializeUser(function(user, done) {
    done(null, user);
    // if you use Model.id as your idAttribute maybe you'd want
    // done(null, user.id);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  //2016년 12월 8일 추가됨
  
  res.setTimeout(120000, function(){
        console.log('Request has timed out.');
        });
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
    res.render('error500', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error500', {
    message: err.message,
    error: {}
  });
});

module.exports = app;


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, _next) {
    console.log('Error handler', err);
    if(err instanceof IpDeniedError){
      res.status(401);
    }else{
      res.status(err.status || 500);
    }

    res.render('error', {
      message: 'You shall not pass',
      error: err
    });
  });
}