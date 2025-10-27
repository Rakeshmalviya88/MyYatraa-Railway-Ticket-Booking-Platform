@echo off
title MySQL Connection Test

echo ========================================
echo   MySQL Connection Test
echo ========================================
echo.

echo Testing MySQL connection...
echo.
echo Please enter your MySQL root password when prompted.
echo If you don't have a password set, just press Enter.
echo.

"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "SELECT 'MySQL Connection Successful!' as Status; SHOW DATABASES;"

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCESS: MySQL connection is working!
    echo.
    echo Next steps:
    echo 1. Run setup_database.bat to create the railway database
    echo 2. Configure backend/.env with your MySQL password
    echo 3. Run start_project.bat to start the application
) else (
    echo.
    echo ❌ FAILED: Could not connect to MySQL
    echo.
    echo Possible issues:
    echo - Wrong password
    echo - MySQL service not running
    echo - MySQL not properly installed
    echo.
    echo Try running: net start MySQL80
)

echo.
pause