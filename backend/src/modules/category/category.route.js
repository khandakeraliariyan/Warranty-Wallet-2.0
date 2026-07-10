const express = require("express");

const controller = require("./category.controller");

const auth = require("../../middlewares/auth.middleware");
const role = require("../../middlewares/role.middleware");

const router = express.Router();

router.get("/", controller.getCategories);

router.post("/", auth, role("ADMIN"), controller.createCategory);

router.patch("/:id", auth, role("ADMIN"), controller.updateCategory);

router.delete("/:id", auth, role("ADMIN"), controller.deleteCategory);

module.exports = router;