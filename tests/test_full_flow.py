from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 720})
    
    print('Navigating to http://localhost:5173...')
    page.goto('http://localhost:5173', wait_until='domcontentloaded')
    
    # Wait for Browse button
    print('Waiting for Browse button...')
    page.wait_for_selector('button:has-text("Browse")', timeout=10000)
    page.wait_for_timeout(1000)
    
    # Click Browse
    print('Clicking Browse button...')
    page.click('button:has-text("Browse")')
    page.wait_for_timeout(2000)
    page.screenshot(path='pw_test_browse.png')
    print('Saved pw_test_browse.png!')

    # Progress through mission staging
    print('Selecting Water Ice...')
    page.click('text="Water Ice"')
    page.wait_for_timeout(500)
    page.click('text="Next"')
    page.wait_for_timeout(600)
    page.click('text="Next"')
    page.wait_for_timeout(600)
    page.click('text="Next"')
    page.wait_for_timeout(600)
    
    print('Clicking Launch Expedition...')
    page.click('text="Launch Expedition"')
    page.wait_for_timeout(3500)
    page.screenshot(path='pw_test_timeline.png')
    print('Saved pw_test_timeline.png!')

    browser.close()
