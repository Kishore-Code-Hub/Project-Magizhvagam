const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('api')) {
      console.log(`[API Request] Method: ${request.method()}, URL: ${request.url()}`);
      if (request.postData()) {
        console.log(`  Payload: ${request.postData().substring(0, 300)}`);
      }
    }
  });

  page.on('response', response => {
    if (response.url().includes('api')) {
      console.log(`[API Response] Status: ${response.status()}, URL: ${response.url()}`);
    }
  });

  try {
    console.log('Logging in...');
    await page.goto('http://localhost:5000/admin/login');
    await page.fill('input[type="email"]', 'admin@magizhvagam.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    console.log('Navigating to settings page...');
    await page.goto('http://localhost:5000/admin/settings.html');
    await page.waitForTimeout(2000);

    // Switch to Home tab
    console.log('Switching to Home tab...');
    await page.click('button:has-text("Home")');
    await page.waitForTimeout(1000);

    // Fill fields
    console.log('Filling About fields...');
    await page.fill('#about-story-heading-field', 'Test Heading from Playwright Form');
    await page.fill('#about-story-intro-field', 'Test Intro from Playwright Form.');
    await page.fill('#about-left-heading-field', 'Test Left Heading from Playwright Form');
    await page.fill('#about-left-p1-field', 'Test paragraph 1.');
    await page.fill('#about-left-p2-field', 'Test paragraph 2.');
    
    // Mimic choosing an image by setting value of hidden input directly
    await page.evaluate(() => {
      const field = document.getElementById('about-image-field');
      if (field) {
        field.value = 'https://images.unsplash.com/photo-1517841905240-472988babdf9'; // simulated chosen image
      }
    });

    console.log('Clicking Save All Settings...');
    await page.click('#save-settings-submit-btn');
    await page.waitForTimeout(3000); // wait for requests to complete

    console.log('Done.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

run();
