// Common Route for each version where we categorize it by modules
var express = require('express');
var app = express();


var auth = require('./auth.route');
var users = require('./users.route');
var templates = require('./templates.route');
var pages = require('./pages.route');
var products = require('./products.route');

// route grouping
app.prefix('/auth', function (router) { // Any route    
    router.use('/', auth);
});

app.prefix('/users', function (router) { // Any route
    router.use('/', users);
});

app.prefix('/templates', function (router) { // Any route
    router.use('/', templates);
});

app.prefix('/pages', function (router) { // Any route
    router.use('/', pages);
});

app.prefix('/products', function (router) { // Any route
    router.use('/', products);
});

module.exports = app;