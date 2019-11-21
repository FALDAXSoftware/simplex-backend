var express = require('express');
var router = express.Router();

var app = express();


// route grouping
var SimplexController = require('../controllers/v1/SimplexController');
var UsersController = require('../controllers/v1/UsersController');

router.get('/api/v1/users/get/:id', UsersController.get);
router.get('/api/v1/test', function(req, res){
    return res.json({status:1})
});
router.post('/api/v1/simplex/simplex-details', SimplexController.getUserQouteDetails);
router.get('/api/v1/simplex/get-simplex-coin-list', SimplexController.getSimplexCoinList);
router.post('/api/v1/simplex/get-partner-data',SimplexController.getPartnerData);


module.exports = router;
