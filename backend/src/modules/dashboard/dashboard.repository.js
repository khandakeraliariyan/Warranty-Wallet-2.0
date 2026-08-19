const prisma = require("../../config/prisma");

const getProductStatistics = async (userId) => {
    const [total, active, expiringSoon, expired, purchaseValue] = await Promise.all([
        prisma.product.count({
            where: {
                userId,
                isDeleted: false,
            },
        }),

        prisma.product.count({
            where: {
                userId,
                warrantyStatus: "ACTIVE",
                isDeleted: false,
            },
        }),

        prisma.product.count({
            where: {
                userId,
                warrantyStatus: "EXPIRING_SOON",
                isDeleted: false,
            },
        }),

        prisma.product.count({
            where: {
                userId,
                warrantyStatus: "EXPIRED",
                isDeleted: false,
            },
        }),

        prisma.product.aggregate({
            where: {
                userId,
                isDeleted: false,
            },
            _sum: {
                purchasePrice: true,
            },
        }),
    ]);

    return {
        total,
        active,
        expiringSoon,
        expired,
        purchaseValue:
            purchaseValue._sum.purchasePrice || 0,
    };
};

const getDocumentStatistics = async (userId) => {
    return prisma.document.count({

        where: {

            product: {

                userId,

            },

        },

    });

};

const getNotificationStatistics = async (userId) => {
    const [total, unread,] = await Promise.all([

        prisma.notification.count({

            where: {

                userId,

            },

        }),

        prisma.notification.count({

            where: {

                userId,

                isRead: false,

            },

        }),

    ]);

    return {

        total,

        unread,

    };

};

const getRecentNotifications = async (userId, limit = 5) => {

    return prisma.notification.findMany({

        where: {

            userId,

        },

        orderBy: {

            createdAt: "desc",

        },

        take: limit,

    });

};


const getRecentActivities = async (userId, limit = 5) => {

    return prisma.activityLog.findMany({

        where: {

            userId,

        },

        orderBy: {

            createdAt: "desc",

        },

        take: limit,

    });

};

const getCategoryDistribution = async (userId) => {
    return prisma.product.groupBy({

        by: [

            "categoryId",

        ],

        where: {

            userId,

            isDeleted: false,

        },

        _count: {

            id: true,

        },

    });

};

const getWarrantyTimeline = async (userId, limit = 10) => {

    return prisma.product.findMany({

        where: {

            userId,

            isDeleted: false,

            hasWarranty: true,

            lifecycleStatus: "ADDED",

            expiryDate: { not: null },

        },

        orderBy: {

            expiryDate: "asc",

        },

        select: {

            id: true,

            name: true,

            expiryDate: true,

            warrantyStatus: true,

        },

        take: limit,

    });

};

const getAdminStatistics = async () => {
    const [

        totalUsers,

        paidUsers,

        totalProducts,

        totalRevenue,

        successfulPayments,

    ] = await Promise.all([

        prisma.user.count(),

        prisma.user.count({
            where: {
                plan: { in: ["PLUS", "PRO"] },
            },
        }),

        prisma.product.count({

            where: {

                isDeleted: false,

            },

        }),

        prisma.payment.aggregate({

            where: {

                status: "SUCCESS",

            },

            _sum: {

                amount: true,

            },

        }),

        prisma.payment.count({

            where: {

                status: "SUCCESS",

            },

        }),

    ]);

    return {

        totalUsers,

        paidUsers,

        totalProducts,

        totalRevenue:
            totalRevenue._sum.amount || 0,

        successfulPayments,

    };

};

const getRecentPayments = async (limit = 10) => {

    return prisma.payment.findMany({

        orderBy: {

            createdAt: "desc",

        },

        include: {

            user: {

                select: {

                    id: true,

                    name: true,

                    email: true,

                },

            },

        },

        take: limit,

    });

};

const getMonthlyRevenue = async (year) => {
    const start = new Date(
        year,
        0,
        1
    );

    const end = new Date(
        year + 1,
        0,
        1
    );

    return prisma.payment.groupBy({

        by: [

            "createdAt",

        ],

        where: {

            status: "SUCCESS",

            createdAt: {

                gte: start,

                lt: end,

            },

        },

        _sum: {

            amount: true,

        },

    });

};

const getProductGrowth = async (year) => {

    const start = new Date(
        year,
        0,
        1
    );

    const end = new Date(
        year + 1,
        0,
        1
    );

    return prisma.product.groupBy({

        by: [

            "createdAt",

        ],

        where: {

            createdAt: {

                gte: start,

                lt: end,

            },

            isDeleted: false,

        },

        _count: {

            id: true,

        },

    });

};

const getOpenClaimsCount = (userId) => prisma.claim.count({
    where: {
        userId,
        status: { in: ["SUBMITTED", "IN_PROGRESS"] },
    },
});

const getRecentDocuments = (userId, limit = 5) => prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
        id: true,
        fileName: true,
        fileType: true,
        ocrProcessed: true,
        createdAt: true,
        product: { select: { id: true, name: true } },
    },
});

const getAiProcessingCount = (userId) => prisma.document.count({
    where: {
        userId,
        fileType: { in: ["INVOICE", "RECEIPT", "WARRANTY_CARD"] },
        ocrProcessed: false,
    },
});

const getWarrantyHeatmap = async (userId) => {
    // Get all products with warranty data
    const products = await prisma.product.findMany({
        where: {
            userId,
            isDeleted: false,
            hasWarranty: true,
            lifecycleStatus: "ADDED",
            expiryDate: { not: null },
        },
        select: {
            id: true,
            name: true,
            brand: true,
            purchasePrice: true,
            expiryDate: true,
            warrantyStatus: true,
            category: {
                select: {
                    name: true,
                },
            },
        },
    });

    // Group by month and calculate statistics
    const heatmapData = {};
    const trendData = {};
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let totalValue = 0;
    let valueAtRisk = 0;
    const statusCounts = {
        ACTIVE: 0,
        EXPIRING_SOON: 0,
        EXPIRED: 0,
        NO_WARRANTY: 0,
    };

    products.forEach((product) => {
        const expiryDate = new Date(product.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);

        // Calculate year-month key
        const year = expiryDate.getFullYear();
        const month = String(expiryDate.getMonth() + 1).padStart(2, "0");
        const monthKey = `${year}-${month}`;

        // Initialize month object if not exists
        if (!heatmapData[monthKey]) {
            heatmapData[monthKey] = {
                month: monthKey,
                monthName: expiryDate.toLocaleString("default", {
                    month: "short",
                    year: "numeric",
                }),
                date: expiryDate,
                products: [],
                count: 0,
                value: 0,
                statusBreakdown: {
                    ACTIVE: 0,
                    EXPIRING_SOON: 0,
                    EXPIRED: 0,
                },
            };
        }

        // Initialize trend data for this month
        if (!trendData[monthKey]) {
            trendData[monthKey] = {
                month: monthKey,
                date: expiryDate,
                ACTIVE: 0,
                EXPIRING_SOON: 0,
                EXPIRED: 0,
                totalValue: 0,
            };
        }

        // Add product to month
        const price = Number(product.purchasePrice) || 0;
        totalValue += price;

        // Track value at risk (expiring soon or expired)
        if (product.warrantyStatus === "EXPIRING_SOON" || product.warrantyStatus === "EXPIRED") {
            valueAtRisk += price;
        }

        heatmapData[monthKey].products.push({
            id: product.id,
            name: product.name,
            brand: product.brand,
            category: product.category?.name || "Uncategorized",
            purchasePrice: price,
            expiryDate: expiryDate,
            warrantyStatus: product.warrantyStatus,
            daysUntilExpiry: Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        });

        heatmapData[monthKey].count += 1;
        heatmapData[monthKey].value += price;
        heatmapData[monthKey].statusBreakdown[product.warrantyStatus] =
            (heatmapData[monthKey].statusBreakdown[product.warrantyStatus] || 0) + 1;

        // Update trend data
        trendData[monthKey][product.warrantyStatus]++;
        trendData[monthKey].totalValue += price;

        // Update overall status counts
        statusCounts[product.warrantyStatus]++;
    });

    // Sort by date and convert to array
    const sortedHeatmap = Object.values(heatmapData)
        .sort((a, b) => a.date - b.date)
        .map((month) => ({
            ...month,
            date: month.date.toISOString(),
        }));

    // Sort trend data and format for chart
    const sortedTrend = Object.values(trendData)
        .sort((a, b) => a.date - b.date)
        .map((month) => ({
            month: month.month,
            monthName: new Date(month.date).toLocaleString("default", {
                month: "short",
                year: "2-digit",
            }),
            ACTIVE: month.ACTIVE,
            EXPIRING_SOON: month.EXPIRING_SOON,
            EXPIRED: month.EXPIRED,
            totalValue: month.totalValue,
            totalItems: month.ACTIVE + month.EXPIRING_SOON + month.EXPIRED,
        }));

    // Calculate health score
    const totalProducts = products.length;
    const healthScore =
        totalProducts === 0
            ? 100
            : Math.max(
                0,
                Math.round(
                    ((statusCounts.ACTIVE + statusCounts.EXPIRING_SOON * 0.5) / totalProducts) * 100
                )
            );

    return {
        summary: {
            totalProducts,
            totalValue,
            valueAtRisk,
            healthScore,
            statusCounts,
        },
        heatmap: sortedHeatmap,
        trend: sortedTrend,
    };
};

module.exports = {
    getProductStatistics,
    getDocumentStatistics,
    getOpenClaimsCount,
    getRecentDocuments,
    getAiProcessingCount,
    getNotificationStatistics,
    getRecentNotifications,
    getRecentActivities,
    getCategoryDistribution,
    getWarrantyTimeline,
    getWarrantyHeatmap,
    getAdminStatistics,
    getRecentPayments,
    getMonthlyRevenue,
    getProductGrowth,
};
