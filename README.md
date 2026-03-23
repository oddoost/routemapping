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

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173/routemapping/`

### 3. (Optional) Run Screenshot Server

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

## Technology Stack

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
