const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { submitEnquiry } = require('../controllers/contactController');
const { getEnquiries, markAsRead } = require('../controllers/enquiryController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Rate limiting to prevent spam submissions: max 5 requests per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, error: 'Too many contact enquiries from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production'
});

// Public route to submit an enquiry
router.post('/', contactLimiter, submitEnquiry);

// Admin-only routes to get all enquiries and mark them as read
router.get('/', protect, adminOnly, getEnquiries);
router.put('/:id/read', protect, adminOnly, markAsRead);

module.exports = router;
