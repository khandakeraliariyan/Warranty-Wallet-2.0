const cron = require("node-cron");

const warrantyJob = require("./warranty.job");

const startCronJobs = () => {

    cron.schedule("0 0 * * *", async () => {

        console.log("Running Warranty Cron Job...");

        await warrantyJob.run();

    });

};

module.exports = startCronJobs;