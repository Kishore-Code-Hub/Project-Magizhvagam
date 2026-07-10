# MAGIZHVAGAM — Performance Baseline Report

> **Captured:** 2026-07-08T16:21:27.668Z
> **Environment:** localhost:5000, Node.js Express, PostgreSQL 5433
> **Purpose:** Pre-redesign baseline. Compare after each phase to track regression/improvement.

---

## 1. Page Response Metrics

| Page | Path | Status | Response Time | Transfer Size | Redirects |
|------|------|--------|--------------|---------------|-----------|
| Home | `/` | 200 | 22ms | 7.4KB | None |
| Products | `/products` | 200 | 20ms | 12.7KB | None |
| Product Detail | `/product/test-placeholder` | 200 | 13ms | 55.5KB | None |
| Cart | `/cart` | 200 | 3ms | 5KB | None |
| Checkout | `/checkout` | 200 | 2ms | 24.9KB | 302 → /login?redirect=checkout |
| About | `/about` | 200 | 17ms | 12.3KB | None |
| Contact | `/contact` | 200 | 2ms | 13.6KB | None |
| Login | `/login` | 200 | 3ms | 24.9KB | None |
| Register | `/register` | 200 | 5ms | 15.4KB | None |
| Wishlist | `/wishlist` | 200 | 1ms | 24.9KB | 302 → /login?redirect=wishlist |
| Profile | `/profile` | 404 | 4ms | 7.4KB | None |
| Admin Dashboard | `/admin/login` | 200 | 4ms | 11.3KB | None |

## 2. HTML Quality Analysis (per page)

### Home (`/`)

| Metric | Value |
|--------|-------|
| External Scripts | 12 |
| External Stylesheets | 5 |
| Images | 0 |
| Inline Styles | 1 |
| Inline Scripts | 0 |
| Total Links | 3 |
| Title Tag | ✅ "Magizhvagam | Place of Happiness — Premium Tamil Cultural Gi..." |
| Meta Description | ✅ (160 chars) |
| H1 Count | ✅ 1 |
| Viewport Meta | ✅ |
| Images without alt | ✅ 0 |
| Buttons without label | ✅ 0 |
| Font Preconnects | 2 |
| Font Links | 0 |

### Products (`/products`)

| Metric | Value |
|--------|-------|
| External Scripts | 11 |
| External Stylesheets | 6 |
| Images | 0 |
| Inline Styles | 2 |
| Inline Scripts | 0 |
| Total Links | 0 |
| Title Tag | ✅ "Catalog | MAGIZHVAGAM - Return Gifts & customized Gifts" |
| Meta Description | ✅ (137 chars) |
| H1 Count | ❌ 0 |
| Viewport Meta | ✅ |
| Images without alt | ✅ 0 |
| Buttons without label | ✅ 0 |
| Font Preconnects | 0 |
| Font Links | 0 |

### Product Detail (`/product/test-placeholder`)

| Metric | Value |
|--------|-------|
| External Scripts | 11 |
| External Stylesheets | 6 |
| Images | 1 |
| Inline Styles | 2 |
| Inline Scripts | 1 |
| Total Links | 3 |
| Title Tag | ✅ "Product Details | MAGIZHVAGAM" |
| Meta Description | ❌ Missing |
| H1 Count | ✅ 1 |
| Viewport Meta | ✅ |
| Images without alt | ✅ 0 |
| Buttons without label | ⚠️ 1 |
| Font Preconnects | 0 |
| Font Links | 0 |

### Cart (`/cart`)

| Metric | Value |
|--------|-------|
| External Scripts | 12 |
| External Stylesheets | 6 |
| Images | 0 |
| Inline Styles | 2 |
| Inline Scripts | 0 |
| Total Links | 0 |
| Title Tag | ✅ "Shopping Cart | MAGIZHVAGAM" |
| Meta Description | ❌ Missing |
| H1 Count | ✅ 1 |
| Viewport Meta | ✅ |
| Images without alt | ✅ 0 |
| Buttons without label | ✅ 0 |
| Font Preconnects | 0 |
| Font Links | 0 |

### Checkout (`/checkout`)

| Metric | Value |
|--------|-------|
| External Scripts | 12 |
| External Stylesheets | 6 |
| Images | 0 |
| Inline Styles | 2 |
| Inline Scripts | 1 |
| Total Links | 2 |
| Title Tag | ✅ "Login | MAGIZHVAGAM - Premium Return Gifts" |
| Meta Description | ❌ Missing |
| H1 Count | ❌ 0 |
| Viewport Meta | ✅ |
| Images without alt | ✅ 0 |
| Buttons without label | ✅ 0 |
| Font Preconnects | 0 |
| Font Links | 0 |

### About (`/about`)

| Metric | Value |
|--------|-------|
| External Scripts | 11 |
| External Stylesheets | 6 |
| Images | 1 |
| Inline Styles | 2 |
| Inline Scripts | 1 |
| Total Links | 0 |
| Title Tag | ✅ "Our Story | MAGIZHVAGAM - Premium Return Gifts" |
| Meta Description | ✅ (140 chars) |
| H1 Count | ✅ 1 |
| Viewport Meta | ✅ |
| Images without alt | ⚠️ 1 |
| Buttons without label | ✅ 0 |
| Font Preconnects | 0 |
| Font Links | 0 |

### Contact (`/contact`)

| Metric | Value |
|--------|-------|
| External Scripts | 11 |
| External Stylesheets | 6 |
| Images | 0 |
| Inline Styles | 2 |
| Inline Scripts | 1 |
| Total Links | 1 |
| Title Tag | ✅ "Contact Us | MAGIZHVAGAM - Premium Return Gifts" |
| Meta Description | ✅ (142 chars) |
| H1 Count | ✅ 1 |
| Viewport Meta | ✅ |
| Images without alt | ✅ 0 |
| Buttons without label | ✅ 0 |
| Font Preconnects | 0 |
| Font Links | 0 |

### Login (`/login`)

| Metric | Value |
|--------|-------|
| External Scripts | 12 |
| External Stylesheets | 6 |
| Images | 0 |
| Inline Styles | 2 |
| Inline Scripts | 1 |
| Total Links | 2 |
| Title Tag | ✅ "Login | MAGIZHVAGAM - Premium Return Gifts" |
| Meta Description | ❌ Missing |
| H1 Count | ❌ 0 |
| Viewport Meta | ✅ |
| Images without alt | ✅ 0 |
| Buttons without label | ✅ 0 |
| Font Preconnects | 0 |
| Font Links | 0 |

### Register (`/register`)

| Metric | Value |
|--------|-------|
| External Scripts | 12 |
| External Stylesheets | 6 |
| Images | 0 |
| Inline Styles | 2 |
| Inline Scripts | 1 |
| Total Links | 1 |
| Title Tag | ✅ "Register | MAGIZHVAGAM - Premium Return Gifts" |
| Meta Description | ❌ Missing |
| H1 Count | ❌ 0 |
| Viewport Meta | ✅ |
| Images without alt | ✅ 0 |
| Buttons without label | ✅ 0 |
| Font Preconnects | 0 |
| Font Links | 0 |

### Wishlist (`/wishlist`)

| Metric | Value |
|--------|-------|
| External Scripts | 12 |
| External Stylesheets | 6 |
| Images | 0 |
| Inline Styles | 2 |
| Inline Scripts | 1 |
| Total Links | 2 |
| Title Tag | ✅ "Login | MAGIZHVAGAM - Premium Return Gifts" |
| Meta Description | ❌ Missing |
| H1 Count | ❌ 0 |
| Viewport Meta | ✅ |
| Images without alt | ✅ 0 |
| Buttons without label | ✅ 0 |
| Font Preconnects | 0 |
| Font Links | 0 |

### Admin Dashboard (`/admin/login`)

| Metric | Value |
|--------|-------|
| External Scripts | 1 |
| External Stylesheets | 3 |
| Images | 0 |
| Inline Styles | 1 |
| Inline Scripts | 1 |
| Total Links | 1 |
| Title Tag | ✅ "Admin Portal Login | MAGIZHVAGAM" |
| Meta Description | ❌ Missing |
| H1 Count | ✅ 1 |
| Viewport Meta | ✅ |
| Images without alt | ✅ 0 |
| Buttons without label | ✅ 0 |
| Font Preconnects | 0 |
| Font Links | 0 |

## 3. API Response Times

| Endpoint | Path | Status | Response Time | Size |
|----------|------|--------|--------------|------|
| Products API | `/api/products?limit=10` | 200 | 13ms | 8.9KB |
| Categories API | `/api/products/categories` | 200 | 2ms | 1.6KB |
| Site Settings | `/api/site-settings/navigation` | 200 | 15ms | 0.1KB |
| Session Check | `/api/auth/session` | 200 | 1ms | 0KB |
| Footer Config | `/api/site-settings/footer` | 200 | 6ms | 2.1KB |

## 4. CSS Bundle Sizes

| File | Size |
|------|------|
| `theme.defaults.css` | 12KB |
| `design-system.css` | 28.3KB |
| `typography.css` | 2.2KB |
| `main.css` | 114.2KB |
| `responsive.css` | 49.7KB |
| **Total CSS** | **206KB** |

## 5. JS Bundle Sizes (Storefront)

| File | Size |
|------|------|
| `theme-loader.js` | 30.1KB |
| `animation-loader.js` | 3.8KB |
| `nav.js` | 8.2KB |
| `footer.js` | 11KB |
| `storefront-init.js` | 2.8KB |
| `home.js` | 25.1KB |
| `store-enhancements.js` | 20.9KB |
| `app.js` | 100.8KB |
| **Total JS (storefront)** | **203KB** |

## 6. Performance Budget Comparison

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Total CSS | < 150KB | 206KB | ⚠️ Over budget |
| Total JS (storefront) | < 200KB | 203KB | ⚠️ Over budget |
| Page response (p95) | < 200ms | TBD | — |
| LCP (Lighthouse) | < 2.5s | ⚠️ CLI unavailable — measure manually in Chrome DevTools | — |
| FID/INP (Lighthouse) | < 100ms | ⚠️ CLI unavailable — measure manually in Chrome DevTools | — |
| CLS (Lighthouse) | < 0.1 | ⚠️ CLI unavailable — measure manually in Chrome DevTools | — |

> [!NOTE]
> Lighthouse CLI could not launch Chrome in this environment. Core Web Vitals (LCP, FID/INP, CLS) should be measured manually using Chrome DevTools → Lighthouse tab on these pages: Home, Products, Product Detail, Cart, Checkout, Admin Login. Add those numbers to this file when available.

---

*This file is the official "before" baseline. After each phase, a new section will be appended with updated metrics for comparison.*
