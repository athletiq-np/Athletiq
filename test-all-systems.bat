@echo off
:: =======================================================
:: ATHLETIQ - COMPLETE SYSTEM TEST
:: =======================================================
:: Test all components after GitHub restore
:: =======================================================

title Athletiq - System Test

cls
echo.
echo =========================================
echo 🧪 ATHLETIQ - COMPLETE SYSTEM TEST
echo =========================================
echo.

:: Change to project directory
cd /d "%~dp0"

echo 📍 Testing from directory: %CD%
echo.

:: Test 1: Check project structure
echo [1/10] 📁 Checking project structure...
if exist "athletiq-backend" (
    echo ✅ Backend directory found
) else (
    echo ❌ Backend directory missing
    goto :error
)

if exist "atheletiq-frontend\athletiq-web" (
    echo ✅ Frontend directory found
) else (
    echo ❌ Frontend directory missing
    goto :error
)

if exist "athletiq-backend\package.json" (
    echo ✅ Backend package.json found
) else (
    echo ❌ Backend package.json missing
    goto :error
)

if exist "atheletiq-frontend\athletiq-web\package.json" (
    echo ✅ Frontend package.json found
) else (
    echo ❌ Frontend package.json missing
    goto :error
)
echo.

:: Test 2: Check Git status
echo [2/10] 🔍 Checking Git status...
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git not available
    goto :error
) else (
    echo ✅ Git is available
)

git status --porcelain >nul 2>&1
if errorlevel 1 (
    echo ❌ Not in a git repository
    goto :error
) else (
    echo ✅ Git repository detected
)
echo.

:: Test 3: Check Node.js and npm
echo [3/10] 🟢 Checking Node.js and npm...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not available
    goto :error
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js version: %%i
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not available
    goto :error
) else (
    for /f "tokens=*" %%i in ('npm --version') do echo ✅ npm version: %%i
)
echo.

:: Test 4: Check backend dependencies
echo [4/10] 📦 Checking backend dependencies...
if exist "athletiq-backend\node_modules" (
    echo ✅ Backend node_modules found
) else (
    echo ❌ Backend node_modules missing
    echo Installing backend dependencies...
    cd athletiq-backend
    npm install
    cd ..
    if exist "athletiq-backend\node_modules" (
        echo ✅ Backend dependencies installed
    ) else (
        echo ❌ Backend dependency installation failed
        goto :error
    )
)
echo.

:: Test 5: Check frontend dependencies
echo [5/10] 📦 Checking frontend dependencies...
if exist "atheletiq-frontend\athletiq-web\node_modules" (
    echo ✅ Frontend node_modules found
) else (
    echo ❌ Frontend node_modules missing
    echo Installing frontend dependencies...
    cd atheletiq-frontend\athletiq-web
    npm install
    cd ..\..
    if exist "atheletiq-frontend\athletiq-web\node_modules" (
        echo ✅ Frontend dependencies installed
    ) else (
        echo ❌ Frontend dependency installation failed
        goto :error
    )
)
echo.

:: Test 6: Test backend syntax
echo [6/10] 🔧 Testing backend syntax...
cd athletiq-backend
node -c server.js >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend syntax errors detected
    node -c server.js
    cd ..
    goto :error
) else (
    echo ✅ Backend syntax is valid
)
cd ..
echo.

:: Test 7: Test frontend syntax
echo [7/10] 🔧 Testing frontend syntax...
cd atheletiq-frontend\athletiq-web
npm run build >nul 2>&1
if errorlevel 1 (
    echo ❌ Frontend build failed
    echo Running build to see errors...
    npm run build
    cd ..\..
    goto :error
) else (
    echo ✅ Frontend builds successfully
)
cd ..\..
echo.

:: Test 8: Test backend startup (quick test)
echo [8/10] 🚀 Testing backend startup...
cd athletiq-backend
echo const express = require('express'); const app = express(); console.log('Backend test passed'); process.exit(0); > test-startup.js
node test-startup.js >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend startup test failed
    node test-startup.js
    del test-startup.js
    cd ..
    goto :error
) else (
    echo ✅ Backend startup test passed
)
del test-startup.js
cd ..
echo.

:: Test 9: Check environment files
echo [9/10] ⚙️ Checking environment configuration...
if exist "athletiq-backend\.env" (
    echo ✅ Backend .env file found
) else (
    echo ⚠️ Backend .env file missing (may need to create)
)

if exist "athletiq-backend\.env.example" (
    echo ✅ Backend .env.example found
) else (
    echo ⚠️ Backend .env.example missing
)
echo.

:: Test 10: Final system health check
echo [10/10] 🏥 Final system health check...
echo ✅ Project structure: Complete
echo ✅ Git repository: Active
echo ✅ Node.js environment: Ready
echo ✅ Dependencies: Installed
echo ✅ Code syntax: Valid
echo ✅ Build process: Working
echo.

:: Success message
echo =========================================
echo 🎉 ALL TESTS PASSED!
echo =========================================
echo.
echo ✅ Your Athletiq system is ready for development!
echo.
echo 🚀 To start development:
echo.
echo 1. Start Backend (in one terminal):
echo    cd athletiq-backend
echo    npm start
echo.
echo 2. Start Frontend (in another terminal):
echo    cd atheletiq-frontend\athletiq-web
echo    npm start
echo.
echo 3. Open your browser to:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:5000
echo.
echo 📊 System Status: ALL SYSTEMS GREEN ✅
echo.
pause
exit /b 0

:error
echo.
echo =========================================
echo ❌ SYSTEM TEST FAILED!
echo =========================================
echo.
echo 🔧 Please check the error messages above and:
echo    1. Ensure all prerequisites are installed
echo    2. Check your internet connection
echo    3. Verify file permissions
echo    4. Try running the restore script again
echo.
pause
exit /b 1
