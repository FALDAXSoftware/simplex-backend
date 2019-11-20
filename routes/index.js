var express = require('express');
// var router = express.Router();

var app = express();


// route grouping
app.prefix('/api/v1/', function (router) {
    var v1 = require("./common.route");
    router.use('/', v1);
});

app.use(function (req, res, next) {
    var err = new Error('Resource Not Found');
    err.status = 404;
    var resources = {};
    res.status(404);
    resources.status = err.status;
    resources.message = err.message;
    return res.json(resources);
});

module.exports = app;