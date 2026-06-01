/**
 * Clicks interactive elements on key pages and reports uncaught page errors.
 * Usage: npm start (in another terminal), then node scripts/audit-buttons.mjs
 * Requires: npm i -D playwright && npx playwright install chromium
 */
const BASE = process.env.BASE_URL || 'http://localhost:5000';

const PAGES = [
  '/',
  '/products.html',
  '/cart.html',
  '/login.html',
  '/register.html'
];

async function main() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error('Playwright not installed. Run: npm i -D playwright && npx playwright install chromium');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  let failures = 0;

  for (const path of PAGES) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    try {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (err) {
      console.error(`[FAIL] ${path} — navigation: ${err.message}`);
      failures++;
      await page.close();
      continue;
    }

    const selectors = ['button', 'a.btn', '.btn', '[onclick]', '.menu-link', '.qty-btn'];
    for (const sel of selectors) {
      const elements = await page.$$(sel);
      for (let i = 0; i < Math.min(elements.length, 15); i++) {
        try {
          await elements[i].click({ timeout: 2000 });
          await page.waitForTimeout(150);
        } catch {
          // Element not clickable — skip
        }
      }
    }

    if (errors.length) {
      console.error(`[FAIL] ${path} — ${errors.length} page error(s):`);
      errors.forEach((e) => console.error(`  - ${e}`));
      failures++;
    } else {
      console.log(`[PASS] ${path}`);
    }
    await page.close();
  }

  await browser.close();
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
