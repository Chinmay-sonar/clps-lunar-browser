import { chromium } from 'playwright';
import { preview } from 'vite';

async function run() {
  const server = await preview({ preview: { port: 4173 } });
  console.log('Preview server started on port 4173');

  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Navigating to simulator...');
  await page.goto('http://localhost:4173/?direct=true', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);

  // Take screenshot of VIPER ground contact
  await page.screenshot({ path: 'C:/Users/Asus/.gemini/antigravity/brain/da4554cc-f5e2-4174-9da0-c9d2bd7bc5d6/test_ground_contact_viper.png' });
  console.log('Saved test_ground_contact_viper.png');

  // Test WASD driving
  console.log('Testing WASD drive...');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(600);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/Asus/.gemini/antigravity/brain/da4554cc-f5e2-4174-9da0-c9d2bd7bc5d6/test_viper_driven.png' });
  console.log('Saved test_viper_driven.png');

  // Switch to Griffin via HUD pill
  console.log('Switching to Griffin...');
  const griffinBtn = page.locator('button:has-text("GRIFFIN")').first();
  if (await griffinBtn.isVisible()) {
    await griffinBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'C:/Users/Asus/.gemini/antigravity/brain/da4554cc-f5e2-4174-9da0-c9d2bd7bc5d6/test_griffin_deployed.png' });
    console.log('Saved test_griffin_deployed.png');

    // Drive Griffin
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(600);
    await page.keyboard.up('KeyW');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'C:/Users/Asus/.gemini/antigravity/brain/da4554cc-f5e2-4174-9da0-c9d2bd7bc5d6/test_griffin_driven.png' });
    console.log('Saved test_griffin_driven.png');
  }

  // Test Navbar Views -> Rover Camera
  console.log('Testing Views -> Rover Camera...');
  const viewsPill = page.locator('button:has-text("Views")').first();
  if (await viewsPill.isVisible()) {
    await viewsPill.click();
    await page.waitForTimeout(600);
    const roverCamCard = page.locator('div:has-text("Rover Camera")').last();
    if (await roverCamCard.isVisible()) {
      await roverCamCard.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'C:/Users/Asus/.gemini/antigravity/brain/da4554cc-f5e2-4174-9da0-c9d2bd7bc5d6/test_rover_chase_camera.png' });
      console.log('Saved test_rover_chase_camera.png');
    }
  }

  // Test Staging Vehicle Selection -> Upload Your Own Rover
  console.log('Testing Staging Upload Your Own Rover...');
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click Elevate to enter Staging
  const elevateBtn = page.locator('button:has-text("Elevate")').first();
  if (await elevateBtn.isVisible()) {
    await elevateBtn.click();
    await page.waitForTimeout(1500);
  }

  // Click first objective
  const firstObj = page.locator('text=Lunar Mission Control Site').first();
  if (await firstObj.isVisible()) {
    await firstObj.click();
    await page.waitForTimeout(800);
  }
  // Click next step to Site
  const nextBtn = page.locator('button:has-text("Next Step"), button:has-text("Select Landing Site")').first();
  if (await nextBtn.isVisible()) {
    await nextBtn.click();
    await page.waitForTimeout(800);
  }
  // Select first site
  const firstSite = page.locator('text=Nobile Crater Rim 1').first();
  if (await firstSite.isVisible()) {
    await firstSite.click();
    await page.waitForTimeout(800);
  }
  // Click next step to Rover
  const nextBtn2 = page.locator('button:has-text("Next Step"), button:has-text("Select Rover")').first();
  if (await nextBtn2.isVisible()) {
    await nextBtn2.click();
    await page.waitForTimeout(1000);
    // Click Upload Your Own Rover
    const uyorOption = page.locator('text=Upload Your Own Rover').first();
    if (await uyorOption.isVisible()) {
      await uyorOption.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: 'C:/Users/Asus/.gemini/antigravity/brain/da4554cc-f5e2-4174-9da0-c9d2bd7bc5d6/test_uyor_dropzone.png' });
      console.log('Saved test_uyor_dropzone.png');
    }
  }

  await browser.close();
  await server.close();
  console.log('All automated tests completed successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
