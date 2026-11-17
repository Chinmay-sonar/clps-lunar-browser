import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        page.on('pageerror', lambda err: print(f"PAGE ERROR: {err}"))
        
        # Test on 5174 then 5173
        url = 'http://localhost:5174/'
        try:
            await page.goto(url, wait_until='networkidle', timeout=6000)
        except Exception:
            url = 'http://localhost:5173/'
            await page.goto(url, wait_until='networkidle')
            
        print(f"Connected to {url}")
        await asyncio.sleep(2)
        
        # Switch to surface view or skip
        await page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const descend = btns.find(b => b.innerText.includes('DESCEND'));
            if (descend) descend.click();
        }""")
        await asyncio.sleep(1.5)
        
        await page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const skip = btns.find(b => b.innerText.includes('SKIP'));
            if (skip) skip.click();
        }""")
        await asyncio.sleep(2)
        
        # Select Rover Camera View (or close camera)
        await page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const roverCam = btns.find(b => b.innerText.toLowerCase().includes('rover') || b.innerText.includes('ROVER'));
            if (roverCam) roverCam.click();
        }""")
        await asyncio.sleep(1.5)
        
        # Drive forward a bit
        await page.keyboard.down('KeyW')
        await asyncio.sleep(1.5)
        await page.keyboard.up('KeyW')
        await asyncio.sleep(1)
        
        await page.screenshot(path="scripts/test_rover_closeup.png")
        print("Captured screenshot to scripts/test_rover_closeup.png")
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
