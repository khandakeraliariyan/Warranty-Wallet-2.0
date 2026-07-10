const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");

const service = require("./category.service");

const createCategory = asyncHandler(async (req, res) => {
    const category = await service.createCategory(req.body);

    res.status(201).json(
        new ApiResponse(201, "Category created successfully.", category)
    );
});

const getCategories = asyncHandler(async (req, res) => {
    const categories = await service.getCategories();

    res.status(200).json(
        new ApiResponse(200, "Categories fetched successfully.", categories)
    );
});

const updateCategory = asyncHandler(async (req, res) => {
    const category = await service.updateCategory(req.params.id, req.body);

    res.status(200).json(
        new ApiResponse(200, "Category updated successfully.", category)
    );
});

const deleteCategory = asyncHandler(async (req, res) => {
    await service.deleteCategory(req.params.id);

    res.status(200).json(
        new ApiResponse(200, "Category deleted successfully.")
    );
});

module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
};