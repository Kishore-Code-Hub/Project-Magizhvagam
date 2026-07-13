const { chromium } = require('playwright');

(async () => {
  console.log('=== Starting E2E Admin Products Dashboard Verification ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Forensic') || text.includes('[MZLifecycle]') || text.includes('[MZTransition]') || text.includes('adminFetch') || text.includes('admin.js')) {
      console.log(`[CONSOLE] ${text}`);
    }
  });

  try {
    // 1. Log in as admin
    console.log('Logging in as admin...');
    await page.goto('http://localhost:5000/admin/login');
    await page.waitForTimeout(1000);

    await page.fill('#email', 'admin@magizhvagam.com');
    await page.fill('#password', 'MagizhvagamSecure2026!');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('http://localhost:5000/admin/dashboard.html');
    console.log('SUCCESS: Admin logged in successfully and reached dashboard.');

    // 2. Navigate client-side or directly to admin products
    console.log('Navigating to admin products page...');
    await page.goto('http://localhost:5000/admin/products.html');
    // Wait for spinner to disappear and actual product rows to populate
    await page.waitForSelector('#admin-products-tbody tr:not(:has(.spinner))', { timeout: 10000 });

    const checksAdmin = await page.evaluate(() => {
      const tbody = document.getElementById('admin-products-tbody');
      const rows = tbody ? tbody.querySelectorAll('tr') : [];
      const firstRow = rows[0];

      let rowText = firstRow ? firstRow.innerText : '';
      let isSpinner = firstRow ? firstRow.querySelector('.spinner') !== null : false;

      return {
        activePageId: window.MZLifecycle ? window.MZLifecycle.getActivePageId() : 'unknown',
        tbodyExists: !!tbody,
        rowCount: rows.length,
        isSpinner,
        rowText: rowText.slice(0, 100),
        isTbodyAttached: tbody ? document.contains(tbody) : false
      };
    });

    console.log('\nAdmin Products Page Results:');
    console.log(`  Active Page ID: ${checksAdmin.activePageId}`);
    console.log(`  Tbody exists: ${checksAdmin.tbodyExists}`);
    console.log(`  Row count: ${checksAdmin.rowCount}`);
    console.log(`  Spinner visible: ${checksAdmin.isSpinner}`);
    console.log(`  Tbody is attached to document: ${checksAdmin.isTbodyAttached}`);
    console.log(`  First row content (sample): ${checksAdmin.rowText.trim()}`);

    if (checksAdmin.rowCount > 0 && !checksAdmin.isSpinner && !checksAdmin.rowText.includes('Failed')) {
      console.log('SUCCESS: Admin products table populated successfully!');
    } else {
      console.error('FAIL: Admin products table rendering failed or remained empty!');
    }

  } catch (err) {
    console.error('Admin E2E verification failed with error:', err);
  } finally {
    await browser.close();
    console.log('\n=== E2E Admin Verification Finished ===');
  }
})();
