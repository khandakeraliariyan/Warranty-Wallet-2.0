const ExcelJS = require("exceljs");

const generateExcel = async ({
    sheetName,
    columns,
    rows,
}) => {

    const workbook =
        new ExcelJS.Workbook();

    const worksheet =
        workbook.addWorksheet(
            sheetName
        );

    worksheet.columns = columns;

    worksheet.addRows(rows);

    worksheet.getRow(1).font = {

        bold: true,

    };

    return workbook;

};

module.exports = {

    generateExcel,

};