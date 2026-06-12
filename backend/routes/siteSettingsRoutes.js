/**
 * MAGIZHVAGAM V4 — Site Settings API Routes
 * 
 * All appearance/customization endpoints mounted at /api/site-settings
 * Public reads for theme/homepage/navigation/footer/animation
 * Admin-protected writes for all config documents
 */

const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/siteSettingsController');

// ─── Public Reads (used by theme-loader.js and frontend renderers) ──────────

router.get('/all', ctrl.getAll);
router.get('/theme', ctrl.getTheme);
router.get('/homepage', ctrl.getHomepage);
router.get('/navigation', ctrl.getNavigation);
router.get('/footer', ctrl.getFooter);
router.get('/animation', ctrl.getAnimation);

// ─── Admin-Protected Writes ─────────────────────────────────────────────────

router.put('/theme', protect, adminOnly, ctrl.updateTheme);
router.put('/homepage', protect, adminOnly, ctrl.updateHomepage);
router.put('/navigation', protect, adminOnly, ctrl.updateNavigation);
router.put('/footer', protect, adminOnly, ctrl.updateFooter);
router.put('/animation', protect, adminOnly, ctrl.updateAnimation);

// ─── Preview & Rollback (Admin Only) ────────────────────────────────────────

router.get('/preview/:version', protect, adminOnly, ctrl.getPreview);
router.post('/rollback', protect, adminOnly, ctrl.rollback);
router.get('/history/:collection', protect, adminOnly, ctrl.getHistory);

module.exports = router;
