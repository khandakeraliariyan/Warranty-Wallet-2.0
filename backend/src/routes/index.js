const express = require("express");

const router = express.Router();

const userRoutes = require("../modules/user/user.route");
const categoryRoutes = require("../modules/category/category.route");
const productRoutes = require("../modules/product/product.route");

router.use("/users", userRoutes);

router.use("/categories", categoryRoutes);

router.use("/products", productRoutes);

module.exports = router;