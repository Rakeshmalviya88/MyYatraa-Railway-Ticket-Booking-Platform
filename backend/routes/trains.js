const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/authMiddleware');

// get all trains or search by source/destination/date (simple)
router.get('/', async (req, res) => {
  try {
    const { source, destination } = req.query;
    let sql = `SELECT t.*, GROUP_CONCAT(CONCAT(c.class_type, ':', c.fare) SEPARATOR ';') as classes FROM Train t
               LEFT JOIN Class c ON t.train_no = c.train_no`;
    const params = [];
    if (source || destination) {
      const conds = [];
      if (source) { conds.push('t.source = ?'); params.push(source); }
      if (destination) { conds.push('t.destination = ?'); params.push(destination); }
      sql += ` WHERE ${conds.join(' AND ')}`;
    }
    sql += ` GROUP BY t.train_no`;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// get a train by id
router.get('/:train_no', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM Train WHERE train_no = ?`, [req.params.train_no]);
    if (!rows.length) return res.status(404).json({ message: 'Train not found' });
    const train = rows[0];
    const [classes] = await pool.query(`SELECT * FROM Class WHERE train_no = ?`, [req.params.train_no]);
    res.json({ ...train, classes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
