# MAGIZHVAGAM — Implementation Log

Chronological log of every file changed, the exact change, and the reason.

---

## Phase 1 — Bug #1: Wishlist Access Control & User Isolation

| File | Change | Reason |
|------|--------|--------|
| `IMPLEMENTATION_LOG.md` | Created this log | Required project tracking per spec |
| `assets/js/app.js` | User-scoped wishlist localStorage (`magizhvagam_wishlist_{userId}`); `getWishlist()` returns `[]` for guests; legacy key cleanup on login/logout; `setSessionUser` clears cross-user cache | Wishlist was shared via global `magizhvagam_wishlist` — guests saw prior users' hearts/badge counts |
| `assets/js/wishlist.js` | Await server sync before render; remove guest localStorage fallbacks; require customer auth for remove/move | Prevent guests from mutating or displaying a global wishlist |
| `backend/controllers/wishlistController.js` | Explicit `userId` variable on all `User.findById` calls; reject missing `req.user._id` | Document and enforce per-user DB queries |
| `assets/js/app.js` | Exported `window.setWishlistCache`; clear legacy key when session invalid | Allow wishlist page to update cache; guests never retain stale global key |
| `assets/js/app.js` | `handleLogout` captures `prevUser` before clearing session | Remove user-scoped wishlist cache on logout |
| `assets/js/app.js` | Exported `window.validateUserSession` | Let wishlist page await session before rendering |
| `assets/js/wishlist.js` | Await `validateUserSession()` instead of immediate redirect | Avoid race where page redirected logged-in customers |

**Status:** Phase 1 Bug #1 — **COMPLETE**

---

## Phase 1 — Bug #2: Cart & Checkout Access Control

| File | Change | Reason |
|------|--------|--------|
| `assets/js/app.js` | Implement `getCartStorageKey()` user-scoped localStorage key (`magizhvagam_cart_{userId}`); `getCart()` returns `[]` for guests; clear user-scoped cart key on logout and clean up legacy `magizhvagam_cart` key; add `/cart.html` to page protection; intercept direct page loads, Add to Cart clicks, Buy Now clicks, and Cart/Checkout icon/link clicks to display toast message and trigger login modal. | Isolate cart storage per-user so guests read empty carts, clean up legacy data, and intercept guest actions with correct warning messaging and login modal trigger. |
| `assets/js/cart.js` | Replace direct `localStorage.setItem('magizhvagam_cart', ...)` references with `window.setCartCache(...)`. | Ensure cart actions update the user-isolated cache instead of the global legacy cache. |
| `backend/controllers/cartController.js` | Add strict check for `!req.user || !req.user._id` at start of all cart handlers. | Secure backend endpoints to strictly require an authenticated customer ID. |
| `IMPLEMENTATION_LOG.md` | Logged changes for Bug #2 | Required project tracking per spec |

**Status:** Phase 1 Bug #2 — **COMPLETE**

---

## Phase 1 — Bug #2 Follow-Up: Wishlist Guest Intercept & User Name Display

| File | Change | Reason |
|------|--------|--------|
| `assets/js/app.js` | Add intercept check in `initGlobalClickHandlers()` for clicking `#header-wishlist-link` as guest; update `window.toggleWishlist()` to show warning toast message `"Please login or create a customer account to continue."` before opening the login modal. | Resolve Bug A (Wishlist guest clicks failed silently without warning toast). |
| `assets/js/app.js` | Inject dynamic username display selectors (`#user-name-display` and `.profile-name`) inside header account dropdown and mobile sidebar accordion templates in `injectComponents()`; update `setSessionUser()` to dynamically populate `#user-name-display`, `.profile-name`, and `#member-name` with `user.name` (or reset to `"Guest"`/`"Name"` on logout). | Resolve Bug B (User name did not dynamically populate in header/profile UI after logging in or out). |
| `IMPLEMENTATION_LOG.md` | Logged changes for Bug #2 Follow-Up | Required project tracking per spec |

**Status:** Phase 1 Bug #2 Follow-Up — **COMPLETE**

---

## Phase 1 — Bug #3: Homepage Products Sync

| File | Change | Reason |
|------|--------|--------|
| `backend/controllers/productController.js` | Added support for `ids` query parameter to the `getProducts` controller, parsing a comma-separated string of product IDs and querying the database via `{ _id: { $in: idArray } }`. | Allows the frontend to resolve a list of specific product IDs in a single query directly from the database. |
| `assets/js/home.js` | Refactored `loadProductSection` to fetch live data from the database using `/api/products?ids=...`, preserved sorting/layout order of product configurations via Map, and implemented fallback queries and robust try-catch handlers. Refactored `renderCategoryHighlights` to preserve admin highlights selection via Map mapping fresh data from `/api/products/categories`. | Eliminates hardcoded static HTML/JS/JSON caching blocks; ensures any changes to product details reflect instantly on the homepage. |
| `IMPLEMENTATION_LOG.md` | Logged changes for Bug #3 | Required project tracking per spec |

**Status:** Phase 1 Bug #3 — **COMPLETE**
