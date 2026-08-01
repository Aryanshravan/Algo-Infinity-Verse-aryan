import puppeteer from 'puppeteer';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = 'http://127.0.0.1:8080/index.html';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  
  page.on('console', msg => console.log(`  [${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.log(`  [PAGE_ERR] ${err.message}`));

  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Check if back button exists in DOM at all
  const backBtnExists = await page.evaluate(() => {
    return !!document.querySelector('.mega-menu-back');
  });
  console.log(`Back button in DOM: ${backBtnExists}`);

  // Open hamburger menu
  await page.evaluate(() => document.getElementById('menuToggle')?.click());
  await new Promise(r => setTimeout(r, 600));

  // Open Learn dropdown
  await page.evaluate(() => {
    const toggles = document.querySelectorAll('#navLinks .dropdown-toggle');
    for (const t of toggles) {
      if (t.textContent.includes('Learn')) {
        t.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 500));

  // Check back button visibility inside the open dropdown
  const backBtnInfo = await page.evaluate(() => {
    const btn = document.querySelector('.mega-menu-back');
    if (!btn) return { exists: false };
    const style = window.getComputedStyle(btn);
    const rect = btn.getBoundingClientRect();
    return {
      exists: true,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      rect: { w: rect.width.toFixed(0), h: rect.height.toFixed(0), top: rect.top.toFixed(0) },
      text: btn.textContent?.trim(),
      parentVisible: btn.closest('.dropdown-menu')?.style.display,
    };
  });
  console.log('Back button info:', JSON.stringify(backBtnInfo, null, 2));

  // Click the back button
  if (backBtnInfo.exists) {
    await page.evaluate(() => {
      const btn = document.querySelector('.mega-menu-back');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 300));

    const afterBack = await page.evaluate(() => {
      const nav = document.getElementById('navLinks');
      const dd = document.querySelector('.nav-learn-dropdown.open');
      return {
        navStillOpen: nav?.classList.contains('active'),
        dropdownClosed: !dd,
      };
    });
    console.log('After back click:', JSON.stringify(afterBack, null, 2));
  }

  await page.screenshot({ path: '/tmp/back-btn-check.png', fullPage: false });
  console.log('Screenshot: /tmp/back-btn-check.png');

  await browser.close();
}

run().catch(err => { console.error('FATAL:', err); process.exit(1); });
