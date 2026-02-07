#!/bin/bash
# PWA Icons Generation Script
# This script helps generate icons for the PWA

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Shams Teacher Portal - PWA Icon Generator ===${NC}\n"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed."
    echo "Install it with:"
    echo "  Mac: brew install imagemagick"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  Windows: Download from https://imagemagick.org/"
    exit 1
fi

# Check if input image exists
if [ ! -f "logo.png" ]; then
    echo "Error: logo.png not found in current directory"
    echo "Please add your logo as 'logo.png' first"
    exit 1
fi

# Create icons directory if it doesn't exist
mkdir -p public/icons

echo -e "${BLUE}Generating icons from logo.png...${NC}\n"

# Generate different sizes
echo "Creating icon-96.png..."
convert logo.png -resize 96x96 -background none -gravity center -extent 96x96 public/icons/icon-96.png

echo "Creating icon-192.png..."
convert logo.png -resize 192x192 -background none -gravity center -extent 192x192 public/icons/icon-192.png

echo "Creating icon-192-maskable.png..."
convert logo.png -resize 192x192 -background none -gravity center -extent 192x192 public/icons/icon-192-maskable.png

echo "Creating icon-512.png..."
convert logo.png -resize 512x512 -background none -gravity center -extent 512x512 public/icons/icon-512.png

echo "Creating icon-512-maskable.png..."
convert logo.png -resize 512x512 -background none -gravity center -extent 512x512 public/icons/icon-512-maskable.png

echo -e "${GREEN}✓ Icons created successfully!${NC}\n"

echo -e "${BLUE}Note:${NC}"
echo "- For maskable icons, ensure your logo has proper padding"
echo "- Maskable icons will have rounded corners on Android"
echo "- Consider adding padding (at least 10%) to your source logo"
echo "- Test icons at: https://www.pwabuilder.com/\n"

echo -e "${GREEN}Next steps:${NC}"
echo "1. Add screenshots for better installation prompts:"
echo "   - Create screenshot-1.png (540x720)"
echo "   - Create screenshot-2.png (540x720)"
echo "   - Place them in public/icons/"
echo ""
echo "2. Build your app:"
echo "   npm run build"
echo ""
echo "3. Test the PWA:"
echo "   npm start"
echo "   Open http://localhost:3000/teacher in Chrome"
