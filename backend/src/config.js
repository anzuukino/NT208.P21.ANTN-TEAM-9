
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

const user_db = {
    username: process.env.POSTGRES_USER || 'yuu',
    password: process.env.POSTGRES_PASSWORD || 'test',
    database: process.env.POSTGRES_DB || 'app_database',
    host: process.env.POSTGRES_HOST || 'postgresql',
    port: 5432
}

module.exports = { user_db, JWT_SECRET};