import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Simple static server for dist/
const distDir = 'c:\\Users\\Asus\\OneDrive\\Desktop\\The NASA Space App\\Challenge 4\\clps-lunar-browser\\dist';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(distDir, decodeURIComponent(reqPath));

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // SPA fallback
    const indexPath = path.join(distDir, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexPath).pipe(res);
  }
});

server.listen(4199, async () => {
  console.log('Test server listening on http://localhost:4199');
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // Test 1: Mission Staging Moon texture
  console.log('Navigating to mission staging...');
  await page.goto('http://localhost:4199/?staging=true', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const stagingShotPath = 'c:\\Users\\Asus\\OneDrive\\Desktop\\The NASA Space App\\Challenge 4\\clps-lunar-browser\\verify_staging_moon.png';
  await page.locator('#root').screenshot({ path: stagingShotPath });
  console.log('Staging Moon screenshot saved to:', stagingShotPath);

  // Test 2: Direct simulation launch (post-landing view)
  console.log('Navigating to direct simulation...');
  await page.goto('http://localhost:4199/?direct=true', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const directSimShotPath = 'c:\\Users\\Asus\\OneDrive\\Desktop\\The NASA Space App\\Challenge 4\\clps-lunar-browser\\verify_surface_lander_rover.png';
  await page.locator('#root').screenshot({ path: directSimShotPath });
  console.log('Surface Lander & Rover screenshot saved to:', directSimShotPath);

  await browser.close();
  server.close();
  process.exit(0);
});
