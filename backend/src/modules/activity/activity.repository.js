const prisma = require("../../config/prisma");

const create = (payload) => {
    return prisma.activityLog.create({
        data: payload,
    });
};

const findManyByUser = (userId, skip, take) => {
    return prisma.activityLog.findMany({
        where: {
            userId,
        },

        orderBy: {
            createdAt: "desc",
        },

        skip,

        take,
    });
};

const countByUser = (userId) => {
    return prisma.activityLog.count({
        where: {
            userId,
        },
    });
};

const findById = (id) => {
    return prisma.activityLog.findUnique({
        where: {
            id,
        },
    });
};

module.exports = {

    create,

    findManyByUser,

    countByUser,

    findById,

};