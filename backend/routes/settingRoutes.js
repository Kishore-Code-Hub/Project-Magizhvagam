const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  getSetting, updateSetting, getCoupons, createCoupon, deleteCoupon, resetSetting, uploadSettingsImage,
  getFeatureToggles, updateFeatureToggles
} = require('../controllers/settingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Public endpoints
router.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Settings API root', settings: {} });
});

// Feature toggles (MUST be before /:key to avoid route conflict)
router.get('/feature-toggles', getFeatureToggles);
router.put('/feature-toggles', protect, adminOnly, updateFeatureToggles);

// Admin-only settings builder, uploads & Coupon endpoints
router.post('/upload', protect, adminOnly, upload.single('image'), uploadSettingsImage);
router.get('/coupons/all', protect, adminOnly, getCoupons);
router.post('/coupons/new', protect, adminOnly, createCoupon);
router.delete('/coupons/:id', protect, adminOnly, deleteCoupon);

// Dynamic key routes (keep these LAST)
router.get('/:key', getSetting);
router.put('/:key', protect, adminOnly, updateSetting);
router.post('/:key/reset', protect, adminOnly, resetSetting);

module.exports = router;

