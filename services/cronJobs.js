/* Used to store CronJobs  */
var cron = require('node-cron');
var simplexController = require('../controllers/v1/SimplexController');

// On Every Minute
cron.schedule('* * * * *',async (req, res, next) => {
    console.log("Started cron....");
    await simplexController.checkPaymentStatus();
    
});
