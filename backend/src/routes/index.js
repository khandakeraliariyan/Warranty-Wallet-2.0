const express = require("express");

const userRoutes = require("../modules/user/user.route");
const categoryRoutes = require("../modules/category/category.route");

const router = express.Router();

router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);

module.exports = router;