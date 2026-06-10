const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // Memory storage for single avatar upload

const { 
  handleLocalRegister, 
  handleLocalLogin, 
  executeEmailVerification,  
  requestPasswordResetLink, 
  processSecurePasswordUpdate, 
  terminateUserSession, 
  updateProfileMetadata, 
  handleAvatarUploadCloudinary,
  adminLogin,
  refresh,
  getSession,
  getProfile,
  addAddress,
  updateAddressById,
  getCustomers,
  adminToggleRole,
  adminForceResetPassword,
  adminUnlockAccount
} = require('../controllers/authController');
const { protect, optionalProtect, adminOnly } = require('../middleware/authMiddleware');

// Primary Auth Endpoints
router.post('/register', handleLocalRegister);
router.post('/login', handleLocalLogin);
router.get('/verify-email', executeEmailVerification);
router.post('/forgot-password', requestPasswordResetLink);
router.post('/reset-password/:token', processSecurePasswordUpdate);
router.post('/logout', terminateUserSession);

// Admin-specific Login & Customers directory
router.post('/admin/login', adminLogin);
router.get('/customers', protect, adminOnly, getCustomers);

// Token Refresher & Session retrieval
router.post('/refresh', refresh);
router.get('/session', optionalProtect, getSession);

// Profile loading and updates (with PUT aliases to prevent breakages)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileMetadata);
router.put('/profile/update', protect, updateProfileMetadata);
router.post('/profile/avatar', protect, upload.single('avatar'), handleAvatarUploadCloudinary);

// Address Book integration
router.post('/profile/address', protect, addAddress);
router.put('/profile/address/:addressId', protect, updateAddressById);

// Admin customer directory controls
router.post('/admin/toggle-role', protect, adminOnly, adminToggleRole);
router.post('/admin/force-reset', protect, adminOnly, adminForceResetPassword);
router.post('/admin/unlock', protect, adminOnly, adminUnlockAccount);

module.exports = router;

