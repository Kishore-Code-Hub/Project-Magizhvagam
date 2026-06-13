const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport to mobile size (375px)
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:5000/index.html');
  await page.waitForTimeout(1500); // let animations load
  
  console.log('--- DIAGNOSTIC AUDIT (Viewport: 800px) ---');
  
  const overflows = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const elements = document.querySelectorAll('*');
    const result = [];
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > viewportWidth || rect.right > viewportWidth) {
        // Find path
        const path = [];
        let cur = el;
        while (cur) {
          let name = cur.tagName.toLowerCase();
          if (cur.id) name += '#' + cur.id;
          else if (cur.className) name += '.' + Array.from(cur.classList).join('.');
          path.unshift(name);
          cur = cur.parentElement;
        }
        result.push({
          element: path.join(' > '),
          width: rect.width,
          right: rect.right,
          x: rect.x
        });
      }
    });
    return result;
  });
  
  overflows.forEach(o => {
    console.log(`Element: ${o.element}\n  Width: ${o.width}px, Right: ${o.right}px, X: ${o.x}px`);
  });
  
  await browser.close();
})();
