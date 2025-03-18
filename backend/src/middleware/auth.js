const jwt = require('jsonwebtoken');
const {JWT_SECRET } = require('../config');
const { getUserByEmail } = require('../db_helpers')

const auth = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/login');
    }
    try {
        jwt.verify(token, JWT_SECRET, async (err,user) => {
            const data = await getUserByEmail(user.email);
            if (err || !data) {
                return res.redirect('/login');
            }
            req.user = data;
            next();
        });
    }
    catch (err) {
        return res.redirect('/login');
    }
};

module.exports = auth;
