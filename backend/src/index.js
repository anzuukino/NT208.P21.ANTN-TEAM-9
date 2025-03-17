const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const path = require('path');
const { Client } = require('pg');
const { client, healthcheck}  = require('./init');


let port = process.env.PORT || 9233;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../public')));


app.get('/api/healthcheck', async (req, res) => {
    var check = await healthcheck();
    if(check){
        return res.json({ message: 'Server is up and running' });
    }
    else{
        return res.status(500).json({ message: 'Server is down' });
    }
});




app.listen(
    port,
    () => console.log(`Backend running on localhost:${port}`),
);