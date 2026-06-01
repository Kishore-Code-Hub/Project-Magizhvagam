const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, adminOnly, getDashboardStats);

module.exports = router;
