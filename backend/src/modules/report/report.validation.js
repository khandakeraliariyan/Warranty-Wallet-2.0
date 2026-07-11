const { z } = require("zod");

const exportReportSchema = z.object({

    query: z.object({

        format: z.enum([
            "EXCEL",
            "PDF",
        ]),

        status: z.enum([
            "ACTIVE",
            "EXPIRING_SOON",
            "EXPIRED",
        ]).optional(),

        from: z.string().optional(),

        to: z.string().optional(),

    }),

});

module.exports = {

    exportReportSchema,

};