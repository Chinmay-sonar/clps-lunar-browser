@echo off
title NASA CLPS Lunar Browser Builder
echo ====================================================
echo 🔨 Building NASA CLPS Lunar Browser Production Bundle
echo ====================================================
cd /d "C:\Users\Asus\OneDrive\Desktop\The NASA Space App\Challenge 4\clps-lunar-browser"
node runner.cjs build
echo.
echo ====================================================
echo ✅ Build complete!
echo ====================================================
pause
