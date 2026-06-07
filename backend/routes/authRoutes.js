const express = require('express');
const router = express.Router();
const { register, login, adminLogin, logout, refresh, getSession, getProfile, updateProfile, getCustomers, addAddress, updateAddressById } = require('../controllers/authController');
const { protect, optionalProtect, adminOnly } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/session', optionalProtect, getSession);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/profile/address', protect, addAddress);
router.put('/profile/address/:addressId', protect, updateAddressById);
router.get('/customers', protect, adminOnly, getCustomers);

module.exports = router;
