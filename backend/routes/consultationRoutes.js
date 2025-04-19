const express = require('express');
const router = express.Router();
const db = require('../config/db');  // Import the DB connection

router.post('/', (req, res) => {
  const { service, name, address, date, time, message } = req.body;

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

module.exports = router;
