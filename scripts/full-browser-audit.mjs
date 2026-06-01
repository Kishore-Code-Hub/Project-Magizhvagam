/**
 * Full browser functional audit for MAGIZHVAGAM.
 * Usage: npm start (server on :5000), then node scripts/full-browser-audit.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || 'http://localhost:5000';
const OUT = path.join(__dirname, '..', 'audit-results.json');

const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/products.html', name: 'Products' },
  { path: '/product-details.html?id=seed', name: 'Product Details', dynamicId: true },
  { path: '/profile.html', name: 'Profile', needsCustomer: true },
  { path: '/wishlist.html', name: 'Wishlist', needsCustomer: true },
  { path: '/cart.html', name: 'Cart', needsCustomer: true },
  { path: '/checkout.html', name: 'Checkout', needsCustomer: true },
  { path: '/login.html', name: 'Login' },
  { path: '/register.html', name: 'Register' },
  { path: '/admin/dashboard.html', name: 'Admin Dashboard', needsAdmin: true },
  { path: '/admin/products.html', name: 'Admin Products', needsAdmin: true },
  { path: '/admin/orders.html', name: 'Admin Orders', needsAdmin: true },
  { path: '/admin/reports.html', name: 'Admin Reports', needsAdmin: true },
  { path: '/admin/settings.html', name: 'Admin Settings', needsAdmin: true }
];

const results = { testedAt: new Date().toISOString(), base: BASE, pages: [], elements: [], consoleErrors: [], networkFailures: [] };

function classify(el, error) {
  if (error) return 'BROKEN';
  return 'WORKING';
}

async function main() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error('Playwright required: npm i -D playwright');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();

  async function apiPost(path, body) {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    let json = {};
    try { json = JSON.parse(text); } catch { /* ignore */ }
    const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
    return { status: res.status, json, cookie, headers: res.headers };
  }

  async function apiGet(path, cookie) {
    const res = await fetch(`${BASE}${path}`, { headers: cookie ? { Cookie: cookie } : {} });
    const json = await res.json();
    return { status: res.status, json };
  }

  const customerEmail = `audit${Date.now()}@test.com`;
  const customerPass = 'AuditPass123!';

  await apiPost('/api/auth/register', { name: 'Audit Customer', email: customerEmail, password: customerPass });
  const custLogin = await apiPost('/api/auth/login', { email: customerEmail, password: customerPass });
  const custCookie = custLogin.cookie;

  const adminLogin = await apiPost('/api/auth/admin/login', { email: 'admin@magizhvagam.com', password: 'AdminPass123!' });
  const adminCookie = adminLogin.cookie;

  const prodRes = await apiGet('/api/products?limit=1', adminCookie);
  const productId = prodRes.json.products?.[0]?._id || '';

  // --- Profile tab audit (customer) ---
  const profileCtx = await browser.newContext();
  if (custCookie) await profileCtx.addCookies(custCookie.split('; ').filter(Boolean).map((pair) => {
    const [name, value] = pair.split('=');
    return { name, value, domain: 'localhost', path: '/' };
  }));
  const profilePage = await profileCtx.newPage();
  const profileErrors = [];
  profilePage.on('pageerror', (e) => profileErrors.push(e.message));
  profilePage.on('console', (msg) => { if (msg.type() === 'error') profileErrors.push(msg.text()); });
  await profilePage.goto(`${BASE}/profile.html`, { waitUntil: 'networkidle', timeout: 45000 });
  await profilePage.waitForSelector('.profile-ready', { timeout: 15000 }).catch(() => {});

  const profileTabs = [
    { label: 'Profile Details', tab: 'tab-profile' },
    { label: 'Address Book', tab: 'tab-addresses' },
    { label: 'Order History', tab: 'tab-orders' },
    { label: 'Wishlist', tab: 'tab-wishlist' }
  ];

  for (const t of profileTabs) {
    let status = 'WORKING';
    let note = '';
    try {
      const link = profilePage.locator(`.profile-nav-link[data-tab="${t.tab}"]`).first();
      if (await link.count() === 0) {
        status = 'BROKEN';
        note = 'Tab link not found';
      } else {
        await link.click({ timeout: 5000 });
        await profilePage.waitForTimeout(300);
        const active = await profilePage.locator(`#${t.tab}.active`).count();
        if (!active) {
          status = 'BROKEN';
          note = 'Tab panel did not activate';
        }
      }
    } catch (e) {
      status = 'BROKEN';
      note = e.message;
    }
    results.elements.push({ page: 'Profile', element: t.label, status, note });
  }

  try {
    await profilePage.evaluate(() => window.handleLogout && window.handleLogout());
    results.elements.push({ page: 'Profile', element: 'Sign Out (handleLogout exists)', status: typeof (await profilePage.evaluate(() => typeof window.handleLogout)) === 'string' && (await profilePage.evaluate(() => typeof window.handleLogout)) === 'function' ? 'WORKING' : 'BROKEN' });
  } catch (e) {
    results.elements.push({ page: 'Profile', element: 'Sign Out', status: 'BROKEN', note: e.message });
  }
  await profileCtx.close();

  // --- Admin products audit ---
  const adminCtx = await browser.newContext();
  if (adminCookie) {
    await adminCtx.addCookies(adminCookie.split('; ').filter(Boolean).map((pair) => {
      const [name, value] = pair.split('=');
      return { name, value, domain: 'localhost', path: '/' };
    }));
  }
  const adminProducts = await adminCtx.newPage();
  adminProducts.on('pageerror', (e) => results.consoleErrors.push({ page: 'Admin Products', error: e.message }));
  await adminProducts.goto(`${BASE}/admin/products.html`, { waitUntil: 'networkidle', timeout: 45000 });
  await adminProducts.waitForTimeout(2000);

  const adminChecks = [
    { name: 'Add New Product modal', fn: async () => {
      await adminProducts.evaluate(() => window.toggleModal('add-product-modal', true));
      const vis = await adminProducts.locator('#add-product-modal').evaluate((el) => getComputedStyle(el).display);
      return vis === 'flex';
    }},
    { name: 'Export CSV function', fn: async () => typeof (await adminProducts.evaluate(() => typeof window.exportProductsCSV)) === 'string' && (await adminProducts.evaluate(() => typeof window.exportProductsCSV)) === 'function' },
    { name: 'Import CSV function', fn: async () => (await adminProducts.evaluate(() => typeof window.importProductsCSV)) === 'function' },
    { name: 'Edit modal function', fn: async () => (await adminProducts.evaluate(() => typeof window.openProductEditModal)) === 'function' },
    { name: 'Delete function', fn: async () => (await adminProducts.evaluate(() => typeof window.deleteProductById)) === 'function' },
    { name: 'Clone function', fn: async () => (await adminProducts.evaluate(() => typeof window.duplicateProductById)) === 'function' }
  ];

  for (const check of adminChecks) {
    let ok = false;
    try { ok = await check.fn(); } catch { ok = false; }
    results.elements.push({ page: 'Admin Products', element: check.name, status: ok ? 'WORKING' : 'BROKEN' });
  }
  await adminCtx.close();

  // --- Admin reports export ---
  const reportsCtx = await browser.newContext();
  if (adminCookie) {
    await reportsCtx.addCookies(adminCookie.split('; ').filter(Boolean).map((pair) => {
      const [name, value] = pair.split('=');
      return { name, value, domain: 'localhost', path: '/' };
    }));
  }
  const reportsPage = await reportsCtx.newPage();
  await reportsPage.goto(`${BASE}/admin/reports.html`, { waitUntil: 'networkidle', timeout: 45000 });
  const hasExportFn = await reportsPage.evaluate(() => typeof window.exportReportsCSV === 'function');
  results.elements.push({ page: 'Admin Reports', element: 'Export CSV Log', status: hasExportFn ? 'WORKING' : 'BROKEN', note: hasExportFn ? '' : 'exportReportsCSV not defined' });
  await reportsCtx.close();

  // --- Page console/network sweep ---
  for (const pg of PAGES) {
    const pagePath = pg.dynamicId && productId ? pg.path.replace('seed', productId) : pg.path;
    if (pg.needsCustomer && !custCookie) continue;
    if (pg.needsAdmin && adminLogin.status !== 200) continue;

    const context = await browser.newContext();
    const cookieStr = pg.needsAdmin ? adminCookie : pg.needsCustomer ? custCookie : '';
    if (cookieStr) {
      await context.addCookies(cookieStr.split('; ').filter(Boolean).map((pair) => {
        const [name, value] = pair.split('=');
        return { name, value, domain: 'localhost', path: '/' };
      }));
    }

    const page = await context.newPage();
    const pageResult = { name: pg.name, path: pagePath, consoleErrors: [], networkFailures: [], status: 'PASS' };
    page.on('pageerror', (e) => pageResult.consoleErrors.push(e.message));
    page.on('console', (msg) => { if (msg.type() === 'error') pageResult.consoleErrors.push(msg.text()); });
    page.on('response', (res) => {
      const url = res.url();
      const st = res.status();
      if (st >= 400 && !url.includes('favicon') && !url.includes('lucide')) {
        pageResult.networkFailures.push({ url, status: st });
      }
    });

    try {
      await page.goto(`${BASE}${pagePath}`, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1500);
    } catch (e) {
      pageResult.status = 'FAIL';
      pageResult.navigationError = e.message;
    }

    if (pageResult.consoleErrors.length || pageResult.networkFailures.length) pageResult.status = 'FAIL';
    results.pages.push(pageResult);
    results.consoleErrors.push(...pageResult.consoleErrors.map((e) => ({ page: pg.name, error: e })));
    results.networkFailures.push(...pageResult.networkFailures.map((n) => ({ page: pg.name, ...n })));
    await context.close();
  }

  await browser.close();

  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  const broken = results.elements.filter((e) => e.status === 'BROKEN');
  console.log('\n=== AUDIT SUMMARY ===');
  console.log(`Pages tested: ${results.pages.length}`);
  console.log(`Elements: ${results.elements.length}, BROKEN: ${broken.length}`);
  console.log(`Console errors: ${results.consoleErrors.length}`);
  console.log(`Network failures: ${results.networkFailures.length}`);
  broken.forEach((b) => console.log(`  BROKEN: [${b.page}] ${b.element}${b.note ? ' — ' + b.note : ''}`));
  console.log(`\nFull results: ${OUT}`);
  process.exit(broken.length > 0 || results.consoleErrors.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
