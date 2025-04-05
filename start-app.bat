@echo off
cd /d %~dp0
start /b nginx.exe
npm run build
node server.js 