const auth = require("./auth.middleware");
const role = require("./role.middleware");

module.exports = [
    auth,
    role("ADMIN"),
];