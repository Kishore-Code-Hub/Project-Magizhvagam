const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to about storefront page...');
    await page.goto('http://localhost:5000/about.html');
    
    // Wait for API fetch and loading
    await page.waitForTimeout(2000);

    const heading = await page.locator('#about-story-heading').textContent();
    const intro = await page.locator('#about-story-intro').textContent();
    const leftHeading = await page.locator('#about-left-heading').textContent();
    const p1 = await page.locator('#about-left-p1').textContent();
    const p2 = await page.locator('#about-left-p2').textContent();
    
    const imgEl = page.locator('#about-story-image-el');
    const imgVisible = await imgEl.isVisible();
    const imgUrl = await imgEl.getAttribute('src');

    console.log('Storefront content loaded:');
    console.log(`- Heading: "${heading}"`);
    console.log(`- Intro: "${intro}"`);
    console.log(`- Left Heading: "${leftHeading}"`);
    console.log(`- Paragraph 1: "${p1}"`);
    console.log(`- Paragraph 2: "${p2}"`);
    console.log(`- Image visible: ${imgVisible}`);
    console.log(`- Image src: "${imgUrl}"`);

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
}

run();
