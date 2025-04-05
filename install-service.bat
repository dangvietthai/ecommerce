@echo off
echo Installing Windows Service...
sc create "LocalShopService" binPath= "%~dp0start-app.bat" start= auto
sc description "LocalShopService" "Local Shop Web Application Service"
echo Service installed successfully!
pause 