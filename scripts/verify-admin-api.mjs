/**
 * Quick admin API smoke test (requires server on :5000 and seed admin user).
 */
const BASE = process.env.API_BASE || ('http://localhost:' + 5000);

async function main() {
  const jar = { cookie: '' };
  const req = async (path, options = {}) => {
    const headers = { ...(options.headers || {}) };
    if (jar.cookie) headers.Cookie = jar.cookie;
    const res = await fetch(`${BASE}${path}`, { ...options, headers });
    const setCookie = res.headers.getSetCookie?.() || [];
    if (setCookie.length) {
      jar.cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
    }
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text.slice(0, 200) };
    }
    return { status: res.status, json };
  };

  const email = process.env.ADMIN_EMAIL || 'admin@magizhvagam.com';
  const password = process.env.ADMIN_PASSWORD || 'MagizhvagamSecure2026!';

  const login = await req('/api/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!login.json.success) {
    console.error('Admin login failed', login.status, login.json);
    process.exit(1);
  }
  console.log('OK admin login');

  const dash = await req('/api/reports/dashboard');
  if (!dash.json.success) {
    console.error('Dashboard failed', dash.status, dash.json);
    process.exit(1);
  }
  console.log('OK reports/dashboard with cookie');

  const products = await req('/api/products?limit=1');
  if (!products.json.success) {
    console.error('Products list failed', products.status);
    process.exit(1);
  }
  console.log('OK products list with cookie');

  console.log('Admin API cookie auth verified.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
