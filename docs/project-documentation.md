# MAGIZHVAGAM Platform Technical Documentation

This document explains the architecture, security models, database models, and components layout of the **MAGIZHVAGAM** Premium Return Gift E-Commerce Platform.

---

## 1. Modular Application Design Pattern

```
Public/Guest Client -> index.html, products.html, cart.html...
                                  | (Fetches JSON)
                                  v
Authenticated Admin  -> admin/dashboard.html, settings.html (Express Protected)
                                  | (Authorization Cookie Header check)
                                  v
Express REST API     -> backend/server.js -> Routes -> Controllers -> Mongoose Models
                                  |
                                  v
Database Server      -> MongoDB Atlas (Collections)
```

1. **Decoupled Markup & Action**: HTML page templates are dry skeletons. Client-side JS (`assets/js/`) triggers AJAX fetches (`window.fetch`) to request data from the Express backend API (`/api/*`).
2. **Dynamic UI Rendering**: No product, category, review, banner, or configuration is hardcoded in HTML pages. The homepage reads banner slides, text headers, collections lists, and testimonials from a single database Settings record. Product lists parse and render cards dynamically.

---

## 2. Shared Components Injection

To avoid repeating the header, footer, and float buttons code across 11 public pages, a central script `assets/js/app.js` runs on window load to inject components:
- **`injectComponents()`**:
  - Injects a responsive, glassmorphic header containing active user badges and item count labels for carts and wishlists.
  - Injects footers with links, copyright text, and contact addresses.
- **`setupWhatsApp()`**:
  - Injects the floating WhatsApp help bubble. It queries the server for the active admin number, avoiding code updates.

---

## 3. Double-JWT Refresh Session Pipeline

```
1. Customer/Admin signs in -> Server generates Access Token (15 mins) & Refresh Token (7 days).
2. Tokens are saved in secure, HTTP-Only cookies: "admin_accessToken" and "admin_refreshToken".
3. Client requests API routes -> Server parses token.
4. If Access Token is expired, server checks "admin_refreshToken":
   - If valid & matches user's RefreshToken in DB: generates new Access Token cookie, updates req.user context, and completes call.
   - If invalid / expired: returns HTTP 401 Unauthorized redirect login.
```

---

## 4. Image Resizing & Storage Pipeline

```
Multer parses files (req.files)
          |
          v
Sharp compresses buffer (1200px limit, WEBP, quality 80)
          |
          +---- (If Cloudinary keys set) ----> Uploads stream -> Save Cloud URL in DB
          |
          +---- (If fallback mode active) ---> Save file locally in /uploads/products/
```

- Local images are saved as unique filenames (e.g. `product-TIMESTAMP.webp`) and can be removed from disk via Node `fs.unlinkSync` if deleted from the admin panel.
