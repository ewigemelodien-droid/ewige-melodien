const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../models/db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');
const { v4: uuidv4 } = require('uuid');

// PayPal Environment Setup
function getPayPalClient() {
  const Environment = process.env.NODE_ENV === 'production' 
    ? paypal.core.LiveEnvironment 
    : paypal.core.SandboxEnvironment;
  return new paypal.core.PayPalHttpClient(new Environment(
    process.env.PAYPAL_CLIENT_ID, 
    process.env.PAYPAL_CLIENT_SECRET
  ));
}

// Stripe Payment Intent
router.post('/stripe', auth, async (req, res) => {
  const { music_id } = req.body;
  if (!music_id) return res.status(400).json({ msg: 'Music ID erforderlich' });

  db.get('SELECT * FROM music WHERE id = ?', [music_id], async (err, track) => {
    if (err) return res.status(500).json({ msg: 'Datenbankfehler' });
    if (!track) return res.status(404).json({ msg: 'Track nicht gefunden' });

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(track.price * 100),
        currency: 'eur',
        metadata: { music_id: music_id.toString(), user_id: req.user.id.toString() }
      });

      res.json({ clientSecret: paymentIntent.client_secret, price: track.price });
    } catch (err) {
      console.error('Stripe Error:', err);
      res.status(500).json({ msg: 'Stripe Fehler: ' + err.message });
    }
  });
});

// PayPal Create Order
router.post('/paypal/create', auth, async (req, res) => {
  const { music_id } = req.body;
  if (!music_id) return res.status(400).json({ msg: 'Music ID erforderlich' });

  db.get('SELECT * FROM music WHERE id = ?', [music_id], async (err, track) => {
    if (err) return res.status(500).json({ msg: 'Datenbankfehler' });
    if (!track) return res.status(404).json({ msg: 'Track nicht gefunden' });

    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'EUR',
          value: track.price.toString()
        },
        custom_id: `${req.user.id}_${music_id}`
      }]
    });

    try {
      const paypalClient = getPayPalClient();
      const order = await paypalClient.execute(request);
      res.json({ orderId: order.result.id });
    } catch (err) {
      console.error('PayPal Error:', err);
      res.status(500).json({ msg: 'PayPal Fehler: ' + err.message });
    }
  });
});

// PayPal Capture Order
router.post('/paypal/capture', auth, async (req, res) => {
  const { orderId, music_id } = req.body;

  try {
    const paypalClient = getPayPalClient();
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    const capture = await paypalClient.execute(request);

    const track = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM music WHERE id = ?', [music_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    db.run(`INSERT INTO purchases (user_id, music_id, amount, payment_method, transaction_id) 
            VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, music_id, track.price, 'paypal', capture.result.id], function(err) {
        if (err) return res.status(500).json({ msg: 'Speicherfehler' });

        const downloadToken = uuidv4();
        res.json({ 
          success: true, 
          downloadUrl: `/api/payment/download/${music_id}?token=${downloadToken}`,
          message: 'Kauf erfolgreich! Vielen Dank für Ihre Unterstützung.'
        });
      });
  } catch (err) {
    console.error('PayPal Capture Error:', err);
    res.status(500).json({ msg: 'PayPal Capture Fehler' });
  }
});

// Confirm Purchase (Stripe)
router.post('/confirm', auth, (req, res) => {
  const { music_id, payment_method, transaction_id, amount } = req.body;

  db.run(`INSERT INTO purchases (user_id, music_id, amount, payment_method, transaction_id) 
          VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, music_id, amount, payment_method, transaction_id], function(err) {
      if (err) return res.status(500).json({ msg: 'Speicherfehler' });

      const downloadToken = uuidv4();
      res.json({ 
        success: true, 
        downloadUrl: `/api/payment/download/${music_id}?token=${downloadToken}`,
        message: 'Kauf erfolgreich! Vielen Dank für Ihre Unterstützung.'
      });
    });
});

// Download endpoint (simplified - in production add token validation)
router.get('/download/:id', auth, (req, res) => {
  const music_id = req.params.id;

  db.get('SELECT * FROM purchases WHERE user_id = ? AND music_id = ?', 
    [req.user.id, music_id], (err, purchase) => {
      if (err || !purchase) {
        return res.status(403).json({ msg: 'Kein Kauf gefunden' });
      }

      db.get('SELECT * FROM music WHERE id = ?', [music_id], (err, track) => {
        if (!track) return res.status(404).json({ msg: 'Track nicht gefunden' });

        const filePath = require('path').join(__dirname, '..', 'public', track.file_path);
        res.download(filePath, `${track.title}.mp3`);
      });
    });
});

module.exports = router;
