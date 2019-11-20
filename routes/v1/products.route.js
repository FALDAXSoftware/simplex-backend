var express = require('express');
var router = express.Router();
var ProductsController = require('../../controllers/v1/ProductsController');

var authentication = require('../../middlewares/validateRequest');

router.post('/create',authentication, ProductsController.create);
router.post('/list',authentication, ProductsController.list);
router.put('/update',authentication, ProductsController.update);
router.get('/get/:id',authentication, ProductsController.get);

module.exports = router;