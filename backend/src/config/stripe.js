const Stripe = require("stripe");

const env = require("./env");

if (!env.STRIPE_SECRET_KEY) {
  throw new Error(
    "Missing STRIPE_SECRET_KEY in environment. Set STRIPE_SECRET_KEY in .env or your system environment."
  );
}

module.exports = new Stripe(env.STRIPE_SECRET_KEY);
