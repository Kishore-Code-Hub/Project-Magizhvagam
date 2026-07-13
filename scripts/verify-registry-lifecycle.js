const { chromium } = require('playwright');

(async () => {
  console.log('=== Starting Unified Lifecycle & Page Registry Verification ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  const errors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('[Forensic') || text.includes('[MZLifecycle]') || text.includes('[MZTransition]') || text.includes('MZPage')) {
      console.log(`[CONSOLE] ${text}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.error(`[JS ERROR] ${err.stack || err.message}`);
  });

  try {
    // Phase 1: Verify Page Registry on Load
    console.log('\n--- PHASE 1: Direct Load & Registry Check ---');
    await page.goto('http://localhost:5000/products.html');
    await page.waitForTimeout(3000);

    const registryKeys = await page.evaluate(() => Object.keys(window.MZPageRegistry || {}));
    console.log('Registered pages in window.MZPageRegistry:', registryKeys);

    // Assert catalog page key
    if (registryKeys.includes('products')) {
      console.log('SUCCESS: "products" is successfully registered.');
    } else {
      console.error('FAIL: "products" is NOT registered!');
    }

    // Assert cart page key
    if (registryKeys.includes('cart')) {
      console.log('SUCCESS: "cart" is successfully registered.');
    }

    // Phase 2: Navigation Chain (Storefront)
    console.log('\n--- PHASE 2: Client-side Navigation Chain ---');
    const pathnames = ['/index.html', '/products.html', '/about.html', '/contact.html', '/login.html'];
    
    for (const pathname of pathnames) {
      console.log(`Navigating client-side to: ${pathname}`);
      await page.evaluate((p) => window.MZNavigate(p), pathname);
      await page.waitForTimeout(2500); // Wait for transition animation
      
      const activePageId = await page.evaluate(() => window.MZLifecycle.getActivePageId());
      console.log(`  Current active page ID: ${activePageId}`);
    }

    // Phase 3: Console Error Audit
    console.log('\n--- PHASE 3: Console Error Audit ---');
    if (errors.length === 0) {
      console.log('SUCCESS: Zero JavaScript runtime errors caught during navigation chain!');
    } else {
      console.error(`FAIL: Caught ${errors.length} JavaScript runtime errors:`);
      errors.forEach(e => console.error(`  - ${e}`));
    }

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    await browser.close();
    console.log('\n=== Verification Finished ===');
  }
})();
