from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for url, out_name in [('http://localhost:5173', 'pw_localhost.png'), ('https://codyseeylunar.surge.sh', 'pw_surge.png')]:
        print(f'=== Testing {url} ===')
        page = browser.new_page()
        
        page.on('console', lambda msg: print(f'[{msg.type}] {msg.text}'))
        page.on('pageerror', lambda err: print(f'[PAGE ERROR] {err}'))
        
        try:
            page.goto(url, wait_until='networkidle', timeout=15000)
            print('Page loaded successfully!')
        except Exception as e:
            print('Goto exception:', e)
            
        page.screenshot(path=f'c:\\Users\\Asus\\OneDrive\\Desktop\\The NASA Space App\\Challenge 4\\clps-lunar-browser\\{out_name}')
        print(f'Screenshot saved to {out_name}')
        page.close()
    browser.close()
