const express = require('express');
const router = express.Router();
const aboutCtrl = require('../controllers/aboutController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public read
router.get('/', aboutCtrl.getAbout);

// Admin update
router.put('/', protect, adminOnly, aboutCtrl.updateAbout);

module.exports = router;
