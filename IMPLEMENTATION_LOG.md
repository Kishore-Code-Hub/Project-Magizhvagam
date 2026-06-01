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
