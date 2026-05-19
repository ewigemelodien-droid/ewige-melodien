const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '..', 'database.sqlite'));

db.serialize(() => {
  // Users Table (with is_admin)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Music Table
  db.run(`CREATE TABLE IF NOT EXISTS music (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    cover TEXT,
    file_path TEXT NOT NULL,
    price REAL DEFAULT 0,
    is_free INTEGER DEFAULT 1,
    duration TEXT,
    category TEXT DEFAULT 'worship'
  )`);

  // Playlists Table
  db.run(`CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Playlist Items Table
  db.run(`CREATE TABLE IF NOT EXISTS playlist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id INTEGER NOT NULL,
    music_id INTEGER NOT NULL
  )`);

  // Purchases Table
  db.run(`CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    music_id INTEGER NOT NULL,
    amount REAL,
    payment_method TEXT,
    transaction_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert Sample Data if empty
  db.get("SELECT COUNT(*) as count FROM music", (err, row) => {
    if (err) return console.error(err);
    if (row.count === 0) {
      const sampleMusic = [
        ['Amazing Grace', 'John Newton', 'Classic Hymns', '/music/covers/amazing-grace.jpg', '/music/amazing-grace.mp3', 0, 1, '3:45', 'hymn'],
        ['How Great Thou Art', 'Stuart Hine', 'Classic Hymns', '/music/covers/how-great.jpg', '/music/how-great.mp3', 1.99, 0, '4:12', 'hymn'],
        ['Oceans', 'Hillsong UNITED', 'Zion', '/music/covers/oceans.jpg', '/music/oceans.mp3', 0, 1, '8:45', 'worship'],
        ['What a Beautiful Name', 'Hillsong Worship', 'Let There Be Light', '/music/covers/beautiful-name.jpg', '/music/beautiful-name.mp3', 1.49, 0, '5:30', 'worship'],
        ['10,000 Reasons', 'Matt Redman', 'Unbroken Praise', '/music/covers/10000-reasons.jpg', '/music/10000-reasons.mp3', 0, 1, '4:22', 'worship'],
        ['Great Are You Lord', 'All Sons & Daughters', 'Live', '/music/covers/great-lord.jpg', '/music/great-lord.mp3', 1.29, 0, '5:15', 'worship'],
        ['Reckless Love', 'Cory Asbury', 'Reckless Love', '/music/covers/reckless-love.jpg', '/music/reckless-love.mp3', 0, 1, '5:00', 'worship'],
        ['Way Maker', 'Sinach', 'Way Maker', '/music/covers/way-maker.jpg', '/music/way-maker.mp3', 1.99, 0, '8:00', 'worship']
      ];

      const stmt = db.prepare(`INSERT INTO music (title, artist, album, cover, file_path, price, is_free, duration, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      sampleMusic.forEach(m => stmt.run(m));
      stmt.finalize();
      console.log('✅ Sample music inserted');
    }
  });
});

module.exports = db;
