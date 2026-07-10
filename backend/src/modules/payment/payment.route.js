const express = require("express");

const router = express.Router();

const controller = require("./payment.controller");

const auth = require("../../middlewares/auth.middleware");

router.post("/create-checkout", auth, controller.createCheckout);

router.get("/", auth, controller.paymentHistory);

router.get("/subscription", auth, controller.subscription);

module.exports = router;