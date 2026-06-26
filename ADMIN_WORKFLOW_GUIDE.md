# MAGIZHVAGAM ADMIN WORKFLOW GUIDE

This guide maps out the step-by-step execution path of the key administrative workflows in Magizhvagam, from frontend trigger to backend controller, database schema modification, and storefront update.

---

## 1. Product Lifecycle Management (CRUD)

### Product Creation Workflow
1. **Trigger:** The admin clicks the **Add New Product** button on `admin/products.html` and fills out the modal form.
2. **Frontend Validation:** Standard HTML validation checks if fields marked with `*` (Name, Price, Category, Stock, Description, Primary Image) are provided. Price must be $\ge 1$, and stock level $\ge 0$.
3. **API Dispatch:** Form is submitted as `multipart/form-data` to `POST /api/products`.
4. **Controller Execution:** 
   * **Middleware:** [uploadMiddleware.js](file:///d:/Project-Magizhvagam/backend/middleware/uploadMiddleware.js) handles raw buffers, optimizes images via `sharp` (creates 80% quality WebP assets), uploads to Cloudinary (if configured) or writes locally to `uploads/products/`.
   * **Controller:** [productController.js](file:///d:/Project-Magizhvagam/backend/controllers/productController.js::createProduct) reads name, description, price, discountPrice, stock, category, specifications, tags, and image paths from request.
5. **Database Changes:** Creates a new document in the `products` collection.
6. **After-Save & Storefront Impact:** 
   * Storefront `/products.html` query immediately shows the new item.
   * If marked `isFeatured: true`, it immediately appears under the "Featured Collection" grid section of the storefront index page.

### Product Deletion Workflow
1. **Trigger:** Click **Delete** next to a product row on `admin/products.html`.
2. **API Dispatch:** `DELETE /api/products/:id`.
3. **Controller Execution:** [productController.js::deleteProduct] fetches the product document, deletes the asset files on Cloudinary or local paths using the stored `publicId` / `url`, and deletes the document.
4. **Database Changes:** The document matching the ID is deleted from the `products` collection. Reviews associated with that product ID are also removed.

---

## 2. Category Curation

1. **Trigger:** Admin switches sidebar to **Products > Categories** (or `admin/products.html?view=categories`).
2. **Action:** Fills out the Category form (Category Name, Image selection) and clicks **Add Category**.
3. **API Dispatch:** `POST /api/products/categories`.
4. **Controller Execution:** [productController.js::createCategory] formats a URL slug from the category name (e.g. "Gift Hampers" becomes "gift-hampers"), checks for slug uniqueness, and creates the document.
5. **Database Changes:** Creates a document in the `categories` collection:
   ```json
   { "name": "Gift Hampers", "image": "/uploads/media/...", "slug": "gift-hampers" }
   ```
6. **Storefront Impact:** The "Shop by Category" section on the storefront homepage instantly renders the new category card. Product lists can now filter items using `?category=gift-hampers`.

---

## 3. Marketing Promotion (Coupons)

1. **Trigger:** Access **Products > Categories > Coupon Manager** or `admin/settings.html?tab=categories` accordion.
2. **Action:** Inputs Coupon code (e.g. FESTIVAL50), type (`Percentage` / `FixedAmount`), value, minimum order criteria, and expiry date.
3. **API Dispatch:** `POST /api/settings/coupons/new`.
4. **Controller Execution:** [settingController.js::createCoupon] forces the code to uppercase, validates that dates are in the future, and saves.
5. **Database Changes:** A document is created in the `coupons` collection.
6. **Storefront Impact:** Customers can input the coupon code in their checkout basket page (`/cart.html` or `/checkout.html`). The cart page calls `POST /api/orders/check-coupon` to deduct the discount dynamically from the subtotal.

---

## 4. Appearance Studio Configuration (V4 Customizer)

### Preset Switch Workflow
1. **Trigger:** Admin visits `admin/settings.html?tab=presets` and clicks a card (e.g. "Royal Gold").
2. **Action:** The visual selector triggers `applyThemePreset('royal')` inside [appearance-studio.js](file:///d:/Project-Magizhvagam/assets/js/appearance-studio.js).
3. **Live Preview:** PostMessage sends token updates to the iframe. The storefront preview instantly swaps its CSS variables.
4. **Persistence (Save):** Admin clicks **Save Changes** at the header of the customizer panel.
5. **API Dispatch:** `PUT /api/site-settings/theme` (with preset configuration values).
6. **Controller Execution:** [siteSettingsController.js::updateTheme] is called. It creates a historical snapshot of the existing configuration in `site_settings_history` for rollback capabilities, then overwrites the singleton document `_id: "active"`.
7. **Storefront Impact:** The active frontend loads the new configuration immediately via [theme-loader.js](file:///d:/Project-Magizhvagam/assets/js/theme-loader.js) which query fetches `GET /api/site-settings/theme` and injects updated CSS variables into the `:root` styling block on page load.

### Homepage Section Reordering & Configuration Workflow
1. **Trigger:** Inside `admin/settings.html?tab=homepage`.
2. **Action:** Click ↑ or ↓ next to home segments (e.g. Hero, Category Grid, Testimonials) or uncheck a section.
3. **API Dispatch:** Click **Save Changes** to submit payload to `PUT /api/site-settings/homepage`.
4. **Controller Execution:** [siteSettingsController.js::updateHomepage] performs validation checking that all section IDs match the system whitelist and orders are unique, updates settings history, and updates the database singleton.
5. **Database Changes:** Modifies the array in the `homepage_sections_v4` collection.
6. **Storefront Impact:** Frontend `index.html` loads section configs dynamically and organizes sections in the DOM in the specified order.

---

## 5. Orders Curation & Delivery Status

1. **Trigger:** Admin visits `/admin/orders.html` and locates an order.
2. **Action:** Admin changes the status option in the dropdown (e.g., from `Pending` to `Delivered`).
3. **API Dispatch:** `PUT /api/orders/:id/status`.
4. **Controller Execution:** [orderController.js::updateOrderStatus] validates the status enum value (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`). If the order status transitions to `Cancelled`, it handles restocking inventory.
5. **Database Changes:** The `status` field is modified on the document matching the ID in the `orders` collection.
6. **Storefront Impact:** If the user checks their history at `/profile.html`, they instantly see the status badge updated. An audit trail records the admin status transition.

---

## 6. Flash Sale Promotion Management

1. **Trigger:** Admin visits the Control Panel on `admin/dashboard.html` under "Flash Sale Management".
2. **Action:** Check **Publish Flash Sale Countdown Banner**, inputs banner message (e.g., "Deepavali Special - 20% Off!"), sets a deadline, and clicks save.
3. **API Dispatch:** `PUT /api/settings/feature-toggles`.
4. **Controller Execution:** [settingController.js::updateFeatureToggles] sanitizes parameters and updates the `featureToggles` setting document.
5. **Database Changes:** Updates `Setting` schema keys `flashSaleActive`, `flashSaleText`, and `flashSaleTargetDate` in the `settings` collection.
6. **Storefront Impact:** Storefront header loads the feature flags; if active, a countdown timer starts ticking on the homepage, calculating real-time differences in seconds towards the target deadline.
