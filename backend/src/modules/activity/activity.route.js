const express = require("express");

const router = express.Router();

const controller = require("./activity.controller");

const auth = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");

const { activityIdSchema } = require("./activity.validation");

router.get("/", auth, controller.getActivities);

router.get("/recent", auth, controller.getRecentActivities);

router.get("/:id", auth, validate(activityIdSchema), controller.getActivity);

module.exports = router;