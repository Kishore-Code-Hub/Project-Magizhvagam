# MAGIZHVAGAM ADMIN PANEL BUG DETECTION & QA AUDIT REPORT

This report catalogs all confirmed broken elements, dead endpoints, layout rendering bugs, and routing mismatches.

---

## 1. Critical & Functional Errors

### 1.1 Database Backups Endpoint 404 Failure (`backups.html`)
* **Severity:** Critical
* **Bug Description:** The frontend backup dashboard (`backups.html`) contains a "Create Backup Point" button that triggers an HTTP POST request to `/api/admin/system/backup`. However, this endpoint is not registered in the Express routing files (`adminSystemRoutes.js` or `server.js`). Clicking the button fails with a 404 Not Found error.
* **File Reference:**
  * Frontend: [backups.html](file:///D:/Project-Magizhvagam/admin/backups.html#L70-L83)
  * Backend: [adminSystemRoutes.js](file:///D:/Project-Magizhvagam/backend/routes/adminSystemRoutes.js) (does not define backup route)
* **Remediation:** Implement a backup controller method in `adminSystemController.js` that executes a PostgreSQL pg_dump stream and register the POST route on `adminSystemRoutes.js`.

### 1.2 Route Mismatch Bug - Support Queries (`support.html` / `admin.js`)
* **Severity:** Major
* **Bug Description:** The dynamic router in `admin.js` checks if the URL path contains `enquiries.html` to trigger `loadAdminEnquiries()`. However, the contact messages page is named `support.html` in the repository. As a result, loading `support.html` fails to fetch the contact entries, leaving the table spinner looping indefinitely until the user manually hits the "Refresh Messages" button.
* **File Reference:**
  * Router logic: [admin.js](file:///D:/Project-Magizhvagam/assets/js/admin.js#L77-L81)
  * Target element: [support.html](file:///D:/Project-Magizhvagam/admin/support.html#L87)
* **Remediation:** Update `admin.js` router checks from `path.includes('enquiries.html')` to `path.includes('support.html')`.

---

## 2. Incomplete / UI-Only Placeholders (Missing Backend)

The following pages are fully rendered in the navigation sidebar but lack backend database schemas, routes, or controllers, running on mock data or redirecting to default fallbacks:

1. **Product Variants Customizer (`variants.html`):**
   * *Status:* UI/Local Storage Mock.
   * *Issue:* Stated in sidebar as "Variants", but options are stored in local storage instead of writing to a database variant schema.
2. **Returns & Refunds Registry (`returns.html` / `refunds.html`):**
   * *Status:* UI/Local Storage Mock.
   * *Issue:* Lists are hardcoded or mock templates saved in localStorage ledger. There is no DB model or API endpoints supporting sales returns or cash refunds.
3. **Logistics & Courier Integrations (`courier.html` / `shipping.html`):**
   * *Status:* Placeholders.
   * *Issue:* Page routes are UI placeholders; logistics details are saved to localStorage, and no real API integrations exist.
4. **General & Theme Settings Panels (`settings.html` / `theme-builder.html`):**
   * *Status:* Partially Mocked.
   * *Issue:* Clicking options like general, SEO settings, or email templates redirects to `settings.html?tab=advanced-settings`, which lacks matching configuration panels and defaults to custom CSS sheets.

---

## 3. UI and Code Quality Defects

* **Duplicate functions definitions in `admin.js`:**
  * The functions `openPalette`, `closePalette`, and `renderPaletteResults` are declared twice in `admin.js` (once on line 920/937 and again on line 3138/3146). This introduces syntax redundancy.
* **Typo in settings page submit button:**
  * In `settings.html` on line 123, the text displays: `Save Profile Profile` instead of `Save Profile Details`.
