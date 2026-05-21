@echo off
echo Stopping all VPN Servers...
taskkill /F /IM tor.exe >nul 2>&1
echo.
echo VPN Successfully Stopped!
timeout /t 2 >nul
exit