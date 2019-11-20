var express = require('express');
// var router = express.Router();

var app=express();


// route grouping
app.prefix('/api/v1/', function (router) { 
    var v1 = require("./v1/common.route");
    router.use('/',v1);
});

// CMS Routes
app.prefix('/admin/', function (router) { 
    var cms = require("./cms/cms.route");
    router.use('/',cms);
});

app.use(function (req, res, next) {
    var err = new Error('Resource Not Found');
    err.status = 404;
    var resources = {};
    res.status( 404 );
    resources.status = err.status;
    resources.message = err.message;
    return res.json(resources);
});

module.exports = app;
