# MAGIZHVAGAM DATABASE MAPPING

This document maps all models, database collections, schemas, fields, relationships, and indexes used in the Magizhvagam repository. The application uses Mongoose (MongoDB) as its primary database adapter with support for a PostgreSQL wrapper stub.

---

## 1. User & Session Security Group

### 1.1 `User` Model
* **Collection Name:** `users` (Implicit Mongoose default)
* **Purpose:** Stores accounts (Customers, Staff, Admins), addresses, user carts, and active refresh tokens.
* **Fields:**
  * `name` (String, required)
  * `email` (String, required, unique, lowercase)
  * `password` / `passwordHash` (String, required, automatically encrypted via bcrypt)
  * `role` (String, enum: `['customer', 'admin', 'staff']`, default: `customer`)
  * `emailVerified` (Boolean, default: `false`)
  * `accountActive` / `isActive` (Boolean, default: `false`)
  * `verificationOtp` (String, default: `null`)
  * `verificationOtpExpires` (Date, default: `null`)
  * `resetPasswordToken` / `resetPasswordExpires` (String/Date, default: `null`)
  * `loginAttempts` (Number, default: `0`)
  * `lockUntil` (Date, default: `null`)
  * `profilePicture` (String, default avatar URL)
  * `lastLoginIP` / `lastLoginTimestamp` (String/Date, default: `null`)
  * `phone` / `phoneVerified` (String/Boolean)
  * `address1`, `city`, `state`, `pincode` (Legacy string blocks)
  * `addresses` (Array of nested `AddressSchema` - fullName, phone, street, street2, city, state, zipCode, country, isDefault)
  * `cartItems` (Array of nested `CartItemSchema` - productId $\to$ ref `Product`, name, price, image, quantity)
  * `wishlistItems` (Array of nested `WishlistItemSchema` - productId $\to$ ref `Product`, name, price, image)
  * `refreshToken` (String, default: `null`)
* **Relationships:**
  * `cartItems.productId` $\to$ references `Product`
  * `wishlistItems.productId` $\to$ references `Product`
* **Indexes:** Automatically indexes unique field `email`.

### 1.2 `UnverifiedStage` Model
* **Collection Name:** `unverifiedstages`
* **Purpose:** Temporary staging area for newly registered users pending OTP validation.
* **Fields:**
  * `name`, `email`, `phone`, `password`, `passwordHash` (Strings)
  * `address1`, `city`, `state`, `pincode` (Strings)
  * `verificationToken` / `verificationTokenExpires` (String/Date, required)
* **Indexes:** Unique index on `email`.

### 1.3 `AuditLog` Model
* **Collection Name:** `auditlogs`
* **Purpose:** Trace log of critical account actions (logins, imports, resets, configuration changes).
* **Fields:**
  * `userId` (ObjectId, ref `User`, default `null`)
  * `email` (String, required)
  * `action` (String, required)
  * `details` (String)
  * `ipAddress` (String)
  * `userAgent` (String)
  * `timestamp` (Date, default `Date.now`)
* **Relationships:**
  * `userId` $\to$ references `User`
* **Indexes:**
  * Index on `userId` (1)
  * Index on `timestamp` (-1)

---

## 2. Product & Category Management Group

### 2.1 `Product` Model
* **Collection Name:** `products`
* **Purpose:** Stores catalog items, base pricing, parameters, image folders, and rating averages.
* **Fields:**
  * `name` (String, required, trim)
  * `description` (String, required)
  * `price` (Number, required)
  * `discountPrice` (Number, default `null`)
  * `stock` (Number, default `0`)
  * `category` (ObjectId, ref `Category`, required)
  * `images` (Array of nested objects: `url` (String), `publicId` (String for Cloudinary))
  * `imageFolder` (String, default `null`)
  * `specifications` (Nested object: `material`, `dimensions`, `weight`, `color`)
  * `tags` (Array of Strings)
  * `averageRating` (Number, default `0`)
  * `totalReviews` (Number, default `0`)
  * `isFeatured` (Boolean, default `false`)
  * `createdAt` (Date, default `Date.now`)
* **Relationships:**
  * `category` $\to$ references `Category`
* **Indexes:**
  * Index on `category` (1)
  * Index on `tags` (1)
  * Index on `price` (1)
  * Index on `createdAt` (-1)
  * Index on `isFeatured` (1)
  * Index on `imageFolder` (1)

### 2.2 `Category` Model
* **Collection Name:** `categories`
* **Purpose:** Storefront product classification groupings.
* **Fields:**
  * `name` (String, required, unique)
  * `image` (String, required)
  * `slug` (String, required, unique)
* **Indexes:** Unique index on `name` and `slug`.

### 2.3 `Review` Model
* **Collection Name:** `reviews`
* **Purpose:** Customer product reviews.
* **Fields:**
  * `productId` (ObjectId, ref `Product`, required, index)
  * `name` (String, required)
  * `rating` (Number, required, range: 1 to 5)
  * `comment` (String, default empty)
  * `createdAt` (Date, default `Date.now`)
* **Relationships:**
  * `productId` $\to$ references `Product`
* **Indexes:** Index on `productId` (1).

---

## 3. Checkout & Transaction Group

### 3.1 `Order` Model
* **Collection Name:** `orders`
* **Purpose:** Customer sales, guest address parameters, payment records, and processing indicators.
* **Fields:**
  * `userId` (ObjectId, ref `User`, default `null`)
  * `guestDetails` (Nested object: `fullName`, `email`, `phone`)
  * `items` (Array of nested schemas: `productId` $\to$ ref `Product`, `name`, `price`, `quantity`, `image`)
  * `shippingAddress` (Nested: `fullName`, `phone`, `street`, `city`, `state`, `zipCode`)
  * `payment` (Nested: `method` (enum: `UPI`, `Card`, `COD`), `status` (enum: `Pending`, `Paid`, `Failed`), `transactionId`)
  * `summary` (Nested: `subtotal`, `tax`, `shipping`, `discount`, `total`)
  * `couponCode` (String, default `null`)
  * `status` (String, enum: `Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`)
  * `orderId` (String, unique, sparse, generated auto-prefixed: e.g. `MAG-XXXXXX-XXXX`)
  * `createdAt` (Date, default `Date.now`)
* **Relationships:**
  * `userId` $\to$ references `User`
  * `items.productId` $\to$ references `Product`
* **Indexes:**
  * Index on `userId` (1)
  * Index on `createdAt` (-1)
  * Unique sparse index on `orderId`.

### 3.2 `Coupon` Model
* **Collection Name:** `coupons`
* **Purpose:** Promotional coupon configurations.
* **Fields:**
  * `code` (String, required, unique, uppercase, trim)
  * `discountType` (String, enum: `Percentage`, `FixedAmount`, required)
  * `discountValue` (Number, required)
  * `minOrderValue` (Number, default `0`)
  * `expiresAt` (Date, required)
  * `active` (Boolean, default `true`)
* **Indexes:** Unique index on `code`.

---

## 4. Appearance Studio Configuration (V4 Customizer)

### 4.1 `SiteSettingsV4` Model
* **Collection Name:** `site_settings_v4`
* **Purpose:** Singleton theme styling properties, metadata, and custom CSS overrides.
* **Fields:**
  * `_id` (String, default: `"active"`)
  * `version` (Number, default: `0`)
  * `updatedAt` / `updatedBy` (Date / ObjectId ref User)
  * `theme` (Nested mixed objects storing variables for: `hdr`, `nav`, `hero`, `pc`, `pdp`, `btn`, `cart`, `co`, `ft`, `frm`, `mod`, `bdg`, `cd`, `acc`, `st`, `adm`, `glass`)
  * `typography` (Nested Display, Heading, Body, Price, Button, Badge properties and `scaleMultiplier`)
  * `layout` (Nested container width limits, gaps, section paddings, border/shadow strength, radii)
  * `meta` (Store details: Name, tagline, SEO parameters, social links)
  * `customCss` (String, raw stylesheet custom rules)

### 4.2 `HomepageSectionsV4` Model
* **Collection Name:** `homepage_sections_v4`
* **Purpose:** Ordering and configuration for the 15 homepage builder blocks.
* **Fields:**
  * `_id` (String, default: `"active"`)
  * `version` (Number, default: `0`)
  * `updatedAt` / `updatedBy` (Date / ObjectId ref User)
  * `sections` (Array of nested section items: `id` (enum section IDs whitelisted), `enabled` (Boolean), `order` (Number), `config` (Mixed))

### 4.3 `NavigationConfigV4` Model
* **Collection Name:** `navigation_config_v4`
* **Purpose:** Layout links and structures for desktop mega menus and mobile sliders.
* **Fields:**
  * `_id` (String, default: `"active"`)
  * `version` (Number, default: `0`)
  * `desktop` (Array of mega-menu/dropdown nodes: `id`, `label`, `url`, `icon`, `order`, `featured`, `panel`)
  * `mobile` (Array of child-nested mobile links: `label`, `url`, `children`)

### 4.4 `FooterConfigV4` Model
* **Collection Name:** `footer_config_v4`
* **Purpose:** Content data for footer layouts.
* **Fields:**
  * `_id` (String, default: `"active"`)
  * `brand` (Nested logoText, tagline, statement)
  * `columns` (Array of lists: `heading`, `links` [label, url])
  * `social` (Array of platfroms URLs)
  * `contact` (Address, phone, email strings with visible toggles)
  * `newsletter` (Heading, ctaLabel, incentive, placeholder)
  * `copyright` (text string, autoYear Boolean)

### 4.5 `AnimationConfigV4` Model
* **Collection Name:** `animation_config_v4`
* **Purpose:** Site-wide transitions and micro-interactions.
* **Fields:**
  * `_id` (String, default: `"active"`)
  * `preset` (enum: `subtle`, `elevated`, `expressive`, `none`)
  * `overrides` (Nested keys: `cardHover`, `btnClick`, `pageEntrance`, `scrollReveal` (Boolean), `countdownTick`, `skeletonShimmer`)

### 4.6 `SiteSettingsHistory` Model
* **Collection Name:** `site_settings_history`
* **Purpose:** Backup configurations database for Version rollback. Auto-deletes old snapshots using Mongoose TTL.
* **Fields:**
  * `savedAt` (Date, default `Date.now`, has a 90-day TTL expiry index)
  * `savedBy` (ObjectId ref User)
  * `configCollection` (String, target collection identifier: e.g. `"site_settings_v4"`)
  * `version` (Number, version counter)
  * `snapshot` (Mixed, complete clone of settings document)
* **Indexes:**
  * Index on `savedAt` (TTL index)
  * Compound Index on `configCollection` (1) and `version` (-1)
  * Compound Index on `configCollection` (1) and `savedAt` (-1)

---

## 5. Media & Generic Settings Group

### 5.1 `MediaAsset` Model
* **Collection Name:** `media_assets`
* **Purpose:** Uploaded image assets file logs.
* **Fields:**
  * `filename` (String, required)
  * `originalName` (String, required)
  * `url` (String, required)
  * `mimeType` (String)
  * `size` (Number)
  * `width` / `height` (Number)
  * `alt` (String)
  * `tags` (Array of Strings)
  * `uploadedBy` (ObjectId ref User)
  * `folder` (String, default `"media"`)
* **Indexes:**
  * Index on `filename` (1)
  * Compound Text Index on `originalName`, `alt`, and `tags`.

### 5.2 `Setting` Model
* **Collection Name:** `settings`
* **Purpose:** Flat key-value configurations (e.g. `featureToggles`, `allowSignup`, and legacy homepage overrides).
* **Fields:**
  * `key` (String, required, unique)
  * `value` (Mixed, required)
  * `flashSaleActive` (Boolean)
  * `flashSaleText` (String)
  * `flashSaleTargetDate` (Date)
* **Indexes:** Unique index on `key`.

### 5.3 `AboutPage` Model
* **Collection Name:** `aboutpages`
* **Purpose:** Static site info for `/about.html`.
* **Fields:**
  * `storyHeading`, `storyIntro`, `leftHeading`, `leftParagraph1`, `leftParagraph2` (Strings)
  * `image` (String url)
  * `updatedAt` (Date)
