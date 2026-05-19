const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../models/db');

// Get user playlists
router.get('/', auth, (req, res) => {
  db.all('SELECT * FROM playlists WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ msg: 'Datenbankfehler' });
    res.json(rows);
  });
});

// Create playlist
router.post('/', auth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ msg: 'Name erforderlich' });

  db.run('INSERT INTO playlists (user_id, name) VALUES (?, ?)', 
    [req.user.id, name], function(err) {
      if (err) return res.status(500).json({ msg: 'Fehler beim Erstellen' });
      res.json({ id: this.lastID, name, user_id: req.user.id });
    });
});

// Add to playlist
router.post('/:id/add', auth, (req, res) => {
  const { music_id } = req.body;
  if (!music_id) return res.status(400).json({ msg: 'Music ID erforderlich' });

  db.run('INSERT INTO playlist_items (playlist_id, music_id) VALUES (?, ?)',
    [req.params.id, music_id], function(err) {
      if (err) return res.status(500).json({ msg: 'Fehler beim Hinzufügen' });
      res.json({ msg: 'Zur Playlist hinzugefügt' });
    });
});

// Get playlist items
router.get('/:id/items', auth, (req, res) => {
  db.all(`SELECT m.* FROM music m 
          JOIN playlist_items pi ON m.id = pi.music_id 
          WHERE pi.playlist_id = ?`, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ msg: 'Datenbankfehler' });
    res.json(rows);
  });
});

// Delete playlist
router.delete('/:id', auth, (req, res) => {
  db.run('DELETE FROM playlists WHERE id = ? AND user_id = ?', 
    [req.params.id, req.user.id], function(err) {
      if (err) return res.status(500).json({ msg: 'Fehler' });
      db.run('DELETE FROM playlist_items WHERE playlist_id = ?', [req.params.id]);
      res.json({ msg: 'Playlist gelöscht' });
    });
});

module.exports = router;
