@echo off
REM PWA Icons Generation Script for Windows
REM This script helps generate icons for the PWA

echo.
echo ======= Shams Teacher Portal - PWA Icon Generator =======
echo.

REM Check if ImageMagick is installed
where convert >nul 2>nul
if errorlevel 1 (
    echo ImageMagick is not installed.
    echo.
    echo Install it with:
    echo   - Download from: https://imagemagick.org/
    echo   - Or use Chocolatey: choco install imagemagick
    echo   - Or use Windows Package Manager: winget install ImageMagick.Q16
    echo.
    pause
    exit /b 1
)

REM Check if input image exists
if not exist "logo.png" (
    echo Error: logo.png not found in current directory
    echo Please add your logo as 'logo.png' first
    echo.
    pause
    exit /b 1
)

REM Create icons directory
if not exist "public\icons" mkdir public\icons

echo Generating icons from logo.png...
echo.

echo Creating icon-96.png...
convert logo.png -resize 96x96 -background none -gravity center -extent 96x96 public\icons\icon-96.png

echo Creating icon-192.png...
convert logo.png -resize 192x192 -background none -gravity center -extent 192x192 public\icons\icon-192.png

echo Creating icon-192-maskable.png...
convert logo.png -resize 192x192 -background none -gravity center -extent 192x192 public\icons\icon-192-maskable.png

echo Creating icon-512.png...
convert logo.png -resize 512x512 -background none -gravity center -extent 512x512 public\icons\icon-512.png

echo Creating icon-512-maskable.png...
convert logo.png -resize 512x512 -background none -gravity center -extent 512x512 public\icons\icon-512-maskable.png

echo.
echo ✓ Icons created successfully!
echo.
echo Note:
echo - For maskable icons, ensure your logo has proper padding
echo - Maskable icons will have rounded corners on Android
echo - Consider adding padding (at least 10%%) to your source logo
echo - Test icons at: https://www.pwabuilder.com/
echo.
echo Next steps:
echo 1. Add screenshots for better installation prompts:
echo    - Create screenshot-1.png (540x720)
echo    - Create screenshot-2.png (540x720)
echo    - Place them in public\icons\
echo.
echo 2. Build your app:
echo    npm run build
echo.
echo 3. Test the PWA:
echo    npm start
echo    Open http://localhost:3000/teacher in Chrome
echo.
pause
