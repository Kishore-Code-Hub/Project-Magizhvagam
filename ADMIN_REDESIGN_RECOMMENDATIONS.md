# MAGIZHVAGAM ADMIN REDESIGN RECOMMENDATIONS

This document presents technical and user experience recommendations for the upcoming redesign of the Magizhvagam Admin Panel, based on code-level analysis of the repository.

---

## 1. Features to Keep Unchanged

* **Iframe-Based Live Preview:**
  * *Rationale:* The postMessage-based sync between `appearance-studio.js` and `/index.html?preview=true` works well. It updates CSS custom properties in real-time without reloading the page, which should be preserved in the redesign.
* **History Rollback Engine:**
  * *Rationale:* The automated snapshot logging to the `site_settings_history` collection provides version control and rollback options for site layouts. This is a solid feature that should be kept.
* **Dual-Database Abstraction Layer (`dbAdapter.js`):**
  * *Rationale:* The adapter pattern is well-structured to support both MongoDB and Supabase/PostgreSQL. It simplifies future database migrations.

---

## 2. Features to Merge

* **Consolidated Design Tokens Panel:**
  * *Current State:* The Appearance Studio sidebar has separate tabs for Colors, Typography, Buttons, and Cards.
  * *Recommendation:* Merge these into a unified **"Theme Design System"** view. Group them under card collapsibles to make style adjustments more cohesive.
* **Unified Promotional Banner Editor:**
  * *Current State:* Hero banners and Collections Spotlight banners use separate custom list editors.
  * *Recommendation:* Combine these into a single **"Promotional Layouts Manager"** view to standardize image selection and text overrides.

---

## 3. Features to Reorganize

* **Resolve Placeholder Navigation Links:**
  * *Current State:* Sidebar submenus for system settings, emails, popups, and general store configurations route to `/admin/settings.html?tab=advanced-settings`, which falls back to the Custom CSS panel due to missing tab views.
  * *Recommendation:* Restructure the settings page layouts. Either build these sections as distinct tabs (e.g., General Settings, Marketing, Integrations) or hide these sidebar links until their corresponding forms are implemented.
* **Integrate Categories & Coupons into Product Management:**
  * *Current State:* Categories and Coupons are managed in accordions within the Category tab of the Appearance Studio.
  * *Recommendation:* Move these settings to the **Products Catalogue** section. Category and coupon management fit better alongside product listings than within storefront styling options.

---

## 4. Features to Remove

* **Legacy Setting Overrides:**
  * *Recommendation:* Clean up the commented-out `syncSettingsToV4` syncing function in `settingController.js` and remove references to flat settings keys. Use the `SiteSettingsV4` singleton as the sole source of truth for storefront styles.
* **Unused Sidebar Navigation Items:**
  * *Recommendation:* Remove placeholder sidebar items like "Image Compression" and "Upload Limits" from the Media Library submenu until their settings panels are fully implemented.

---

## 5. Recommended New Features

* **Product Variant Management Interface:**
  * *Recommendation:* Add options to define product variants (e.g., size, color, material) with separate pricing and inventory tracking in the Add/Edit Product modals.
* **Visual Mega-Menu & Navigation Builder:**
  * *Recommendation:* Build an interface to customize header navigation links. This will allow admins to manage menu hierarchies and mega-menus without direct database updates.
* **Security & Audit Trail Viewer:**
  * *Recommendation:* Add an administrative log viewer that reads from the `audit_logs` collection, helping admins monitor user logins, configuration changes, and system errors.
* **Staff Access Control Interface (ACL):**
  * *Recommendation:* Implement a permissions dashboard to define access levels for staff accounts (e.g., permitting inventory updates but restricting checkout or database settings).
