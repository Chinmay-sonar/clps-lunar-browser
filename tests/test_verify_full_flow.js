import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

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
    const indexPath = path.join(distDir, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexPath).pipe(res);
  }
});

server.listen(4200, async () => {
  console.log('Testing video to surface flow on http://localhost:4200');
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:4200/?staging=true', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Click on "Lunar Mission Control Site" objective (Step 1)
  console.log('Selecting objective...');
  const objBtn = page.locator('text=Lunar Mission Control Site').first();
  if (await objBtn.isVisible()) {
    await objBtn.click();
  }
  await page.waitForTimeout(1000);

  // Step 2: Next step to vehicle
  console.log('Advancing step 2 -> 3...');
  const nextBtn1 = page.locator('button:has-text("Next")').first();
  if (await nextBtn1.isVisible()) {
    await nextBtn1.click();
  }
  await page.waitForTimeout(1000);

  // Step 3 -> 4
  console.log('Advancing step 3 -> 4...');
  const nextBtn2 = page.locator('button:has-text("Next")').first();
  if (await nextBtn2.isVisible()) {
    await nextBtn2.click();
  }
  await page.waitForTimeout(1000);

  // Step 4: Click "ENTER 3D LUNAR BROWSER"
  console.log('Clicking ENTER 3D LUNAR BROWSER...');
  const launchBtn = page.locator('button:has-text("ENTER 3D LUNAR BROWSER"), button:has-text("LAUNCH EXPEDITION")').first();
  if (await launchBtn.isVisible()) {
    await launchBtn.click();
  }
  await page.waitForTimeout(2000);

  // Landing video is playing! Fast forward video to trigger onEnded
  console.log('Triggering video onEnded...');
  await page.evaluate(() => {
    const video = document.querySelector('video');
    if (video) {
      video.currentTime = video.duration || 17.0;
      video.dispatchEvent(new Event('ended'));
    }
  });

  // Capture immediately after video ends (0.5s): 3D surface should be visible, UI chrome emerging
  await page.waitForTimeout(600);
  const postLandingInitial = 'c:\\Users\\Asus\\OneDrive\\Desktop\\The NASA Space App\\Challenge 4\\clps-lunar-browser\\verify_post_landing_initial.png';
  await page.screenshot({ path: postLandingInitial });
  console.log('Saved post-landing initial screenshot to:', postLandingInitial);

  // Wait 1.6s for full UI emergence
  await page.waitForTimeout(1600);
  const postLandingRevealed = 'c:\\Users\\Asus\\OneDrive\\Desktop\\The NASA Space App\\Challenge 4\\clps-lunar-browser\\verify_post_landing_revealed.png';
  await page.screenshot({ path: postLandingRevealed });
  console.log('Saved post-landing revealed screenshot to:', postLandingRevealed);

  await browser.close();
  server.close();
  process.exit(0);
});
