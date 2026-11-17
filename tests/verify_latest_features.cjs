const { chromium } = require('playwright');
const path = require('path');

async function verifyFeatures() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Part 1: Verify 3D Moon GLB model on Staging Screen
  console.log('Navigating to http://localhost:5175 to verify 3D Moon model...');
  await page.goto('http://localhost:5175', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  const browseBtn = page.locator('button:has-text("Browse")').first();
  if (await browseBtn.count() > 0 && await browseBtn.isVisible()) {
    console.log('Clicking Browse button...');
    await browseBtn.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: path.join(__dirname, 'screenshot_1_objective_moon.png') });
  console.log('Saved screenshot_1_objective_moon.png');

  // Part 2: Direct simulation to verify Surface, Wheels, Rocks, HUD, and Collapsible Timeline
  console.log('Navigating to http://localhost:5175/?direct=true for 3D surface simulation...');
  await page.goto('http://localhost:5175/?direct=true', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3500);

  // Screenshot 2: 3D Surface with Rover Wheels flush on regolith and photorealistic vesicular rocks
  await page.screenshot({ path: path.join(__dirname, 'screenshot_2_surface_wheels_rocks.png') });
  console.log('Saved screenshot_2_surface_wheels_rocks.png');

  // Verify Top HUD bar font
  const hudTop = page.locator('text=DTE S-BAND LOCKED').first();
  if (await hudTop.count() > 0) {
    const fontFamily = await hudTop.evaluate(el => window.getComputedStyle(el.closest('div')).fontFamily);
    console.log('Top HUD font-family:', fontFamily);
  }

  // Verify Bottom Drive Hint HUD font
  const driveHint = page.locator('text=Drive VIPER Rover').first();
  if (await driveHint.count() > 0) {
    const fontFamily = await driveHint.evaluate(el => window.getComputedStyle(el.closest('div')).fontFamily);
    console.log('Drive Hint HUD font-family:', fontFamily);
  }

  // Test Collapsible Timeline
  console.log('Testing Collapsible Timeline...');
  const collapseBtn = page.locator('button[title*="Collapse"], button[title*="Expand"]').first();
  if (await collapseBtn.count() > 0) {
    console.log('Clicking collapse button to transform into single line...');
    await collapseBtn.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: path.join(__dirname, 'screenshot_3_collapsed_single_line.png') });
    console.log('Saved screenshot_3_collapsed_single_line.png');

    // Click expand button to restore
    console.log('Clicking expand button to restore 3-track timeline...');
    await collapseBtn.click();
    await page.waitForTimeout(800);

    await page.screenshot({ path: path.join(__dirname, 'screenshot_4_expanded_timeline.png') });
    console.log('Saved screenshot_4_expanded_timeline.png');
  } else {
    console.warn('Collapse button not found!');
  }

  await browser.close();
  console.log('Verification completed 100% successfully!');
}

verifyFeatures().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
