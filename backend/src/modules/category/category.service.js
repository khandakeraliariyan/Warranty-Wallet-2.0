const ApiError = require("../../utils/ApiError");
const repository = require("./category.repository");

const createCategory = async (payload) => {
    const exists = await repository.findByName(payload.name);

    if (exists) {
        throw new ApiError(409, "Category already exists.");
    }

    return repository.create(payload);
};

const getCategories = () => repository.findAll();

const updateCategory = async (id, payload) => {
    const category = await repository.findById(id);

    if (!category) {
        throw new ApiError(404, "Category not found.");
    }

    return repository.update(id, payload);
};

const deleteCategory = async (id) => {
    const category = await repository.findById(id);

    if (!category) {
        throw new ApiError(404, "Category not found.");
    }

    return repository.remove(id);
};

module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
};