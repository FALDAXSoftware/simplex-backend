var express = require('express');
var router = express.Router();

var app = express();


// route grouping
<<<<<<< HEAD
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
=======
// var SimplexController = require('../../controllers/v1/SimplexController');
var UsersController = require('../controllers/v1/UsersController');

router.get('/api/v1/users/get/:id', UsersController.get);
router.get('/api/v1/test', function(req, res){
    return res.json({status:1})
});


module.exports = router;
>>>>>>> b5952988497c63ef2c72442bc3875afbe1dfb26a
