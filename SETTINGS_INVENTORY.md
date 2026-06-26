# MAGIZHVAGAM SETTINGS INVENTORY

This document catalogues all configurable settings, feature flags, environmental constants, and media policies currently supported by the Magizhvagam Admin Panel and storefront backend.

---

## 1. General & Store Identity Settings

These are saved in the singleton config schema metadata (`site_settings_v4` collection, `meta` block) and the legacy configuration keys (`settings` collection, key `homepage`).

* **Store Name / Brand Name:**
  * Keys: `meta.storeName` (SiteSettings) & `brandName` (Setting: `homepage`)
  * Data Type: String
  * Default: `"MAGIZHVAGAM"`
* **Store Tagline:**
  * Key: `meta.storeTagline`
  * Data Type: String
  * Default: `"Place of Happiness"`
* **Store Address / Contact details:**
  * Keys: `meta.contactAddress` & `contactDetails` (Setting: `homepage`)
  * Data Type: String
  * Default: `"Chennai, Tamil Nadu"`
* **Store Phone / WhatsApp Contact:**
  * Keys: `meta.socialLinks.whatsapp` & `whatsappContact` (Setting: `homepage`)
  * Data Type: String (Phone digits with country code)
  * Default: `"919876543210"`
* **SEO Title:**
  * Key: `meta.seoTitle`
  * Data Type: String
  * Default: `"MAGIZHVAGAM | Premium Return Gifts & Customized Gift Store"`
* **SEO Description:**
  * Key: `meta.seoDescription`
  * Data Type: String
  * Default: `"Premium Return Gifts & Customized Gifts for Weddings, Birthdays, Baby Showers, Corporate events, and Festivals."`

---

## 2. Social Media Settings

* **Instagram URL:**
  * Keys: `meta.socialLinks.instagram` & `footerInstagram` (Setting: `homepage`)
  * Data Type: String URL
* **Facebook URL:**
  * Keys: `meta.socialLinks.facebook` & `footerFacebook` (Setting: `homepage`)
  * Data Type: String URL
* **Twitter URL:**
  * Keys: `meta.socialLinks.twitter` & `footerTwitter` (Setting: `homepage`)
  * Data Type: String URL
* **YouTube URL:**
  * Key: `meta.socialLinks.youtube`
  * Data Type: String URL
* **WhatsApp Link:**
  * Keys: `meta.socialLinks.whatsapp` & `footerWhatsapp` (Setting: `homepage`)
  * Data Type: String URL (e.g. `https://wa.me/919876543210`)

---

## 3. Core Feature Toggles

These settings are managed in the `settings` collection (document matching key: `featureToggles` or `allowSignup`).

* **Global Wishlist System:**
  * Key: `wishlistEnabled`
  * Data Type: Boolean
  * Default: `true`
* **Coupon Discount Engine:**
  * Key: `couponsEnabled`
  * Data Type: Boolean
  * Default: `true`
* **Customer Registration Portal:**
  * Key: `registrationEnabled` / `allowSignup`
  * Data Type: Boolean
  * Default: `true`
* **WhatsApp Checkout Routing:**
  * Key: `whatsappCheckoutEnabled`
  * Data Type: Boolean
  * Default: `false`
* **Cash on Delivery (COD) Option:**
  * Key: `codEnabled`
  * Data Type: Boolean
  * Default: `true`
* **Reviews & Ratings:**
  * Key: `reviewsEnabled`
  * Data Type: Boolean
  * Default: `true`
* **Recommendations Panel:**
  * Key: `recommendationsEnabled`
  * Data Type: Boolean
  * Default: `true`
* **Flash Sales & Promo Banners:**
  * Key: `promosEnabled`
  * Data Type: Boolean
  * Default: `true`
* **Announcement Banner:**
  * Key: `announcementBannerEnabled`
  * Data Type: Boolean
  * Default: `true`
* **Theme Accent Color:**
  * Key: `themeAccentColor`
  * Data Type: String (Hex Color)
  * Default: `"#6A0DAD"`
* **Homepage Layout Featured Curation:**
  * Key: `homepageLayoutFeatured`
  * Data Type: Boolean
  * Default: `true`
* **Customer Login Requirement:**
  * Key: `customerLoginRequirement`
  * Data Type: Boolean
  * Default: `true`
* **Publish Flash Sale Countdown Banner:**
  * Key: `flashSaleActive`
  * Data Type: Boolean
  * Default: `false`
* **Flash Sale Promotional Banner Text:**
  * Key: `flashSaleText`
  * Data Type: String
  * Default: `"Mega Flash Sale! Get 20% off all return gifts!"`
* **Flash Sale Target Deadline Date & Time:**
  * Key: `flashSaleTargetDate`
  * Data Type: Date (UTC/ISO date-time or null)
  * Default: `null`

---

## 4. System Settings (Email & SMTP)

Configured securely on the server via backend environmental variables (`.env`).

* **SMTP Diagnostic Parameters:**
  * `SMTP_HOST`: Host Address (e.g. `smtp.gmail.com`)
  * `SMTP_PORT`: Port integer (e.g. `587` or `465`)
  * `SMTP_USER`: Credentials username
  * `SMTP_PASS`: Credentials password (e.g. App password)
  * `SMTP_SECURE`: Connection security mode (`true` for TLS, `false` for default transport)
  * `SMTP_FROM`: Outbox display signature email address

---

## 5. Media & Upload Settings

Defines file processing thresholds and backend destinations.

* **Image Compression Optimization:**
  * Dimensions: Resized to fit inside `1920x1920` boundary parameters preserving aspect ratio (Sharp).
  * Format: WebP (`quality: 80`).
* **Upload Limits by Destination (Multer Memory Size Constraints):**
  * Settings Images Upload: Max size limit of **10MB**.
  * Media Library Assets: Max size limit of **8MB**.
  * User Profile Avatars: Max size limit of **5MB**.
* **Cloudinary Storage Parameters:**
  * `CLOUDINARY_CLOUD_NAME`: Credentials cloud name
  * `CLOUDINARY_API_KEY`: Credentials API key
  * `CLOUDINARY_API_SECRET`: Credentials API secret
