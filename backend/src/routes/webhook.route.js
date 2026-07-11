const express = require("express");

const router = express.Router();

const controller = require("../modules/payment/payment.controller");

router.post("/stripe",

    express.raw({
        type: "application/json",
    }),

    controller.webhook

);

module.exports = router;