const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/authMiddleware');

// Get database statistics summary
router.get('/summary', async (req, res) => {
  try {
    const [totalUsers] = await pool.query('SELECT COUNT(*) as count FROM User');
    const [totalTrains] = await pool.query('SELECT COUNT(*) as count FROM Train');
    const [totalBookings] = await pool.query('SELECT COUNT(*) as count FROM Ticket');
    const [totalRevenue] = await pool.query('SELECT SUM(amount) as total FROM Payment');
    const [todayBookings] = await pool.query('SELECT COUNT(*) as count FROM Ticket WHERE DATE(booking_time) = CURDATE()');
    
    res.json({
      totalUsers: totalUsers[0].count,
      totalTrains: totalTrains[0].count,
      totalBookings: totalBookings[0].count,
      totalRevenue: totalRevenue[0].total || 0,
      todayBookings: todayBookings[0].count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get popular trains using nested queries
router.get('/popular-trains', async (req, res) => {
  try {
    const [popularTrains] = await pool.query(`
      SELECT t.train_name, t.source, t.destination, 
             (SELECT COUNT(*) FROM Ticket WHERE train_no = t.train_no) as total_bookings
      FROM Train t
      WHERE (SELECT COUNT(*) FROM Ticket WHERE train_no = t.train_no) > 
            (SELECT AVG(booking_count) FROM 
             (SELECT COUNT(*) as booking_count FROM Ticket GROUP BY train_no) as avg_bookings)
      ORDER BY total_bookings DESC
      LIMIT 10
    `);
    
    res.json(popularTrains);
  } catch (err) {
    console.error('Popular trains error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;