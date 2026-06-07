# FINAL BUG REPORT & REGRESSION AUDIT

This document outlines the bugs resolved, payload projection validation, and security status during the final audit sweep.

## 1. Resolved Issues

### A. Autocomplete Payload Bloat (Input Projection Enforcement)
* **Bug**: The header search autocomplete mechanism fetched unnecessary database fields (like `description`, `specifications`, `reviews`, `stock`, etc.), causing high network payload weights.
* **Fix**: Implemented strict selection projection whitelisting in the backend product controller (`exports.getProducts`) and aligned the frontend search autocomplete triggers (`app.js`) to query exactly: `_id`, `name`, `price`, `discountPrice`, and `images`.
* **Prohibition Enforced**: Fields like `description`, `specifications`, `reviews`, `inventoryDetails`, and backend metadata (`__v`) are programmatically stripped from the `.select(...)` block.

### B. Price Range Filter Coercion Gotcha
* **Bug**: The backend controller coerced empty string/undefined values of `minPrice`/`maxPrice` using `Number(cleanNumberString(val))`. Since `Number("")` evaluates to `0` and `Number.isFinite(0)` is `true`, requests without explicit price filters were incorrectly filtered to products costing exactly ₹0, returning an empty catalog.
* **Fix**: Hardened the price casting block to explicitly check for defined, non-empty values before coercing to numbers and performing Mongoose finite checks.

---

## 2. Payload/Projection Profiling
* **Target Endpoint**: `GET /api/products?limit=1&select=name,price,discountPrice,images,description`
* **Verified Response JSON**:
```json
{
  "success": true,
  "count": 8,
  "page": 1,
  "pages": 1,
  "products": [
    {
      "_id": "6a1da997eeeeb8f087b80e39",
      "name": "Silver-Finish Executive Pen Set",
      "price": 750,
      "discountPrice": 599,
      "images": [
        {
          "url": "/assets/images/products/pen_set.jpg",
          "publicId": null,
          "_id": "6a1da997eeeeb8f087b80e3a"
        }
      ]
    }
  ]
}
```
* **Analysis**: As demonstrated above, even when the client requests `description`, the field is stripped out by the backend whitelist projection, reducing payload weight to the absolute minimum required.

---

## 3. Security Audit Checkpoint
* **NoSQL Query injection protection**: Checked and confirmed that `express-mongo-sanitize` is fully active in `server.js` (line 66) to sanitize query objects and strip keys starting with `$` or `.`.
* **RegExp Injection & ReDoS Protection**: Verified that user inputs used in regular expressions (like `searchVal` and occasion filters) are safely escaped using the `escapeRegex` utility in `productController.js` before compiling queries.
* **Input Casting**: Ensured all raw parameters (like `limit`, `page`, and filter strings) are typed-coerced into primitives before processing in the MongoDB layer.
