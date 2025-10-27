const express = require('express');
const router = express.Router();
const pool = require('../db');
const { hashPassword, comparePassword, signToken } = require('../utils/helpers.js');

// register
router.post('/register', async (req, res) => {
  try {
    const { username, password, f_name, l_name, mobile_no } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'username/password required' });

    const hashed = await hashPassword(password);
    const [result] = await pool.query(
      `INSERT INTO User (username,password,f_name,l_name,mobile_no) VALUES (?, ?, ?, ?, ?)`,
      [username, hashed, f_name || null, l_name || null, mobile_no || null]
    );
    res.json({ message: 'Registered', user_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Username or mobile already exists' });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query(`SELECT * FROM User WHERE username = ?`, [username]);
    if (!rows.length) return res.status(400).json({ message: 'Invalid credentials' });
    const user = rows[0];
    const ok = await comparePassword(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
    const token = signToken({ user_id: user.user_id, username: user.username });
    res.json({ token, user: { user_id: user.user_id, username: user.username, f_name: user.f_name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
