const productRepository = require("../modules/product/product.repository");

const notificationService = require("../modules/notification/notification.service");

const activityService = require("../modules/activity/activity.service");

const run = async () => {

    const today = new Date();

    const next30Days = new Date();

    next30Days.setDate(today.getDate() + 30);

    const products =
        await productRepository.findExpiringProducts(
            next30Days
        );

    for (const product of products) {

        await productRepository.updateStatus(
            product.id,
            "EXPIRING_SOON"
        );

        await notificationService.notifyWarrantyExpiry({

            userId: product.userId,

            productId: product.id,

            productName: product.name,

        });

        await activityService.logActivity({

            userId: product.userId,

            type: "SYSTEM",

            entity: "PRODUCT",

            entityId: product.id,

            title: "Warranty Reminder",

            description: `Warranty for "${product.name}" will expire soon.`,

        });

    }

};

module.exports = {
    run,
};