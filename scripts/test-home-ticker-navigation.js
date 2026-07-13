const { chromium } = require('playwright');

(async () => {
  console.log('=== Testing Homepage Ticker Navigation Lifecycle ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Log page errors
  page.on('pageerror', err => {
    console.error('[PAGE ERROR]:', err.message);
  });

  console.log('1. Loading homepage initially...');
  await page.goto('http://localhost:5000/');
  await page.waitForTimeout(3000);

  const initialItems = await page.evaluate(() => {
    const track = document.getElementById('infinite-ticker-track');
    return track ? track.querySelectorAll('.ticker-item').length : 0;
  });
  console.log(`   Initial ticker items count: ${initialItems}`);

  // Navigate to products catalog page (client-side navigation)
  console.log('2. Navigating to products page (client-side transition)...');
  await page.click('a[href="/products"]');
  await page.waitForTimeout(3000);

  const productsItems = await page.evaluate(() => {
    const track = document.getElementById('infinite-ticker-track');
    return track ? track.querySelectorAll('.ticker-item').length : 0;
  });
  console.log(`   Products page ticker items count (should be 0 since it is not on Products page): ${productsItems}`);

  // Navigate back to homepage
  console.log('3. Navigating back to homepage (client-side transition)...');
  // Find a link to home, e.g. logo or home button
  await page.click('a[href="/"]');
  await page.waitForTimeout(3000);

  const backItems = await page.evaluate(() => {
    const track = document.getElementById('infinite-ticker-track');
    const display = track ? getComputedStyle(track.closest('.infinite-product-ticker-section')).display : 'none';
    return {
      count: track ? track.querySelectorAll('.ticker-item').length : 0,
      display
    };
  });
  console.log(`   Back on homepage ticker items count: ${backItems.count}`);
  console.log(`   Back on homepage ticker display style: ${backItems.display}`);

  if (backItems.count > 0 && backItems.display === 'block') {
    console.log('SUCCESS: Product ticker successfully restored and re-initialized on back navigation!');
  } else {
    console.warn('FAILURE: Product ticker is missing or hidden after navigating back!');
  }

  await browser.close();
})();
