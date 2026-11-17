const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to direct simulation...');
  await page.goto('http://localhost:5173/?direct=true', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Take screenshot of surface with new timeline indicators
  await page.screenshot({ path: path.join(__dirname, 'test_timeline_verified.png') });
  console.log('Saved test_timeline_verified.png');

  // Click on "Guide" in Navbar
  const guideBtn = page.locator('text=Guide');
  if (await guideBtn.count() > 0) {
    await guideBtn.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(__dirname, 'test_guide_card_verified.png') });
    console.log('Saved test_guide_card_verified.png');

    // Click on SOLAR DYNAMICS tab
    const solarTab = page.locator('button:has-text("SOLAR DYNAMICS")');
    if (await solarTab.count() > 0) {
      await solarTab.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(__dirname, 'test_guide_solar_tab.png') });
      console.log('Saved test_guide_solar_tab.png');
    }

    // Click on EARTH DTE tab
    const earthTab = page.locator('button:has-text("EARTH DTE")');
    if (await earthTab.count() > 0) {
      await earthTab.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(__dirname, 'test_guide_earth_tab.png') });
      console.log('Saved test_guide_earth_tab.png');
    }

    // Click on CHALLENGE CRITERIA tab
    const criteriaTab = page.locator('button:has-text("CHALLENGE CRITERIA")');
    if (await criteriaTab.count() > 0) {
      await criteriaTab.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(__dirname, 'test_guide_criteria_tab.png') });
      console.log('Saved test_guide_criteria_tab.png');
    }
  }

  await browser.close();
  console.log('Verification script completed.');
})();
