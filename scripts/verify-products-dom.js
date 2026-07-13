const { chromium } = require('playwright');

(async () => {
  console.log('=== Starting End-to-End Products Page DOM Verification ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Forensic') || text.includes('[MZLifecycle]') || text.includes('[MZTransition]') || text.includes('DOM-Check')) {
      console.log(`[CONSOLE] ${text}`);
    }
  });

  try {
    // 1. Load Products Page Directly
    console.log('\n--- Direct Page Load Check ---');
    await page.goto('http://localhost:5000/products');
    await page.waitForTimeout(3000); // Allow rendering and animations to settle

    const checksDirect = await page.evaluate(() => {
      const grid = document.querySelector('#catalog-grid');
      const cards = document.querySelectorAll('.product-card');
      const firstCard = cards[0];
      
      let cardStyle = null;
      let cardRect = null;
      if (firstCard) {
        const computed = getComputedStyle(firstCard);
        cardStyle = {
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity
        };
        cardRect = firstCard.getBoundingClientRect();
      }

      return {
        activePageId: window.MZLifecycle ? window.MZLifecycle.getActivePageId() : 'unknown',
        gridExists: !!grid,
        gridChildren: grid ? grid.children.length : 0,
        cardCount: cards.length,
        isGridAttached: grid ? document.contains(grid) : false,
        cardStyle,
        cardRect
      };
    });

    console.log('Direct Load Results:');
    console.log(`  Active Page ID: ${checksDirect.activePageId}`);
    console.log(`  Grid exists: ${checksDirect.gridExists}`);
    console.log(`  Grid children count: ${checksDirect.gridChildren}`);
    console.log(`  Cards count: ${checksDirect.cardCount}`);
    console.log(`  Grid is attached to document: ${checksDirect.isGridAttached}`);
    if (checksDirect.cardStyle) {
      console.log(`  First Card display: ${checksDirect.cardStyle.display}`);
      console.log(`  First Card visibility: ${checksDirect.cardStyle.visibility}`);
      console.log(`  First Card opacity: ${checksDirect.cardStyle.opacity}`);
      console.log(`  First Card Rect: x=${checksDirect.cardRect.x}, y=${checksDirect.cardRect.y}, w=${checksDirect.cardRect.width}, h=${checksDirect.cardRect.height}`);
    } else {
      console.log('  No cards found to check visibility.');
    }

    // 2. Load index first, then navigate client-side to /products
    console.log('\n--- Client-side Navigation Check ---');
    await page.goto('http://localhost:5000/');
    await page.waitForTimeout(2000);

    // Perform transition
    await page.evaluate(() => window.MZNavigate('/products'));
    await page.waitForTimeout(4000); // Allow full transition swap + layout reveal

    const checksNav = await page.evaluate(() => {
      const grid = document.querySelector('#catalog-grid');
      const cards = document.querySelectorAll('.product-card');
      const firstCard = cards[0];
      
      let cardStyle = null;
      let cardRect = null;
      if (firstCard) {
        const computed = getComputedStyle(firstCard);
        cardStyle = {
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity
        };
        cardRect = firstCard.getBoundingClientRect();
      }

      return {
        activePageId: window.MZLifecycle ? window.MZLifecycle.getActivePageId() : 'unknown',
        gridExists: !!grid,
        gridChildren: grid ? grid.children.length : 0,
        cardCount: cards.length,
        isGridAttached: grid ? document.contains(grid) : false,
        cardStyle,
        cardRect
      };
    });

    console.log('Client-side Navigation Results:');
    console.log(`  Active Page ID: ${checksNav.activePageId}`);
    console.log(`  Grid exists: ${checksNav.gridExists}`);
    console.log(`  Grid children count: ${checksNav.gridChildren}`);
    console.log(`  Cards count: ${checksNav.cardCount}`);
    console.log(`  Grid is attached to document: ${checksNav.isGridAttached}`);
    if (checksNav.cardStyle) {
      console.log(`  First Card display: ${checksNav.cardStyle.display}`);
      console.log(`  First Card visibility: ${checksNav.cardStyle.visibility}`);
      console.log(`  First Card opacity: ${checksNav.cardStyle.opacity}`);
      console.log(`  First Card Rect: x=${checksNav.cardRect.x}, y=${checksNav.cardRect.y}, w=${checksNav.cardRect.width}, h=${checksNav.cardRect.height}`);
    } else {
      console.log('  No cards found to check visibility.');
    }

  } catch (err) {
    console.error('E2E DOM verification crashed:', err);
  } finally {
    await browser.close();
    console.log('\n=== E2E DOM Verification Finished ===');
  }
})();
