const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/authMiddleware');

router.get('/pnr/:pnr', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM Payment WHERE pnr_no = ?`, [req.params.pnr]);
    if (!rows.length) return res.status(404).json({ message: 'Payment not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
