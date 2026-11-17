import { chromium } from 'playwright';
import { preview } from 'vite';

async function test() {
  const server = await preview({ preview: { port: 4175 } });
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Navigating to root...');
  await page.goto('http://localhost:4175/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Click Browse to enter Mission Staging immediately
  const browseBtn = page.locator('button:has-text("Browse")').first();
  if (await browseBtn.isVisible()) {
    console.log('Clicking Browse...');
    await browseBtn.click();
    await page.waitForTimeout(1500);
  }

  // Step 0: Objective
  const firstObj = page.locator('text=Lunar Mission Control Site').first();
  if (await firstObj.isVisible()) {
    console.log('Selecting objective...');
    await firstObj.click();
    await page.waitForTimeout(800);
  }

  // Click Next button
  const nextBtn1 = page.locator('button:has-text("Next")').last();
  if (await nextBtn1.isVisible()) {
    console.log('Clicking Next to Step 1 (Site)...');
    await nextBtn1.click();
    await page.waitForTimeout(1000);
  }

  // Step 1: Select site
  const firstSite = page.locator('text=Malapert Mountain').first();
  if (await firstSite.isVisible()) {
    console.log('Selecting site...');
    await firstSite.click();
    await page.waitForTimeout(800);
  }

  // Click Next button to Step 2 (Rover)
  const nextBtn2 = page.locator('button:has-text("Next")').last();
  if (await nextBtn2.isVisible()) {
    console.log('Clicking Next to Step 2 (Rover)...');
    await nextBtn2.click();
    await page.waitForTimeout(1000);
  }

  // Step 2: Check UYOR
  const uyor = page.locator('text=Upload Your Own Rover').first();
  if (await uyor.isVisible()) {
    console.log('Found Upload Your Own Rover! Clicking it...');
    await uyor.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'C:/Users/Asus/.gemini/antigravity/brain/da4554cc-f5e2-4174-9da0-c9d2bd7bc5d6/test_uyor_dropzone_verified.png' });
    console.log('Saved test_uyor_dropzone_verified.png');
  } else {
    console.log('Saving debug screenshot...');
    await page.screenshot({ path: 'C:/Users/Asus/.gemini/antigravity/brain/da4554cc-f5e2-4174-9da0-c9d2bd7bc5d6/test_staging_debug_rover.png' });
  }

  await browser.close();
  await server.close();
  console.log('Done!');
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
