# PWA Install Banner Troubleshooting

## Quick Diagnosis

The install banner now shows in two ways:

1. **Automatic Mode** - When browser fires `beforeinstallprompt` event
2. **Fallback Mode** - After 5 seconds if the event doesn't fire

You should see a blue banner at the top of the teacher dashboard.

---

## Why Banner Might Not Appear

### Reason 1: HTTPS Not Enabled (Production Issue)
**Problem**: PWA features require HTTPS in production
**Solution**: 
- ✅ Local development: Works on `localhost`
- ✅ Staging: Enable HTTPS on your server
- ✅ Production: Must be HTTPS only

### Reason 2: Manifest Not Loading
**Problem**: The browser can't read `public/manifest.json`
**Solution**:
- Check that manifest link is in HTML head:
  ```html
  <link rel="manifest" href="/manifest.json">
  ```
- Verify file exists at `/public/manifest.json`
- Check browser DevTools → Network tab → manifest.json (should be 200 OK)

### Reason 3: Service Worker Not Registered
**Problem**: Service worker (`public/sw.js`) failed to register
**Solution**:
- Check browser Console (F12) for errors
- Verify `public/sw.js` exists
- Check that JavaScript is enabled
- Look for messages: "✓ Service Worker registered" or "✗ Service Worker registration failed"

### Reason 4: App Already Installed
**Problem**: App is installed, so banner doesn't show
**Solution**:
- The banner only shows for new installations
- If app is already installed, banner is hidden
- Uninstall to see banner again

### Reason 5: Browser Doesn't Support Installing
**Problem**: Some browsers/devices don't support PWA install
**Solution**:
- The fallback banner always shows (after 5 seconds)
- iOS users see instructions: "Tap Share → Add to Home Screen"
- Some older browsers show "How to" button instead of "Install"

---

## Debugging Steps

### Step 1: Open DevTools
1. Press **F12** on keyboard
2. Go to **Console** tab
3. Look for logs starting with ✓, ✗, or ⚠

### Step 2: Check PWA Status
You should see something like:
```
✓ Service Worker registered
✓ Manifest.json is accessible
PWA Status: {
  serviceWorker: "Supported",
  standalone: "Browser mode",
  online: "Online",
  https: "No (local ok)"
}
```

### Step 3: Run Diagnostics
Visit: `/teacher/diagnostics`

This page shows:
- ✓ or ✗ for each PWA feature
- Recommendations to fix issues
- Links to documentation

### Step 4: Check Specific Errors

**Error: Cannot find manifest.json**
- Solution: Ensure file exists at `c:/Users/.../shams-sms/public/manifest.json`

**Error: Service Worker installation failed**
- Solution: Check console for specific error message
- Possible causes: File not at `/sw.js`, syntax error, blocked by browser

**Error: beforeinstallprompt never fires**
- Solution: This is normal! Fallback banner will show instead
- Only fires when app meets PWA criteria and isn't installed

---

## Testing on Mobile Device

### Android (Chrome/Edge/Samsung Internet)

1. **Build the app**:
   ```bash
   npm run build
   npm start
   ```

2. **Find your computer's IP**:
   - Windows: run `ipconfig` and look for IPv4 Address
   - Example: `192.168.1.100`

3. **Open on mobile**:
   - URL: `http://192.168.1.100:3000/teacher`
   - (Not https needed on local network)

4. **Wait for banner**:
   - Should appear in < 5 seconds
   - Blue banner at top of page

5. **Click Install**:
   - Android shows native install dialog
   - App appears on home screen

### iOS (Safari)

1. Same steps 1-4 above

2. **See different banner**:
   - Says "Add to Home Screen: Tap Share → Add to Home Screen"

3. **How to install**:
   - Tap Share button (arrow out of box)
   - Tap "Add to Home Screen"
   - Choose name and tap Add
   - App appears on home screen

---

## Console Commands

### Register Service Worker Manually
```javascript
navigator.serviceWorker.register('/sw.js')
  .then(reg => console.log('✓ Registered:', reg))
  .catch(err => console.error('✗ Error:', err))
```

### Check Service Worker Status
```javascript
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('Service Workers:', regs))
```

### Fetch and Check Manifest
```javascript
fetch('/manifest.json')
  .then(r => r.json())
  .then(manifest => console.log('Manifest:', manifest))
```

### Clear All Caches (if needed)
```javascript
caches.keys().then(names => {
  Promise.all(names.map(name => caches.delete(name)))
})
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| No banner appears | App installed | Uninstall and refresh |
| No banner appears | beforeinstallprompt blocked | Fallback shows after 5s |
| Banner says "How to" | No native install support | Shows iOS instructions |
| Service Worker errors | File not found | Check `/public/sw.js` exists |
| Manifest errors | Invalid JSON | Use JSON validator |
| Icons not showing | Files missing | Check `/public/icons/` folder |
| Offline doesn't work | SW not active | Reload page with SW registered |

---

## What Each Button Does

### Install Button
- **With `beforeinstallprompt`**: Shows native browser install dialog
- **Without `beforeinstallprompt`**: Shows alert with instructions
- Different behavior for iOS vs Android

### How To Button
- Shows instructions for manual installation
- Fallback when native install not available

### Close Button (X)
- Dismisses banner for this session
- Banner returns after page reload
- Refresh shows it again

### Debug Button (Info icon)
- Opens debug panel
- Shows technical information
- Helps troubleshoot issues

---

## Next Steps

1. **Test now**: 
   ```bash
   npm start
   ```
   - Visit `http://localhost:3000/teacher`
   - Check for blue banner

2. **Check diagnostics**:
   - Visit `http://localhost:3000/teacher/diagnostics`
   - See which PWA features work

3. **View console logs** (F12 → Console):
   - Look for ✓ and ✗ messages
   - Read error messages carefully

4. **Deploy to production**:
   - Enable HTTPS
   - Install banner will fully work there

---

## Production Checklist

Before deploying, ensure:
- ✅ HTTPS is enabled
- ✅ `/public/manifest.json` exists
- ✅ `/public/sw.js` exists
- ✅ All icons in `/public/icons/` are accessible
- ✅ No console errors on load
- ✅ Service worker registers successfully
- ✅ Test on real mobile device
- ✅ App can be installed to home screen

---

## Still Having Issues?

If banner still doesn't appear:

1. **Hard refresh** (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)
2. **Clear cache** (DevTools → Application → Clear site data)
3. **Check manifest** - Validate JSON at https://jsonlint.com/
4. **Check sw.js** - Look for JavaScript syntax errors
5. **Change `next-pwa` config** - See `next.config.ts`
6. **Check environment** - HTTPS? Correct domain? Port?

---

## Files Involved in PWA

```
shams-sms/
├── public/
│   ├── manifest.json        ← App metadata 
│   ├── sw.js                ← Service worker
│   └── icons/               ← App icons
└── app/
    ├── layout.tsx           ← PWA meta tags
    ├── components/
    │   └── pwa-installer.tsx   ← Service worker registration
    └── teacher/
        ├── pwa-banner.tsx   ← Install banner
        └── diagnostics/     ← Diagnostic page
            └── page.tsx
```

Each file is critical for PWA functionality. If any is missing, look for error logs.

---

## Resources

- [PWA Diagnostics](http://localhost:3000/teacher/diagnostics) - Built-in diagnostic page
- [MDN PWA Documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google PWA Checklist](https://developers.google.com/web/progressive-web-apps/checklist)
- [Web App Manifest Spec](https://www.w3.org/TR/appmanifest/)

---

## Summary

The install banner should now:
1. ✓ Show automatically on supported browsers
2. ✓ Show fallback after 5 seconds (always visible)
3. ✓ Display debug info with info button
4. ✓ Handle offline installs gracefully
5. ✓ Provide testing page at `/teacher/diagnostics`

If you still don't see it, visit the diagnostics page to identify which PWA feature is missing! 🔍
