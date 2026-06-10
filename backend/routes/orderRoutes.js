const express = require('express');
const router = express.Router();
const { 
  createOrder, getOrderHistory, getOrderById, 
  getOrders, updateOrderStatus, checkCoupon, generateInvoice 
} = require('../controllers/orderController');
const { protect, adminOnly, verifyEmailGuard } = require('../middleware/authMiddleware');

// Public checkout & coupon check
router.post('/', (req, res, next) => {
  if (req.cookies && req.cookies.admin_accessToken) {
    return protect(req, res, next);
  }
  next();
}, verifyEmailGuard, createOrder);

router.post('/check-coupon', checkCoupon);

// Customer protected routes (authentication required)
router.get('/history', protect, getOrderHistory);
router.get('/:id/invoice', protect, generateInvoice);
router.get('/:id', protect, getOrderById);

// Admin-only routes
router.get('/', protect, adminOnly, getOrders);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;

