@echo off
echo.
echo ========================================
echo    ATHLETIQ MINIMAL SERVER STARTER
echo ========================================
echo.
echo Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
echo Waiting for processes to close...
timeout /t 3 /nobreak >nul
echo.
echo Starting minimal server with mock data...
echo Port: 5001 (avoiding port 5000 conflict)
echo All endpoints mocked for testing
echo.
cd /d "E:\Athletiq\athletiq-backend"
node minimal-server.js
pause
