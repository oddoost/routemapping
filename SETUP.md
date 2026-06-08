# Quick Start Guide

## First Time Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The app will be available at **http://localhost:5173/**

---

## Troubleshooting

### If `npm run dev` doesn't work:

**Make sure you're in the project directory:**
```bash
cd routemapping
```

**Then run:**
```bash
npm run dev
```

### If you see a blank page:

Try one of these:
```bash
# Option 1: Use the local vite installation
./node_modules/.bin/vite

# Option 2: Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Port 5173 already in use?

```bash
# Use a different port
npm run dev -- --port 3000
```

---

## Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## Preview Production Build

```bash
npm run preview
```

---

## Kiosk Mode (macOS)

### Using the App's Lock Button (Recommended)

1. Start the dev server: `npm run dev`
2. Open the app in browser
3. Click the **lock icon** (🔒) in the left sidebar
4. The app enters fullscreen kiosk mode with all editing disabled
5. Click the lock icon again to exit

### Launch Chrome in Kiosk Mode (Full Browser Kiosk)

**From Terminal:**

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Launch Chrome in kiosk mode
open -a "Google Chrome" --args --kiosk http://localhost:5173/routemapping/
```

**Or with full path:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --kiosk http://localhost:5173/routemapping/
```

**Additional Chrome Kiosk Flags** (optional):
```bash
# Hide cursor after inactivity
--kiosk --kiosk-printing \
  --no-user-gesture-required \
  http://localhost:5173/routemapping/

# Disable exiting kiosk mode with Esc key
--kiosk --disable-keyboard-shortcuts \
  http://localhost:5173/routemapping/
```

### Exit Kiosk Mode

- Press `Esc` key (if not disabled)
- Use Alt+F4 or Cmd+Q to force quit
- Click the lock button if using app's kiosk mode
