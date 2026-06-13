const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

(async () => {
  const root = path.resolve(__dirname, '..');
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const homeJs = fs.readFileSync(path.join(root, 'assets', 'js', 'home.js'), 'utf8');
  const appJs = fs.readFileSync(path.join(root, 'assets', 'js', 'app.js'), 'utf8');

  // Fetch the live V4 homepage via local server
  const fetch = require('node-fetch');
  let v4data = null;
  try {
    const res = await fetch('http://localhost:5001/api/site-settings/homepage');
    v4data = await res.json();
  } catch (e) {
    console.error('Failed to fetch V4 homepage from local server:', e.message);
    process.exit(1);
  }

  const dom = new JSDOM(index, { runScripts: 'dangerously', resources: 'usable' });
  const { window } = dom;

  // Minimal implementations for globals used by home.js
  window.console = console;
  const serverOrigin = 'http://localhost:5001';
  window.fetch = async (url, opts) => {
    let resolved = url;
    try {
      // Normalize relative paths to absolute for node-fetch
      if (typeof url === 'string' && url.startsWith('/')) resolved = serverOrigin + url;
      if (typeof url === 'string' && !url.startsWith('http')) resolved = serverOrigin + '/' + url;
    } catch (e) { resolved = url; }

    if (resolved.includes('/api/site-settings/homepage')) {
      return { ok: true, json: async () => v4data };
    }
    if (resolved.includes('/api/settings/homepage')) {
      return { ok: false, text: async () => JSON.stringify({ success: false }) };
    }
    return fetch(resolved, opts);
  };

  // Provide a minimal fetchSettings to satisfy loadHomepageData
  window.fetchSettings = async () => ({
    categoryHighlights: [],
    featuredProductIds: [],
    bestSellerProductIds: [],
    newArrivalProductIds: [],
    promotionalBanners: [],
    testimonials: []
  });

  // Provide minimal feature toggles and utilities to avoid network fetches
  window.fetchFeatureToggles = async () => ({ promosEnabled: true, flashSaleActive: false });
  window.featureToggles = { promosEnabled: true, flashSaleActive: false };
  window.showToast = (msg, type) => { console.log('TOAST', type || 'info', msg); };

  // Evaluate app.js and home.js in the JSDOM window
  const vm = require('vm');
  const scriptHome = new vm.Script(homeJs, { filename: 'home.js' });

  try {
    // Do not execute app.js to avoid extra network calls; provide minimal globals instead.
    scriptHome.runInContext(window);
  } catch (e) {
    console.error('Error executing home.js in JSDOM:', e.stack || e.message);
    process.exit(1);
  }

  // Wait a short moment for async loadHomepageData to execute
  await new Promise(r => setTimeout(r, 800));

  const heroContainer = window.document.getElementById('hero-slider-container');
  const headline = window.document.querySelector('.hero-headline');
  const subtext = window.document.querySelector('.hero-subtext');

  console.log('Hero container HTML length:', heroContainer ? heroContainer.innerHTML.length : 'MISSING');
  console.log('Hero headline text:', headline ? headline.textContent.trim() : 'MISSING');
  console.log('Hero subtext text:', subtext ? subtext.textContent.trim() : 'MISSING');

  // Output a small sample of hero container
  if (heroContainer) {
    const sample = heroContainer.innerHTML.replace(/\s+/g, ' ').trim();
    console.log('Hero sample:', sample.substring(0, 400));
  }

  process.exit(0);
})();
