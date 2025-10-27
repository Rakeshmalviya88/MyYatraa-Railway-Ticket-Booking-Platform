const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/authMiddleware');

// Book ticket (requires auth)
router.post('/book', auth, async (req, res) => {
  /*
    body: {
      train_no, passenger_name, class_type, seat_no (optional), source, destination, date_time, amount, card_no (for payment), bank
    }
  */
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { train_no, passenger_name, class_type, seat_no, source, destination, date_time, amount, bank, card_no } = req.body;
    const user_id = req.user.user_id;

    // Check seat availability
    const [trows] = await conn.query(`SELECT seat_available FROM Train WHERE train_no = ? FOR UPDATE`, [train_no]);
    if (!trows.length) throw { status: 400, message: 'Train not found' };
    const seat_available = trows[0].seat_available;
    if (seat_available <= 0) throw { status: 400, message: 'No seats available' };

    console.log(`BEFORE BOOKING - Train ${train_no}: available=${seat_available}`);

    // Insert ticket
    const [tresult] = await conn.query(
      `INSERT INTO Ticket (train_no, user_id, passenger_name, class_type, seat_no, source, destination, date_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [train_no, user_id, passenger_name, class_type, seat_no || null, source, destination, date_time]
    );
    const pnr_no = tresult.insertId;

    console.log(`TICKET INSERTED - PNR: ${pnr_no}, Train: ${train_no}`);

    // Payment record (stub)
    const [payResult] = await conn.query(
      `INSERT INTO Payment (pnr_no, bank, card_no, amount) VALUES (?, ?, ?, ?)`,
      [pnr_no, bank || 'N/A', card_no ? card_no.slice(-4) : 'XXXX', amount || 0.00]
    );

    // Check if seat_available was updated by trigger
    const [afterRows] = await conn.query(`SELECT seat_available FROM Train WHERE train_no = ?`, [train_no]);
    const new_seat_available = afterRows[0].seat_available;
    
    console.log(`AFTER BOOKING - Train ${train_no}: available=${new_seat_available}, changed=${seat_available !== new_seat_available}`);

    // Let the trigger automatically update seat availability

    await conn.commit();
    res.json({ 
      message: 'Booked successfully! Trigger updated seat availability.', 
      pnr_no, 
      transaction_id: payResult.insertId,
      seat_info: {
        before_booking: seat_available,
        after_booking: new_seat_available,
        trigger_worked: seat_available !== new_seat_available
      }
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
});

// get my tickets
router.get('/my', auth, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const [rows] = await pool.query(`SELECT t.*, p.transaction_id FROM Ticket t LEFT JOIN Payment p ON t.pnr_no = p.pnr_no WHERE t.user_id = ? ORDER BY t.date_time DESC`, [user_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel ticket (delete from database)
router.delete('/cancel/:pnr_no', auth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { pnr_no } = req.params;
    const user_id = req.user.user_id;

    // Check if ticket exists and belongs to user
    const [ticket] = await conn.query(
      `SELECT * FROM Ticket WHERE pnr_no = ? AND user_id = ? FOR UPDATE`, 
      [pnr_no, user_id]
    );
    
    if (!ticket.length) {
      throw { status: 404, message: 'Ticket not found' };
    }

    // Check if cancellation is allowed (e.g., not within 2 hours of departure)
    const departureTime = new Date(ticket[0].date_time);
    const currentTime = new Date();
    const timeDiff = (departureTime - currentTime) / (1000 * 60 * 60); // hours

    if (timeDiff < 2) {
      throw { status: 400, message: 'Cannot cancel ticket within 2 hours of departure' };
    }

    // Delete payment record first (due to foreign key constraint)
    await conn.query(`DELETE FROM Payment WHERE pnr_no = ?`, [pnr_no]);

    // Delete ticket - trigger will automatically update seat availability
    await conn.query(`DELETE FROM Ticket WHERE pnr_no = ?`, [pnr_no]);

    await conn.commit();
    res.json({ message: 'Ticket cancelled successfully! Trigger updated seat availability.', pnr_no });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
});

// Get current seat availability 
router.get('/seat-availability/:train_no', async (req, res) => {
  try {
    const { train_no } = req.params;
    
    // Use SQL function to get seat availability (DBMS demonstration)
    const [functionResult] = await pool.query('SELECT GetAvailableSeats(?) as function_result', [train_no]);
    
    // Also get direct value from table for comparison
    const [trainResult] = await pool.query('SELECT seat_available FROM Train WHERE train_no = ?', [train_no]);
    
    if (!trainResult.length) {
      return res.status(404).json({ message: 'Train not found' });
    }
    
    // Get actual booked count for debugging
    const [ticketCount] = await pool.query('SELECT COUNT(*) as booked_count FROM Ticket WHERE train_no = ?', [train_no]);
    
    const functionAvailable = functionResult[0].function_result;
    const tableAvailable = trainResult[0].seat_available;
    const actualBooked = ticketCount[0].booked_count;
    
    console.log(`Train ${train_no}:`, {
      function_result: functionAvailable,
      table_value: tableAvailable,
      booked_tickets: actualBooked
    });
    
    res.json({
      train_no: parseInt(train_no),
      available_seats: functionAvailable, // Use function result
      debug_info: {
        function_result: functionAvailable,
        table_value: tableAvailable,
        booked_tickets: actualBooked,
        function_vs_table_match: functionAvailable === tableAvailable
      }
    });
  } catch (err) {
    console.error('Seat availability error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Simple route to check current train seat status
router.get('/check-train-status/:train_no', async (req, res) => {
  try {
    const { train_no } = req.params;
    
    // Get train details
    const [train] = await pool.query('SELECT * FROM Train WHERE train_no = ?', [train_no]);
    if (!train.length) {
      return res.status(404).json({ message: 'Train not found' });
    }
    
    // Count actual booked tickets
    const [tickets] = await pool.query('SELECT COUNT(*) as count FROM Ticket WHERE train_no = ?', [train_no]);
    const bookedCount = tickets[0].count;
    
    // Get recent tickets for this train
    const [recentTickets] = await pool.query(
      'SELECT pnr_no, passenger_name, booking_time FROM Ticket WHERE train_no = ? ORDER BY booking_time DESC LIMIT 5', 
      [train_no]
    );
    
    res.json({
      train_details: train[0],
      booked_tickets_count: bookedCount,
      actual_available: train[0].seat_available,
      recent_bookings: recentTickets
    });
  } catch (err) {
    console.error('Train status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug route: Check if triggers exist and manually fix seat availability
router.get('/debug/fix-seats', async (req, res) => {
  try {
    // Check if triggers exist
    const [triggers] = await pool.query("SHOW TRIGGERS LIKE 'after_ticket_%'");
    
    // Get all trains and fix their seat availability
    const [trains] = await pool.query('SELECT train_no, seat_available, total_capacity FROM Train');
    const fixResults = [];
    
    for (const train of trains) {
      // Count actual booked tickets
      const [ticketCount] = await pool.query('SELECT COUNT(*) as count FROM Ticket WHERE train_no = ?', [train.train_no]);
      const bookedTickets = ticketCount[0].count;
      
      // Calculate correct available seats
      const totalCapacity = train.total_capacity || 50; // default if not set
      const correctAvailable = Math.max(0, totalCapacity - bookedTickets);
      
      // Update if different
      if (train.seat_available !== correctAvailable) {
        await pool.query('UPDATE Train SET seat_available = ? WHERE train_no = ?', [correctAvailable, train.train_no]);
        fixResults.push({
          train_no: train.train_no,
          old_available: train.seat_available,
          new_available: correctAvailable,
          booked_tickets: bookedTickets
        });
      }
    }
    
    res.json({
      triggers_found: triggers.length,
      trigger_names: triggers.map(t => t.Trigger),
      fixes_applied: fixResults.length,
      fixes: fixResults
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ message: 'Debug error', error: err.message });
  }
});

module.exports = router;
