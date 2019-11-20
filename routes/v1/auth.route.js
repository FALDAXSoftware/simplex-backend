var express = require('express');
var router = express.Router();

var AuthController = require('../../controllers/v1/AuthController');
var authentication = require('../../middlewares/validateRequest');

router.get('/verify_activation/:token', AuthController.activateAccount );
router.post('/login', AuthController.login );
router.post('/signup', AuthController.signup );    
router.post('/forgot_password',  AuthController.forgotPassword );   
router.get('/reset-password/:token',  AuthController.resetPassword );    
router.post('/logout', authentication, AuthController.logout );
router.post('/change_password', AuthController.changePassword );
router.post('/temp_file_upload', AuthController.tempFileUpload );


module.exports = router;