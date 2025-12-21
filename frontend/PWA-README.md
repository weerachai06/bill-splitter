# Bill Splitter PWA

A Progressive Web Application for splitting bills among friends and colleagues easily.

## PWA Features

### 🚀 Installation
- **Chrome/Edge**: Look for the install button or "Install Bill Splitter" notification
- **Safari iOS**: Tap the share button (⎋) and select "Add to Home Screen" (➕)
- **Firefox**: Look for the install prompt in the address bar

### 📱 Mobile Experience
- Works offline with cached data
- Native app-like experience when installed
- Responsive design for all screen sizes

### 🔧 PWA Components
- **Web App Manifest**: Defines app metadata, icons, and display mode
- **Service Worker**: Handles offline functionality and caching
- **Install Prompt**: Guides users to install the app
- **Offline Status**: Shows connection status

## Development

### Running the PWA
```bash
pnpm dev          # Development with hot reload
pnpm build        # Build for production  
pnpm start        # Start production server
```

### PWA Testing
1. Build and start the production server: `pnpm build && pnpm start`
2. Open `http://localhost:3000` in Chrome/Edge
3. Look for the install button in the PWA install prompt
4. Test offline functionality by going offline in DevTools

### PWA Files
- `src/app/manifest.ts` - Web App Manifest configuration
- `public/sw.js` - Service Worker for caching and offline support
- `src/components/PWAComponents.tsx` - Install prompts and status indicators
- `public/icon-*.png` - PWA icons in various sizes

### Security Headers
The app includes security headers for PWA best practices:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Browser Support
- Chrome/Chromium-based browsers: Full PWA support
- Safari (iOS 16.4+): Full support when installed to home screen
- Firefox: Basic PWA support

## Production Deployment

1. Update the `metadataBase` URL in `src/app/layout.tsx`
2. Update the notification click URL in `public/sw.js`
3. Ensure HTTPS is enabled for PWA installation
4. Test PWA features on various devices and browsers

## Features

- 📊 Split bills with multiple people
- 🧾 Individual item assignment
- 💰 Automatic tax and service charge calculation
- 📱 Mobile-first responsive design
- 🔄 Real-time updates and calculations
- 💾 Offline capability with service worker
- 🎯 Native app-like experience when installed