const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/admin');
const db = require('../models/db');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'cover') {
      cb(null, 'public/music/covers/');
    } else if (file.fieldname === 'music') {
      cb(null, 'public/music/');
    } else {
      cb(null, 'public/uploads/');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Ensure upload directories exist
const fs = require('fs');
['public/music/covers', 'public/music', 'public/uploads'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ========== STATS ==========
router.get('/stats', adminAuth, (req, res) => {
  const stats = {};

  db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
    stats.users = row.count;
    db.get('SELECT COUNT(*) as count FROM music', [], (err, row) => {
      stats.music = row.count;
      db.get('SELECT COUNT(*) as count FROM playlists', [], (err, row) => {
        stats.playlists = row.count;
        db.get('SELECT COUNT(*) as count FROM purchases', [], (err, row) => {
          stats.purchases = row.count;
          db.get('SELECT SUM(amount) as total FROM purchases', [], (err, row) => {
            stats.revenue = row.total || 0;
            res.json(stats);
          });
        });
      });
    });
  });
});

// ========== MUSIC CRUD ==========

// Get all music (admin view)
router.get('/music', adminAuth, (req, res) => {
  db.all('SELECT * FROM music ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ msg: 'Datenbankfehler' });
    res.json(rows);
  });
});

// Add new music
router.post('/music', adminAuth, upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'music', maxCount: 1 }
]), (req, res) => {
  const { title, artist, album, price, is_free, duration, category } = req.body;

  const coverPath = req.files.cover ? '/music/covers/' + req.files.cover[0].filename : '/images/default-cover.jpg';
  const musicPath = req.files.music ? '/music/' + req.files.music[0].filename : '';

  db.run(
    `INSERT INTO music (title, artist, album, cover, file_path, price, is_free, duration, category) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, artist, album || '', coverPath, musicPath, price || 0, is_free === '1' ? 1 : 0, duration || '0:00', category || 'worship'],
    function(err) {
      if (err) return res.status(500).json({ msg: 'Fehler beim Speichern', error: err.message });
      res.json({ id: this.lastID, msg: 'Musik erfolgreich hinzugefügt' });
    }
  );
});

// Update music
router.put('/music/:id', adminAuth, upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'music', maxCount: 1 }
]), (req, res) => {
  const { title, artist, album, price, is_free, duration, category } = req.body;
  const musicId = req.params.id;

  let updates = [];
  let params = [];

  if (title) { updates.push('title = ?'); params.push(title); }
  if (artist) { updates.push('artist = ?'); params.push(artist); }
  if (album !== undefined) { updates.push('album = ?'); params.push(album); }
  if (price !== undefined) { updates.push('price = ?'); params.push(price); }
  if (is_free !== undefined) { updates.push('is_free = ?'); params.push(is_free === '1' ? 1 : 0); }
  if (duration) { updates.push('duration = ?'); params.push(duration); }
  if (category) { updates.push('category = ?'); params.push(category); }

  if (req.files.cover) {
    updates.push('cover = ?');
    params.push('/music/covers/' + req.files.cover[0].filename);
  }
  if (req.files.music) {
    updates.push('file_path = ?');
    params.push('/music/' + req.files.music[0].filename);
  }

  if (updates.length === 0) return res.status(400).json({ msg: 'Keine Änderungen' });

  params.push(musicId);

  db.run(
    `UPDATE music SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) return res.status(500).json({ msg: 'Fehler beim Aktualisieren' });
      res.json({ msg: 'Musik aktualisiert' });
    }
  );
});

// Delete music
router.delete('/music/:id', adminAuth, (req, res) => {
  db.run('DELETE FROM music WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ msg: 'Fehler beim Löschen' });
    res.json({ msg: 'Musik gelöscht' });
  });
});

// ========== USERS ==========
router.get('/users', adminAuth, (req, res) => {
  db.all('SELECT id, name, email, is_admin, created_at FROM users ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ msg: 'Datenbankfehler' });
    res.json(rows);
  });
});

// Make user admin
router.put('/users/:id/admin', adminAuth, (req, res) => {
  const { is_admin } = req.body;
  db.run('UPDATE users SET is_admin = ? WHERE id = ?', [is_admin ? 1 : 0, req.params.id], function(err) {
    if (err) return res.status(500).json({ msg: 'Fehler' });
    res.json({ msg: 'Benutzer aktualisiert' });
  });
});

// Delete user
router.delete('/users/:id', adminAuth, (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ msg: 'Fehler' });
    res.json({ msg: 'Benutzer gelöscht' });
  });
});

// ========== PURCHASES ==========
router.get('/purchases', adminAuth, (req, res) => {
  db.all(`SELECT p.*, m.title as music_title, u.email as user_email 
          FROM purchases p 
          JOIN music m ON p.music_id = m.id 
          JOIN users u ON p.user_id = u.id 
          ORDER BY p.created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ msg: 'Datenbankfehler' });
    res.json(rows);
  });
});

module.exports = router;
