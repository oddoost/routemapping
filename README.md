# Route Mapping - Canvas Application

An interactive canvas application for creating visual diagrams with nodes and connections. Built with React, Vite, TypeScript, and React Flow.

## Features

- **Node Types**: Create Markdown, Image, and Iframe nodes
- **Canvas Interactions**: Pan, zoom, and drag nodes freely
- **Connections**: Link nodes with edges and customize them
- **Persistence**: Auto-save to IndexedDB with manual save/load options
- **Export/Import**: JSON-based export and import
- **Sharing**: Generate shareable links with encoded canvas data
- **High-Resolution Screenshots**: Capture canvas at 8x resolution with full content rendering
- **Lock Mode**: Prevent accidental edits while viewing

## Setup & Installation

### Prerequisites
- Node.js 16+ and npm
- For screenshots: Puppeteer (requires Chrome/Chromium)

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

The app will be available at **http://localhost:5173/**

**For detailed setup instructions and troubleshooting, see [SETUP.md](./SETUP.md)**

### (Optional) Run Screenshot Server

For high-resolution screenshots with embedded content:

```bash
node screenshot-server.js
```

This starts a Puppeteer server on `http://localhost:3001` that captures screenshots at 8x resolution.

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run deploy    # Deploy to GitHub Pages
```

## Usage

### Creating Nodes
- **Markdown**: Click the markdown button or drag files
- **Images**: Upload images or drag image URLs
- **Iframes**: Embed web content directly in nodes

### Editing
- Double-click nodes to edit content
- Use the lock button to prevent accidental changes
- Undo/redo with keyboard shortcuts (Cmd+Z / Cmd+Shift+Z)

### Sharing
- Click the share button to generate a shareable link
- The link contains your entire canvas encoded in the URL
- Others can visit the link and see your canvas immediately

### Screenshots
- Click the camera button to capture a high-resolution screenshot
- Screenshots are captured at 8x resolution with all embedded content
- Requires the screenshot server to be running

### Saving
- Canvas auto-saves every 5 seconds to IndexedDB
- Click the save button for immediate save
- Export to JSON for backup or sharing

### Lock & Kiosk Mode
- Click the **lock icon** (🔒) to lock the canvas and enter fullscreen kiosk mode
- In kiosk mode, all editing is disabled and the canvas is read-only
- Click the lock icon again to unlock and exit kiosk mode

#### Launch in Kiosk Mode on macOS

For a full-screen kiosk experience without browser UI:

**Option 1: Using the app's lock button** (Recommended)
```bash
# Start the dev server
npm run dev

# In browser, click the lock icon to enter kiosk mode
```

**Option 2: Launch Chrome in kiosk mode**
```bash
# First, start the dev server in another terminal
npm run dev

# Then launch Chrome in kiosk mode (macOS)
open -a "Google Chrome" --args --kiosk http://localhost:5173/routemapping/
```

Or with the full path:
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --kiosk http://localhost:5173/routemapping/
```

**Option 3: For production deployment**
```bash
# Build the app
npm run build

# Serve the dist folder, then open in kiosk mode
open -a "Google Chrome" --args --kiosk http://your-domain.com/routemapping/
```

**Note**: In kiosk mode, press `Esc` to exit (if enabled in Chrome settings).


- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **React Flow** - Canvas and node/edge management
- **Zustand** - State management
- **Dexie** - IndexedDB wrapper
- **Tailwind CSS** - Styling
- **Puppeteer** - Screenshot capture (optional)
- **Express** - Screenshot server (optional)

## Project Structure

```
src/
├── components/
│   ├── Canvas.tsx           # Main canvas component
│   ├── EdgeContextMenu.tsx  # Edge editing menu
│   └── NodeTypes/
│       ├── MarkdownNode.tsx
│       ├── ImageNode.tsx
│       └── IframeNode.tsx
├── App.tsx                  # Root app component
├── store.ts                 # Zustand store
├── db.ts                    # IndexedDB persistence
├── config.ts                # Configuration constants
└── main.tsx                 # Entry point

screenshot-server.js         # Puppeteer screenshot server
vite.config.ts              # Vite configuration
```

## Deployment

The app is deployed to GitHub Pages at: https://oddoost.github.io/routemapping/

To deploy your own:
```bash
npm run deploy
```

This uses the `gh-pages` package to push the `dist` folder to the `gh-pages` branch.

## Notes

- Canvas data is stored locally in IndexedDB
- No data is sent to any server (except when sharing links or taking screenshots)
- Share links encode canvas data in the URL for peer-to-peer sharing
- Screenshots require a local Puppeteer server for best results
