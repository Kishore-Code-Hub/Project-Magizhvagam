const { chromium } = require('playwright');

(async () => {
  console.log('=== Starting E2E Responsive Overlays Verification ===');
  const browser = await chromium.launch({ headless: true });

  // ─── TEST 1: Mobile Bottom Sheet (375px) ───
  console.log('\n--- MOBILE VIEWPORT TEST (375x667) ---');
  const contextMobile = await browser.newContext({
    viewport: { width: 375, height: 667 }
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto('http://localhost:5000/products');
  await pageMobile.waitForTimeout(2000);

  // Assert hidden initially
  const initialSidebarOffset = await pageMobile.evaluate(() => {
    const sidebar = document.querySelector('.filter-sidebar');
    if (!sidebar) return null;
    const rect = sidebar.getBoundingClientRect();
    const style = getComputedStyle(sidebar);
    return {
      rect,
      display: style.display,
      position: style.position,
      transform: style.transform,
      zIndex: style.zIndex
    };
  });
  console.log(`Initial Sidebar display: ${initialSidebarOffset.display}, position: ${initialSidebarOffset.position}, z-index: ${initialSidebarOffset.zIndex}`);

  // Click Filter button to open
  console.log('Opening mobile filter drawer...');
  await pageMobile.click('#mobile-filter-btn');
  await pageMobile.waitForTimeout(800); // Allow drawer animation

  const openedChecks = await pageMobile.evaluate(() => {
    const sidebar = document.querySelector('.filter-sidebar');
    const backdrop = document.getElementById('mobile-filter-backdrop');
    const rect = sidebar.getBoundingClientRect();
    const style = getComputedStyle(sidebar);
    return {
      isOpenClassAdded: sidebar.classList.contains('open'),
      isBackdropOpen: backdrop.classList.contains('open'),
      isBodyLocked: document.body.style.position === 'fixed',
      position: style.position,
      rect,
      zIndex: style.zIndex
    };
  });
  console.log(`  Sidebar open class added: ${openedChecks.isOpenClassAdded}`);
  console.log(`  Backdrop open class added: ${openedChecks.isBackdropOpen}`);
  console.log(`  Body scroll locked: ${openedChecks.isBodyLocked}`);
  console.log(`  Sidebar position: ${openedChecks.position}`);
  console.log(`  Sidebar bottom alignment: top=${openedChecks.rect.top}, bottom=${openedChecks.rect.bottom}, height=${openedChecks.rect.height}`);

  // Assert it covers the bottom of viewport
  if (openedChecks.rect.bottom === 667) {
    console.log('SUCCESS: Mobile drawer is successfully attached to viewport bottom!');
  } else {
    console.warn(`WARNING: Mobile drawer bottom is at ${openedChecks.rect.bottom} instead of viewport bottom (667).`);
  }

  // Click backdrop to close
  console.log('Closing mobile drawer via backdrop click...');
  await pageMobile.click('#mobile-filter-backdrop', { position: { x: 10, y: 10 } });
  await pageMobile.waitForTimeout(800);

  const closedChecks = await pageMobile.evaluate(() => {
    return {
      isOpenClassAdded: document.querySelector('.filter-sidebar').classList.contains('open'),
      isBodyLocked: document.body.style.position === 'fixed'
    };
  });
  console.log(`  Sidebar open class after closing: ${closedChecks.isOpenClassAdded}`);
  console.log(`  Body scroll locked after closing: ${closedChecks.isBodyLocked}`);

  // ─── TEST 1B: Mobile Sort Dropdown (375px) ───
  console.log('\n--- MOBILE SORT DROPDOWN TEST ---');
  const sortInitial = await pageMobile.evaluate(() => {
    const dropdown = document.getElementById('mobile-sort-dropdown');
    return {
      display: getComputedStyle(dropdown).display,
      isOpen: dropdown.classList.contains('open')
    };
  });
  console.log(`  Sort dropdown initial open class: ${sortInitial.isOpen}, display: ${sortInitial.display}`);

  console.log('Opening mobile sort dropdown...');
  await pageMobile.click('#mobile-sort-btn');
  await pageMobile.waitForTimeout(500);

  const sortOpenChecks = await pageMobile.evaluate(() => {
    const dropdown = document.getElementById('mobile-sort-dropdown');
    const rect = dropdown.getBoundingClientRect();
    return {
      isOpen: dropdown.classList.contains('open'),
      display: getComputedStyle(dropdown).display,
      width: rect.width,
      isBodyLocked: document.body.style.position === 'fixed'
    };
  });
  console.log(`  Sort dropdown open class: ${sortOpenChecks.isOpen}, display: ${sortOpenChecks.display}`);
  console.log(`  Sort dropdown width: ${sortOpenChecks.width}px`);
  console.log(`  Body scroll locked: ${sortOpenChecks.isBodyLocked}`);

  if (sortOpenChecks.width >= 220 && sortOpenChecks.width <= 260) {
    console.log('SUCCESS: Sort dropdown width conforms to design specs (220px to 260px)!');
  } else {
    console.warn(`WARNING: Sort dropdown width is ${sortOpenChecks.width}px, which does not match spec.`);
  }

  // Click outside (e.g. at coordinates x:10, y:10) to close
  console.log('Closing sort dropdown via outside click...');
  await pageMobile.mouse.click(10, 10);
  await pageMobile.waitForTimeout(500);

  const sortClosedChecks = await pageMobile.evaluate(() => {
    const dropdown = document.getElementById('mobile-sort-dropdown');
    return {
      isOpen: dropdown.classList.contains('open')
    };
  });
  console.log(`  Sort dropdown open class after outside click: ${sortClosedChecks.isOpen}`);

  // ─── TEST 2: Tablet Right-Side Drawer (820px) ───
  console.log('\n--- TABLET VIEWPORT TEST (820x1080) ---');
  const contextTablet = await browser.newContext({
    viewport: { width: 820, height: 1080 }
  });
  const pageTablet = await contextTablet.newPage();
  await pageTablet.goto('http://localhost:5000/products');
  await pageTablet.waitForTimeout(2000);

  console.log('Opening tablet filter drawer...');
  await pageTablet.click('#mobile-filter-btn');
  await pageTablet.waitForTimeout(800);

  const tabletChecks = await pageTablet.evaluate(() => {
    const sidebar = document.querySelector('.filter-sidebar');
    const rect = sidebar.getBoundingClientRect();
    const style = getComputedStyle(sidebar);
    return {
      isOpen: sidebar.classList.contains('open'),
      position: style.position,
      rect,
      width: rect.width,
      right: rect.right
    };
  });
  console.log(`  Sidebar open: ${tabletChecks.isOpen}`);
  console.log(`  Sidebar position: ${tabletChecks.position}`);
  console.log(`  Sidebar width: ${tabletChecks.width}px`);
  console.log(`  Sidebar right edge: ${tabletChecks.right}px`);

  // Assert right alignment: on 820px wide viewport, right edge must be exactly 820
  if (tabletChecks.right === 820) {
    console.log('SUCCESS: Tablet drawer is aligned flush with the right edge of the viewport!');
  } else {
    console.warn(`WARNING: Tablet drawer right edge is at ${tabletChecks.right} instead of viewport width (820).`);
  }

  await browser.close();
  console.log('\n=== E2E Overlays Verification Finished ===');
})();
