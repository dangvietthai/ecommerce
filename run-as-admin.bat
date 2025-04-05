@echo off
cd /d %~dp0

REM Kill any existing Node.js processes
taskkill /F /IM node.exe

REM Build and start Next.js app
call npm run build
start /b node server.js

echo Application has been started successfully!
echo Press any key to exit...
pause > nul 