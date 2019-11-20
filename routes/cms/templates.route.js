var express = require('express');
var router = express.Router();
var EmailtemplatesController = require('../../controllers/cms/EmailtemplateController');

var authentication = require('../../middlewares/validateRequest');

router.get('/list',authentication, EmailtemplatesController.list);
router.get('/get/:id',authentication, EmailtemplatesController.get);
router.post('/create',authentication, EmailtemplatesController.create);
router.put('/update',authentication, EmailtemplatesController.update);


module.exports = router;