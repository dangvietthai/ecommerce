@echo off
cd /d C:\nginx
taskkill /F /IM nginx.exe
start nginx.exe
echo Nginx has been restarted successfully!
pause 