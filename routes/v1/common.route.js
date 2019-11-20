// Common Route for each version where we categorize it by modules
var express = require('express');
var app = express();


var auth = require('./auth.route');
var users = require('./users.route');
var products = require('./products.route');

// route grouping
app.prefix('/auth', function (router) { // Any route    
    router.use('/', auth);
});

app.prefix('/users', function (router) { // Any route
    router.use('/', users);
});

app.prefix('/products', function (router) { // Any route
    router.use('/', products);
});

module.exports = app;