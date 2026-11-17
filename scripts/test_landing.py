import asyncio
import sys
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        errors = []
        page.on('console', lambda msg: print(f"[{msg.type.upper()}] {msg.text.encode('ascii', errors='replace').decode()}"))
        page.on('pageerror', lambda err: print(f"PAGE ERROR: {err}"))
        
        print("1. Navigating to http://localhost:5173/ ...")
        await page.goto('http://localhost:5173/', wait_until='networkidle')
        await asyncio.sleep(2)
        
        buttons = await page.query_selector_all('button')
        target_btn = None
        for b in buttons:
            txt = (await b.inner_text()).strip()
            ascii_txt = txt.encode('ascii', errors='replace').decode()
            if 'DESCEND' in txt or 'LAUNCH' in txt:
                target_btn = b
                print("Clicking target button:", ascii_txt)
                break
                
        if target_btn:
            await target_btn.click()
        else:
            print("No descend/launch button found!")
            
        print("Observing landing sequence until completion...")
        for s in range(28):
            await asyncio.sleep(1)
            hud = await page.query_selector('text=ALTITUDE')
            if hud:
                try:
                    parent = await hud.evaluate_handle('el => el.parentElement.parentElement.innerText')
                    val = str(parent).replace('\n', ' | ')
                    print(f"Sec {s+1}: {val}")
                except Exception:
                    print(f"Sec {s+1}: HUD transition")
            else:
                print(f"Sec {s+1}: [DONE] Landing HUD cleared! Surface Driving Mode active.")
                break
                
        await page.screenshot(path="scripts/test_landing_final_done.png")
        print("Saved final screenshot to scripts/test_landing_final_done.png")
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
