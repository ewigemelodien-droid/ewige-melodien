const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../models/db');

// Get shop items (paid music)
router.get('/', (req, res) => {
  db.all('SELECT * FROM music WHERE is_free = 0', [], (err, rows) => {
    if (err) return res.status(500).json({ msg: 'Datenbankfehler' });
    res.json(rows);
  });
});

// Check if user owns track
router.get('/check/:id', auth, (req, res) => {
  db.get('SELECT * FROM purchases WHERE user_id = ? AND music_id = ?', 
    [req.user.id, req.params.id], (err, row) => {
      if (err) return res.status(500).json({ msg: 'Datenbankfehler' });
      res.json({ owned: !!row });
    });
});

module.exports = router;
