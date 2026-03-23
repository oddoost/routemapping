const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = express();

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

let browser;

// Initialize browser on startup
(async () => {
  browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  console.log('Puppeteer browser launched');
})();

app.post('/screenshot', async (req, res) => {
  try {
    const { url = 'http://localhost:5173/routemapping/', scale = 8 } = req.body;
    
    const page = await browser.newPage();
    
    // Set viewport to capture full content
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: scale,
    });

    // Navigate to the app
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for iframes and content to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true,
      omitBackground: false,
    });

    await page.close();

    // Save to file
    const timestamp = Date.now();
    const filename = `canvas-${timestamp}.png`;
    const filepath = path.join(__dirname, filename);
    
    fs.writeFileSync(filepath, screenshot);

    res.json({
      success: true,
      filename: filename,
      path: filepath,
      size: screenshot.length,
    });
  } catch (error) {
    console.error('Screenshot error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/screenshots', (req, res) => {
  const files = fs.readdirSync(__dirname)
    .filter(f => f.startsWith('canvas-') && f.endsWith('.png'))
    .sort()
    .reverse()
    .slice(0, 10);
  res.json({ files });
});

app.get('/screenshot/:filename', (req, res) => {
  const filepath = path.join(__dirname, req.params.filename);
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Screenshot server running on http://localhost:${PORT}`);
  console.log(`POST http://localhost:${PORT}/screenshot to capture`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  if (browser) await browser.close();
  process.exit();
});
