const express = require('express');
const router = express.Router();
const { getDashboardStats, resetStats } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.post('/reset-stats', protect, adminOnly, resetStats);

module.exports = router;
