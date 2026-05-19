const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Get all music
router.get('/', (req, res) => {
  db.all('SELECT * FROM music ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ msg: 'Datenbankfehler' });
    res.json(rows);
  });
});

// Get free music
router.get('/free', (req, res) => {
  db.all('SELECT * FROM music WHERE is_free = 1', [], (err, rows) => {
    if (err) return res.status(500).json({ msg: 'Datenbankfehler' });
    res.json(rows);
  });
});

// Get single track
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM music WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ msg: 'Datenbankfehler' });
    if (!row) return res.status(404).json({ msg: 'Nicht gefunden' });
    res.json(row);
  });
});

module.exports = router;
