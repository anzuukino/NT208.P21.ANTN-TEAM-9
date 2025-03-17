const { Client } = require('pg');


const client = new Client({
    user: 'yuu',
    host: 'localhost',
    database: 'app_database',
    password: 'test',
    port: 5432,
});

client.connect().then(() => console.log('Connected to database'))
.catch(e => console.error('Connection error', e.stack));

async function healthcheck(){
    try {
        await client.query('SELECT NOW()');
        return true;
    }
    catch(e){
        return false;
    }
}

module.exports = {
    client,
    healthcheck
}