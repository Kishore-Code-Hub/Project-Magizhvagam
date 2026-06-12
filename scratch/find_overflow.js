const { chromium } = require('playwright');

const urls = [
  'http://localhost:5000/index.html',
  'http://localhost:5000/products.html',
  'http://localhost:5000/product-details.html?id=fb-1',
  'http://localhost:5000/cart.html',
  'http://localhost:5000/checkout.html',
  'http://localhost:5000/about.html',
  'http://localhost:5000/contact.html',
  'http://localhost:5000/login.html',
  'http://localhost:5000/register.html',
  'http://localhost:5000/profile.html',
  'http://localhost:5000/admin/index.html',
  'http://localhost:5000/admin/settings.html'
];

const viewports = [320, 375, 425, 768, 1024];

async function checkOverflow(page, url, width) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(url, { waitUntil: 'load', timeout: 5000 }).catch(e => {});
  await page.waitForTimeout(1000); // Allow animations/layout to settle

  const data = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const winWidth = window.innerWidth;
    const bodyWidth = document.body.scrollWidth;
    
    // Find elements causing overflow
    const overflowingElements = [];
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.right > winWidth) {
        let name = el.tagName.toLowerCase();
        if (el.id) name += '#' + el.id;
        if (el.className) name += '.' + Array.from(el.classList).join('.');
        overflowingElements.push({ name, right: rect.right, width: rect.width });
      }
    }

    return {
      docWidth,
      winWidth,
      bodyWidth,
      overflow: docWidth > winWidth || bodyWidth > winWidth,
      overflowingElements: overflowingElements.slice(0, 5) // top 5
    };
  });

  return data;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Logging in as Admin...');
    await page.goto('http://localhost:5000/login.html');
    await page.fill('#email', 'admin@magizhvagam.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    console.log('\n--- SCANNING PAGES FOR HORIZONTAL OVERFLOW ---');
    for (const url of urls) {
      console.log(`\nURL: ${url}`);
      for (const w of viewports) {
        const res = await checkOverflow(page, url, w);
        if (res.overflow) {
          console.log(`  [OVERFLOW] Width ${w}px: scrollWidth = ${res.docWidth}px (window = ${res.winWidth}px)`);
          console.log('    Possible causes:', res.overflowingElements);
        } else {
          console.log(`  [OK] Width ${w}px`);
        }
      }
    }
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
  }
}

run();
