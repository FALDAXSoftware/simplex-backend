/* Used to store CronJobs  */
var cron = require('node-cron');

var cronFunction = async()=>{
    // code for cron
}
// On Every Minute
cron.schedule('* * * * *', (req, res, next) => {
    console.log("Started cron....");
    cronFunction();
    
});
