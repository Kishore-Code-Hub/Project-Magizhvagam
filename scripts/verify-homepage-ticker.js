const { chromium } = require('playwright');

(async () => {
  console.log('=== Starting E2E Product Ticker Verification ===');
  const browser = await chromium.launch({ headless: true });

  // ─── TEST 1: DESKTOP LIFECYCLE & HOVER PAUSE ───
  console.log('\n--- TEST 1: Desktop Viewport (1280x1024) ---');
  const contextDesktop = await browser.newContext({
    viewport: { width: 1280, height: 1024 }
  });
  const pageDesktop = await contextDesktop.newPage();
  
  // Log page errors
  pageDesktop.on('pageerror', err => {
    console.error('  [PAGE ERROR]:', err.message);
  });

  await pageDesktop.goto('http://localhost:5000/');
  await pageDesktop.waitForTimeout(3000); // Allow data fetch and layout

  const initialDesktopState = await pageDesktop.evaluate(() => {
    const section = document.querySelector('.infinite-product-ticker-section');
    const track = document.getElementById('infinite-ticker-track');
    const items = track ? track.querySelectorAll('.ticker-item') : [];
    
    return {
      isVisible: section && getComputedStyle(section).display === 'block',
      itemsCount: items.length,
      playState: track ? getComputedStyle(track).animationPlayState : null
    };
  });
  console.log(`  Ticker section visible: ${initialDesktopState.isVisible}`);
  console.log(`  Items fetched and duplicated: ${initialDesktopState.itemsCount}`);
  console.log(`  Initial animation play state: ${initialDesktopState.playState}`);

  if (initialDesktopState.itemsCount === 0) {
    console.error('  [FAIL]: Ticker contains no items.');
    process.exit(1);
  }

  // Hover over the ticker section
  console.log('  Hovering over ticker section...');
  await pageDesktop.hover('.infinite-product-ticker-section');
  await pageDesktop.waitForTimeout(500);

  const hoveredPlayState = await pageDesktop.evaluate(() => {
    const track = document.getElementById('infinite-ticker-track');
    return track ? getComputedStyle(track).animationPlayState : null;
  });
  console.log(`  Animation play state while hovered: ${hoveredPlayState}`);

  if (hoveredPlayState === 'paused') {
    console.log('  [PASS]: Animation correctly pauses on desktop hover.');
  } else {
    console.error('  [FAIL]: Animation did not pause on desktop hover.');
    process.exit(1);
  }

  // Move cursor away
  console.log('  Moving cursor away from ticker track...');
  await pageDesktop.mouse.move(0, 0);
  await pageDesktop.waitForTimeout(500);

  const leftPlayState = await pageDesktop.evaluate(() => {
    const track = document.getElementById('infinite-ticker-track');
    return track ? getComputedStyle(track).animationPlayState : null;
  });
  console.log(`  Animation play state after mouse leaves: ${leftPlayState}`);

  if (leftPlayState === 'running') {
    console.log('  [PASS]: Animation correctly resumes when cursor leaves.');
  } else {
    console.error('  [FAIL]: Animation did not resume.');
    process.exit(1);
  }

  // ─── TEST 2: MOBILE CONTINUOUS SCROLLING (NO HOVER PAUSE) ───
  console.log('\n--- TEST 2: Mobile Viewport (375x667) ---');
  const contextMobile = await browser.newContext({
    viewport: { width: 375, height: 667 }
  });
  const pageMobile = await contextMobile.newPage();
  
  await pageMobile.goto('http://localhost:5000/');
  await pageMobile.waitForTimeout(3000);

  // Hover on mobile shouldn't trigger pause
  console.log('  Attempting to hover over ticker section on mobile...');
  await pageMobile.hover('.infinite-product-ticker-section');
  await pageMobile.waitForTimeout(500);

  const mobilePlayState = await pageMobile.evaluate(() => {
    const track = document.getElementById('infinite-ticker-track');
    return track ? getComputedStyle(track).animationPlayState : null;
  });
  console.log(`  Mobile animation play state when hovered: ${mobilePlayState}`);

  if (mobilePlayState === 'running') {
    console.log('  [PASS]: Continuous scrolling is preserved on mobile (no hover pause).');
  } else {
    console.error('  [FAIL]: Ticker paused on mobile hover.');
    process.exit(1);
  }

  // ─── TEST 3: SPA LIFECYCLE REINITIALIZATION ───
  console.log('\n--- TEST 3: SPA Client-side Navigation Cycles ---');
  console.log('  Navigating away from Home page...');
  await pageDesktop.click('a[href="/products"]');
  await pageDesktop.waitForTimeout(3000);

  const onProductsPage = await pageDesktop.evaluate(() => {
    return !document.getElementById('infinite-ticker-track');
  });
  console.log(`  Ticker removed from active DOM on page change: ${onProductsPage}`);

  console.log('  Navigating back to Home page...');
  await pageDesktop.click('a[href="/"]');
  await pageDesktop.waitForTimeout(3000);

  const restoredState = await pageDesktop.evaluate(() => {
    const section = document.querySelector('.infinite-product-ticker-section');
    const track = document.getElementById('infinite-ticker-track');
    const items = track ? track.querySelectorAll('.ticker-item') : [];
    return {
      isVisible: section && getComputedStyle(section).display === 'block',
      itemsCount: items.length,
      playState: track ? getComputedStyle(track).animationPlayState : null
    };
  });
  console.log(`  Ticker restored and visible: ${restoredState.isVisible}`);
  console.log(`  Ticker items count after navigation: ${restoredState.itemsCount}`);
  console.log(`  Ticker play state: ${restoredState.playState}`);

  if (restoredState.itemsCount > 0 && restoredState.isVisible) {
    console.log('  [PASS]: Ticker re-initialized flawlessly on back navigation.');
  } else {
    console.error('  [FAIL]: Ticker did not load on back navigation.');
    process.exit(1);
  }

  await browser.close();
  console.log('\n=== E2E Product Ticker Verification SUCCESS ===');
})();
