const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminSystemController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/smtp-test', protect, adminOnly, ctrl.testSmtp);
router.post('/smtp-send-test', protect, adminOnly, ctrl.sendTestEmail);

module.exports = router;
