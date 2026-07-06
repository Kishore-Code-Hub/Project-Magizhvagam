const express = require('express');
const router = express.Router();
const { 
  getProducts, getProductById, createProduct, 
  updateProduct, deleteProduct, 
  getCategories, createCategory, deleteCategory, updateCategory,
  duplicateProduct, bulkDeleteProducts, bulkUpdateProducts, bulkImportProducts,
  toggleProductFeatured
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadMultiple, processImages } = require('../middleware/uploadMiddleware');

// Public endpoints — static paths before /:id
router.get('/', getProducts);
router.get('/categories', getCategories);

// Admin-only endpoints (static paths before /:id)
router.post('/bulk-delete', protect, adminOnly, bulkDeleteProducts);
router.put('/bulk-update', protect, adminOnly, bulkUpdateProducts);
router.post('/bulk-import', protect, adminOnly, bulkImportProducts);
router.post('/categories', protect, adminOnly, createCategory);
router.put('/categories/:id', protect, adminOnly, updateCategory);
router.delete('/categories/:id', protect, adminOnly, deleteCategory);

router.post('/duplicate/:id', protect, adminOnly, duplicateProduct);
router.post('/', protect, adminOnly, uploadMultiple, processImages, createProduct);

// Parameterized public/admin routes last
router.get('/:id', getProductById);
router.put('/:id/featured', protect, adminOnly, toggleProductFeatured);
router.put('/:id', protect, adminOnly, uploadMultiple, processImages, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
