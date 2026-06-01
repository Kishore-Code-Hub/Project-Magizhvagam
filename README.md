# MAGIZHVAGAM E-Commerce Platform

A premium return gift and customized gift e-commerce platform built from scratch.

## Technology Stack

- **Frontend**: Plain HTML5, Vanilla HSL CSS (design tokens, glassmorphism, responsive styles), client JS binders.
- **Backend**: Node.js & Express.js API server.
- **Database**: MongoDB Atlas via Mongoose models.
- **Image Pipeline**: Multer, Sharp (local WEBP resizing and optimization fallback), and Cloudinary API.
- **Authentication**: JWT Access & Refresh Tokens stored securely in HTTP-Only cookies.

---

## Getting Started

### 1. Prerequisites
- Node.js installed locally.
- MongoDB server running locally or a MongoDB Atlas connection string.

### 2. Installation
Install all dependencies:
```bash
npm install
```

### 3. Environment Setup
Configure your `.env` variables. Create a `.env` file at the root (refer to `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/magizhvagam
JWT_ACCESS_SECRET=your_jwt_access_secret_key_change_this_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_change_this_in_production
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
WHATSAPP_PHONE=919876543210
NODE_ENV=development
```

### 4. Database Seeding
Populate MongoDB Atlas collections with initial product categories, customized homepage settings, coupons, and a default administrator account (`admin@magizhvagam.com` with password `AdminPass123!`):
```bash
npm run seed
```

### 5. Running the Application
Start the Node.js Express server:
```bash
npm start
```
The server will run on `http://localhost:5000`. You can visit the homepage directly at `http://localhost:5000`.

---

## Running Automated Endpoints Verification Tests
Ensure the server is running on `localhost:5000` via `npm start`, then in a separate terminal execute:
```bash
npm test
```
This triggers verification tests validating catalog lists, coupon validation checks, login blocks, and admin routing protections.

---

## Core Security Features
1. **Protected Admin Pages**: Administrative files inside `/admin/*` are blocked at the Express routing level. Express cookie-checks the client JWT before sending files, preventing raw page exposure.
2. **Double Token Sessions**: Access tokens have 15-minute expirations. If expired, the backend automatically issues a new access token via the 7-day secure Refresh Token cookie.
3. **NoSQL Protection**: Integrates `express-mongo-sanitize` to purge query injections.
4. **Helmet Security Headers**: Blocks XSS attacks and frames hijacking.
5. **No-Store Caching**: Admin pages are marked `no-store` to prevent caching leaks after logging out.
