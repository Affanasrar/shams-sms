#!/bin/bash
# PWA Health Check Script
# Verifies that all PWA components are properly set up

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== PWA Health Check ===${NC}\n"

checks_passed=0
checks_failed=0

# Function to check file exists
check_file() {
    local file=$1
    local name=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $name exists"
        ((checks_passed++))
    else
        echo -e "${RED}✗${NC} $name missing: $file"
        ((checks_failed++))
    fi
}

# Function to check directory exists
check_dir() {
    local dir=$1
    local name=$2
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $name directory exists"
        ((checks_passed++))
    else
        echo -e "${RED}✗${NC} $name directory missing: $dir"
        ((checks_failed++))
    fi
}

# Function to check if string exists in file
check_content() {
    local file=$1
    local pattern=$2
    local name=$3
    
    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $name configured"
        ((checks_passed++))
    else
        echo -e "${RED}✗${NC} $name not found in: $file"
        ((checks_failed++))
    fi
}

echo -e "Checking core files..."
check_file "next.config.ts" "next.config.ts"
check_file "public/manifest.json" "manifest.json"
check_file "public/sw.js" "service worker"
check_file "package.json" "package.json"

echo -e "\nChecking layout files..."
check_file "app/layout.tsx" "Root layout"
check_file "app/teacher/layout.tsx" "Teacher layout"

echo -e "\nChecking PWA components..."
check_file "app/components/pwa-installer.tsx" "PWA installer"
check_file "app/teacher/pwa-banner.tsx" "PWA banner"

echo -e "\nChecking configuration..."
check_file "lib/pwa-config.ts" "PWA config"

echo -e "\nChecking icons directory..."
check_dir "public/icons" "Icons"

if [ -d "public/icons" ]; then
    echo -e "\nChecking required icons..."
    check_file "public/icons/icon-96.png" "  icon-96.png"
    check_file "public/icons/icon-192.png" "  icon-192.png"
    check_file "public/icons/icon-192-maskable.png" "  icon-192-maskable.png"
    check_file "public/icons/icon-512.png" "  icon-512.png"
    check_file "public/icons/icon-512-maskable.png" "  icon-512-maskable.png"
    check_file "public/icons/screenshot-1.png" "  screenshot-1.png"
    check_file "public/icons/screenshot-2.png" "  screenshot-2.png"
fi

echo -e "\nChecking configuration content..."
check_content "next.config.ts" "next-pwa" "next-pwa import"
check_content "package.json" "next-pwa" "next-pwa dependency"
check_content "app/layout.tsx" "manifest" "manifest in metadata"
check_content "app/teacher/layout.tsx" "TeacherPWABanner" "PWA banner component"

echo -e "\n${YELLOW}=== Summary ===${NC}"
echo -e "${GREEN}Passed: $checks_passed${NC}"
if [ $checks_failed -gt 0 ]; then
    echo -e "${RED}Failed: $checks_failed${NC}"
else
    echo -e "${GREEN}Failed: $checks_failed${NC}"
fi

echo -e "\n${YELLOW}=== Next Steps ===${NC}"
if [ $checks_failed -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC}"
    echo "To finalize:"
    echo "1. Add icon files to public/icons/"
    echo "2. Run: npm install"
    echo "3. Run: npm run build"
    echo "4. Run: npm start"
    echo "5. Test on mobile browser"
else
    echo "Please fix the missing files/configurations above"
fi
