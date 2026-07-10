/**
 * MAGIZHVAGAM — Performance Baseline Capture Script
 * Captures response times, transfer sizes, resource counts, and HTML quality metrics
 * for all target pages. Produces a markdown report.
 *
 * Usage: node scratch/capture-baseline.js
 */

const http = require('http');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

const PAGES = [
  { name: 'Home', path: '/', formFactor: 'both' },
  { name: 'Products', path: '/products', formFactor: 'both' },
  { name: 'Product Detail', path: '/product/test-placeholder', formFactor: 'both' },
  { name: 'Cart', path: '/cart', formFactor: 'both' },
  { name: 'Checkout', path: '/checkout', formFactor: 'both' },
  { name: 'About', path: '/about', formFactor: 'both' },
  { name: 'Contact', path: '/contact', formFactor: 'both' },
  { name: 'Login', path: '/login', formFactor: 'both' },
  { name: 'Register', path: '/register', formFactor: 'both' },
  { name: 'Wishlist', path: '/wishlist', formFactor: 'both' },
  { name: 'Profile', path: '/profile', formFactor: 'both' },
  { name: 'Admin Dashboard', path: '/admin/login', formFactor: 'desktop' },
];

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const start = process.hrtime.bigint();
    http.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1e6;
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          transferSize: Buffer.byteLength(data, 'utf8'),
          responseTimeMs: Math.round(durationMs),
          redirectUrl: res.headers.location || null
        });
      });
    }).on('error', reject);
  });
}

function followRedirects(url, maxRedirects = 5) {
  return new Promise(async (resolve, reject) => {
    let currentUrl = url;
    let redirectCount = 0;
    let finalResponse = null;
    let redirectChain = [];

    while (redirectCount < maxRedirects) {
      try {
        const res = await fetchPage(currentUrl);
        if (res.statusCode >= 300 && res.statusCode < 400 && res.redirectUrl) {
          redirectChain.push({ from: currentUrl, to: res.redirectUrl, status: res.statusCode });
          // Handle relative redirects
          if (res.redirectUrl.startsWith('/')) {
            currentUrl = BASE_URL + res.redirectUrl;
          } else {
            currentUrl = res.redirectUrl;
          }
          redirectCount++;
        } else {
          finalResponse = res;
          finalResponse.redirectChain = redirectChain;
          finalResponse.finalUrl = currentUrl;
          break;
        }
      } catch (err) {
        reject(err);
        return;
      }
    }

    if (finalResponse) {
      resolve(finalResponse);
    } else {
      reject(new Error(`Too many redirects for ${url}`));
    }
  });
}

function analyzeHTML(html, pageName) {
  try {
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Resource counts
    const scripts = doc.querySelectorAll('script[src]');
    const stylesheets = doc.querySelectorAll('link[rel="stylesheet"]');
    const images = doc.querySelectorAll('img');
    const inlineStyles = doc.querySelectorAll('style');
    const inlineScripts = doc.querySelectorAll('script:not([src])');

    // SEO checks
    const title = doc.querySelector('title')?.textContent?.trim() || '';
    const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const h1Count = doc.querySelectorAll('h1').length;
    const viewport = doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';

    // Accessibility quick checks
    const imagesWithoutAlt = [...images].filter(img => !img.getAttribute('alt')).length;
    const buttonsWithoutLabel = [...doc.querySelectorAll('button')].filter(btn =>
      !btn.textContent.trim() && !btn.getAttribute('aria-label')
    ).length;
    const linksCount = doc.querySelectorAll('a[href]').length;

    // Font loading
    const fontPreconnects = doc.querySelectorAll('link[rel="preconnect"]').length;
    const fontLinks = [...stylesheets].filter(l => (l.getAttribute('href') || '').includes('fonts')).length;

    // Console error indicators (inline script with error patterns)
    const allInlineJS = [...inlineScripts].map(s => s.textContent).join('\n');

    return {
      resources: {
        externalScripts: scripts.length,
        externalStylesheets: stylesheets.length,
        images: images.length,
        inlineStyles: inlineStyles.length,
        inlineScripts: inlineScripts.length,
        totalLinks: linksCount
      },
      seo: {
        title: title ? `✅ "${title.substring(0, 60)}${title.length > 60 ? '...' : ''}"` : '❌ Missing',
        metaDescription: metaDesc ? `✅ (${metaDesc.length} chars)` : '❌ Missing',
        h1Count: h1Count === 1 ? `✅ 1` : h1Count === 0 ? '❌ 0' : `⚠️ ${h1Count}`,
        viewport: viewport ? '✅' : '❌ Missing'
      },
      accessibility: {
        imagesWithoutAlt,
        buttonsWithoutLabel
      },
      fontPreconnects,
      fontLinks
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function captureBaseline() {
  console.log('🔍 MAGIZHVAGAM Performance Baseline Capture');
  console.log('============================================\n');

  const results = [];
  const timestamp = new Date().toISOString();

  for (const page of PAGES) {
    const url = BASE_URL + page.path;
    process.stdout.write(`  Auditing: ${page.name} (${page.path})... `);

    try {
      const response = await followRedirects(url);
      const analysis = response.statusCode === 200 ? analyzeHTML(response.body, page.name) : null;

      results.push({
        name: page.name,
        path: page.path,
        statusCode: response.statusCode,
        responseTimeMs: response.responseTimeMs,
        transferSizeKB: Math.round(response.transferSize / 1024 * 10) / 10,
        redirectChain: response.redirectChain,
        finalUrl: response.finalUrl,
        analysis
      });

      console.log(`${response.statusCode} (${response.responseTimeMs}ms, ${Math.round(response.transferSize / 1024)}KB)`);
    } catch (err) {
      results.push({
        name: page.name,
        path: page.path,
        error: err.message
      });
      console.log(`❌ ERROR: ${err.message}`);
    }
  }

  // Also measure API response times for key endpoints
  console.log('\n  Measuring API response times...');
  const apiEndpoints = [
    { name: 'Products API', path: '/api/products?limit=10' },
    { name: 'Categories API', path: '/api/products/categories' },
    { name: 'Site Settings', path: '/api/site-settings/navigation' },
    { name: 'Session Check', path: '/api/auth/session' },
    { name: 'Footer Config', path: '/api/site-settings/footer' },
  ];

  const apiResults = [];
  for (const endpoint of apiEndpoints) {
    try {
      const res = await fetchPage(BASE_URL + endpoint.path);
      apiResults.push({
        name: endpoint.name,
        path: endpoint.path,
        statusCode: res.statusCode,
        responseTimeMs: res.responseTimeMs,
        transferSizeKB: Math.round(res.transferSize / 1024 * 10) / 10
      });
      process.stdout.write(`    ${endpoint.name}: ${res.responseTimeMs}ms\n`);
    } catch (err) {
      apiResults.push({ name: endpoint.name, path: endpoint.path, error: err.message });
    }
  }

  // Measure CSS file sizes
  console.log('\n  Measuring CSS bundle sizes...');
  const cssFiles = [
    '/assets/css/theme.defaults.css',
    '/assets/css/design-system.css',
    '/assets/css/typography.css',
    '/assets/css/main.css',
    '/assets/css/responsive.css',
  ];
  const cssResults = [];
  let totalCSSBytes = 0;
  for (const cssPath of cssFiles) {
    try {
      const res = await fetchPage(BASE_URL + cssPath);
      const size = res.transferSize;
      totalCSSBytes += size;
      cssResults.push({ path: cssPath, sizeKB: Math.round(size / 1024 * 10) / 10 });
      process.stdout.write(`    ${path.basename(cssPath)}: ${Math.round(size / 1024)}KB\n`);
    } catch (err) {
      cssResults.push({ path: cssPath, error: err.message });
    }
  }

  // Measure JS file sizes
  console.log('\n  Measuring JS bundle sizes...');
  const jsFiles = [
    '/assets/js/theme-loader.js',
    '/assets/js/animation-loader.js',
    '/assets/js/nav.js',
    '/assets/js/footer.js',
    '/assets/js/storefront-init.js',
    '/assets/js/home.js',
    '/assets/js/store-enhancements.js',
    '/assets/js/app.js',
  ];
  const jsResults = [];
  let totalJSBytes = 0;
  for (const jsPath of jsFiles) {
    try {
      const res = await fetchPage(BASE_URL + jsPath);
      const size = res.transferSize;
      totalJSBytes += size;
      jsResults.push({ path: jsPath, sizeKB: Math.round(size / 1024 * 10) / 10 });
      process.stdout.write(`    ${path.basename(jsPath)}: ${Math.round(size / 1024)}KB\n`);
    } catch (err) {
      jsResults.push({ path: jsPath, error: err.message });
    }
  }

  // Generate markdown report
  const report = generateMarkdownReport(results, apiResults, cssResults, jsResults, totalCSSBytes, totalJSBytes, timestamp);

  const outputPath = path.join(__dirname, '..', 'BASELINE_METRICS.md');
  fs.writeFileSync(outputPath, report, 'utf8');
  console.log(`\n✅ Baseline report saved to: ${outputPath}`);
}

function generateMarkdownReport(pages, apis, css, js, totalCSS, totalJS, timestamp) {
  let md = `# MAGIZHVAGAM — Performance Baseline Report

> **Captured:** ${timestamp}
> **Environment:** localhost:5000, Node.js Express, PostgreSQL 5433
> **Purpose:** Pre-redesign baseline. Compare after each phase to track regression/improvement.

---

## 1. Page Response Metrics

| Page | Path | Status | Response Time | Transfer Size | Redirects |
|------|------|--------|--------------|---------------|-----------|
`;

  for (const p of pages) {
    if (p.error) {
      md += `| ${p.name} | \`${p.path}\` | ❌ Error | — | — | ${p.error} |\n`;
    } else {
      const redirectInfo = p.redirectChain.length > 0
        ? p.redirectChain.map(r => `${r.status} → ${r.to}`).join(', ')
        : 'None';
      md += `| ${p.name} | \`${p.path}\` | ${p.statusCode} | ${p.responseTimeMs}ms | ${p.transferSizeKB}KB | ${redirectInfo} |\n`;
    }
  }

  md += `\n## 2. HTML Quality Analysis (per page)\n\n`;

  for (const p of pages) {
    if (!p.analysis || p.analysis.error) continue;
    const a = p.analysis;

    md += `### ${p.name} (\`${p.path}\`)\n\n`;
    md += `| Metric | Value |\n|--------|-------|\n`;
    md += `| External Scripts | ${a.resources.externalScripts} |\n`;
    md += `| External Stylesheets | ${a.resources.externalStylesheets} |\n`;
    md += `| Images | ${a.resources.images} |\n`;
    md += `| Inline Styles | ${a.resources.inlineStyles} |\n`;
    md += `| Inline Scripts | ${a.resources.inlineScripts} |\n`;
    md += `| Total Links | ${a.resources.totalLinks} |\n`;
    md += `| Title Tag | ${a.seo.title} |\n`;
    md += `| Meta Description | ${a.seo.metaDescription} |\n`;
    md += `| H1 Count | ${a.seo.h1Count} |\n`;
    md += `| Viewport Meta | ${a.seo.viewport} |\n`;
    md += `| Images without alt | ${a.accessibility.imagesWithoutAlt === 0 ? '✅ 0' : '⚠️ ' + a.accessibility.imagesWithoutAlt} |\n`;
    md += `| Buttons without label | ${a.accessibility.buttonsWithoutLabel === 0 ? '✅ 0' : '⚠️ ' + a.accessibility.buttonsWithoutLabel} |\n`;
    md += `| Font Preconnects | ${a.fontPreconnects} |\n`;
    md += `| Font Links | ${a.fontLinks} |\n`;
    md += `\n`;
  }

  md += `## 3. API Response Times\n\n`;
  md += `| Endpoint | Path | Status | Response Time | Size |\n`;
  md += `|----------|------|--------|--------------|------|\n`;
  for (const a of apis) {
    if (a.error) {
      md += `| ${a.name} | \`${a.path}\` | ❌ | — | — |\n`;
    } else {
      md += `| ${a.name} | \`${a.path}\` | ${a.statusCode} | ${a.responseTimeMs}ms | ${a.transferSizeKB}KB |\n`;
    }
  }

  md += `\n## 4. CSS Bundle Sizes\n\n`;
  md += `| File | Size |\n|------|------|\n`;
  for (const c of css) {
    md += `| \`${path.basename(c.path)}\` | ${c.sizeKB || '—'}KB |\n`;
  }
  md += `| **Total CSS** | **${Math.round(totalCSS / 1024)}KB** |\n`;

  md += `\n## 5. JS Bundle Sizes (Storefront)\n\n`;
  md += `| File | Size |\n|------|------|\n`;
  for (const j of js) {
    md += `| \`${path.basename(j.path)}\` | ${j.sizeKB || '—'}KB |\n`;
  }
  md += `| **Total JS (storefront)** | **${Math.round(totalJS / 1024)}KB** |\n`;

  md += `\n## 6. Performance Budget Comparison\n\n`;
  md += `| Metric | Target | Current | Status |\n`;
  md += `|--------|--------|---------|--------|\n`;
  md += `| Total CSS | < 150KB | ${Math.round(totalCSS / 1024)}KB | ${totalCSS / 1024 < 150 ? '✅' : '⚠️ Over budget'} |\n`;
  md += `| Total JS (storefront) | < 200KB | ${Math.round(totalJS / 1024)}KB | ${totalJS / 1024 < 200 ? '✅' : '⚠️ Over budget'} |\n`;
  md += `| Page response (p95) | < 200ms | TBD | — |\n`;
  md += `| LCP (Lighthouse) | < 2.5s | ⚠️ CLI unavailable — measure manually in Chrome DevTools | — |\n`;
  md += `| FID/INP (Lighthouse) | < 100ms | ⚠️ CLI unavailable — measure manually in Chrome DevTools | — |\n`;
  md += `| CLS (Lighthouse) | < 0.1 | ⚠️ CLI unavailable — measure manually in Chrome DevTools | — |\n`;

  md += `\n> [!NOTE]\n> Lighthouse CLI could not launch Chrome in this environment. Core Web Vitals (LCP, FID/INP, CLS) should be measured manually using Chrome DevTools → Lighthouse tab on these pages: Home, Products, Product Detail, Cart, Checkout, Admin Login. Add those numbers to this file when available.\n`;

  md += `\n---\n\n*This file is the official "before" baseline. After each phase, a new section will be appended with updated metrics for comparison.*\n`;

  return md;
}

captureBaseline().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
