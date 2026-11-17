from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 720})
    
    page.on('console', lambda msg: print(f'[{msg.type}] {msg.text}'))
    page.on('pageerror', lambda err: print(f'[PAGE ERROR] {err}'))
    
    page.goto('http://localhost:5173', wait_until='networkidle')
    page.click('text="Water Ice"')
    page.wait_for_timeout(500)
    
    # Click Next
    page.click('text="Next"')
    page.wait_for_timeout(1000)
    page.screenshot(path='c:\\Users\\Asus\\OneDrive\\Desktop\\The NASA Space App\\Challenge 4\\clps-lunar-browser\\step_sites.png')
    print('Sites step captured')
    
    # Click Malapert Mountain or another site
    page.click('button:has-text("Malapert Mountain")')
    page.wait_for_timeout(500)
    page.click('text="Next"')
    page.wait_for_timeout(1000)
    page.screenshot(path='c:\\Users\\Asus\\OneDrive\\Desktop\\The NASA Space App\\Challenge 4\\clps-lunar-browser\\step_rover.png')
    print('Rover step captured')

    # Click Next again to step through date/launch
    page.click('text="Next"')
    page.wait_for_timeout(1000)
    page.screenshot(path='c:\\Users\\Asus\\OneDrive\\Desktop\\The NASA Space App\\Challenge 4\\clps-lunar-browser\\step_date.png')
    print('Date step captured')

    # Click Launch Expedition
    launch_btn = page.locator('text="Launch Expedition"')
    if launch_btn.count() > 0:
        launch_btn.click()
        page.wait_for_timeout(2000)
        page.screenshot(path='c:\\Users\\Asus\\OneDrive\\Desktop\\The NASA Space App\\Challenge 4\\clps-lunar-browser\\step_surface.png')
        print('Surface simulation launched & captured!')

    browser.close()
