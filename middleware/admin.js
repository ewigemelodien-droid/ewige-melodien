const jwt = require('jsonwebtoken');
const db = require('../models/db');

module.exports = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'Kein Token, Zugriff verweigert' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user is admin
    db.get('SELECT is_admin FROM users WHERE id = ?', [decoded.id], (err, user) => {
      if (err || !user || !user.is_admin) {
        return res.status(403).json({ msg: 'Admin Zugriff erforderlich' });
      }
      req.user = decoded;
      req.user.is_admin = true;
      next();
    });
  } catch (err) {
    res.status(401).json({ msg: 'Token ungültig' });
  }
};
