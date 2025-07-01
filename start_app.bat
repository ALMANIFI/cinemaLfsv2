@echo off
cd /d d:\Dev\cinemaLfsv2
echo Installing dependencies...
npm install
echo.
echo Clearing Metro cache...
npx expo start --clear --reset-cache
pause
