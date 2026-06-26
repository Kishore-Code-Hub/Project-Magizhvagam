# MAGIZHVAGAM MISSING FEATURES REPORT

This report catalogs features that are currently missing in the Admin Panel or storefront management backend. All entries listed below are **Not Currently Implemented** in the codebase.

---

## 1. Missing Admin & System Features

* **Admin Role Permission Manager (ACL):**
  * *Status:* Not Currently Implemented.
  * *Description:* Roles (`admin`, `staff`, `customer`) are defined, but there is no interface to configure permission overrides for staff users (e.g. restricting write access to settings or products).
* **System Settings Configuration Panels:**
  * *Status:* Not Currently Implemented.
  * *Description:* Configuration panels for general settings, SEO metadata, integrations, and email templates are missing. Currently, these must be edited via environment variables or direct database modification.
* **Audit Trail Viewer:**
  * *Status:* Not Currently Implemented.
  * *Description:* The backend logs operations to `AuditLog` collection, but there is no admin page to view or filter these records.

---

## 2. Missing Ecommerce & Catalog Features

* **Product Variants Configurator:**
  * *Status:* Not Currently Implemented.
  * *Description:* The sidebar has a "Variants" link, but there is no interface or schema supporting product variant options (e.g., size, color, material) with separate stock tracking and pricing.
* **Smart Inventory Alerts:**
  * *Status:* Not Currently Implemented.
  * *Description:* The admin panel lacks automated low-stock warnings, restocking suggestions, or filters for out-of-stock items.
* **Tax and Shipping Rate Configurator:**
  * *Status:* Not Currently Implemented.
  * *Description:* Shipping rates and tax values are hardcoded in the checkout and order controller logic; there is no interface to edit tax tiers or shipping fees by region.

---

## 3. Missing Appearance Controls

* **Pages Editor (Contact, Privacy, Terms):**
  * *Status:* Not Currently Implemented.
  * *Description:* Forms and database bindings to edit content for the Contact Page, Privacy Policy, and Terms of Service are missing.
* **Navigation Mega-Menu Builder:**
  * *Status:* Not Currently Implemented.
  * *Description:* The backend has schema structures for navigation columns and promotional links, but the Admin Panel lacks an interface to customize header navigation links.
* **Image Optimization Controls (Compression & Limits):**
  * *Status:* Not Currently Implemented.
  * *Description:* The sidebar includes links for compression and upload limits, but there is no interface to adjust image resolution limits, WebP quality levels, or maximum upload sizes.

---

## 4. Missing Marketing & Sales Features

* **Popup Promo Builder:**
  * *Status:* Not Currently Implemented.
  * *Description:* The Admin Panel lacks tools to configure, design, or schedule pop-up newsletters or promotional banners.
* **Abandoned Cart Recovery:**
  * *Status:* Not Currently Implemented.
  * *Description:* The system does not track abandoned carts or offer features to send recovery emails or WhatsApp reminders.
* **Flash Sale Product Selector:**
  * *Status:* Not Currently Implemented.
  * *Description:* Flash sales can be scheduled, but there is no interface to select specific products to include in the sale.

---

## 5. Missing Customer & Security Features

* **Customer Account Actions:**
  * *Status:* Not Currently Implemented.
  * *Description:* Admins cannot log in as a customer (impersonation), view customer wishlists, edit customer addresses, or review customer activity logs.
* **Security Logs & Brute-Force Monitoring:**
  * *Status:* Not Currently Implemented.
  * *Description:* The database tracks failed login attempts and lockouts, but the Admin Panel does not display security notifications, blocked IP addresses, or brute-force alerts.

---

## 6. Missing Analytics & Reports Features

* **Advanced Analytics Dashboard:**
  * *Status:* Not Currently Implemented.
  * *Description:* Reports are limited to top-selling items and a basic sales trend SVG. The system lacks graphs for conversion rates, customer retention, coupon utilization, average order value (AOV), and geographical sales distributions.
