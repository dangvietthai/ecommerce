@echo off
cd /d %~dp0

REM Create Windows Service
sc create "LocalShopService" binPath= "%~dp0run-as-admin.bat" start= auto
sc description "LocalShopService" "Local Shop Web Application Service"

REM Start the service
sc start LocalShopService

echo Service has been installed and started successfully!
pause 