const express = require('express');
const router = express.Router();
const {
  getWishlist,
  mergeWishlist,
  addWishlistItem,
  removeWishlistItem
} = require('../controllers/wishlistController');
const { protect, customerOnly } = require('../middleware/authMiddleware');

router.get('/', protect, customerOnly, getWishlist);
router.post('/merge', protect, customerOnly, mergeWishlist);
router.post('/items', protect, customerOnly, addWishlistItem);
router.delete('/items/:productId', protect, customerOnly, removeWishlistItem);

module.exports = router;
