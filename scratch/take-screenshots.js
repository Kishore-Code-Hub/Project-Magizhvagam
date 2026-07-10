/**
 * MAGIZHVAGAM — Capture Visual Baseline Screenshots
 * Uses Playwright to load and capture screenshots of all storefront & admin pages
 * under the "before" state.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';
const OUTPUT_DIR = path.join(__dirname, 'visual-baselines', 'after');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const ADMIN_EMAIL = 'admin@magizhvagam.com';
const ADMIN_PASSWORD = 'MagizhvagamSecure2026!';

// We also need a regular customer login or we can just use the admin user since the admin user is also a valid user.
// Wait, can the admin user access `/checkout`, `/wishlist`, and `/account`?
// Let's verify by logging in as the admin user.

const PAGES = [
  { name: '01_home', url: '/' },
  { name: '02_products', url: '/products' },
  { name: '03_product_detail', url: '/product/612c6335-ffd3-497c-af99-19d72e0c1257' },
  { name: '04_cart', url: '/cart' },
  { name: '05_checkout_auth', url: '/checkout', needsAuth: true },
  { name: '06_login', url: '/login' },
  { name: '07_register', url: '/register' },
  { name: '08_wishlist_auth', url: '/wishlist', needsAuth: true },
  { name: '09_about', url: '/about' },
  { name: '10_contact', url: '/contact' },
  { name: '11_profile_auth', url: '/account', needsAuth: true },
  { name: '12_admin_dashboard', url: '/admin/dashboard.html', needsAdminAuth: true },
  { name: '13_admin_products', url: '/admin/products.html', needsAdminAuth: true },
  { name: '14_admin_settings', url: '/admin/settings.html', needsAdminAuth: true }
];

async function captureScreenshots() {
  console.log('📸 MAGIZHVAGAM — Capture Visual Baseline');
  console.log('=======================================');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // 1. Establish Authentication (Log in on the main storefront)
  console.log('\n🔑 Logging in to storefront/admin...');
  await page.goto(`${BASE_URL}/login`);
  await page.fill('#email', ADMIN_EMAIL);
  await page.fill('#password', ADMIN_PASSWORD);
  
  // Submit login form
  // Let's see what the selector is for login form submission.
  // We can press Enter or click the button.
  await page.keyboard.press('Enter');
  
  // Wait for login redirection/success state
  await page.waitForTimeout(3000);
  console.log('👍 Logged in successfully.');

  // Now, let's verify if we need to log in to the admin panel specifically as well,
  // since the admin page checks cookies. The admin login route is /admin/login.html
  // Let's perform admin login to set the admin cookies.
  console.log('🔑 Logging in to admin panel...');
  await page.goto(`${BASE_URL}/admin/login`);
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  // Press enter
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
  console.log('👍 Admin login completed.');

  // 2. Loop through pages and take screenshots
  for (const p of PAGES) {
    const targetUrl = `${BASE_URL}${p.url}`;
    console.log(`📸 Capturing [${p.name}] at: ${targetUrl}`);
    
    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 15000 });
      // Extra wait for dynamic render and animations
      await page.waitForTimeout(2000);
      
      const screenshotPath = path.join(OUTPUT_DIR, `${p.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   Saved to ${screenshotPath}`);
    } catch (err) {
      console.error(`   ❌ Failed to capture ${p.name}: ${err.message}`);
    }
  }

  await browser.close();
  console.log('\n✅ Visual baseline capture complete.');
}

captureScreenshots().catch(err => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
