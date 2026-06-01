const express = require('express');
const router = express.Router();
const {
  getCart,
  mergeCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart
} = require('../controllers/cartController');
const { protect, customerOnly } = require('../middleware/authMiddleware');

router.get('/', protect, customerOnly, getCart);
router.post('/merge', protect, customerOnly, mergeCart);
router.post('/items', protect, customerOnly, addCartItem);
router.patch('/items/:productId', protect, customerOnly, updateCartItem);
router.delete('/items/:productId', protect, customerOnly, removeCartItem);
router.delete('/', protect, customerOnly, clearCart);

module.exports = router;
