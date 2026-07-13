const { chromium } = require('playwright');

(async () => {
  console.log('=== Starting E2E Storefront Responsive Audit ===');
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'Mobile (375x667)', width: 375, height: 667 },
    { name: 'Tablet (820x1080)', width: 820, height: 1080 }
  ];

  const pages = [
    { name: 'Home', path: '/' },
    { name: 'Catalog', path: '/products' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Login', path: '/login' },
    { name: 'Cart', path: '/cart' },
    { name: 'Wishlist', path: '/wishlist' }
  ];

  let totalIssues = 0;

  for (const viewport of viewports) {
    console.log(`\n--- Viewport: ${viewport.name} ---`);
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    const page = await context.newPage();

    // Log JS errors
    page.on('pageerror', err => {
      console.error(`  [JS ERROR] on page: ${err.message}`);
      totalIssues++;
    });

    for (const pageInfo of pages) {
      try {
        await page.goto(`http://localhost:5000${pageInfo.path}`);
        await page.waitForTimeout(1500); // Allow render + transitions

        const audit = await page.evaluate((viewportWidth) => {
          const docWidth = document.documentElement.scrollWidth;
          const bodyWidth = document.body.scrollWidth;
          const hasHorizontalScroll = docWidth > viewportWidth || bodyWidth > viewportWidth;
          
          // Find any overflowing elements
          const overflowEls = [];
          document.querySelectorAll('*').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > viewportWidth + 1) { // 1px threshold for sub-pixel anti-aliasing
              // Filter out elements that are drawers, modales, or overlays (e.g. fixed/absolute hidden off-screen)
              const style = getComputedStyle(el);
              if (style.position !== 'fixed' && style.position !== 'absolute' && style.display !== 'none') {
                overflowEls.push({
                  tag: el.tagName.toLowerCase(),
                  id: el.id,
                  class: el.className,
                  right: rect.right
                });
              }
            }
          });

          return {
            docWidth,
            bodyWidth,
            hasHorizontalScroll,
            overflowCount: overflowEls.length,
            overflowSample: overflowEls.slice(0, 3)
          };
        }, viewport.width);

        if (audit.hasHorizontalScroll) {
          console.warn(`  [OVERFLOW WARNING] Page: ${pageInfo.name} has horizontal scroll! (Doc: ${audit.docWidth}px, Body: ${audit.bodyWidth}px, Viewport: ${viewport.width}px)`);
          if (audit.overflowCount > 0) {
            console.warn(`    Potential culprits:`, audit.overflowSample);
          }
          totalIssues++;
        } else {
          console.log(`  [OK] Page: ${pageInfo.name} fits correctly within viewport width.`);
        }

      } catch (err) {
        console.error(`  [ERROR] Failed to load ${pageInfo.name}:`, err.message);
        totalIssues++;
      }
    }
    await page.close();
  }

  await browser.close();
  console.log(`\n=== Responsive Audit Finished. Total Issues Found: ${totalIssues} ===`);
})();
