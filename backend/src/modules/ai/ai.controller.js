const asyncHandler = require("../../utils/asyncHandler");

const ApiResponse = require("../../utils/ApiResponse");

const service = require("./ai.service");

const extractInvoice = asyncHandler(async (req, res) => {

    const data = await service.extractInvoice(
        req.file
    );

    res.status(200).json(
        new ApiResponse(
            200,
            "Invoice extracted successfully.",
            data
        )
    );
});

module.exports = {
    extractInvoice,
};