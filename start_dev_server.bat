@echo off
title NASA CLPS Lunar Browser Dev Server
echo ====================================================
echo 🚀 Starting NASA CLPS Lunar Mission Browser Server
echo 🔗 URL: http://localhost:5175/
echo ====================================================
cd /d "C:\Users\Asus\OneDrive\Desktop\The NASA Space App\Challenge 4\clps-lunar-browser"
start http://localhost:5175/
node runner.cjs dev
pause
