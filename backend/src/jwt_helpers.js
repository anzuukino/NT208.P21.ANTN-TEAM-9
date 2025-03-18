const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./config");

function signJWT(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

module.exports = { signJWT };
