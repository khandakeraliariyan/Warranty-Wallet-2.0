const app = require("./app");
const env = require("./config/env");

const { startCronJobs } = require("./jobs");

const PORT = env.PORT || 5000;

app.listen(PORT, () => {

    console.log(`Server running on ${PORT}`);

    startCronJobs();

});