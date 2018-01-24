var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var moment = require('moment');

var express = require('express');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mongoose = require('mongoose');
var configUrl = require('./config.js');
var nodemailer = require('nodemailer');

var passport = require('passport');
var flash = require('connect-flash');
var bcrypt = require('bcrypt-nodejs');
var async = require('async');
var crypto = require('crypto');

var routes = require('./routes/router');
var User = require('./public/schema/UserSchema');

require('./public/passport')(passport);
mongoose.connect(configUrl.url);

var hbs = exphbs.create({
    helpers: {
        dateFormat: function(date, format) {
          moment.locale('fr'); 
          var mmnt = moment(date);
          return 'Le '+mmnt.format('dddd')+' '+mmnt.format('LL')+' à '+mmnt.format('LT');
        },
        getStringifiedJson: function (value) {
            return JSON.stringify(value);
        },
        breaklines: function(text) {
          text = text.replace(/(\r\n|\n|\r)/gm, '<br />');
          return text;
        }
    },
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir:  __dirname + '/views/partials/'
});

var app = express();
// view engine setup
app.engine('hbs', hbs.engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator({
  customValidators: {
    isEqual: (value1, value2) => {
      return value1 === value2
    },
    isIntRange: (value, min, max) => {
      if(parseInt(value) >= min && parseInt(value) <= max){
        return true
      }
      else{
        return false;
      }
    },
    isValidPassword: (value, passwd) => {
      return bcrypt.compareSync(value, passwd);
    }
  }
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: "4dsqf4fgh654fdgs",
                  saveUninitialized: true,
                  resave: true,
                  store: new MongoStore({ mongooseConnection: mongoose.connection, ttl: 2 * 24 * 60 * 60})
                }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  res.redirect('/')
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
//nbv
module.exports = app;