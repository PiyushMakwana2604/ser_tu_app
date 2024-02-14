require('dotenv').config()
const mysql = require('mysql2');

 const pool =  mysql.createPool({
    host:process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
});
    
    

const dbConn = pool.promise();
module.exports = dbConn;