
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

const user_db = {
    username: process.env.USERNAME || 'yuu',
    password: process.env.PASSWORD || 'test',
    database: process.env.DATABASE || 'app_database',
    host: process.env.HOST || 'localhost',
    port: process.env.PORT || 5432
}

module.exports = { user_db, JWT_SECRET};