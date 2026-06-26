# MAGIZHVAGAM API INVENTORY

This document provides a comprehensive log of all backend API endpoints.

---

## 1. Authentication & User Administration (`/api/auth`)

* **`POST /api/auth/admin/login`**
  * **Method / Route:** POST `/api/auth/admin/login`
  * **Controller Method:** [authController.js::adminLogin]
  * **Middleware:** None (has dynamic rate limiter)
  * **Validation:** Requires `email` and `password` in body.
  * **Authentication:** Checks that user role is `admin` or `staff`.
  * **Success Response:** Sets HTTP-only cookies `admin_accessToken` (expires in 3 minutes) and `admin_refreshToken` (expires in 7 days), returns `{ success: true, user }`.
  * **Error Response:** `401 Unauthorized` or `403 Forbidden` with error description.
  * **Frontend Usage:** Form trigger inside `admin/login.html` (stores `adminAuth = "true"` in localStorage for basic frontend redirection).
  * **Database Interaction:** Queries `users` schema.

* **`GET /api/auth/customers`**
  * **Method / Route:** GET `/api/auth/customers`
  * **Controller Method:** [authController.js::getCustomers]
  * **Middleware:** `protect`, `adminOnly`
  * **Success Response:** `{ success: true, count, customers: [...] }`
  * **Frontend Usage:** Automatically queries on loading `/admin/customers.html` to populate the directory list.
  * **Database Interaction:** Queries the `users` collection, filters out admin/staff entries, and populates order metrics.

* **`POST /api/auth/admin/toggle-role`**
  * **Method / Route:** POST `/api/auth/admin/toggle-role`
  * **Controller Method:** [authController.js::adminToggleRole]
  * **Middleware:** `protect`, `adminOnly`
  * **Validation:** Body must contain `{ userId, role }`.
  * **Database Interaction:** Modifies the `role` field on a user document.

* **`POST /api/auth/admin/force-reset`**
  * **Method / Route:** POST `/api/auth/admin/force-reset`
  * **Controller Method:** [authController.js::adminForceResetPassword]
  * **Middleware:** `protect`, `adminOnly`
  * **Validation:** Body must contain `{ userId, newPassword }`.
  * **Database Interaction:** Encrypts newPassword and overwrites the user password credentials.

* **`POST /api/auth/admin/unlock`**
  * **Method / Route:** POST `/api/auth/admin/unlock`
  * **Controller Method:** [authController.js::adminUnlockAccount]
  * **Middleware:** `protect`, `adminOnly`
  * **Validation:** Body must contain `{ userId }`.
  * **Database Interaction:** Clears `loginAttempts` and sets `lockUntil` to `null`.

---

## 2. Product Catalog Management (`/api/products`)

* **`GET /api/products`**
  * **Method / Route:** GET `/api/products`
  * **Controller Method:** [productController.js::getProducts]
  * **Middleware:** None (Public)
  * **Validation:** Optional query filters (search, category, minPrice, maxPrice, sort, page, limit, tags).
  * **Success Response:** `{ success: true, count, page, pages, products: [...] }`
  * **Database Interaction:** Queries `products` and populates references from `categories`.

* **`POST /api/products`**
  * **Method / Route:** POST `/api/products`
  * **Controller Method:** [productController.js::createProduct]
  * **Middleware:** `protect`, `adminOnly`, `uploadMultiple`, `processImages`
  * **Validation:** Body requires name, description, price, category.
  * **Database Interaction:** Inserts a document into the `products` collection.

* **`PUT /api/products/:id`**
  * **Method / Route:** PUT `/api/products/:id`
  * **Controller Method:** [productController.js::updateProduct]
  * **Middleware:** `protect`, `adminOnly`, `uploadMultiple`, `processImages`
  * **Database Interaction:** Overwrites fields in the matching `products` document.

* **`DELETE /api/products/:id`**
  * **Method / Route:** DELETE `/api/products/:id`
  * **Controller Method:** [productController.js::deleteProduct]
  * **Middleware:** `protect`, `adminOnly`
  * **Database Interaction:** Removes the matching product document and its related reviews.

* **`POST /api/products/duplicate/:id`**
  * **Method / Route:** POST `/api/products/duplicate/:id`
  * **Controller Method:** [productController.js::duplicateProduct]
  * **Middleware:** `protect`, `adminOnly`
  * **Database Interaction:** Clones a product, appending "- Copy" to its name, and saves it.

* **`POST /api/products/bulk-delete`**
  * **Method / Route:** POST `/api/products/bulk-delete`
  * **Controller Method:** [productController.js::bulkDeleteProducts]
  * **Middleware:** `protect`, `adminOnly`
  * **Validation:** Array of string IDs in `ids` field.
  * **Database Interaction:** Deletes all products in the whitelisted list.

* **`PUT /api/products/bulk-update`**
  * **Method / Route:** PUT `/api/products/bulk-update`
  * **Controller Method:** [productController.js::bulkUpdateProducts]
  * **Middleware:** `protect`, `adminOnly`
  * **Validation:** Expects `{ ids, action: 'stock'|'category', value }` in body.
  * **Database Interaction:** Updates stock levels or categories across a selection of products.

* **`POST /api/products/bulk-import`**
  * **Method / Route:** POST `/api/products/bulk-import`
  * **Controller Method:** [productController.js::bulkImportProducts]
  * **Middleware:** `protect`, `adminOnly`
  * **Validation:** Array of product rows in JSON format.
  * **Database Interaction:** Performs bulk write insert operations.

---

## 3. Order Curation (`/api/orders`)

* **`GET /api/orders`**
  * **Method / Route:** GET `/api/orders`
  * **Controller Method:** [orderController.js::getOrders]
  * **Middleware:** `protect`, `adminOnly`
  * **Success Response:** `{ success: true, count, orders: [...] }`
  * **Database Interaction:** Returns orders sorted by `createdAt` desc, populating customer details.

* **`PUT /api/orders/:id/status`**
  * **Method / Route:** PUT `/api/orders/:id/status`
  * **Controller Method:** [orderController.js::updateOrderStatus]
  * **Middleware:** `protect`, `adminOnly`
  * **Validation:** Expects `status` value in request body.
  * **Database Interaction:** Modifies the status of an order. Restocks items if status is set to `Cancelled`.

* **`GET /api/orders/:id/invoice`**
  * **Method / Route:** GET `/api/orders/:id/invoice`
  * **Controller Method:** [orderController.js::generateInvoice]
  * **Middleware:** `protect`
  * **Success Response:** Returns order details with calculated tax breakdowns.

---

## 4. Generic Customization & Settings (`/api/settings`)

* **`GET /api/settings/feature-toggles`**
  * **Method / Route:** GET `/api/settings/feature-toggles`
  * **Controller Method:** [settingController.js::getFeatureToggles]
  * **Success Response:** `{ success: true, toggles: { ... } }`
  * **Database Interaction:** Reads key `featureToggles` from the `settings` collection.

* **`PUT /api/settings/feature-toggles`**
  * **Method / Route:** PUT `/api/settings/feature-toggles`
  * **Controller Method:** [settingController.js::updateFeatureToggles]
  * **Middleware:** `protect`, `adminOnly`
  * **Success Response:** `{ success: true, toggles: { ... } }`
  * **Database Interaction:** Overwrites toggles in the settings document.

* **`GET /api/settings/coupons/all`**
  * **Method / Route:** GET `/api/settings/coupons/all`
  * **Controller Method:** [settingController.js::getCoupons]
  * **Middleware:** `protect`, `adminOnly`
  * **Success Response:** `{ success: true, coupons: [...] }`
  * **Database Interaction:** Queries all documents in the `coupons` collection.

* **`POST /api/settings/coupons/new`**
  * **Method / Route:** POST `/api/settings/coupons/new`
  * **Controller Method:** [settingController.js::createCoupon]
  * **Middleware:** `protect`, `adminOnly`
  * **Database Interaction:** Inserts a document into the `coupons` collection.

* **`DELETE /api/settings/coupons/:id`**
  * **Method / Route:** DELETE `/api/settings/coupons/:id`
  * **Controller Method:** [settingController.js::deleteCoupon]
  * **Middleware:** `protect`, `adminOnly`
  * **Database Interaction:** Deletes a coupon by ID.

* **`GET /api/settings/:key`**
  * **Method / Route:** GET `/api/settings/:key`
  * **Controller Method:** [settingController.js::getSetting]
  * **Success Response:** `{ success: true, setting }`
  * **Database Interaction:** Queries a setting by key.

* **`PUT /api/settings/:key`**
  * **Method / Route:** PUT `/api/settings/:key`
  * **Controller Method:** [settingController.js::updateSetting]
  * **Middleware:** `protect`, `adminOnly`
  * **Database Interaction:** Overwrites setting properties.

* **`POST /api/settings/:key/reset`**
  * **Method / Route:** POST `/api/settings/:key/reset`
  * **Controller Method:** [settingController.js::resetSetting]
  * **Middleware:** `protect`, `adminOnly`
  * **Success Response:** Resets the homepage settings and site settings to default theme presets.

---

## 5. Reports & Analytics (`/api/reports`)

* **`GET /api/reports/dashboard`**
  * **Method / Route:** GET `/api/reports/dashboard`
  * **Controller Method:** [reportController.js::getDashboardStats]
  * **Middleware:** `protect`, `adminOnly`
  * **Success Response:** Returns sales totals, customer count, live product counts, recent transactions, and trend chart nodes.

* **`POST /api/reports/reset-stats`**
  * **Method / Route:** POST `/api/reports/reset-stats`
  * **Controller Method:** [reportController.js::resetStats]
  * **Middleware:** `protect`, `adminOnly`
  * **Success Response:** Clears metrics and orders, resetting stats to zero.

---

## 6. Media Library Management (`/api/media`)

* **`GET /api/media`**
  * **Method / Route:** GET `/api/media`
  * **Controller Method:** [mediaController.js::listMedia]
  * **Middleware:** `protect`, `adminOnly`
  * **Success Response:** `{ success: true, data: [...] }`
  * **Database Interaction:** Queries all entries in the `media_assets` collection.

* **`POST /api/media/upload`**
  * **Method / Route:** POST `/api/media/upload`
  * **Controller Method:** [mediaController.js::uploadMedia]
  * **Middleware:** `protect`, `adminOnly`, upload
  * **Database Interaction:** Inserts an optimized WebP image reference into `media_assets`.

* **`PUT /api/media/:id`**
  * **Method / Route:** PUT `/api/media/:id`
  * **Controller Method:** [mediaController.js::replaceMedia]
  * **Middleware:** `protect`, `adminOnly`, upload
  * **Database Interaction:** Replaces the asset file and updates dimensions/size in `media_assets`.

* **`DELETE /api/media/:id`**
  * **Method / Route:** DELETE `/api/media/:id`
  * **Controller Method:** [mediaController.js::deleteMedia]
  * **Middleware:** `protect`, `adminOnly`
  * **Database Interaction:** Deletes an asset by ID and unlinks files.

---

## 7. Appearance Studio Customization (`/api/site-settings`)

These endpoints read and write configuration properties whitelisted inside [siteSettingsController.js](file:///d:/Project-Magizhvagam/backend/controllers/siteSettingsController.js).

* **`GET /api/site-settings/all`**
  * **Method / Route:** GET `/api/site-settings/all`
  * **Success Response:** Returns the configurations for: `theme`, `homepage`, `navigation`, `footer`, and `animation`.
* **`GET /api/site-settings/theme`**
  * **Method / Route:** GET `/api/site-settings/theme`
  * **Success Response:** Returns current active `site_settings_v4` document.
* **`PUT /api/site-settings/theme`**
  * **Method / Route:** PUT `/api/site-settings/theme`
  * **Middleware:** `protect`, `adminOnly`
  * **Database Interaction:** Saves snapshot to settings history, and updates the active document.
* **`GET /api/site-settings/homepage`**
  * **Method / Route:** GET `/api/site-settings/homepage`
  * **Success Response:** Returns active `homepage_sections_v4` document.
* **`PUT /api/site-settings/homepage`**
  * **Method / Route:** PUT `/api/site-settings/homepage`
  * **Middleware:** `protect`, `adminOnly`
  * **Database Interaction:** Validates section ordering and configuration, logs history, and saves.
* **`GET /api/site-settings/navigation`**
  * **Method / Route:** GET `/api/site-settings/navigation`
  * **Success Response:** Returns active `navigation_config_v4` document.
* **`PUT /api/site-settings/navigation`**
  * **Method / Route:** PUT `/api/site-settings/navigation`
  * **Middleware:** `protect`, `adminOnly`
  * **Database Interaction:** Updates mega-menu / drawer links.
* **`GET /api/site-settings/footer`**
  * **Method / Route:** GET `/api/site-settings/footer`
  * **Success Response:** Returns active `footer_config_v4` document.
* **`PUT /api/site-settings/footer`**
  * **Method / Route:** PUT `/api/site-settings/footer`
  * **Middleware:** `protect`, `adminOnly`
  * **Database Interaction:** Updates footer configurations.
* **`GET /api/site-settings/animation`**
  * **Method / Route:** GET `/api/site-settings/animation`
  * **Success Response:** Returns active `animation_config_v4` document.
* **`PUT /api/site-settings/animation`**
  * **Method / Route:** PUT `/api/site-settings/animation`
  * **Middleware:** `protect`, `adminOnly`
  * **Database Interaction:** Updates transition presets.
* **`GET /api/site-settings/preview/:version`**
  * **Method / Route:** GET `/api/site-settings/preview/:version`
  * **Middleware:** `protect`, `adminOnly`
  * **Database Interaction:** Fetches snapshot matching version in history collection.
* **`POST /api/site-settings/rollback`**
  * **Method / Route:** POST `/api/site-settings/rollback`
  * **Middleware:** `protect`, `adminOnly`
  * **Database Interaction:** Copies snapshot from settings history to the active document.
* **`GET /api/site-settings/history/:collection`**
  * **Method / Route:** GET `/api/site-settings/history/:collection`
  * **Middleware:** `protect`, `adminOnly`
  * **Database Interaction:** Lists recent history entries for rollback selection.

---

## 8. Storefront Pages (`/api/about-page`)

* **`GET /api/about-page`**
  * **Method / Route:** GET `/api/about-page`
  * **Success Response:** Returns current `AboutPage` text blocks and image references.
* **`PUT /api/about-page`**
  * **Method / Route:** PUT `/api/about-page`
  * **Middleware:** `protect`, `adminOnly`
  * **Database Interaction:** Overwrites story texts and image references.

---

## 9. System Diagnostics (`/api/admin/system`)

* **`GET /api/admin/system/smtp-test`**
  * **Method / Route:** GET `/api/admin/system/smtp-test`
  * **Middleware:** `protect`, `adminOnly`
  * **Success Response:** Returns connectivity metrics. Logs diagnostics action to audit log.
* **`POST /api/admin/system/smtp-send-test`**
  * **Method / Route:** POST `/api/admin/system/smtp-send-test`
  * **Middleware:** `protect`, `adminOnly`
  * **Validation:** Requires recipient email parameter in `to` field.
  * **Success Response:** Returns SMTP output. Logs action to audit log.
