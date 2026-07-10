const { z } = require("zod");

const createProductSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2).max(100),

        brand: z.string().trim().min(2).max(100),

        model: z.string().trim().optional(),

        serialNumber: z.string().trim().optional(),

        categoryId: z.string().cuid(),

        purchasePrice: z.number().positive(),

        purchaseDate: z.coerce.date(),

        warrantyDuration: z.number().int().positive(),

        warrantyType: z.enum([
            "MANUFACTURER",
            "EXTENDED",
        ]),

        sellerName: z.string().optional(),

        sellerPhone: z.string().optional(),

        sellerAddress: z.string().optional(),

        productImage: z.string().url().optional(),

        notes: z.string().optional(),
    }),
});

const updateProductSchema = z.object({
    body: createProductSchema.shape.body.partial(),
});

module.exports = {
    createProductSchema,
    updateProductSchema,
};