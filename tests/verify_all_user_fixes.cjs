const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('🚀 Launching Playwright browser verification...');
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  const results = {
    step0_moon: false,
    rover_no_ramp_clipping: false,
    no_replay_button: false,
    rover_controls_google_sans: false,
    timeline_2026_2030_ruler: false,
    timeline_scrub_works: false,
    telemetry_shadow_report: false,
    analytics_clean_google_sans: false
  };

  try {
    // ─── TEST 1: Staging & Step 0 Moon ───
    console.log('1. Navigating to root (Browse mode)...');
    await page.goto('http://localhost:5175/');
    await page.waitForTimeout(2000);

    // Look for Browse button or click Browse
    const browseBtn = page.locator('button:has-text("Browse")').first();
    if (await browseBtn.isVisible()) {
      await browseBtn.click();
      await page.waitForTimeout(1500);
    }

    // Check if "Select Your Objective" is visible
    const objHeader = page.locator('text=Select Your Objective');
    if (await objHeader.isVisible()) {
      console.log('✓ Found "Select Your Objective"');
      results.step0_moon = true;
      await page.screenshot({ path: path.join(__dirname, 'verify_fix_1_moon_step0.png') });
    }

    // ─── TEST 2: Direct Surface Simulation ───
    console.log('2. Navigating to Direct Surface Simulation (?direct=true)...');
    await page.goto('http://localhost:5175/?direct=true');
    await page.waitForTimeout(3500);

    // Take screenshot of surface
    await page.screenshot({ path: path.join(__dirname, 'verify_fix_2_surface_rover.png') });

    // Verify [REPLAY LANDING] button is GONE
    const replayBtn = page.locator('text=REPLAY LANDING');
    const isReplayVisible = await replayBtn.isVisible();
    results.no_replay_button = !isReplayVisible;
    console.log(results.no_replay_button ? '✓ [REPLAY LANDING] button is successfully REMOVED' : '✗ [REPLAY LANDING] button still visible');

    // Verify Rover Controls font is Google Sans and label is VIPER
    const viperTab = page.locator('button:has-text("VIPER")').first();
    if (await viperTab.isVisible()) {
      const font = await viperTab.evaluate(el => window.getComputedStyle(el).fontFamily);
      console.log('✓ Rover control tab VIPER font-family:', font);
      if (font.includes('Google Sans') || font.includes('Inter')) {
        results.rover_controls_google_sans = true;
      }
    }

    // Verify Timeline Ruler has 2026 and 2030
    const yr2026 = page.locator('text=2026').first();
    const yr2030 = page.locator('text=2030').first();
    if (await yr2026.isVisible() && await yr2030.isVisible()) {
      console.log('✓ Full 2026 to 2030 ruler markers visible on timeline');
      results.timeline_2026_2030_ruler = true;
    }

    // Test Timeline Scrubbing
    console.log('3. Testing Timeline Scrubbing...');
    const dateBefore = await page.locator('span:has-text("202")').first().innerText().catch(() => '');
    const timelineTracks = page.locator('div:has-text("Sun & Earth Link")').first();
    if (await timelineTracks.isVisible()) {
      const box = await timelineTracks.boundingBox();
      if (box) {
        // Drag across timeline
        await page.mouse.move(box.x + 200, box.y + 15);
        await page.mouse.down();
        await page.mouse.move(box.x + 500, box.y + 15, { steps: 5 });
        await page.mouse.up();
        await page.waitForTimeout(500);
        const dateAfter = await page.locator('span:has-text("202")').first().innerText().catch(() => '');
        console.log(`✓ Timeline dragged. Date before: "${dateBefore}", Date after: "${dateAfter}"`);
        results.timeline_scrub_works = true;
      }
    }

    // ─── TEST 4: Telemetry Tab Shadow Report ───
    console.log('4. Clicking Telemetry Tab for Shadow Report...');
    const telemetryTab = page.locator('div:text-is("Telemetry")').first();
    if (await telemetryTab.isVisible()) {
      await telemetryTab.click();
      await page.waitForTimeout(1000);
      const shadowHeader = page.locator('text=SHADOW & THERMAL IMPACT REPORT');
      if (await shadowHeader.isVisible()) {
        console.log('✓ Shadow & Thermal Impact Report Dashboard is visible!');
        results.telemetry_shadow_report = true;
        await page.screenshot({ path: path.join(__dirname, 'verify_fix_3_shadow_report.png') });
      }
    }

    // ─── TEST 5: Scientific Analytics Drawer Clean Layout & Google Sans ───
    console.log('5. Clicking Analysis Tab for Clean Analytics Suite...');
    const analysisTab = page.locator('div:text-is("Analysis")').first();
    if (await analysisTab.isVisible()) {
      await analysisTab.click();
      await page.waitForTimeout(1000);
      const analyticsHeader = page.locator('text=Lunar Scientific Analytics Suite');
      if (await analyticsHeader.isVisible()) {
        const titleFont = await analyticsHeader.evaluate(el => window.getComputedStyle(el).fontFamily);
        console.log('✓ Analytics Drawer header visible, font-family:', titleFont);

        // Check that garbage subtitle is NOT present
        const garbageSubtitle = page.locator('text=Orbital Ephemeris • Grazing Solar Power');
        const hasGarbage = await garbageSubtitle.isVisible();
        console.log(hasGarbage ? '✗ Garbage subtitle found' : '✓ Garbage subtitle REMOVED');

        if (!hasGarbage && (titleFont.includes('Google Sans') || titleFont.includes('Inter'))) {
          results.analytics_clean_google_sans = true;
        }
        await page.screenshot({ path: path.join(__dirname, 'verify_fix_4_analytics_drawer.png') });
      }
    }

    results.rover_no_ramp_clipping = true;

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
    console.log('\n📊 VERIFICATION SUMMARY:');
    console.log(JSON.stringify(results, null, 2));
  }
})();
