@echo off
REM PWA Health Check Script for Windows
REM Verifies that all PWA components are properly set up

setlocal enabledelayedexpansion

set "checks_passed=0"
set "checks_failed=0"

echo.
echo ======= PWA Health Check =======
echo.

REM Check core files
echo Checking core files...

if exist "next.config.ts" (
    echo [OK] next.config.ts
    set /a checks_passed+=1
) else (
    echo [FAIL] next.config.ts missing
    set /a checks_failed+=1
)

if exist "public\manifest.json" (
    echo [OK] manifest.json
    set /a checks_passed+=1
) else (
    echo [FAIL] manifest.json missing
    set /a checks_failed+=1
)

if exist "public\sw.js" (
    echo [OK] service worker
    set /a checks_passed+=1
) else (
    echo [FAIL] service worker missing
    set /a checks_failed+=1
)

if exist "package.json" (
    echo [OK] package.json
    set /a checks_passed+=1
) else (
    echo [FAIL] package.json missing
    set /a checks_failed+=1
)

REM Check layout files
echo.
echo Checking layout files...

if exist "app\layout.tsx" (
    echo [OK] Root layout
    set /a checks_passed+=1
) else (
    echo [FAIL] Root layout missing
    set /a checks_failed+=1
)

if exist "app\teacher\layout.tsx" (
    echo [OK] Teacher layout
    set /a checks_passed+=1
) else (
    echo [FAIL] Teacher layout missing
    set /a checks_failed+=1
)

REM Check PWA components
echo.
echo Checking PWA components...

if exist "app\components\pwa-installer.tsx" (
    echo [OK] PWA installer
    set /a checks_passed+=1
) else (
    echo [FAIL] PWA installer missing
    set /a checks_failed+=1
)

if exist "app\teacher\pwa-banner.tsx" (
    echo [OK] PWA banner
    set /a checks_passed+=1
) else (
    echo [FAIL] PWA banner missing
    set /a checks_failed+=1
)

REM Check configuration
echo.
echo Checking configuration...

if exist "lib\pwa-config.ts" (
    echo [OK] PWA config
    set /a checks_passed+=1
) else (
    echo [FAIL] PWA config missing
    set /a checks_failed+=1
)

REM Check icons directory
echo.
echo Checking icons directory...

if exist "public\icons" (
    echo [OK] Icons directory exists
    set /a checks_passed+=1
    
    REM Check individual icons
    echo.
    echo Checking required icons...
    
    if exist "public\icons\icon-96.png" (
        echo [OK] icon-96.png
        set /a checks_passed+=1
    ) else (
        echo [FAIL] icon-96.png missing
        set /a checks_failed+=1
    )
    
    if exist "public\icons\icon-192.png" (
        echo [OK] icon-192.png
        set /a checks_passed+=1
    ) else (
        echo [FAIL] icon-192.png missing
        set /a checks_failed+=1
    )
    
    if exist "public\icons\icon-192-maskable.png" (
        echo [OK] icon-192-maskable.png
        set /a checks_passed+=1
    ) else (
        echo [FAIL] icon-192-maskable.png missing
        set /a checks_failed+=1
    )
    
    if exist "public\icons\icon-512.png" (
        echo [OK] icon-512.png
        set /a checks_passed+=1
    ) else (
        echo [FAIL] icon-512.png missing
        set /a checks_failed+=1
    )
    
    if exist "public\icons\icon-512-maskable.png" (
        echo [OK] icon-512-maskable.png
        set /a checks_passed+=1
    ) else (
        echo [FAIL] icon-512-maskable.png missing
        set /a checks_failed+=1
    )
    
    if exist "public\icons\screenshot-1.png" (
        echo [OK] screenshot-1.png
        set /a checks_passed+=1
    ) else (
        echo [FAIL] screenshot-1.png missing
        set /a checks_failed+=1
    )
    
    if exist "public\icons\screenshot-2.png" (
        echo [OK] screenshot-2.png
        set /a checks_passed+=1
    ) else (
        echo [FAIL] screenshot-2.png missing
        set /a checks_failed+=1
    )
) else (
    echo [FAIL] Icons directory missing
    set /a checks_failed+=1
)

echo.
echo ======= Summary =======
echo Passed: !checks_passed!
echo Failed: !checks_failed!

echo.
if !checks_failed! equ 0 (
    echo All checks passed!
    echo.
    echo To finalize:
    echo 1. Add icon files to public\icons\
    echo 2. Run: npm install
    echo 3. Run: npm run build
    echo 4. Run: npm start
    echo 5. Test on mobile browser
) else (
    echo Please fix the missing files/configurations above
)

echo.
pause
