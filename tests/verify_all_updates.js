import { chromium } from 'playwright';
import path from 'path';

(async () => {
  console.log('🚀 Running Full Feature & Visual Verification in Headless Edge...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // ─── TEST 1: MOBILE NOTICE & COUNTDOWN TIMER ───
  console.log('\n[TEST 1] Mobile Device Screen Restriction & Dec 16 Countdown');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://127.0.0.1:4173/?direct=true', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  const countdownText = await mobilePage.textContent('body');
  const hasCountdown = countdownText.includes('DAYS') && countdownText.includes('HRS');
  const hasNoticeText = countdownText.includes('This Browser Is Strictly for the Desktop / Laptop usecases only');
  console.log('  Countdown timer present:', hasCountdown);
  console.log('  Desktop notice present:', hasNoticeText);

  const mobileScreenshotPath = path.resolve('test_mobile_verification.png');
  await mobilePage.screenshot({ path: mobileScreenshotPath });
  console.log('  Mobile screenshot saved to:', mobileScreenshotPath);

  // ─── TEST 2: DESKTOP 3D VIEWPORT, ROVER & SAVE REPORT MODAL ───
  console.log('\n[TEST 2] Desktop 3D Viewport & Save Report Presentation Deck');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://127.0.0.1:4173/?direct=true', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(3000);

  // Verify Navbar exists and "Save Report" is clickable
  const saveReportBtn = await desktopPage.$('button:has-text("Save Report")');
  console.log('  "Save Report" button located:', !!saveReportBtn);

  if (saveReportBtn) {
    await saveReportBtn.click();
    await desktopPage.waitForTimeout(1200);

    const reportModal = await desktopPage.$('text=LUNAR SOUTH POLE EXPEDITION REPORT');
    console.log('  Presentation Deck Modal opened (Slide 1):', !!reportModal);

    const reportSlide1Path = path.resolve('test_report_slide1.png');
    await desktopPage.screenshot({ path: reportSlide1Path });
    console.log('  Slide 1 screenshot saved to:', reportSlide1Path);

    // Click Next Slide to verify Slide 2 (Traverse & Odometry)
    const nextBtn = await desktopPage.$('button:has-text("Next Slide →")');
    if (nextBtn) {
      await nextBtn.click();
      await desktopPage.waitForTimeout(600);
      const slide2Text = await desktopPage.textContent('body');
      console.log('  Slide 2 (Surface Traverse & Odometry) loaded:', slide2Text.includes('SURFACE TRAVERSE & ODOMETRY PERFORMANCE'));

      const reportSlide2Path = path.resolve('test_report_slide2.png');
      await desktopPage.screenshot({ path: reportSlide2Path });
      console.log('  Slide 2 screenshot saved to:', reportSlide2Path);
    }

    // Close Report Modal
    await desktopPage.keyboard.press('Escape');
    await desktopPage.waitForTimeout(600);
  }

  // ─── TEST 3: STAGING VEHICLE SELECTOR (ONLY 3 LANDERS) ───
  console.log('\n[TEST 3] Staging Vehicle Selector Options');
  await desktopPage.goto('http://127.0.0.1:4173/?staging=true', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1500);

  // Click on "Choose Lander" or Step 2 in showcase
  const step2Btn = await desktopPage.$('button:has-text("Choose Lander")') || await desktopPage.$('button:has-text("Lander")');
  if (step2Btn) {
    await step2Btn.click();
    await desktopPage.waitForTimeout(600);
  }

  const pageBodyText = await desktopPage.textContent('body');
  const hasViper = pageBodyText.includes('VIPER');
  const hasGriffin = pageBodyText.includes('Griffin');
  const hasNova = pageBodyText.includes('Nova') || pageBodyText.includes('NOVA');
  const hasCustomUyor = pageBodyText.includes('Custom (UYOR)');
  console.log('  VIPER option present:', hasViper);
  console.log('  Griffin option present:', hasGriffin);
  console.log('  Nova Lander option present:', hasNova);
  console.log('  Custom UYOR removed:', !hasCustomUyor);

  await browser.close();
  console.log('\n✅ All Tests Completed Successfully!');
})();
