var express = require('express');
var router = express.Router();

var app = express();


// route grouping
var SimplexController = require('../controllers/v1/SimplexController');

router.post('/api/v1/simplex/simplex-details', SimplexController.getUserQouteDetails);
router.post('/api/v1/simplex/get-partner-data', SimplexController.getPartnerData);
router.get('/api/v1/simplex/get-event-data', SimplexController.getCronEventData)
router.get('/api/v1/simplex/delete-event-data/:event_id', SimplexController.cronDeleteEvent)


module.exports = router;
