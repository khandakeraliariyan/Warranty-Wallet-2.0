const { z } = require("zod");

const userIdSchema = z.object({
    params: z.object({
        id: z.string().cuid(),
    }),
});

const listUsersSchema = z.object({
    query: z.object({
        page: z.coerce.number().min(1).optional(),

        limit: z.coerce.number().min(1).max(100).optional(),

        search: z.string().optional(),

        role: z.enum([
            "USER",
            "ADMIN",
        ]).optional(),

        plan: z.enum([
            "FREE",
            "PREMIUM",
        ]).optional(),

        status: z.enum([
            "ACTIVE",
            "BLOCKED",
            "DELETED",
        ]).optional(),

        sortBy: z.enum([
            "createdAt",
            "name",
            "email",
        ]).optional(),

        sortOrder: z.enum([
            "asc",
            "desc",
        ]).optional(),
    }),
});

module.exports = {
    userIdSchema,
    listUsersSchema,
};