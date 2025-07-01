@echo off
echo ========================================
echo    LFS Cinema App Startup Script
echo ========================================
echo.

cd /d d:\Dev\cinemaLfsv2

echo [1/4] Checking project directory...
if not exist package.json (
    echo ERROR: package.json not found!
    pause
    exit
)
echo ✓ Project directory confirmed

echo.
echo [2/4] Clearing caches...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .expo rmdir /s /q .expo
echo ✓ Caches cleared

echo.
echo [3/4] Installing dependencies...
npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit
)
echo ✓ Dependencies installed

echo.
echo [4/4] Starting Expo...
echo.
echo Starting Metro bundler...
echo If the app doesn't start, try:
echo 1. Close this window
echo 2. Run: npx expo start --tunnel
echo 3. Or try: npx expo start --localhost
echo.
npx expo start

pause
