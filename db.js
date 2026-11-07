const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'onlinetravelpackagebooking'
});

db.connect((err) => {
    if (err) {
        console.log('Database connection failed:', err);
        return;
    }

    console.log('MySQL Connected Successfully');
});

module.exports = db;