const jwt = require('jsonwebtoken');
const {JWT_SECRET } = require('../config');
const { getUserByEmail } = require('../db_helpers')

const auth = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({error: "No token provided"});
    }
    try {
        jwt.verify(token, JWT_SECRET, async (err,user) => {
            if (err){
                return res.status(401).json({error: "Invalid token"});
            }
            const data = await getUserByEmail(user.email);
            if (!data) {
                return res.status(401).json({error: "Invalid token"});
            }
            req.user = data;
            next();
        });
    }
    catch (err) {
        return res.status(500).json({error: "Internal server error"});
    }
};

module.exports = auth;
