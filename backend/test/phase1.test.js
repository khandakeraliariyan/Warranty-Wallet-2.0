const test = require("node:test");
const assert = require("node:assert/strict");

require("dotenv").config();

const categoryRepository = require("../src/modules/category/category.repository");
const productRepository = require("../src/modules/product/product.repository");
const productService = require("../src/modules/product/product.service");
const userRepository = require("../src/modules/user/user.repository");
const paymentRepository = require("../src/modules/payment/payment.repository");
const paymentService = require("../src/modules/payment/payment.service");
const stripe = require("../src/config/stripe");
const prisma = require("../src/config/prisma");
const { PLAN_CONFIG } = require("../src/constants/plans");

const productPayload = {
    categoryId: "category-id",
    name: "Test asset",
    brand: "Test brand",
    purchasePrice: 100,
    purchaseDate: new Date("2026-01-01"),
    warrantyDuration: 12,
    warrantyType: "MANUFACTURER",
};

test("enforces the 5/100/500 asset limits", async (t) => {
    const originalFindCategory = categoryRepository.findById;
    const originalCountProducts = productRepository.countUserProducts;
    const originalCreateProduct = productRepository.create;
    const originalFindPreferences = userRepository.findPreferences;

    categoryRepository.findById = async () => ({ id: productPayload.categoryId });
    productRepository.create = async (payload) => payload;
    userRepository.findPreferences = async () => ({ warrantyReminders: true, reminderDays: [30, 7, 1] });

    t.after(() => {
        categoryRepository.findById = originalFindCategory;
        productRepository.countUserProducts = originalCountProducts;
        productRepository.create = originalCreateProduct;
        userRepository.findPreferences = originalFindPreferences;
    });

    for (const [plan, config] of Object.entries(PLAN_CONFIG)) {
        productRepository.countUserProducts = async () => config.assetLimit;

        await assert.rejects(
            productService.createProduct({ id: "user-id", plan }, productPayload),
            (error) =>
                error.statusCode === 403 &&
                error.message.includes(`${config.assetLimit} assets`)
        );

        productRepository.countUserProducts = async () => config.assetLimit - 1;
        const created = await productService.createProduct(
            { id: "user-id", plan },
            productPayload
        );

        assert.equal(created.userId, "user-id");
    }
});

test("builds correct Plus and Pro subscription checkout sessions", async (t) => {
    const originalCreateSession = stripe.checkout.sessions.create;
    const originalCreatePayment = paymentRepository.createPayment;
    const sessionRequests = [];
    const paymentRequests = [];

    stripe.checkout.sessions.create = async (request) => {
        sessionRequests.push(request);
        return {
            id: `session-${request.metadata.plan}`,
            url: `https://checkout.test/${request.metadata.plan}`,
        };
    };
    paymentRepository.createPayment = async (request) => {
        paymentRequests.push(request);
        return request;
    };

    t.after(() => {
        stripe.checkout.sessions.create = originalCreateSession;
        paymentRepository.createPayment = originalCreatePayment;
    });

    for (const plan of ["PLUS", "PRO"]) {
        const result = await paymentService.createCheckoutSession(
            {
                id: "user-id",
                email: "user@example.com",
                plan: "BASIC",
            },
            plan
        );
        const expected = PLAN_CONFIG[plan];
        const sessionRequest = sessionRequests.at(-1);
        const paymentRequest = paymentRequests.at(-1);

        assert.equal(result.url, `https://checkout.test/${plan}`);
        assert.equal(sessionRequest.mode, "subscription");
        assert.equal(sessionRequest.metadata.plan, plan);
        assert.equal(sessionRequest.subscription_data.metadata.plan, plan);
        assert.equal(sessionRequest.line_items[0].price_data.unit_amount, expected.price * 100);
        assert.equal(sessionRequest.line_items[0].price_data.recurring.interval, "month");
        assert.equal(paymentRequest.plan, plan);
        assert.equal(paymentRequest.amount, expected.price);
        assert.equal(paymentRequest.status, "PENDING");
    }

    await assert.rejects(
        paymentService.createCheckoutSession(
            {
                id: "user-id",
                email: "user@example.com",
                plan: "BASIC",
            },
            "BASIC"
        ),
        (error) => error.statusCode === 400
    );
});

test("checkout confirmation verifies ownership and paid status", async (t) => {
    const originalFindPayment = paymentRepository.findPaymentBySessionId;
    const originalRetrieve = stripe.checkout.sessions.retrieve;

    t.after(() => {
        paymentRepository.findPaymentBySessionId = originalFindPayment;
        stripe.checkout.sessions.retrieve = originalRetrieve;
    });

    paymentRepository.findPaymentBySessionId = async () => null;
    await assert.rejects(
        paymentService.confirmCheckoutSession({ id: "user-id" }, "cs_missing"),
        (error) => error.statusCode === 404
    );

    paymentRepository.findPaymentBySessionId = async () => ({
        id: "payment-id",
        userId: "user-id",
        status: "PENDING",
    });
    stripe.checkout.sessions.retrieve = async () => ({
        id: "cs_pending",
        status: "open",
        payment_status: "unpaid",
    });

    await assert.rejects(
        paymentService.confirmCheckoutSession({ id: "user-id" }, "cs_pending"),
        (error) => error.statusCode === 409
    );
});

test("paid plan downgrades are scheduled without changing current access", async (t) => {
    const originalFind = paymentRepository.findSubscription;
    const originalUpdate = paymentRepository.updateSubscription;
    const originalRetrieve = stripe.subscriptions.retrieve;
    const originalUpdateRemote = stripe.subscriptions.update;
    const originalCreatePrice = stripe.prices.create;
    const originalReusablePrice = paymentRepository.findReusablePlanPrice;
    const local = {
        userId: "user-id",
        plan: "PRO",
        isActive: true,
        scheduledPlan: null,
        stripeSubscriptionId: "sub_1",
    };
    let saved;
    let remoteUpdate;
    paymentRepository.findSubscription = async () => ({ ...local, ...saved });
    paymentRepository.updateSubscription = async (_userId, payload) => {
        saved = payload;
        return { ...local, ...payload };
    };
    stripe.subscriptions.retrieve = async () => ({
        id: "sub_1",
        metadata: { plan: "PRO" },
        items: { data: [{ id: "si_1", price: { product: "prod_1" } }] },
    });
    stripe.prices.create = async () => ({ id: "price_plus" });
    paymentRepository.findReusablePlanPrice = async () => null;
    stripe.subscriptions.update = async (_id, payload) => {
        remoteUpdate = payload;
        return {};
    };

    t.after(() => {
        paymentRepository.findSubscription = originalFind;
        paymentRepository.updateSubscription = originalUpdate;
        stripe.subscriptions.retrieve = originalRetrieve;
        stripe.subscriptions.update = originalUpdateRemote;
        stripe.prices.create = originalCreatePrice;
        paymentRepository.findReusablePlanPrice = originalReusablePrice;
    });

    const result = await paymentService.changePlan({ id: "user-id" }, "PLUS");
    assert.equal(saved.scheduledPlan, "PLUS");
    assert.equal(saved.cancelAtPeriodEnd, false);
    assert.equal(remoteUpdate.proration_behavior, "none");
    assert.equal(result.subscription.plan, "PRO");
});

test("subscription cancellation and reversal preserve access until period end", async (t) => {
    const originalFind = paymentRepository.findSubscription;
    const originalUpdate = paymentRepository.updateSubscription;
    const originalRetrieve = stripe.subscriptions.retrieve;
    const originalUpdateRemote = stripe.subscriptions.update;
    const originalCreatePrice = stripe.prices.create;
    const originalReusablePrice = paymentRepository.findReusablePlanPrice;
    const local = {
        userId: "user-id",
        plan: "PLUS",
        isActive: true,
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: "sub_1",
        currentPeriodEnd: new Date("2026-09-01"),
    };
    let state = { ...local };
    const remoteRequests = [];
    paymentRepository.findSubscription = async () => state;
    paymentRepository.updateSubscription = async (_userId, payload) => {
        state = { ...state, ...payload };
        return state;
    };
    stripe.subscriptions.update = async (_id, payload) => {
        remoteRequests.push(payload);
        return { current_period_end: 1788220800, items: { data: [] } };
    };
    stripe.subscriptions.retrieve = async () => ({
        id: "sub_1",
        items: { data: [{ id: "si_1", price: { product: "prod_1" } }] },
    });
    stripe.prices.create = async () => ({ id: "price_plus" });
    paymentRepository.findReusablePlanPrice = async () => null;

    t.after(() => {
        paymentRepository.findSubscription = originalFind;
        paymentRepository.updateSubscription = originalUpdate;
        stripe.subscriptions.retrieve = originalRetrieve;
        stripe.subscriptions.update = originalUpdateRemote;
        stripe.prices.create = originalCreatePrice;
        paymentRepository.findReusablePlanPrice = originalReusablePrice;
    });

    const cancelled = await paymentService.cancelSubscription({ id: "user-id" });
    assert.equal(cancelled.plan, "PLUS");
    assert.equal(cancelled.scheduledPlan, "BASIC");
    assert.equal(cancelled.cancelAtPeriodEnd, true);
    assert.equal(remoteRequests[0].cancel_at_period_end, true);

    const resumed = await paymentService.resumeSubscription({ id: "user-id" });
    assert.equal(resumed.plan, "PLUS");
    assert.equal(resumed.scheduledPlan, null);
    assert.equal(resumed.cancelAtPeriodEnd, false);
    assert.equal(remoteRequests[1].cancel_at_period_end, false);
    assert.equal(remoteRequests[1].items, undefined);
    assert.equal(remoteRequests[1].proration_behavior, undefined);
});

test("paid upgrades return Stripe's payment page when customer action is required", async (t) => {
    const originalFind = paymentRepository.findSubscription;
    const originalUpdate = paymentRepository.updateSubscription;
    const originalReusablePrice = paymentRepository.findReusablePlanPrice;
    const originalRetrieveSubscription = stripe.subscriptions.retrieve;
    const originalUpdateRemote = stripe.subscriptions.update;
    const originalRetrievePrice = stripe.prices.retrieve;
    const local = {
        userId: "user-id",
        plan: "PLUS",
        isActive: true,
        stripeSubscriptionId: "sub_1",
    };
    let saved;
    paymentRepository.findSubscription = async () => ({ ...local, ...saved });
    paymentRepository.updateSubscription = async (_userId, payload) => {
        saved = payload;
        return { ...local, ...payload };
    };
    paymentRepository.findReusablePlanPrice = async () => ({ stripePriceId: "price_pro" });
    stripe.prices.retrieve = async () => ({ id: "price_pro", active: true, unit_amount: 2000, currency: "usd", product: "prod_1" });
    stripe.subscriptions.retrieve = async () => ({
        id: "sub_1",
        metadata: { plan: "PLUS" },
        items: { data: [{ id: "si_1", price: { product: "prod_1" } }] },
    });
    stripe.subscriptions.update = async () => ({
        id: "sub_1",
        pending_update: { expires_at: 1 },
        latest_invoice: { hosted_invoice_url: "https://invoice.test/pay" },
    });

    t.after(() => {
        paymentRepository.findSubscription = originalFind;
        paymentRepository.updateSubscription = originalUpdate;
        paymentRepository.findReusablePlanPrice = originalReusablePrice;
        stripe.subscriptions.retrieve = originalRetrieveSubscription;
        stripe.subscriptions.update = originalUpdateRemote;
        stripe.prices.retrieve = originalRetrievePrice;
    });

    const result = await paymentService.changePlan({ id: "user-id" }, "PRO");
    assert.equal(result.paymentUrl, "https://invoice.test/pay");
    assert.equal(result.subscription.plan, "PLUS");
    assert.equal(saved.pendingPlan, "PRO");
});

test("upgrade clears a scheduled cancellation before changing the subscription", async (t) => {
    const originalFind = paymentRepository.findSubscription;
    const originalUpdate = paymentRepository.updateSubscription;
    const originalReusablePrice = paymentRepository.findReusablePlanPrice;
    const originalRetrieveSubscription = stripe.subscriptions.retrieve;
    const originalUpdateRemote = stripe.subscriptions.update;
    const originalCreatePrice = stripe.prices.create;
    const local = {
        userId: "user-id",
        plan: "PLUS",
        isActive: true,
        cancelAtPeriodEnd: true,
        stripeSubscriptionId: "sub_1",
    };
    const remoteRequests = [];
    let saved;

    paymentRepository.findSubscription = async () => ({ ...local, ...saved });
    paymentRepository.updateSubscription = async (_userId, payload) => {
        saved = { ...saved, ...payload };
        return { ...local, ...saved };
    };
    paymentRepository.findReusablePlanPrice = async () => null;
    stripe.prices.create = async () => ({ id: "price_pro" });
    stripe.subscriptions.retrieve = async () => ({
        id: "sub_1",
        metadata: { plan: "PLUS" },
        cancel_at_period_end: true,
        items: { data: [{ id: "si_1", price: { product: "prod_1" } }] },
    });
    stripe.subscriptions.update = async (_id, payload) => {
        remoteRequests.push(payload);
        return payload.items
            ? { pending_update: { expires_at: 1 }, latest_invoice: { hosted_invoice_url: "https://invoice.test/pay" } }
            : { status: "active", items: { data: [{ price: { id: "price_plus" } }] } };
    };

    t.after(() => {
        paymentRepository.findSubscription = originalFind;
        paymentRepository.updateSubscription = originalUpdate;
        paymentRepository.findReusablePlanPrice = originalReusablePrice;
        stripe.subscriptions.retrieve = originalRetrieveSubscription;
        stripe.subscriptions.update = originalUpdateRemote;
        stripe.prices.create = originalCreatePrice;
    });

    const result = await paymentService.changePlan({ id: "user-id" }, "PRO");
    assert.equal(remoteRequests[0].cancel_at_period_end, false);
    assert.equal(remoteRequests[1].items[0].price, "price_pro");
    assert.equal(result.paymentUrl, "https://invoice.test/pay");
});

test("plan price reuse is rejected when Stripe product does not match the active subscription", async (t) => {
    const originalFind = paymentRepository.findSubscription;
    const originalUpdate = paymentRepository.updateSubscription;
    const originalRetrieveSubscription = stripe.subscriptions.retrieve;
    const originalUpdateRemote = stripe.subscriptions.update;
    const originalCreatePrice = stripe.prices.create;
    const originalReusablePrice = paymentRepository.findReusablePlanPrice;
    const originalRetrievePrice = stripe.prices.retrieve;
    const local = {
        userId: "user-id",
        plan: "PLUS",
        isActive: true,
        stripeSubscriptionId: "sub_1",
    };
    let createdPrice;
    let remoteUpdate;
    paymentRepository.findSubscription = async () => local;
    paymentRepository.updateSubscription = async (_userId, payload) => ({ ...local, ...payload });
    paymentRepository.findReusablePlanPrice = async () => ({ stripePriceId: "price_pro" });
    stripe.prices.retrieve = async () => ({ id: "price_pro", active: true, unit_amount: 2000, currency: "usd", product: "prod_other" });
    stripe.prices.create = async (payload) => {
        createdPrice = payload;
        return { id: "price_new" };
    };
    stripe.subscriptions.retrieve = async () => ({
        id: "sub_1",
        metadata: { plan: "PLUS" },
        items: { data: [{ id: "si_1", price: { product: "prod_1" } }] },
    });
    stripe.subscriptions.update = async (_id, payload) => {
        remoteUpdate = payload;
        return { pending_update: { expires_at: 1 }, latest_invoice: { hosted_invoice_url: "https://invoice.test/pay" } };
    };

    t.after(() => {
        paymentRepository.findSubscription = originalFind;
        paymentRepository.updateSubscription = originalUpdate;
        stripe.subscriptions.retrieve = originalRetrieveSubscription;
        stripe.subscriptions.update = originalUpdateRemote;
        stripe.prices.create = originalCreatePrice;
        paymentRepository.findReusablePlanPrice = originalReusablePrice;
        stripe.prices.retrieve = originalRetrievePrice;
    });

    const result = await paymentService.changePlan({ id: "user-id" }, "PRO");
    assert.equal(result.paymentUrl, "https://invoice.test/pay");
    assert.equal(createdPrice.nickname, "Warranty Wallet Pro");
    assert.equal(remoteUpdate.items[0].price, "price_new");
});

test("failed upgrade invoices still mark the subscription as past due", async (t) => {
    const originalFindWebhookEvent = paymentRepository.findWebhookEvent;
    const originalCreateWebhookEvent = paymentRepository.createWebhookEvent;
    const originalMarkWebhookEventProcessed = paymentRepository.markWebhookEventProcessed;
    const originalFindSubscriptionByStripeId = paymentRepository.findSubscriptionByStripeId;
    const originalUpsertInvoicePayment = paymentRepository.upsertInvoicePayment;
    const originalUpdateSubscription = paymentRepository.updateSubscription;

    let subscriptionUpdate;
    paymentRepository.findWebhookEvent = async () => null;
    paymentRepository.createWebhookEvent = async () => null;
    paymentRepository.markWebhookEventProcessed = async () => null;
    paymentRepository.findSubscriptionByStripeId = async () => ({
        id: "subscription-id",
        userId: "user-id",
        plan: "PLUS",
        pendingPlan: "PRO",
        scheduledPlan: null,
        stripeSubscriptionId: "sub_1",
    });
    paymentRepository.upsertInvoicePayment = async () => null;
    paymentRepository.updateSubscription = async (_userId, payload) => {
        subscriptionUpdate = payload;
        return payload;
    };

    t.after(() => {
        paymentRepository.findWebhookEvent = originalFindWebhookEvent;
        paymentRepository.createWebhookEvent = originalCreateWebhookEvent;
        paymentRepository.markWebhookEventProcessed = originalMarkWebhookEventProcessed;
        paymentRepository.findSubscriptionByStripeId = originalFindSubscriptionByStripeId;
        paymentRepository.upsertInvoicePayment = originalUpsertInvoicePayment;
        paymentRepository.updateSubscription = originalUpdateSubscription;
    });

    await paymentService.processStripeEvent({
        id: "evt_failed_upgrade",
        type: "invoice.payment_failed",
        data: {
            object: {
                subscription: "sub_1",
                payment_intent: "pi_1",
                amount_due: 500,
                currency: "usd",
            },
        },
    });

    assert.equal(subscriptionUpdate.status, "PAST_DUE");
    assert.equal(subscriptionUpdate.isActive, true);
});
