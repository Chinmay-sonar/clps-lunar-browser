const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER PAGE ERROR:', err.message, err.stack));
  await page.goto('http://localhost:5175/?direct=true', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const btn = page.locator('#timeline-collapse-toggle');
  console.log('Found #timeline-collapse-toggle count:', await btn.count());
  if (await btn.count() > 0) {
    console.log('Clicking #timeline-collapse-toggle via evaluate...');
    await btn.evaluate(el => el.click());
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(__dirname, 'test_collapsed_single_line_real.png') });
    console.log('Saved test_collapsed_single_line_real.png');
  }
  await browser.close();
})();
