var express = require('express');
var router = express.Router();
var PagesController = require('../../controllers/cms/PagesController');

var authentication = require('../../middlewares/validateRequest');

router.get('/list',authentication, PagesController.list);
router.get('/get/:id',authentication, PagesController.get);
router.post('/create',authentication, PagesController.create);
router.post('/update',authentication, PagesController.update);


module.exports = router;