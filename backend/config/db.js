const mysql = require('mysql2');
require('dotenv').config();

// Create a connection to the MySQL database using environment variables
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Connect and handle any connection errors
connection.connect(err => {
  if (err) {
    console.error('❌ Error connecting to MySQL:', err.message);
    process.exit(1); // Exit the app if DB connection fails
  } else {
    console.log('✅ Connected to MySQL database!');
  }
});

module.exports = connection;
