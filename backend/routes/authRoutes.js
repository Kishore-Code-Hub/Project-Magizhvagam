const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMime = /^image\/(jpeg|jpg|png|webp|gif)$/;
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    
    if (allowedMime.test(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only standard image files are allowed (.jpg, .jpeg, .png, .webp, .gif)'), false);
    }
  }
});

const { 
  handleLocalRegister, 
  handleLocalLogin, 
  
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
  adminUnlockAccount,
  verifyOtp,
  resendOtp,
  verifyResetOtp,
  resetPasswordWithOtp,
  // 2FA & Password/Session controllers
  verifyAdmin2FA,
  setup2FA,
  enable2FA,
  disable2FA,
  generateNewRecoveryCodes,
  updateAdminPassword,
  getActiveSessions,
  revokeSession,
  revokeOtherSessions,
  revokeAllSessions
} = require('../controllers/authController');
const { protect, optionalProtect, adminOnly } = require('../middleware/authMiddleware');

// Primary Auth Endpoints
router.post('/register', handleLocalRegister);
router.post('/login', handleLocalLogin);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', requestPasswordResetLink);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPasswordWithOtp);
router.post('/reset-password/:token', processSecurePasswordUpdate);
router.post('/logout', terminateUserSession);

// Admin-specific Login & Customers directory
router.post('/admin/login', adminLogin);
router.post('/admin/verify-2fa', verifyAdmin2FA);
router.get('/customers', protect, adminOnly, getCustomers);

// 2FA Management Endpoints (Admin Only)
router.post('/admin/2fa/setup', protect, adminOnly, setup2FA);
router.post('/admin/2fa/enable', protect, adminOnly, enable2FA);
router.post('/admin/2fa/disable', protect, adminOnly, disable2FA);
router.post('/admin/2fa/recovery-codes', protect, adminOnly, generateNewRecoveryCodes);

// Admin Profile Password Management
router.post('/admin/update-password', protect, adminOnly, updateAdminPassword);

// Session Management Endpoints (Admin Only)
router.get('/admin/sessions', protect, adminOnly, getActiveSessions);
router.delete('/admin/sessions/:id', protect, adminOnly, revokeSession);
router.post('/admin/sessions/logout-others', protect, adminOnly, revokeOtherSessions);
router.post('/admin/sessions/logout-all', protect, adminOnly, revokeAllSessions);

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

