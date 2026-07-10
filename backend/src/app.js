const express = require("express");

const app = express();

const webhookRoutes = require("./routes/webhook.route");

app.use("/api/v1/webhooks", webhookRoutes);

app.use(express.json());

app.use(express.urlencoded({
    extended: true,
}));

const routes = require("./routes");

app.use("/api/v1", routes);

module.exports = app;