
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

const user_db = {
    username: process.env.POSTGRES_USER || 'yuu',
    password: process.env.POSTGRES_PASSWORD || 'test',
    database: process.env.POSTGRES_DB || 'app_database',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: 5432
}

const GoogleClientID = process.env.CLIENT_ID || 'your-google-client-id';
const GoogleClientSecret = process.env.CLIENT_SECRET || 'your-google-client-secret';

module.exports = { user_db, JWT_SECRET, GoogleClientID, GoogleClientSecret };