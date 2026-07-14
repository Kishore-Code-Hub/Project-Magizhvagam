# MAGIZHVAGAM ADMIN PANEL FEATURE INVENTORY

This document logs every page, module, component, form, API, and database interaction found in the Magizhvagam Admin Panel.

## Inventory Overview
The admin console comprises **62 files** representing distinct workflows. They are grouped into left-sidebar categories injected dynamically by [admin.js](file:///D:/Project-Magizhvagam/assets/js/admin.js).

---

## 1. Overview & Telemetry Console

### 1.1 Dashboard Page (`dashboard.html`)
* **Purpose:** Monitor live sales aggregates, schedule flash campaigns, and configure global website feature toggles.
* **UI Elements:**
  * Metric Telemetry Cards: Revenue, Total Orders, Active Customers, Live Inventory items.
  * SVG Trend Chart: Renders dynamic daily/weekly performance logs.
  * Feature Flags Grid: 8 toggle inputs (Wishlist, Customer Login, Account Registration, Coupon engine, WhatsApp checkout routing, Cash on Delivery, Reviews, Flash sales).
  * Brand Color Picker: Allows live customization of primary accents across styling pages.
  * Flash Sale Scheduling: Form with banner promotion inputs and target date picker.
  * Reset Statistics Modal: Confirms database aggregates purge.
* **Backend APIs:**
  * `GET /api/reports/dashboard`
  * `POST /api/reports/reset-stats`
  * `GET /api/settings/feature-toggles`
  * `PUT /api/settings/feature-toggles`
* **Database Models:** `orders`, `users`, `products`, `settings`
* **Status:** **Fully Working**

---

## 2. Catalog & Inventory Management

### 2.1 Products Catalogue (`products.html`)
* **Purpose:** Management of products entries, including stock quantities, pricing adjustments, image galleries, and duplicate actions.
* **UI Elements:**
  * Products Listing Table: Grid displaying thumbnail, title, category, pricing, stock levels, featured flag status, edit/duplicate/delete action nodes.
  * Add/Edit Product Modal Form: Fields for name, description, price, discount pricing, category selector, specs fields (Material, Dimensions, Weight, Color), tags array, primary/secondary uploads, multi-gallery (max 3 uploads).
  * Bulk Action Panel: Allows bulk delete, stock modification, and category adjustments.
  * CSV Importer/Exporter: Trigger inputs to import database CSV rows or compile CSV download logs.
* **Backend APIs:**
  * `GET /api/products`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`
  * `POST /api/products/duplicate/:id`
  * `POST /api/products/bulk-delete`
  * `PUT /api/products/bulk-update`
  * `POST /api/products/bulk-import`
* **Database Models:** `products`, `categories`
* **Status:** **Fully Working**

### 2.2 Category Manager (`categories.html`)
* **Purpose:** Structure classifications for products.
* **Backend APIs:** `GET /api/products/categories`, `POST /api/products/categories`, `DELETE /api/products/categories/:id`
* **Database Models:** `categories`
* **Status:** **Fully Working**

### 2.3 Regional Warehouse Stock (`warehouse.html`)
* **Purpose:** Manages inventory splits across HQ, Chennai Hub, and Coimbatore.
* **UI Elements:**
  * Warehouse Stock Table: Shows regional stock numbers per product and combined totals.
  * Stock Transfer Modal Form: Transfers specific stock quantities from a source hub to a destination.
* **Backend APIs:** Uses `PUT /api/products/:id` to update the total combined stock in the database.
* **Database Models:** `products`
* **Status:** **Partially Working / Mock**. Splits and transfers are saved in `localStorage` (`warehouse_allocations_${prodId}`), but total stock updates connect to the backend.

### 2.4 Product Variants (`variants.html`)
* **Purpose:** Define additional gift wrapping and customization options.
* **Status:** **Mock Data (Local Storage)**. Reads and writes variant groups and options strictly inside `localStorage` (`product_variants_custom`). Lacks backend APIs or models.

### 2.5 Media Library Gallery (`media.html`)
* **Purpose:** Storefront media library and upload repository.
* **Backend APIs:** `GET /api/media`, `POST /api/media/upload`, `DELETE /api/media/:id`
* **Status:** **Partially Working**. Image uploading works, but submenus for compression settings and upload limits are static placeholders.

---

## 3. Sales & Fulfillment Registry

### 3.1 Orders Registry (`orders.html`)
* **Purpose:** Track customer checkouts and modify delivery states.
* **Backend APIs:** `GET /api/orders`, `PUT /api/orders/:id/status`
* **Status:** **Partially Working**. Order listing and status updates are functional (triggers restock if cancelled), but detailed notes and logistics histories save in `localStorage` (`logistics_${orderId}`).

### 3.2 Invoice Resolution Hub (`invoices.html`)
* **Purpose:** Search orders, display tax structures, and print invoice documents.
* **Backend APIs:** `GET /api/orders/:id/invoice`
* **Status:** **Partially Working**. The search and printing of invoices are working. However, the Purchase Order generator and Credit Notes list tabs inside the page are local mocks (saving in memory arrays and static templates).

---

## 4. Marketing & Content Customization

### 4.1 Discount Coupons (`coupons.html`)
* **Purpose:** Create promotional discount coupons.
* **Backend APIs:** `GET /api/settings/coupons`, `POST /api/settings/coupons/new`, `DELETE /api/settings/coupons/:id`
* **Database Models:** `coupons`
* **Status:** **Fully Working**

### 4.2 Customer Support Console (`support.html`)
* **Purpose:** Renders contact form enquiries, chatbot logs, live support chats, and FAQs.
* **Backend APIs:** `GET /api/contact`
* **Database Models:** `enquiries`
* **Status:** **Partially Working / Mock**. The Contact queries tab works (via API), but live chats, chatbot session logs, and FAQ configurations are entirely frontend mocks saving to local memory. It also suffers from a page routing mismatch bug where `admin.js` only loads queries on `enquiries.html` instead of `support.html`.

---

## 5. System Administration & Settings

### 5.1 System Diagnostics (`system-diagnostics.html`)
* **Purpose:** SMTP diagnostics verification.
* **Backend APIs:** `GET /api/admin/system/smtp-test`, `POST /api/admin/system/smtp-send-test`
* **Status:** **Fully Working**

### 5.2 Security Audits (`security.html`)
* **Purpose:** Displays administrative audit logs.
* **Backend APIs:** `GET /api/admin/system/audit-logs`
* **Database Models:** `audit_logs`
* **Status:** **Fully Working**

### 5.3 Database System Backups (`backups.html`)
* **Purpose:** Triggers PostgreSQL database dumps.
* **Backend APIs:** `POST /api/admin/system/backup` (Route missing in backend!)
* **Status:** **Broken (Missing backend API)**. Triggering the backup button results in a 404 connection failure.
