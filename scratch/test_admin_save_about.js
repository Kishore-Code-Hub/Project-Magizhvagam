const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Logging in as admin...');
    await page.goto('http://localhost:5000/admin/login');
    await page.fill('input[type="email"]', 'admin@magizhvagam.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    console.log('Testing direct PUT request to /api/about-page via browser context...');
    const result = await page.evaluate(async () => {
      const res = await window.adminFetch('/api/about-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyHeading: 'Saved Heading via Admin API',
          storyIntro: 'Saved intro text via Admin API.',
          leftHeading: 'Saved Left Heading',
          leftParagraph1: 'Saved Left Paragraph 1.',
          leftParagraph2: 'Saved Left Paragraph 2.',
          image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2', // new unsplash image
          ctaText: 'View Store',
          ctaLink: '/products.html'
        })
      });
      return res.json();
    });

    console.log('API Response:', result);

    if (result.success) {
      console.log('SUCCESS: PUT request succeeded and returned success status.');
    } else {
      console.log('FAILURE: PUT request returned error.');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

run();
