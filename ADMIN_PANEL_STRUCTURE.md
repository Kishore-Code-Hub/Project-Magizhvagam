# MAGIZHVAGAM ADMIN PANEL STRUCTURE

This document details the layout structure, page hierarchy, and navigation flow of the Magizhvagam Admin Panel. The navigation tree is constructed dynamically on the frontend via JavaScript injection from `assets/js/admin.js`.

---

## 1. Left Sidebar Navigation Tree

Below is the complete tree representation of the administrative menu groups, submenus, routes, and Lucide icons as implemented in `injectAdminSidebar()` inside [admin.js](file:///d:/Project-Magizhvagam/assets/js/admin.js#L83-L306).

```
MAGIZHVAGAM (Logo Header)
├── Dashboard (Icon: layout-dashboard, Route: /admin/dashboard.html)
├── Products (Icon: gift) [Submenu]
│   ├── Product List (Route: /admin/products.html)
│   ├── Add Product (Route: /admin/products.html?action=add)
│   ├── Categories (Route: /admin/products.html?view=categories)
│   ├── Inventory (Route: /admin/products.html?view=inventory)
│   └── Variants (Route: /admin/products.html?view=variants)
├── Orders (Icon: shopping-bag, Route: /admin/orders.html)
├── Customers (Icon: users, Route: /admin/customers.html)
├── Media Library (Icon: image) [Submenu]
│   ├── Gallery (Route: /admin/media.html)
│   ├── Image Compression (Route: /admin/media.html?tab=compression)
│   └── Upload Limits (Route: /admin/media.html?tab=limits)
└── Reports (Icon: bar-chart-2, Route: /admin/reports.html)

─── APPEARANCE STUDIO (Section Header)
├── Appearance (Icon: layout) [Submenu]
│   ├── Theme Presets (Route: /admin/settings.html?tab=presets)
│   └── Colors (Route: /admin/settings.html?tab=colors)
├── Typography (Icon: type) [Submenu]
│   ├── Font Family (Route: /admin/settings.html?tab=typography)
│   ├── Font Weight (Route: /admin/settings.html?tab=typography)
│   ├── Font Size (Route: /admin/settings.html?tab=typography)
│   └── Heading Styles (Route: /admin/settings.html?tab=typography)
├── Header (Icon: panel-top) [Submenu]
│   ├── Logo (Route: /admin/settings.html?tab=header)
│   ├── Announcement Bar (Route: /admin/settings.html?tab=header)
│   ├── Sticky Header (Route: /admin/settings.html?tab=header)
│   └── Navigation (Route: /admin/settings.html?tab=header)
├── Homepage (Icon: home) [Submenu]
│   ├── Hero Section (Route: /admin/settings.html?tab=homepage)
│   ├── Categories (Route: /admin/settings.html?tab=homepage)
│   ├── Featured Collection (Route: /admin/settings.html?tab=homepage)
│   ├── Infinite Product Loop (Route: /admin/settings.html?tab=homepage)
│   ├── Flash Sale (Route: /admin/settings.html?tab=homepage)
│   ├── Testimonials (Route: /admin/settings.html?tab=homepage)
│   ├── Newsletter (Route: /admin/settings.html?tab=homepage)
│   └── Footer (Route: /admin/settings.html?tab=homepage)
├── Testimonials (Icon: message-square) [Submenu]
│   ├── Add Testimonial (Route: /admin/settings.html?tab=testimonials)
│   ├── Edit Testimonial (Route: /admin/settings.html?tab=testimonials)
│   ├── Delete Testimonial (Route: /admin/settings.html?tab=testimonials)
│   ├── Ratings (Route: /admin/settings.html?tab=testimonials)
│   ├── Customer Image (Route: /admin/settings.html?tab=testimonials)
│   └── Sort Order (Route: /admin/settings.html?tab=testimonials)
├── Footer (Icon: panel-bottom) [Submenu]
│   ├── Footer Description (Route: /admin/settings.html?tab=footer)
│   ├── Footer Columns (Route: /admin/settings.html?tab=footer)
│   ├── Social Links (Route: /admin/settings.html?tab=footer)
│   ├── Contact Details (Route: /admin/settings.html?tab=footer)
│   ├── Copyright (Route: /admin/settings.html?tab=footer)
│   ├── Newsletter (Route: /admin/settings.html?tab=footer)
│   └── Colors (Route: /admin/settings.html?tab=footer)
├── Pages (Icon: info) [Submenu]
│   ├── About Page (Route: /admin/settings.html?tab=about-page)
│   ├── Contact Page (Route: /admin/settings.html?tab=about-page)
│   ├── Privacy Policy (Route: /admin/settings.html?tab=about-page)
│   └── Terms of Service (Route: /admin/settings.html?tab=about-page)
├── Marketing (Icon: percent) [Submenu]
│   ├── Coupons (Route: /admin/settings.html?tab=advanced-settings)
│   ├── Flash Sales (Route: /admin/settings.html?tab=advanced-settings)
│   ├── Popup Banner (Route: /admin/settings.html?tab=advanced-settings)
│   └── Announcement Bar (Route: /admin/settings.html?tab=advanced-settings)
├── System (Icon: cpu) [Submenu]
│   ├── Email Templates (Route: /admin/settings.html?tab=advanced-settings)
│   ├── OTP Settings (Route: /admin/settings.html?tab=advanced-settings)
│   ├── Session Timeout (Route: /admin/settings.html?tab=advanced-settings)
│   └── WhatsApp Settings (Route: /admin/settings.html?tab=advanced-settings)
└── Settings (Icon: settings) [Submenu]
    ├── General (Route: /admin/settings.html?tab=advanced-settings)
    ├── Store Information (Route: /admin/settings.html?tab=advanced-settings)
    ├── SEO Settings (Route: /admin/settings.html?tab=advanced-settings)
    ├── Analytics (Route: /admin/settings.html?tab=advanced-settings)
    └── Integrations (Route: /admin/settings.html?tab=advanced-settings)

─── UTILITY FUNCTIONS (Action link at bottom of menu)
└── Sign Out (Icon: log-out, Triggers script logout function)
```

---

## 2. Hidden Pages & Direct Routes

The following pages exist under `/admin/` and are fully authenticated but do not appear in the left sidebar tree:

1. **Invoice Resolution Hub**
   * **Route:** `/admin/invoices.html`
   * **Primary Function:** Search for customer invoices by Order ID and compile clean layouts for printing or storage.
2. **System Diagnostics**
   * **Route:** `/admin/system-diagnostics.html`
   * **Primary Function:** Check connection stability for services like SMTP (Email test send / connection verify).
3. **Login Portal**
   * **Route:** `/admin/login` (renders `/admin/login.html`)
   * **Primary Function:** Administrative authentication portal using dynamic JWT checks.

---

## 3. Sidebar Navigation Flow & Routing Logic

1. **Active Page Highlighting:**
   Determined dynamically by checking if `window.location.pathname` contains the target file segment (e.g. `dashboard.html`, `products.html`).
2. **Submenu Expanding:**
   Classes `expanded` (on list items) and `open` (on nested list containers) are applied dynamically based on the current URI pathname or parameter:
   * **Products Submenu:** Expanded if URL path has `products.html`.
   * **Media Submenu:** Expanded if URL path has `media.html`.
   * **Appearance Submenu:** Expanded if path is `settings.html` and query param `tab` is `presets` or `colors`.
   * **Typography Submenu:** Expanded if path is `settings.html` and `tab` is `typography`.
   * **Header Submenu:** Expanded if path is `settings.html` and `tab` is `header`.
   * **Homepage Submenu:** Expanded if path is `settings.html` and `tab` is `homepage`.
   * **Testimonials Submenu:** Expanded if path is `settings.html` and `tab` is `testimonials`.
   * **Footer Submenu:** Expanded if path is `settings.html` and `tab` is `footer`.
   * **Pages Submenu:** Expanded if path is `settings.html` and `tab` is `about-page` (Note: in html panel list, pages submenus route to `tab=about-page`).
   * **Marketing, System, and Settings Submenus:** All expand if `settings.html` has query param `tab=advanced-settings`.
3. **Dynamic Tab Switching:**
   * In [settings.html](file:///d:/Project-Magizhvagam/admin/settings.html), switching between customizer tabs (Presets, Colors, Fonts, Header, Homepage, Testimonials, Footer, Buttons, Cards, Product Pages, Category Pages, About Page, Mobile Settings, Animations, Glassmorphism, Custom CSS) changes the layout live.
   * If a user clicks a sidebar link that goes to `settings.html?tab=xyz`, the theme customizer loads and immediately triggers page panel switching using query param logic.
