-- Railway Ticketing System Database Schema

CREATE DATABASE Railway_Ticketing_System;
USE Railway_Ticketing_System;

-- User table
CREATE TABLE User (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    f_name VARCHAR(50),
    l_name VARCHAR(50),
    mobile_no VARCHAR(15) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Train table
CREATE TABLE Train (
    train_no INT PRIMARY KEY,
    train_name VARCHAR(100) NOT NULL,
    source VARCHAR(50) NOT NULL,
    destination VARCHAR(50) NOT NULL,
    arr_time TIME,
    dep_time TIME,
    seat_available INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class table (for different travel classes and their fares)
CREATE TABLE Class (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    train_no INT,
    class_type VARCHAR(20) NOT NULL, -- e.g., 'Sleeper', 'AC 3-Tier', 'AC 2-Tier', 'AC 1st Class'
    fare DECIMAL(10,2) NOT NULL,
    seats_available INT DEFAULT 50,
    FOREIGN KEY (train_no) REFERENCES Train(train_no) ON DELETE CASCADE
);

-- Ticket table
CREATE TABLE Ticket (
    pnr_no INT AUTO_INCREMENT PRIMARY KEY,
    train_no INT NOT NULL,
    user_id INT NOT NULL,
    passenger_name VARCHAR(100) NOT NULL,
    class_type VARCHAR(20) NOT NULL,
    seat_no VARCHAR(10),
    source VARCHAR(50) NOT NULL,
    destination VARCHAR(50) NOT NULL,
    date_time DATETIME NOT NULL,
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (train_no) REFERENCES Train(train_no),
    FOREIGN KEY (user_id) REFERENCES User(user_id)
);

-- Payment table
CREATE TABLE Payment (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    pnr_no INT NOT NULL,
    bank VARCHAR(50),
    card_no VARCHAR(20), -- Store only last 4 digits for security
    amount DECIMAL(10,2) NOT NULL,
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pnr_no) REFERENCES Ticket(pnr_no) ON DELETE CASCADE
);

-- Inserting sample data
-- Sample trains
INSERT INTO Train (train_no, train_name, source, destination, arr_time, dep_time, seat_available) VALUES
(12001, 'Shatabdi Express', 'New Delhi', 'Mumbai', '06:00:00', '22:00:00', 150),
(12002, 'Rajdhani Express', 'New Delhi', 'Kolkata', '16:55:00', '05:30:00', 120),
(12003, 'Duronto Express', 'Mumbai', 'Chennai', '23:50:00', '06:20:00', 200),
(12004, 'Garib Rath', 'Bangalore', 'Delhi', '20:15:00', '22:30:00', 180),
(12005, 'Jan Shatabdi', 'Chennai', 'Bangalore', '14:30:00', '20:45:00', 160);

-- Sample classes for each train
INSERT INTO Class (train_no, class_type, fare, seats_available) VALUES
-- Shatabdi Express
(12001, 'AC Chair Car', 1200.00, 50),
(12001, 'Executive Chair Car', 2000.00, 30),

-- Rajdhani Express  
(12002, 'AC 3-Tier', 1800.00, 40),
(12002, 'AC 2-Tier', 2500.00, 25),
(12002, 'AC 1st Class', 4000.00, 15),

-- Duronto Express
(12003, 'Sleeper', 450.00, 80),
(12003, 'AC 3-Tier', 1100.00, 50),
(12003, 'AC 2-Tier', 1600.00, 30),

-- Garib Rath
(12004, 'AC 3-Tier', 800.00, 90),
(12004, 'AC Chair Car', 600.00, 60),

-- Jan Shatabdi
(12005, 'AC Chair Car', 500.00, 80),
(12005, 'CC', 300.00, 80);

-- Creating indexes for better performance
CREATE INDEX idx_train_source_dest ON Train(source, destination);
CREATE INDEX idx_ticket_user ON Ticket(user_id);
CREATE INDEX idx_ticket_train ON Ticket(train_no);
CREATE INDEX idx_payment_pnr ON Payment(pnr_no);


--  Train Details View - Complete train information with class details
CREATE VIEW train_details_view AS
SELECT 
    t.train_no,
    t.train_name,
    t.source,
    t.destination,
    t.arr_time,
    t.dep_time,
    t.seat_available,
    c.class_type,
    c.fare,
    c.seats_available as class_seats_available
FROM Train t
LEFT JOIN Class c ON t.train_no = c.train_no
ORDER BY t.train_no, c.fare;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS after_ticket_booking;
DROP TRIGGER IF EXISTS after_ticket_cancellation;
DROP FUNCTION IF EXISTS GetAvailableSeats;

-- Function: Calculate available seats for a train
DELIMITER //
CREATE FUNCTION GetAvailableSeats(train_number INT)
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE current_available INT DEFAULT 0;
    DECLARE booked_seats INT DEFAULT 0;
    DECLARE calculated_available INT DEFAULT 0;
    
    -- Get current seat_available from Train table
    SELECT seat_available INTO current_available 
    FROM Train 
    WHERE train_no = train_number;
    
    -- Count actual booked tickets for this train
    SELECT COUNT(*) INTO booked_seats 
    FROM Ticket 
    WHERE train_no = train_number;
    
    SET calculated_available = current_available;
    
    -- Ensure non-negative
    IF calculated_available < 0 THEN
        SET calculated_available = 0;
    END IF;
    
    RETURN calculated_available;
END//

-- Trigger for booking (INSERT) - decrement seat_available
CREATE TRIGGER after_ticket_booking
    AFTER INSERT ON Ticket
    FOR EACH ROW
BEGIN
    UPDATE Train 
    SET seat_available = GREATEST(seat_available - 1, 0) 
    WHERE train_no = NEW.train_no;
END//

-- Trigger for cancellation (DELETE) - increment seat_available
CREATE TRIGGER after_ticket_cancellation
    AFTER DELETE ON Ticket
    FOR EACH ROW
BEGIN
    UPDATE Train 
    SET seat_available = seat_available + 1 
    WHERE train_no = OLD.train_no;
END//

DELIMITER ;

-- Show tables created
SHOW TABLES;

-- Popular trains list : using Nested query

SELECT t.train_name, t.source, t.destination, 
       (SELECT COUNT(*) FROM Ticket WHERE train_no = t.train_no) as total_bookings
FROM Train t
WHERE (SELECT COUNT(*) FROM Ticket WHERE train_no = t.train_no) > 
      (SELECT AVG(booking_count) FROM 
       (SELECT COUNT(*) as booking_count FROM Ticket GROUP BY train_no) as avg_bookings)
ORDER BY total_bookings DESC;


SELECT * FROM ticket;
