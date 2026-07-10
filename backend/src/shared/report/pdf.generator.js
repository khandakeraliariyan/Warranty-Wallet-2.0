const PDFDocument = require("pdfkit");

const generatePDF = ({
    title,
    rows,
}) => {

    const doc =
        new PDFDocument();

    doc.fontSize(20);

    doc.text(title);

    doc.moveDown();

    rows.forEach((row) => {

        doc.fontSize(12);

        doc.text(
            JSON.stringify(row)
        );

        doc.moveDown();

    });

    return doc;

};

module.exports = {

    generatePDF,

};