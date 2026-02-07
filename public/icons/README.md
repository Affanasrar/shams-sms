# PWA Icons Guide

To make your PWA work properly on all devices, you need to create the following icon files and place them in the `public/icons/` directory:

## Required Icons

1. **icon-96.png** (96x96px)
   - Used for shortcuts in the app menu

2. **icon-192.png** (192x192px)
   - Standard icon for Android home screen
   - Used in shortcuts and notifications

3. **icon-192-maskable.png** (192x192px)
   - Maskable icon for Android (allows rounded corners, etc.)
   - Should have transparent padding around the actual icon

4. **icon-512.png** (512x512px)
   - High-resolution icon for splash screen
   - Used for app installation prompts

5. **icon-512-maskable.png** (512x512px)
   - Maskable icon for splash screens

6. **screenshot-1.png** (540x720px)
   - Screenshot showing the attendance feature
   - Displayed in app store/installation prompt

7. **screenshot-2.png** (540x720px)
   - Screenshot showing another feature like results or schedule

## Quick Generation Options

### Option 1: Using an online service
- Go to https://www.favicon-generator.org/ or https://realfavicongenerator.net/
- Upload your logo/image
- Download the ZIP file with all sizes
- Extract to `public/icons/`

### Option 2: Using command-line tools
If you have ImageMagick installed:
```bash
convert your-logo.png -resize 96x96 icon-96.png
convert your-logo.png -resize 192x192 icon-192.png
convert your-logo.png -resize 512x512 icon-512.png
```

### Option 3: Using Figma
- Create a design in Figma
- Export at different sizes

## Icon Design Tips

- Use colors that match your theme (#0f3460 is the primary theme color)
- Ensure the icon is recognizable at small sizes
- Add padding for maskable icons (at least 10% on all sides)
- Keep important elements in the center

## Verification

After placing icons, you can verify your PWA setup:
1. Open the Teacher Portal
2. On Chrome/Edge: Click the install button (usually appears in the address bar on mobile)
3. On iOS: Use "Add to Home Screen" in Safari
4. Check the manifest.json is loading in DevTools (Network tab)
