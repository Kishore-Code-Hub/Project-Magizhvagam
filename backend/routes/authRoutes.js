const express = require('express');
const router = express.Router();
const { register, login, adminLogin, logout, refresh, getSession, getProfile, updateProfile, getCustomers } = require('../controllers/authController');
const { protect, optionalProtect, adminOnly } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/session', optionalProtect, getSession);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/customers', protect, adminOnly, getCustomers);

module.exports = router;
