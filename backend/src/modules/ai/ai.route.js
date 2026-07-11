const express = require("express");

const router = express.Router();

const controller = require("./ai.controller");

const auth = require("../../middlewares/auth.middleware");

const upload = require("../../middlewares/upload.middleware");

router.post("/extract-invoice", auth, upload.single, controller.extractInvoice);

module.exports = router;