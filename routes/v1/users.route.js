var express = require('express');
var router = express.Router();
var UsersController = require('../../controllers/v1/UsersController');
var UserdetailsController = require('../../controllers/v1/UserdetailsController');
var authentication = require('../../middlewares/validateRequest');

router.post('/list',authentication, UsersController.list);
router.post('/update_other_details',authentication, UserdetailsController.update );


module.exports = router;