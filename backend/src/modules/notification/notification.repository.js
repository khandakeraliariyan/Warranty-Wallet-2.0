const prisma = require("../../config/prisma");

const create = (payload) => {
    return prisma.notification.create({
        data: payload,
    });
};

const findById = (id) => {
    return prisma.notification.findUnique({
        where: { id },
    });
};

const findManyByUser = (userId, skip, take) => {
    return prisma.notification.findMany({
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

const countUnread = (userId) => {
    return prisma.notification.count({
        where: {
            userId,

            isRead: false,
        },
    });
};

const markAsRead = (id) => {
    return prisma.notification.update({
        where: {
            id,
        },

        data: {
            isRead: true,
        },
    });
};

const markAllAsRead = (userId) => {
    return prisma.notification.updateMany({
        where: {
            userId,

            isRead: false,
        },

        data: {
            isRead: true,
        },
    });
};

const remove = (id) => {
    return prisma.notification.delete({
        where: {
            id,
        },
    });
};

const countByUser = (userId) => {
    return prisma.notification.count({
        where: {
            userId,
        },
    });
};

module.exports = {
    create,
    findById,
    findManyByUser,
    countUnread,
    markAsRead,
    markAllAsRead,
    remove,
    countByUser
};