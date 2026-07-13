const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');
const prisma = require('../services/prisma');
const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } = require('../config/jwt');

const ALLOWED_ADMIN_PAGES = new Set([
  'about-builder.html',
  'affiliates.html',
  'api-keys.html',
  'backups.html',
  'blogs.html',
  'brands.html',
  'campaigns.html',
  'categories.html',
  'collections.html',
  'contact-builder.html',
  'content-pages.html',
  'coupons.html',
  'courier.html',
  'credit-notes.html',
  'customer-groups.html',
  'customers.html',
  'dashboard.html',
  'email-studio.html',
  'faq.html',
  'flash-sales.html',
  'homepage-builder.html',
  'inventory.html',
  'invoices.html',
  'media-manager.html',
  'media.html',
  'navigation-builder.html',
  'newsletter.html',
  'orders.html',
  'payment-gateway.html',
  'payment-settings.html',
  'payments.html',
  'permissions.html',
  'popup-builder.html',
  'products.html',
  'profile-settings.html',
  'purchase-orders.html',
  'referrals.html',
  'refunds.html',
  'reports.html',
  'returns.html',
  'reviews.html',
  'roles.html',
  'security.html',
  'seo.html',
  'settings.html',
  'shipping-settings.html',
  'shipping.html',
  'sms-studio.html',
  'smtp-settings.html',
  'staff.html',
  'store-settings.html',
  'support-tickets.html',
  'support.html',
  'system-diagnostics.html',
  'taxes.html',
  'theme-builder.html',
  'users.html',
  'variants.html',
  'vendors.html',
  'warehouse.html',
  'whatsapp-studio.html'
]);

// Authenticate helper for HTML pages (redirect-based instead of JSON error responses)
const checkAdminPageAuth = async (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  let token = req.cookies ? req.cookies.admin_accessToken : null;
  const refreshToken = req.cookies ? req.cookies.admin_refreshToken : null;
  const page = req.params.page || 'dashboard.html';

  if (refreshToken) {
    const session = await prisma.userSession.findUnique({
      where: { refreshToken }
    });
    if (!session) {
      res.clearCookie('admin_accessToken');
      res.clearCookie('admin_refreshToken');
      return handleHtmlAuthFailure(req, res, page);
    }
  }

  if (!token) {
    return handleHtmlAuthFailure(req, res, page);
  }

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });
    if (!user) {
      return handleHtmlAuthFailure(req, res, page);
    }
    if (user.role === 'admin') {
      req.user = user;
      return next();
    }
    // Logged-in customer (or other role) — never redirect to admin login with customer session
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res.status(403).send('Forbidden: Access is restricted to administrators.');
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Attempt auto-refresh using refresh token
      return tryHtmlAutoRefresh(req, res, next, page);
    }
    return handleHtmlAuthFailure(req, res, page);
  }
};

const tryHtmlAutoRefresh = async (req, res, next, page) => {
  const refreshToken = req.cookies ? req.cookies.admin_refreshToken : null;

  if (!refreshToken) {
    return handleHtmlAuthFailure(req, res, page);
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });
    const session = await prisma.userSession.findUnique({
      where: { refreshToken }
    });

    if (!user || !session || user.role !== 'admin') {
      res.clearCookie('admin_accessToken');
      res.clearCookie('admin_refreshToken');
      return handleHtmlAuthFailure(req, res, page);
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_ACCESS_SECRET,
      { expiresIn: '3m' }
    );

    // Set cookie
    res.cookie('admin_accessToken', newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3 * 60 * 1000 // 3 mins
    });

    req.user = user;
    return next();
  } catch (err) {
    res.clearCookie('admin_accessToken');
    res.clearCookie('admin_refreshToken');
    return handleHtmlAuthFailure(req, res, page);
  }
};

const handleHtmlAuthFailure = (req, res, page) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  return res.status(404).sendFile(path.join(__dirname, '../../error.html'));
};

// Route for dedicated admin login page
router.get('/admin/login', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, '../../admin/login.html'));
});

// Route for workspace template directories (dynamically loaded by the SPA)
router.use('/admin/workspaces', checkAdminPageAuth, express.static(path.join(__dirname, '../../admin/workspaces')));

// Route for specific page files
router.get('/admin/:page', checkAdminPageAuth, (req, res) => {
  const filename = path.basename(req.params.page);
  if (filename !== req.params.page || !ALLOWED_ADMIN_PAGES.has(filename)) {
    return res.status(404).sendFile(path.join(__dirname, '../../error.html'));
  }
  const filePath = path.join(__dirname, '../../admin', filename);

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).sendFile(path.join(__dirname, '../../error.html'));
    }
  });
});

// Default admin page redirect
router.get('/admin', checkAdminPageAuth, (req, res) => {
  res.redirect('/admin/dashboard.html');
});

module.exports = router;
