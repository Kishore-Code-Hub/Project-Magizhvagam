const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to homepage...');
    await page.goto('http://localhost:5000/index.html');
    await page.waitForTimeout(2000);

    const showcase = page.locator('.hero-visual-showcase');
    const isVisible = await showcase.isVisible();
    console.log(`hero-visual-showcase visible: ${isVisible}`);

    const cards = await page.locator('.floating-card').all();
    console.log(`Number of floating cards found: ${cards.length}`);
    for (let i = 0; i < cards.length; i++) {
      const cardVisible = await cards[i].isVisible();
      const text = await cards[i].locator('.floating-card-label').textContent();
      console.log(`Card ${i + 1}: Label = "${text.trim()}", Visible = ${cardVisible}`);
    }

    if (isVisible && cards.length === 3) {
      console.log('SUCCESS: Floating cards showcase is fully visible and has exactly 3 cards!');
    } else {
      console.log('FAILURE: Floating cards showcase is hidden or has wrong card count.');
    }

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
}

run();
