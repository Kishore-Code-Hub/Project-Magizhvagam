/**
 * MAGIZHVAGAM — Media Library API Routes
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/mediaController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp|avif|gif)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.get('/', protect, adminOnly, ctrl.listMedia);
router.get('/:id', protect, adminOnly, ctrl.getMedia);
router.post('/upload', protect, adminOnly, upload.single('image'), ctrl.uploadMedia);
router.put('/:id', protect, adminOnly, upload.single('image'), ctrl.replaceMedia);
router.delete('/bulk', protect, adminOnly, ctrl.bulkDeleteMedia);
router.delete('/:id', protect, adminOnly, ctrl.deleteMedia);

module.exports = router;
