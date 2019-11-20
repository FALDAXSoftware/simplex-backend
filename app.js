var express = require('express');
var fs = require('fs')
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cors = require('cors');
var mailer = require('express-mailer');
var dotenv = require('dotenv');
var fileUpload = require('express-fileupload');
var app = express();
var https = require('https');
var http = require('http');
var i18n = require("i18n");
const Validator = require('node-input-validator');
var session = require('express-session')
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: require("./config/secret")()
}));

// Config Router Grouping
express.application.prefix = express.Router.prefix = function (path, configure) {
  var router = express.Router();
  this.use(path, router);
  configure(router);
  return router;
};
// Ends
app.use(cors())

dotenv.load(); // Configuration load (ENV file)
// Configure Locales
i18n.configure({
  locales: ['en', 'de'],
  directory: __dirname + '/locales',
  register: global
});

app.use(i18n.init);

// create a write Usersstream (in append mode)
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {
  flags: 'a'
})

// setup the logger
app.use(logger('common', {
  stream: accessLogStream
}))
app.use(logger('dev'));

// Json parser
app.use(bodyParser.json({
  limit: "2.7mb",
  extended: false
}));
app.use(bodyParser.urlencoded({
  limit: "2.7mb",
  extended: false
}));
app.use(fileUpload({
  limits: {
    fileSize: 10 * 1024 * 1024
  }
}));

// SMTP setting
mailer.extend(app, {
  from: process.env.MAIL_FROM_NAME + " <" + process.env.MAIL_FROM_EMAIL + ">",
  host: process.env.MAIL_HOST, // hostname
  port: process.env.MAIL_PORT, // port forSMTP
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD
  }
});

// Make Images public
app.use(express.static('public'));

// Set views folder for emails
app.set('views', __dirname + '/views');
// Set template engin for view files
app.set('view engine', 'pug');

app.all('/*', function (req, res, next) {
  // CORS headers
  res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  // Set custom headers for CORS
  res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key,Client-Key');
  if (req.headers.language) { // If header send language, then set to that language
    i18n.setLocale(req.headers.language);
  }
  if (req.method == 'OPTIONS') {
    res
      .status(200)
      .end();
  } else {
    next();
  }
});

Validator.extend('extention', async function (field, value) {
  let extentionsArray = ["image/jpeg", "image/png", "application/pdf"];
  if (extentionsArray.includes(value)) {
    return true
  }
  return false;

});
Validator.messages({
  extention: "Invalid file. Only .jpg, .png, .pdf allowed."
});


var server = http.createServer(app);
// SSL Cerificate 
// var server = https.createServer({
//   key: fs.readFileSync(__dirname+'/crypto.key', 'utf8'),
//   cert: fs.readFileSync(__dirname+'/crypto.cert', 'utf8'),
//   requestCert: false,
//   rejectUnauthorized: false
// },app);

// Auth Middleware - This will check if the token is valid Only the requests
// that start with /api/v1/* will be checked for the token. Any URL's that do
// not follow the below pattern should be avoided unless you are sure that
// authentication is not needed
// app.all('/api/v1/*', [require('./middlewares/validateRequest')]);

//Routes
app.use('/', require('./routes'));

// process.on('uncaughtException', function (error) {}); // Ignore error

// Start the server
app.set('port', process.env.PORT);
server.listen(app.get('port'), function () {
  console.log(process.env.PROJECT_NAME + " Application is running on " + process.env.PORT + " port....");
});