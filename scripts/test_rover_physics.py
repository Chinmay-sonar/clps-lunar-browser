import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        page.on('pageerror', lambda err: print(f"PAGE ERROR: {err}"))
        
        # Test on 5174 or 5173
        url = 'http://localhost:5174/'
        try:
            await page.goto(url, wait_until='networkidle', timeout=6000)
        except Exception:
            url = 'http://localhost:5173/'
            await page.goto(url, wait_until='networkidle')
            
        print(f"Connected to {url}")
        await asyncio.sleep(2)
        
        # Click "DESCEND TO SURFACE"
        descend_btn = await page.query_selector('button:has-text("DESCEND")')
        if descend_btn:
            await descend_btn.click(force=True)
        # Wait for descent to finish and reach surface
        print("Waiting for touchdown and surface transition...")
        for _ in range(25):
            await asyncio.sleep(1)
            hud = await page.query_selector('text=ALTITUDE')
            if not hud:
                print("Surface active!")
                break
                
        await asyncio.sleep(2)
        print("Driving forward with KeyW for 3 seconds...")
        await page.keyboard.down('KeyW')
        await asyncio.sleep(3)
        await page.keyboard.up('KeyW')
        await asyncio.sleep(1)
        
        await page.screenshot(path="scripts/test_rover_grounded.png")
        print("Captured screenshot to scripts/test_rover_grounded.png")
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
