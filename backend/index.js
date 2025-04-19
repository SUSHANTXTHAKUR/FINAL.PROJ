const express = require('express');
const mysql = require('mysql2'); // Replacing mysql with mysql2 for better support
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors()); // Allow all origins (you can restrict in production)
app.use(bodyParser.json()); // Parse JSON body

// ✅ MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'your_database_name',
});

// Check database connection
db.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to MySQL:', err.message);
    process.exit(1); // Exit the app if DB connection fails
  } else {
    console.log('✅ Connected to MySQL Database');
  }
});

// ✅ SIGNUP Route
app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  db.query(sql, [username, email, password], (err, result) => {
    if (err) {
      console.error('❌ Error inserting user:', err.message);
      return res.status(500).json({ message: 'Error saving user' });
    }
    res.status(200).json({ message: 'User registered successfully' });
  });
});

// ✅ LOGIN Route
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(sql, [email, password], (err, result) => {
    if (err) {
      console.error('❌ Login query error:', err.message);
      return res.status(500).json({ message: 'Database error' });
    }

    if (result.length > 0) {
      res.status(200).json({ message: 'Login successful' });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  });
});

// ✅ CONSULTATION Route
app.post('/consultation', (req, res) => {
  console.log("🛬 Consultation route hit with data:", req.body); // Debug log to check incoming data

  const { service, name, address, date, time, message } = req.body;

  // Validation check for all fields
  if (!service || !name || !address || !date || !time || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const sql = `
    INSERT INTO consultation (service, name, address, date, time, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [service, name, address, date, time, message], (err, result) => {
    if (err) {
      console.error('❌ Error inserting consultation:', err.message);
      return res.status(500).json({ message: 'Error saving consultation' });
    }
    res.status(200).json({ message: 'Consultation request submitted successfully' });
  });
});

// ✅ Handle Unknown Routes
app.use((req, res, next) => {
  console.warn(`⚠️  Unknown route accessed: ${req.method} ${req.url}`);
  res.status(404).send('Route not found');
});

// ✅ SERVER START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
