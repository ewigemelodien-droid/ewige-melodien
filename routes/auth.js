const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'E-Mail und Passwort erforderlich' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ msg: 'Datenbankfehler' });
    if (user) return res.status(400).json({ msg: 'E-Mail bereits registriert' });

    const hashed = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
      [name || '', email, hashed], function(err) {
        if (err) return res.status(500).json({ msg: 'Serverfehler' });

        const token = jwt.sign({ id: this.lastID }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ 
          token, 
          user: { id: this.lastID, name: name || '', email } 
        });
      });
  });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'E-Mail und Passwort erforderlich' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (!user) return res.status(400).json({ msg: 'Ungültige Anmeldedaten' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Ungültige Anmeldedaten' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email } 
    });
  });
});

// Get current user
router.get('/me', require('../middleware/auth'), (req, res) => {
  db.get('SELECT id, name, email FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (!user) return res.status(404).json({ msg: 'Benutzer nicht gefunden' });
    res.json(user);
  });
});

module.exports = router;
