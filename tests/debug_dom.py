import subprocess
chrome = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
cmd = [chrome, '--headless=new', '--dump-dom', 'https://codyseeylunar.surge.sh']
res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
hero_idx = res.stdout.find('CodyseeyPreloader')
if hero_idx == -1:
    hero_idx = res.stdout.find('Elevate')
print('Elevate found at:', hero_idx)
if hero_idx != -1:
    print(res.stdout[hero_idx-500:hero_idx+1000])
else:
    # Print what comes after ViperTourTheater
    print(res.stdout[-3000:])
