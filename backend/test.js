/**
 * MAGIZHVAGAM API Automated Test Runner
 * Spins up the server on a test port, fires test requests, and verifies responses
 */

const http = require('http');
require('dotenv').config();

// Ensure test runner executes under correct env variables
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

console.log('----------------------------------------------------');
console.log('       MAGIZHVAGAM AUTOMATED TESTS INITIATION       ');
console.log('----------------------------------------------------');

const runTests = async () => {
  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`[PASS] - ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] - ${message}`);
      failed++;
    }
  };

  // Helper to trigger HTTP calls
  const request = (url, method = 'GET', body = null) => {
    return new Promise((resolve, reject) => {
      const u = new URL(url);
      const options = {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: JSON.parse(data)
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: data
            });
          }
        });
      });

      req.on('error', err => reject(err));
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  try {
    console.log(`Pinging local server at ${BASE_URL}... (make sure "npm start" is running)`);
    
    // Test 1: Fetch Products List
    const pRes = await request(`${BASE_URL}/products`);
    assert(pRes.statusCode === 200, 'GET /api/products returns HTTP 200');
    assert(pRes.body.success === true, 'Products response returns success: true');
    assert(Array.isArray(pRes.body.products), 'Products response contains products array');

    // Test 2: Fetch Categories
    const cRes = await request(`${BASE_URL}/products/categories`);
    assert(cRes.statusCode === 200, 'GET /api/products/categories returns HTTP 200');
    assert(cRes.body.success === true, 'Categories response returns success: true');

    // Test 3: Invalid login
    const lRes = await request(`${BASE_URL}/auth/login`, 'POST', { email: 'bad@user.com', password: 'badpassword' });
    assert(lRes.statusCode === 401, 'POST /api/auth/login with invalid password returns HTTP 401');
    assert(lRes.body.success === false, 'Invalid login response returns success: false');

    // Test 4: Invalid Coupon Code Check
    const cpRes = await request(`${BASE_URL}/orders/check-coupon`, 'POST', { code: 'INVALIDCODE123', subtotal: 1000 });
    assert(cpRes.statusCode === 404, 'POST /api/orders/check-coupon with invalid code returns HTTP 404');
    assert(cpRes.body.success === false, 'Invalid coupon validation returns success: false');

    // Test 5: Verify Admin static block redirects
    const adminUrl = `http://localhost:${PORT}/admin/dashboard.html`;
    const admRes = await request(adminUrl);
    // Since checkAdminPageAuth redirects unauthorized requests
    assert(admRes.statusCode === 302, 'Serving admin files redirects unauthorized client requests with HTTP 302');

    // Test 6: Verify Customer static block redirects
    const profileUrl = `http://localhost:${PORT}/profile.html`;
    const profRes = await request(profileUrl);
    assert(profRes.statusCode === 302, 'Serving profile.html redirects unauthorized client requests with HTTP 302');
    assert(profRes.headers.location && profRes.headers.location.startsWith('/login.html'), 'profile.html redirect URL points to login.html');

    const wishlistUrl = `http://localhost:${PORT}/wishlist.html`;
    const wishRes = await request(wishlistUrl);
    assert(wishRes.statusCode === 302, 'Serving wishlist.html redirects unauthorized client requests with HTTP 302');

    const checkoutUrl = `http://localhost:${PORT}/checkout.html`;
    const checkRes = await request(checkoutUrl);
    assert(checkRes.statusCode === 302, 'Serving checkout.html redirects unauthorized client requests with HTTP 302');

    // Test 7: Order detail requires authentication
    const fakeOrderId = '507f1f77bcf86cd799439011';
    const orderRes = await request(`${BASE_URL}/orders/${fakeOrderId}`);
    assert(orderRes.statusCode === 401, 'GET /api/orders/:id without auth returns HTTP 401');

    // Test 8: Invoice requires authentication
    const invoiceRes = await request(`http://localhost:${PORT}/api/orders/${fakeOrderId}/invoice`);
    assert(invoiceRes.statusCode === 401, 'GET /api/orders/:id/invoice without auth returns HTTP 401');

    // Test 9: Cart API requires authentication
    const cartRes = await request(`${BASE_URL}/cart`);
    assert(cartRes.statusCode === 401, 'GET /api/cart without auth returns HTTP 401');

    // Test 10: Wishlist API requires authentication
    const wlRes = await request(`${BASE_URL}/wishlist`);
    assert(wlRes.statusCode === 401, 'GET /api/wishlist without auth returns HTTP 401');

    // Test 11: Admin path traversal blocked
    const traversalRes = await request(`http://localhost:${PORT}/admin/..%2F..%2Fpackage.json`);
    assert(
      traversalRes.statusCode === 302 || traversalRes.statusCode === 404,
      'Traversal attempt on /admin does not return 200 file content'
    );

    // Test 12: Unknown API returns JSON 404
    const api404 = await request(`${BASE_URL}/does-not-exist`);
    assert(api404.statusCode === 404, 'Unknown /api/* route returns HTTP 404');
    assert(api404.body && api404.body.success === false, 'Unknown API returns JSON error body');

    console.log('----------------------------------------------------');
    console.log(`TEST RUN COMPLETED. Passed: ${passed}, Failed: ${failed}`);
    console.log('----------------------------------------------------');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }

  } catch (error) {
    console.error(`Test Runner failed to connect: ${error.message}`);
    console.error('Please ensure the server is running locally using "npm start" before running tests.');
    process.exit(1);
  }
};

runTests();
