# Railway Ticketing System – DBMS Project

A comprehensive full-stack web application for train ticket booking built with React (frontend) and Node.js/Express (backend) with MySQL database. This project demonstrates advanced Database Management System (DBMS) concepts including triggers, functions, views, and nested queries.

## 🚀 Features

### Core Functionality
- **User Registration and Authentication** with JWT tokens
- **Train Search** by Source and Destination with date selection
- **Real-time Seat Availability** with automatic updates
- **Ticket Booking** with fare calculation and payment integration
- **Ticket Cancellation** with automatic seat management
- **Responsive Design** with custom CSS styling

### Advanced DBMS Features
- **SQL Triggers** - Automatic seat availability updates on booking/cancellation
- **SQL Functions** - `GetAvailableSeats()` for encapsulated business logic
- **Database Views** - `train_details_view` with JOIN operations
- **Nested Queries** - Popular trains analysis with subqueries
- **Aggregate Functions** - Revenue calculation, booking statistics
- **Foreign Key Constraints** - Data integrity and referential constraints
- **Transaction Management** - ACID compliance for booking operations

### Reports & Analytics
- **Dashboard Summary** - Total users, trains, bookings, revenue
- **Popular Trains** - Trains with above-average bookings using nested queries
- **Real-time Statistics** - Today's bookings, revenue tracking
- **Seat Availability Refresh** - Real-time updates using SQL functions

## 📊 Technology Stack

**Frontend:**
- React 18 with functional components and hooks
- React Router for navigation
- Axios for API communication

**Backend:**
- Node.js with Express.js framework
- JWT for secure authentication

**Database:**
- MySQL 8.0+ with advanced features
- Triggers for automatic data management
- Functions for business logic encapsulation
- Views for complex queries

## 🎯 DBMS Concepts Demonstrated

### 1. **Database Design**
- Normalized table structure (3NF)
- Primary and foreign key relationships

### 2. **SQL Functions**
```sql
CREATE FUNCTION GetAvailableSeats(train_number INT)
RETURNS INT
-- Calculates real-time seat availability
```

### 3. **SQL Triggers**
```sql
CREATE TRIGGER after_ticket_booking
    AFTER INSERT ON Ticket
-- Automatically updates seat availability when booking
    
CREATE TRIGGER after_ticket_cancellation
    AFTER DELETE ON Ticket  
-- Automatically updates seat availability when cancelling
```

### 4. **Database Views**
```sql
CREATE VIEW train_details_view AS
SELECT t.*, c.class_type, c.fare
FROM Train t LEFT JOIN Class c ON t.train_no = c.train_no
-- Combines train and class information
```

### 5. **Nested Queries**
```sql
SELECT t.train_name, (SELECT COUNT(*) FROM Ticket WHERE train_no = t.train_no) as bookings
FROM Train t  
WHERE (SELECT COUNT(*) FROM Ticket WHERE train_no = t.train_no) > 
      (SELECT AVG(booking_count) FROM ...)
-- Popular trains with above-average bookings
```


## 🛠️ Installation & Setup

### 1. Clone/Download the Project

```bash
cd "d:\My Projects\Railway-Ticketing-System 2"
```

### 2. Database Setup

1. **Install MySQL** (if not already installed)
   - Download from https://dev.mysql.com/downloads/mysql/
   - Install and start MySQL service

2. **Create Database and Apply Schema**
   ```bash
   # Login to MySQL
   mysql -u root -p
   
   # Create database
   CREATE DATABASE Railway_Ticketing_System;
   USE Railway_Ticketing_System;
   
   # Run the schema file (includes tables, triggers, functions, views)
   source database_schema.sql;
   ```

3. **Verify DBMS Features**
   ```sql
   -- Check tables
   SHOW TABLES;
   
   -- Verify triggers
   SHOW TRIGGERS;
   
   -- Test function
   SELECT GetAvailableSeats(12001);
   
   -- Check view
   SELECT * FROM train_details_view LIMIT 5;
   ```

### 3. Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   - Create/edit the `.env` file in the backend directory:
   ```env
   PORT=3001
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=Railway_Ticketing_System
   JWT_SECRET=your_secure_jwt_secret_here_12345
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   # Backend runs on http://localhost:3001
   ```

### 4. Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the frontend development server**
   ```bash
   npm start
   # Frontend runs on http://localhost:3000
   ```

## 🚀 Running the Application

1. **Start MySQL service**
2. **Start Backend server** (Terminal 1):
   ```bash
   cd "d:\My Projects\Railway-Ticketing-System 2\backend"
   npm run dev
   ```

3. **Start Frontend server** (Terminal 2):
   ```bash
   cd "d:\My Projects\Railway-Ticketing-System 2\frontend"
   npm start
   ```

4. **Open browser** and go to http://localhost:3000

## 📱 Usage Guide

### User Journey
1. **Register/Login** - Create account or sign in
2. **Search Trains** - Enter source, destination, and travel date
3. **View Details** - Check train information and available classes
4. **Book Ticket** - Select class, enter passenger details, make payment
5. **Manage Bookings** - View tickets, cancel if needed
6. **Real-time Updates** - Use refresh button to see current seat availability

### Admin Features
- **Reports Dashboard** - View system statistics and analytics
- **Popular Trains** - See trending routes using nested queries
- **Debug Tools** - Check trigger functionality and seat availability

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Trains
- `GET /api/trains` - Get all trains with optional filtering
- `GET /api/trains/search` - Search trains by source/destination
- `GET /api/trains/:train_no` - Get specific train details

### Tickets  
- `POST /api/tickets/book` - Book a ticket (uses triggers for seat update)
- `GET /api/tickets/my` - Get user's booked tickets
- `DELETE /api/tickets/cancel/:pnr_no` - Cancel ticket (triggers update seats)
- `GET /api/tickets/seat-availability/:train_no` - Get seats using SQL function

### Reports (DBMS Features)
- `GET /api/reports/summary` - Dashboard statistics with aggregates
- `GET /api/reports/popular-trains` - Popular trains using nested queries

### Debug & Admin
- `GET /api/tickets/check-train-status/:train_no` - Debug train information
- `GET /api/tickets/debug/fix-seats` - Manual seat count verification
