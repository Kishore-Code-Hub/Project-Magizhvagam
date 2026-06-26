# MAGIZHVAGAM APPEARANCE STUDIO ANALYSIS

The Appearance Studio (rendered by `/admin/settings.html`) is a state-of-the-art live theme customization system. It lets administrators configure colors, layout constants, typography, header, footer, animations, and glassmorphism elements, observing updates inside a live-refreshing viewport iframe.

---

## 1. Core Architecture & Double-Write Synchronization

1. **Active Data Model:**
   * Reads from the `site_settings_v4` singleton document (`_id: "active"`).
   * Reads from whitelisted collections: `homepage_sections_v4`, `navigation_config_v4`, `footer_config_v4`, and `animation_config_v4`.
2. **Synchronization Strategy:**
   * Historically, Magizhvagam used a flat key-value model stored in the `settings` collection (key `homepage`).
   * When settings are saved, the system synchronizes specific inputs to V4 properties via [siteSettingsController.js](file:///d:/Project-Magizhvagam/backend/controllers/siteSettingsController.js).
   * To prevent overwriting V4 values with legacy keys, the automatic reverse synchronization (`syncSettingsToV4`) has been commented out, ensuring Appearance Studio remains the source of truth.
3. **WCAG Contrast Compliance Auditor:**
   * Calculated dynamically inside [contrast-engine.js](file:///d:/Project-Magizhvagam/assets/js/contrast-engine.js).
   * Compares `paletteBgMain` against `paletteTextMain`.
   * Evaluates contrast ratio (L1/L2 luminance logic).
   * Displays compliance status in the panel header. If the ratio falls below **4.5:1**, a toast warning alert is triggered, although saving is not blocked.

---

## 2. Tab-by-Tab Configuration Matrix

### Tab 1 — Theme Presets (`tab-presets`)
* **Purpose:** Instantly swap color palettes and styles.
* **Fields & Settings:** Cards representing presets: Deep Velvet Night (`velvet`), Royal Gold (`royal`), Luxury Ivory (`ivory`), Emerald Premium (`emerald`), Modern Corporate (`corporate`).
* **CSS Variable / Property Map:** Maps directly to `themeV4.meta.activePresetId`. Clicking a card assigns predetermined colors to color picker inputs in the UI.

### Tab 2 — Colors (`tab-colors`)
* **Purpose:** Direct control over branding, backgrounds, and state colors.
* **Global Branding Colors:**
  * Primary Brand Color (`--primary-color-field` $\to$ `theme.hdr.logo_text`)
  * Secondary Brand Color (`--secondary-color-field` $\to$ `theme.hdr.nav_link_hover`)
  * Accent Highlights Color (`--accent-color-field` $\to$ `theme.hero.badge_text`)
* **Identity Canvas Palette:**
  * Main Background Color (`--palette-bg-main` $\to$ `theme.hdr.bg`, `theme.hdr.sticky_bg`, `theme.cart.page_bg`, `theme.ft.bg`)
  * Card Background Color (`--palette-bg-surface` $\to$ `theme.pc.bg`, `theme.pdp.customization_panel_bg`, `theme.cart.item_card_bg`)
  * Main Body Text (`--palette-text-main` $\to$ `theme.hdr.nav_link_color`, `theme.pc.name_color`, `theme.pdp.title_color`)
  * Muted Secondary Text (`--palette-text-muted` $\to$ `theme.hero.subheadline_color`, `theme.pc.category_color`)
* **State & Action Accents:**
  * Main Button Color (`--palette-color-primary` $\to$ `theme.btn.primary_bg`)
  * Secondary Accent / Hover (`--palette-color-secondary` $\to$ `theme.btn.primary_hover_bg`)
  * Success Accent (`--palette-color-success` $\to$ `theme.pc.stock_in_color`)
  * Error Accent (`--palette-color-error` $\to$ `theme.pc.stock_out_color`)

### Tab 3 — Fonts / Typography (`tab-typography`)
* **Purpose:** Custom typography families and text scaling.
* **Fields & Settings:**
  * Font Family select (Options: Outfit, Inter, Plus Jakarta Sans, Playfair Display $\to$ `typography.body.family` & `typography.heading.family`).
  * Font Scale Multiplier slider ($0.9$ to $1.15$ range $\to$ `typography.scaleMultiplier`).

### Tab 4 — Header (`tab-header`)
* **Purpose:** Custom brand labels, announcements, and navigation options.
* **Fields & Settings:**
  * Brand Name text input $\to$ `meta.storeName`.
  * Logo Image select/upload (via Media Picker callback) $\to$ `logo`.
  * WhatsApp Contact number $\to$ `meta.socialLinks.whatsapp`.
  * Enable Sticky Header checkbox $\to$ `theme.hdr.sticky` (Boolean).
  * Show Announcement Bar checkbox $\to$ `theme.hdr.announcement_active` (Boolean).
  * Announcement Bar Bg color $\to$ `theme.hdr.announcement_bg`.
  * Announcement Text color $\to$ `theme.hdr.announcement_text`.

### Tab 5 — Homepage (`tab-homepage`)
* **Purpose:** Homepage curation blocks.
* **Fields & Settings:**
  * **Homepage Section Reordering List:** Vertical row nodes with enabled toggles and Order index updates.
  * **Hero Carousel Banners visual editor:** List rows with Headline, Subheadline, Link URL, and Choose Image.
  * **Collections Spotlight Banners visual editor:** Spotlight title, subtitle, link, and background images.
  * *Stored Fields:* Synced directly to `homepage_sections_v4`.

### Tab 6 — Testimonials (`tab-testimonials`)
* **Purpose:** Management of feedback items shown in "What Our Clients Say".
* **Fields & Settings:** List of cards containing Name, Review Text, Rating input (1-5), Location, and verified status.

### Tab 7 — Footer (`tab-footer`)
* **Purpose:** Footer descriptors, links, social paths, and copyright.
* **Fields & Settings:**
  * Footer Description text block $\to$ `footerContent`.
  * Copyright licensing text $\to$ `footerCopyright`.
  * Instagram URL, Facebook URL, Twitter URL, WhatsApp URL.

### Tab 8 — Buttons (`tab-buttons`)
* **Purpose:** Styles for UI buttons.
* **Fields & Settings:**
  * Border Radius Style select (Options: `rounded` $\to$ 8px, `pill` $\to$ 30px, `sharp` $\to$ 0px).
  * Shadow Strength (none, soft, pronounced).
  * Font Weight (Medium, Semi-Bold, Bold).

### Tab 9 — Cards (`tab-cards`)
* **Purpose:** Styles for products and categories cards.
* **Fields & Settings:**
  * Card Border Radius range slider (0 to 32px).
  * Card Shadow Strength range slider (0 to 3).
  * Hover Translate Y displacement slider (0 to 15px).
  * Card Image Background color picker.

### Tab 10 — Product Pages (`tab-products`)
* **Purpose:** PDP specific colorations and curated IDs lists.
* **Fields & Settings:**
  * Featured Product IDs, Best Sellers IDs, New Arrivals IDs (Comma-separated text fields).
  * PDP Thumbnail Active Border color.
  * PDP Specifications Heading color.
  * PDP Active Tab Accent color.

### Tab 11 — Category Pages (`tab-categories`)
* **Purpose:** Curation grids spacing and nested categories/coupons management.
* **Fields & Settings:**
  * Catalog Grid Gap select input (8px to 48px).
  * Grid Columns Density select input (2, 3, or 4 columns).
  * Integrated **Category Manager** (Add category form and list of existing categories).
  * Integrated **Coupon Manager** (Add coupon form and list of active coupons).

### Tab 12 — About Page (`tab-about`)
* **Purpose:** Text content and images for `/about.html`.
* **Fields & Settings:** Story Heading, Story Intro Text, Left Section Heading, Left Section Paragraphs, and image picker.

### Tab 13 — Mobile Settings (`tab-mobile`)
* **Purpose:** Viewport specific rules for smaller screens.
* **Fields & Settings:**
  * Mobile Font Scaling Offset range slider (0.8 to 1.0 multiplier).
  * Mobile Header Height (50px to 90px).
  * Mobile Drawer Menu Background color picker.

### Tab 14 — Animations (`tab-animations`)
* **Purpose:** System-wide scroll triggers and speed controls.
* **Fields & Settings:**
  * Enable Global Animations checkbox.
  * Animation Transition Speed slider (0.1 to 1.5 seconds).
  * Product Card Hover Effect select (lift & glow, image zoom only, none).

### Tab 15 — Glassmorphism (`tab-glass`)
* **Purpose:** Immersive frosted-glass styling adjustments.
* **Fields & Settings:**
  * Global Glass Effect Enable checkbox.
  * Blur Intensity slider (0px to 24px).
  * Background Opacity slider (0 to 1).
  * Border Opacity slider (0 to 1).
  * Shadow Intensity slider (0 to 3).
  * Border Radius slider (0px to 32px).
  * Glass Brightness slider, Glass Contrast slider, Hover Intensity.
  * Section Specific switches (Header, Product Cards, Modals, Sidebar, Footer, Forms, Hero).

### Tab 16 — Custom CSS (`tab-css`)
* **Purpose:** Custom stylesheet overrides.
* **Fields & Settings:** Text area containing raw CSS rules. Stored in `customCss` field of `site_settings_v4`.

---

## 3. Operations & Workflows

### Preview Iframe Communication
The live customizer renders an iframe targeting `/index.html?preview=true`. When an input is modified, `syncLivePreview()` grabs form values and uses `postMessage` to broadcast updates:
```javascript
iframe.contentWindow.postMessage({
  type: 'UPDATE_THEME_VARIABLES',
  theme: computedThemePayload
}, '*');
```
The storefront listens via `window.addEventListener('message', ...)` and injects styles dynamically into a `<style id="live-customizer-overrides">` block.

### Save Workflow
Admin clicks **Save Changes**. The script posts the form payload to `PUT /api/site-settings/theme`. A confirmation toast confirms success.

### Rollback Workflow
Admin opens the version history list. Clicking a historical version calls `POST /api/site-settings/rollback` with the target version index. The server loads the snapshot from `site_settings_history`, writes it to the active document, and returns the restored data to refresh the editor page.

### Reset Workflow
Clicking **Reset** prompts a confirmation. It resets the homepage settings and active site settings to their default values (e.g. "Luxury Ivory Light" defaults).
