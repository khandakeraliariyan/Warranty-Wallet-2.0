const { z } = require("zod");

const checkoutSchema = z.object({
    body: z.object({})
});

module.exports = {
    checkoutSchema,
};