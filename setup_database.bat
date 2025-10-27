@echo off
title Database Setup - Railway Ticketing System

echo ========================================
echo   Database Setup - Railway Ticketing System
echo ========================================
echo.

echo This script will help you set up the MySQL database.
echo.
echo Prerequisites:
echo - MySQL Server must be installed and running
echo - You should have MySQL root password ready
echo.

set /p continue="Do you want to continue? (y/n): "
if /i not "%continue%"=="y" (
    echo Setup cancelled.
    pause
    exit
)

echo.
echo [1/3] Checking MySQL installation...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ MySQL is not found at expected location
    echo Please check your MySQL installation
    pause
    exit
)
echo ✓ MySQL is installed and accessible

echo.
echo [2/3] Connecting to MySQL and creating database...
echo Please enter your MySQL root password when prompted.
echo.

"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < database_schema.sql
if %errorlevel% neq 0 (
    echo ✗ Database setup failed
    echo Please check your MySQL credentials and try again
    pause
    exit
)

echo ✓ Database setup completed successfully!

echo.
echo [3/3] Verifying database setup...
echo Checking if tables were created...
echo.

"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "USE Railway_Ticketing_System; SHOW TABLES; SELECT COUNT(*) as 'Number of sample trains' FROM Train;"

echo.
echo ========================================
echo   Database Setup Complete!
echo ========================================
echo.
echo Database: Railway_Ticketing_System
echo Tables created: User, Train, Class, Ticket, Payment
echo Sample data: 5 trains with different classes
echo.
echo You can now run the application using start_project.bat
echo.

pause