const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  try {
    console.log('Navigating to homepage...');
    await page.goto('http://localhost:5000/index.html');

    console.log('Waiting 6 seconds to observe slide transitions...');
    for (let i = 1; i <= 6; i++) {
      await page.waitForTimeout(1000);
      const activeSlideInfo = await page.evaluate(() => {
        const activeSlide = document.querySelector('.hero-slide.active');
        if (!activeSlide) return 'No active slide';
        const title = activeSlide.querySelector('.hero-slide-title')?.textContent;
        const subtitle = activeSlide.querySelector('.hero-slide-subtitle')?.textContent;
        return `Active Slide index ${activeSlide.dataset.slideIndex}: "${title}" - "${subtitle}"`;
      });
      console.log(`t = ${i}s: ${activeSlideInfo}`);
    }

    // Let's check the DOM of all hero cards again to see if any duplicate is visible
    const visibleCards = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.hero-content-alignment'));
      return cards.map((c, i) => {
        const rect = c.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(c).display !== 'none' && window.getComputedStyle(c).visibility !== 'hidden';
        return {
          index: i + 1,
          parentClass: c.parentElement.className,
          isVisible,
          text: c.textContent.trim().replace(/\s+/g, ' '),
          rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
        };
      });
    });

    console.log('\n--- Visible Cards Info ---');
    console.log(JSON.stringify(visibleCards, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

run();
