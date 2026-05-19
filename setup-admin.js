// Run this once to make your account admin
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

// Make a user admin by email
function makeAdmin(email) {
  db.run('UPDATE users SET is_admin = 1 WHERE email = ?', [email], function(err) {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log(`✅ User ${email} is now admin!`);
      console.log(`   Changes: ${this.changes}`);
    }
    db.close();
  });
}

// Usage: node setup-admin.js your-email@example.com
const email = process.argv[2];
if (!email) {
  console.log('Usage: node setup-admin.js your-email@example.com');
  process.exit(1);
}

makeAdmin(email);
