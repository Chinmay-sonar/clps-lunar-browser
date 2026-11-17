const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5175/?direct=true', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const btn = page.locator('#timeline-collapse-toggle');
  console.log('Before click box:', await btn.boundingBox());

  await btn.evaluate(el => el.click());
  await page.waitForTimeout(500);

  console.log('After click box:', await btn.boundingBox());

  const tc = page.locator('text=Lunar Mission Timeline');
  console.log('Lunar Mission Timeline count:', await tc.count());
  if (await tc.count() > 0) {
    console.log('Timeline text box:', await tc.boundingBox());
  }

  // Also check if collapsed elements are present
  const sunText = page.locator('text=Sun: +');
  console.log('Sun text count:', await sunText.count());
  if (await sunText.count() > 0) {
    console.log('Sun text box:', await sunText.boundingBox());
  }

  await page.screenshot({ path: 'screenshot_collapsed_single_line_perfect.png' });
  console.log('Saved screenshot_collapsed_single_line_perfect.png');

  await browser.close();
})();
