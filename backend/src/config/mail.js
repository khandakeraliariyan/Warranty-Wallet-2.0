const nodemailer = require("nodemailer");
const env = require("./env");

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,

    port: env.SMTP_PORT,

    secure: false,

    auth: {
        user: env.SMTP_EMAIL,

        pass: env.SMTP_PASSWORD,
    },
});

module.exports = transporter;