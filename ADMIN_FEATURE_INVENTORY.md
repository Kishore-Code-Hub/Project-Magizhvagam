# MAGIZHVAGAM ADMIN FEATURE INVENTORY

This document provides a comprehensive component-by-component inventory of all features currently implemented in the Magizhvagam Admin Panel.

---

## 1. Administrative Login Portal (`login.html`)

* **Feature Name:** Login Portal
* **Purpose:** Authenticates administrative and staff users to establish secure JWT cookie sessions.
* **Frontend Components:**
  * Login Form (Email, Password) with error labels.
  * Remember Me checkbox.
  * Loading spinner indicators.
* **Backend APIs Used:**
  * `POST /api/auth/admin/login`
* **Database Tables Used:**
  * `users` (User model)
  * `audit_logs` (AuditLog model)
* **Permissions Required:** Public guest access (redirects authenticated users with `role: admin` to Dashboard, customer role receives 403 error).
* **Dependencies:**
  * Frontend: [auth.js](file:///d:/Project-Magizhvagam/assets/js/auth.js)
  * Backend: [authController.js](file:///d:/Project-Magizhvagam/backend/controllers/authController.js) (adminLogin)
* **Status:** Fully Working.

---

## 2. Store Performance Dashboard (`dashboard.html`)

* **Feature Name:** KPI & Feature Control Dashboard
* **Purpose:** Monitor overall sales numbers, toggle shopping behaviors site-wide, change brand themes, and schedule flash sales.
* **Frontend Components:**
  * **Metric Grid Cards:** Displays cumulative values for "Total Revenue", "Total Orders", "Total Customers", and "Live Inventory".
  * **Feature Control Toggles:** Toggle switches for Wishlist, Customer Login, Registration, Coupon engine, WhatsApp checkout routing, COD, Reviews, and Flash sales.
  * **Theme Accent Picker:** Color picker syncing the primary accent brand color.
  * **Flash Sale Scheduling Form:** Banner promotion text input and Target datetime-local calendar select.
  * **Sales Revenue Trend Graph:** Rendered inside a custom SVG component dynamically showing daily/weekly milestones.
  * **Recent Orders List:** Displays recent transactions including order ID, customer name, date, total bill, and badge status.
  * **Initialize Statistics Modal:** Warning dialog for irreversible data deletion.
* **Backend APIs Used:**
  * `GET /api/reports/dashboard`
  * `POST /api/reports/reset-stats`
  * `GET /api/settings/feature-toggles`
  * `PUT /api/settings/feature-toggles`
* **Database Tables Used:**
  * `orders` (Order model)
  * `users` (User model)
  * `products` (Product model)
  * `settings` (Setting model - keys: `featureToggles`, `allowSignup`)
  * `site_settings_v4` (SiteSettings model)
* **Permissions Required:** `role: admin` or `role: staff`
* **Dependencies:**
  * Frontend: [admin.js](file:///d:/Project-Magizhvagam/assets/js/admin.js#L309-L364), [app.js](file:///d:/Project-Magizhvagam/assets/js/app.js)
  * Backend: [reportController.js](file:///d:/Project-Magizhvagam/backend/controllers/reportController.js), [settingController.js](file:///d:/Project-Magizhvagam/backend/controllers/settingController.js)
* **Status:** Fully Working.

---

## 3. Products Catalogue (`products.html`)

* **Feature Name:** Product & Category Manager
* **Purpose:** Create, edit, clone, delete, bulk-manage, and import/export products, categories, and promo coupons.
* **Frontend Components:**
  * **Catalogue Table:** Tabular listing with columns for Select Checkbox, Thumbnail, Product Name, Category, Base Price, Stock Level, Featured status, and Actions.
  * **Add Product Modal Form:** Product name, Category dropdown, Price, Discount Price, Stock, Primary Image upload, Secondary Image upload, Gallery (multi-select, max 3), Description textarea, Technical specs inputs (Material, Dimensions, Weight, Color), Tags string, and Featured checkbox.
  * **Edit Product Modal Form:** Similar fields as the Add Form, showing thumbnails of existing images.
  * **Bulk Action Panel:** Dynamic bar appearing upon checkbox selection offering Bulk Delete, Bulk Update Stock, and Bulk Change Category.
  * **CSV Importer & Exporter:** Trigger inputs for file upload and export link.
  * **Category Curation Sub-view:** Toggle to view existing category cards, upload thumbnails, and add names.
  * **Coupon Management Sub-view:** Set promo codes, percentages/flat values, minimum orders, and expirations.
* **Backend APIs Used:**
  * `GET /api/products` (with query filtering)
  * `POST /api/products` (creates a product)
  * `PUT /api/products/:id` (updates a product)
  * `DELETE /api/products/:id` (deletes a product)
  * `POST /api/products/duplicate/:id`
  * `POST /api/products/bulk-delete`
  * `PUT /api/products/bulk-update`
  * `POST /api/products/bulk-import`
  * `GET /api/products/categories`
  * `POST /api/products/categories`
  * `DELETE /api/products/categories/:id`
  * `GET /api/settings/coupons/all`
  * `POST /api/settings/coupons/new`
  * `DELETE /api/settings/coupons/:id`
* **Database Tables Used:**
  * `products` (Product model)
  * `categories` (Category model)
  * `coupons` (Coupon model)
* **Permissions Required:** `role: admin` or `role: staff` (creates/deletes require admin check)
* **Dependencies:**
  * Frontend: [admin.js](file:///d:/Project-Magizhvagam/assets/js/admin.js) (loadAdminProducts), [products.js](file:///d:/Project-Magizhvagam/assets/js/products.js)
  * Backend: [productController.js](file:///d:/Project-Magizhvagam/backend/controllers/productController.js), [uploadMiddleware.js](file:///d:/Project-Magizhvagam/backend/middleware/uploadMiddleware.js)
* **Status:** Fully Working.

---

## 4. Orders Registry (`orders.html`)

* **Feature Name:** Orders Registry
* **Purpose:** Monitor customer purchases, track fulfillment states, change shipping progress, and access printable invoices.
* **Frontend Components:**
  * **Orders Table:** Columns for Order ID, Customer name (guest details check), Date, Total Bill, Delivery Status badge, and Actions (Status select dropdown, Invoice view).
* **Backend APIs Used:**
  * `GET /api/orders`
  * `PUT /api/orders/:id/status`
* **Database Tables Used:**
  * `orders` (Order model)
  * `users` (User model)
* **Permissions Required:** `role: admin` or `role: staff`
* **Dependencies:**
  * Frontend: [admin.js](file:///d:/Project-Magizhvagam/assets/js/admin.js#L60) (loadAdminOrders)
  * Backend: [orderController.js](file:///d:/Project-Magizhvagam/backend/controllers/orderController.js)
* **Status:** Fully Working.

---

## 5. Customer Directory (`customers.html`)

* **Feature Name:** Customer Directory
* **Purpose:** Search and manage registered accounts, verify emails, reset passwords, lock/unlock accounts, and change user roles.
* **Frontend Components:**
  * **Customers Table:** Columns for Name, Email, Role, Verification status, Account Lock status, Total Orders, Cumulative Spend, and Actions.
  * **Quick Actions Popovers:** Dropdowns to toggle role, unlock, or force-reset.
* **Backend APIs Used:**
  * `GET /api/auth/customers`
  * `POST /api/auth/admin/toggle-role`
  * `POST /api/auth/admin/force-reset`
  * `POST /api/auth/admin/unlock`
* **Database Tables Used:**
  * `users` (User model)
  * `orders` (Order model)
* **Permissions Required:** `role: admin`
* **Dependencies:**
  * Frontend: [admin.js](file:///d:/Project-Magizhvagam/assets/js/admin.js#L64) (loadAdminCustomers)
  * Backend: [authController.js](file:///d:/Project-Magizhvagam/backend/controllers/authController.js)
* **Status:** Fully Working.

---

## 6. Media Library (`media.html`)

* **Feature Name:** Media Library
* **Purpose:** Central repository for uploading and choosing site images. Offers drag-and-drop file transfers.
* **Frontend Components:**
  * **Media Grid:** Displays files with file names, sizes, dimensions, and utility buttons (Copy URL, Replace, Delete).
  * **Drag & Drop Upload Target Zone:** Highlights drop areas.
  * **Upload limits & Compression Tab Panel:** Shows compression configurations and limits (these render fallbacks to advanced settings).
  * **Asset Lightbox Modal:** Full image preview showing width/height, file size, mime type, upload date, and a clipboard copy tool.
* **Backend APIs Used:**
  * `GET /api/media`
  * `POST /api/media/upload`
  * `PUT /api/media/:id`
  * `DELETE /api/media/:id`
* **Database Tables Used:**
  * `media_assets` (MediaAsset model)
* **Permissions Required:** `role: admin` or `role: staff`
* **Dependencies:**
  * Frontend: [media-library.js](file:///d:/Project-Magizhvagam/assets/js/media-library.js)
  * Backend: [mediaController.js](file:///d:/Project-Magizhvagam/backend/controllers/mediaController.js)
* **Status:** Fully Working.

---

## 7. Reports & Analytics (`reports.html`)

* **Feature Name:** Sales Analytics
* **Purpose:** Overview of store sales performance, top-selling items, average revenue, and exportable logs.
* **Frontend Components:**
  * **Top Selling Products Table:** Thumbnail, name, qty sold, revenue.
  * **Period Performance Cards:** Daily Average, Weekly Total, Monthly Total, Projected Annual.
  * **Export CSV Log Button:** Exports comma-separated database summaries.
* **Backend APIs Used:**
  * `GET /api/reports/dashboard`
* **Database Tables Used:**
  * `orders` (Order model)
  * `products` (Product model)
* **Permissions Required:** `role: admin`
* **Dependencies:**
  * Frontend: [admin.js](file:///d:/Project-Magizhvagam/assets/js/admin.js#L67) (loadReportsPageData)
  * Backend: [reportController.js](file:///d:/Project-Magizhvagam/backend/controllers/reportController.js)
* **Status:** Fully Working.

---

## 8. Appearance Studio (`settings.html`)

* **Feature Name:** Dynamic Customizer (Theme Editor)
* **Purpose:** Live customizer for store colors, layout, fonts, header/footer configuration, sections ordering, glassmorphism blur intensity, and mobile adjustments. Writes variables directly to CSS theme loaders.
* **Frontend Components:**
  * **Visual Customizer Accordion:** Accordions for colors, logo assets, button rounding range, glass opacity slider, etc.
  * **Homepage Sections Manager:** Drag-and-drop style vertical lists with up/down arrows and check toggles to order homepage blocks.
  * **Live Iframe Preview:** Embedded viewport loading the storefront and subscribing to postMessage events to update variables instantly.
  * **Save / Restore Buttons:** Actions to push changes to backend or load a previous theme snapshot.
* **Backend APIs Used:**
  * `GET /api/site-settings/all`
  * `GET /api/site-settings/theme`
  * `PUT /api/site-settings/theme`
  * `PUT /api/site-settings/homepage`
  * `PUT /api/site-settings/navigation`
  * `PUT /api/site-settings/footer`
  * `PUT /api/site-settings/animation`
  * `POST /api/site-settings/rollback`
  * `GET /api/site-settings/history/:collection`
  * `GET /api/settings/:key`
  * `PUT /api/settings/:key`
* **Database Tables Used:**
  * `site_settings_v4` (SiteSettings model)
  * `homepage_sections_v4` (HomepageSections model)
  * `navigation_config_v4` (NavigationConfig model)
  * `footer_config_v4` (FooterConfig model)
  * `animation_config_v4` (AnimationConfig model)
  * `site_settings_history` (SiteSettingsHistory model)
  * `settings` (Setting model - homepage fallback keys)
* **Permissions Required:** `role: admin`
* **Dependencies:**
  * Frontend: [appearance-studio.js](file:///d:/Project-Magizhvagam/assets/js/appearance-studio.js), [theme-loader.js](file:///d:/Project-Magizhvagam/assets/js/theme-loader.js)
  * Backend: [siteSettingsController.js](file:///d:/Project-Magizhvagam/backend/controllers/siteSettingsController.js), [dbAdapter.js](file:///d:/Project-Magizhvagam/backend/services/dbAdapter.js)
* **Status:** Fully Working.

---

## 9. Invoice Resolution Hub (`invoices.html`)

* **Feature Name:** Invoice Resolution
* **Purpose:** Compile orders to generate printable sheets with print layouts.
* **Frontend Components:**
  * Order Search Form (OrderID input).
  * Printable Invoice Card showing customer address, billing, tax summary, products grid, and terms.
* **Backend APIs Used:**
  * `GET /api/orders/:id/invoice`
* **Database Tables Used:**
  * `orders` (Order model)
* **Permissions Required:** `role: admin` or `role: staff`
* **Dependencies:**
  * Frontend: [admin.js](file:///d:/Project-Magizhvagam/assets/js/admin.js#L61) (initInvoiceSearch)
  * Backend: [orderController.js](file:///d:/Project-Magizhvagam/backend/controllers/orderController.js) (generateInvoice)
* **Status:** Fully Working.

---

## 10. System Diagnostics (`system-diagnostics.html`)

* **Feature Name:** Diagnostics Tool
* **Purpose:** Confirm backend connection parameters (e.g. SMTP connectivity).
* **Frontend Components:**
  * Diagnostics refresh console output.
  * SMTP Test Email trigger.
* **Backend APIs Used:**
  * `GET /api/admin/system/smtp-test`
  * `POST /api/admin/system/smtp-send-test`
* **Database Tables Used:**
  * `audit_logs` (AuditLog model)
* **Permissions Required:** `role: admin`
* **Dependencies:**
  * Frontend: [admin-system.js](file:///d:/Project-Magizhvagam/assets/js/admin-system.js)
  * Backend: [adminSystemController.js](file:///d:/Project-Magizhvagam/backend/controllers/adminSystemController.js), [emailService.js](file:///d:/Project-Magizhvagam/backend/services/emailService.js)
* **Status:** Fully Working.
