const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const { OAuth2Client } = require('google-auth-library'); // ✅ Added
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Session setup
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// ✅ Passport init
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ✅ Google OAuth redirect-based login (still here)
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  console.log('✅ Google profile:', profile);
  return done(null, profile);
}));

// ✅ MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'finalproj',
});

db.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to MySQL:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connected to MySQL Database');
  }
});

// ✅ Signup
app.post('/api/signup', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  db.query(sql, [username, email, password], (err) => {
    if (err) {
      console.error('❌ Error inserting user:', err.message);
      return res.status(500).json({ message: 'Error saving user' });
    }
    res.status(200).json({ message: 'User registered successfully' });
  });
});

// ✅ Login
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

// ✅ Consultation
app.post('/consultation', (req, res) => {
  const { service, name, address, date, time, message } = req.body;
  if (!service || !name || !address || !date || !time || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const sql = `
    INSERT INTO consultation (service, name, address, date, time, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [service, name, address, date, time, message], (err) => {
    if (err) {
      console.error('❌ Error inserting consultation:', err.message);
      return res.status(500).json({ message: 'Error saving consultation' });
    }
    res.status(200).json({ message: 'Consultation request submitted successfully' });
  });
});

// ✅ Google Sign-In (One Tap or button flow) — Token-based
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post('/google-login', async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    const checkQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkQuery, [email], (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });

      if (results.length > 0) {
        res.status(200).json({ message: 'User logged in via Google', user: results[0] });
      } else {
        const insertQuery = 'INSERT INTO users (username, email, google_id) VALUES (?, ?, ?)';
        db.query(insertQuery, [name, email, googleId], (insertErr, result) => {
          if (insertErr) return res.status(500).json({ message: 'Insert error', error: insertErr });
          res.status(200).json({ message: 'User created via Google', user: { name, email } });
        });
      }
    });
  } catch (error) {
    console.error('❌ Google login failed:', error);
    res.status(401).json({ message: 'Invalid token', error });
  }
});

// ✅ Google OAuth redirect-based flow
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('http://127.0.0.1:5500/Frontend/index.html');
  }
);

// ✅ Dummy route
//app.get('/profile', (req, res) => {
  //if (!req.user) return res.status(401).send('Not logged in');
  //res.send(`Hello, ${req.user.displayName}`);
//});

// ✅ 404 handler
app.use((req, res) => {
  console.warn(`⚠️  Unknown route accessed: ${req.method} ${req.url}`);
  res.status(404).send('Route not found');
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
