const { z } = require("zod");

const activityIdSchema = z.object({
    params: z.object({
        id: z.string().cuid(),
    }),
});

module.exports = {
    activityIdSchema,
};