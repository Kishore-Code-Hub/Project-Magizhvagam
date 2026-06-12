const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to homepage...');
    await page.goto('http://localhost:5000/index.html');
    
    // Wait for the slider container and sections to be populated
    await page.waitForTimeout(2000);

    // Get count of visible .hero-content-alignment cards
    const cards = await page.locator('.hero-content-alignment').all();
    console.log(`Total hero-content-alignment cards found: ${cards.length}\n`);

    for (let i = 0; i < cards.length; i++) {
      const parentClass = await cards[i].evaluate(el => el.parentElement.className);
      const isVisible = await cards[i].isVisible();
      
      const computedStyles = await cards[i].evaluate(el => {
        const style = window.getComputedStyle(el);
        const parentStyle = window.getComputedStyle(el.parentElement);
        return {
          opacity: style.opacity,
          visibility: style.visibility,
          display: style.display,
          parentOpacity: parentStyle.opacity,
          parentVisibility: parentStyle.visibility,
          parentDisplay: parentStyle.display,
          parentZIndex: parentStyle.zIndex
        };
      });

      console.log(`Card ${i + 1}: Parent Class = "${parentClass}"`);
      console.log(`  Playwright isVisible: ${isVisible}`);
      console.log(`  Card Style: opacity = ${computedStyles.opacity}, visibility = ${computedStyles.visibility}, display = ${computedStyles.display}`);
      console.log(`  Parent Style: opacity = ${computedStyles.parentOpacity}, visibility = ${computedStyles.parentVisibility}, display = ${computedStyles.parentDisplay}, zIndex = ${computedStyles.parentZIndex}`);
      console.log('--------------------------------------------------');
    }

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
}

run();
