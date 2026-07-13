const { chromium } = require('playwright');

(async () => {
  console.log('=== Debugging Product Ticker on Homepage ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Log page errors and console messages
  page.on('pageerror', err => {
    console.error('[PAGE ERROR]:', err.message);
  });
  page.on('console', msg => {
    console.log('[PAGE CONSOLE]:', msg.text());
  });

  // Track API requests
  page.on('request', req => {
    if (req.url().includes('/api/')) {
      console.log(`[API REQUEST]: ${req.method()} ${req.url()}`);
    }
  });
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      console.log(`[API RESPONSE]: ${res.status()} ${res.url()}`);
    }
  });

  console.log('Navigating to homepage...');
  await page.goto('http://localhost:5000/');
  await page.waitForTimeout(3000); // Wait for transition and loads

  const tickerState = await page.evaluate(() => {
    const section = document.querySelector('.infinite-product-ticker-section');
    const track = document.getElementById('infinite-ticker-track');
    const g1 = document.getElementById('ticker-group-1');
    const g2 = document.getElementById('ticker-group-2');
    
    return {
      sectionExists: !!section,
      sectionDisplay: section ? getComputedStyle(section).display : null,
      trackExists: !!track,
      trackAnimation: track ? getComputedStyle(track).animation : null,
      g1HTML: g1 ? g1.innerHTML.slice(0, 200) : null,
      g2HTML: g2 ? g2.innerHTML.slice(0, 200) : null,
      g1Count: g1 ? g1.querySelectorAll('.ticker-item').length : 0
    };
  });

  console.log('\n--- Ticker State ---');
  console.log('Section exists:', tickerState.sectionExists);
  console.log('Section display style:', tickerState.sectionDisplay);
  console.log('Track exists:', tickerState.trackExists);
  console.log('Track animation style:', tickerState.trackAnimation);
  console.log('Group 1 item count:', tickerState.g1Count);
  console.log('Group 1 HTML Snippet:', tickerState.g1HTML);

  await browser.close();
  console.log('\n=== Finished Diagnostic ===');
})();
