var express = require('express');
var router = express.Router();
var UsersController = require('../../controllers/cms/UsersController');
var UserdetailsController = require('../../controllers/cms/UserdetailsController');
var authentication = require('../../middlewares/validateRequest');

router.post('/list',authentication, UsersController.list);
// router.post('/update_other_details',authentication, UserdetailsController.update );
router.post('/profile_update',authentication, UsersController.updateProfile );
router.get('/get_profile',authentication, UsersController.getProfile );
router.put('/update',authentication, UserdetailsController.update );
router.put('/change_password',authentication, UsersController.changePassword );





module.exports = router;