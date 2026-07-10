const filter = (query) => {

    const filters = {};

    if (query.categoryId) {

        filters.categoryId = query.categoryId;

    }

    if (query.status) {

        filters.status = query.status;

    }

    if (query.userId) {

        filters.userId = query.userId;

    }

    return filters;
};

module.exports = filter;