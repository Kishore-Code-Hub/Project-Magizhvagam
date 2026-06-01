# Magizhvagam Phase 1 — Stabilization Log

## Phase A — Global errors

| Issue | Root cause | Files | Fix | Verification |
|-------|------------|-------|-----|--------------|
| Image 404s | No `assets/images/` in repo | `assets/images/*` | Generated placeholders via sharp | Files exist; network 200 for defaults |
| Category delete | Express route order | `backend/routes/productRoutes.js` | Static `/categories/*` before `/:id` | Route order corrected |
| Console noise | Debug `console.log` | `assets/js/products.js`, `assets/js/app.js` | Removed | Clean console on products page |
| Swallowed errors | Empty `catch {}` | `app.js`, `admin.js`, `checkout.js` | `console.error` added | Errors visible in DevTools |
| Stale backups | Duplicate JS | `app.backup.js`, `home.backup.js`, `app.js.bak` | Deleted | Not in repo |

## Phase D — Security

| Issue | Root cause | Files | Fix | Verification |
|-------|------------|-------|-----|--------------|
| Guest order IDOR | `getOrderById` allowed guests | `orderController.js`, `orderRoutes.js` | `protect` required; `canAccessOrder()` | `backend/test.js` Test 7 |
| Public invoice | Unauthenticated route | `orderRoutes.js`, `orderController.js` | `protect` + ownership | `backend/test.js` Test 8 |
| refreshToken leak | Profile returned full user | `authMiddleware.js` | `USER_SAFE_SELECT` | Profile JSON excludes token |
| Admin path traversal | Unsanitized `:page` | `adminPageRoutes.js` | Whitelist + `path.basename` | Test 11 |
| JWT defaults | Hardcoded fallbacks | `backend/config/jwt.js` | Fail fast in production | Centralized secrets |

## Phase F/G — Cart & wishlist (server)

| Issue | Root cause | Files | Fix | Verification |
|-------|------------|-------|-----|--------------|
| No persistence | localStorage only | `User.js`, cart/wishlist controllers & routes, `app.js`, `auth.js`, `cart.js`, `wishlist.js`, `checkout.js` | MongoDB `cartItems` / `wishlistItems`; REST API; merge on login | `GET /api/cart` 401 without auth (Test 9) |
| Badge stale after checkout | No sync after order | `checkout.js`, `app.js` | `clearServerCart()` | Cart cleared post-order |
| Logout wiped cart | `localStorage.clear()` | `app.js` | Selective key removal | Server cart retained for user |

## Phase C — Auth

| Issue | Root cause | Files | Fix | Verification |
|-------|------------|-------|-----|--------------|
| Admin → customer login | Wrong redirect URL | `admin.js`, `app.js` | `/admin/login` | Admin failure path |
| Profile flash | Content visible before API | `profile.html` | `visibility` until `profile-ready` | No flash for guests |
| Session shape | Inconsistent user object | `app.js`, `auth.js` | Normalized `id` field | Profile/checkout work |

## Phase B — Buttons

| Issue | Root cause | Files | Fix | Verification |
|-------|------------|-------|-----|--------------|
| Wishlist onclick breaks on URLs with quotes | Inline handlers | `wishlist.js` | `data-*` + delegation | Safe encoding |
| Wishlist heart async | Sync return value | `app.js` | `async toggleWishlistBtn` | Heart state updates |

Run: `node scripts/audit-buttons.mjs` (requires Playwright).

## Remaining / manual

- Guest orders: no self-service order lookup without account (by design after IDOR fix).
- Playwright audit: install dev dependency before running script.
- Production: set `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `MONGODB_URI`.

## Final stabilization pass (2026-05-31)

Additional fixes: `formatPrice` rupee encoding, single-image hover blank cards, admin blocked on customer login, admin login page isolated from storefront header, API JSON 404, product-details null-safety, catalog JSON parse guards. Full report: [FINAL_STABILIZATION_REPORT.md](FINAL_STABILIZATION_REPORT.md). Automated tests: **21/21 pass**.

## Recommended Phase 2

UI/UX enhancement only after `npm test` passes with server running and browser console is clean on all storefront + admin pages.
