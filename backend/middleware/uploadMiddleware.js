const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { isCloudinaryConfigured, uploadToCloudinary } = require('../services/cloudinary');

// In-memory storage for raw buffers before optimization
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|avif/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only images of type JPG, PNG, WEBP, or AVIF are supported!'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Main middleware to process and upload/save images
const processImages = async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    req.processedImages = [];
    return next();
  }

  try {
    const processedImages = [];
    const uploadDir = path.join(__dirname, '../../uploads/products');

    // Create upload directory locally if not using Cloudinary or as fallback
    if (!isCloudinaryConfigured && !fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Handle both fields (object) and array formats safely
    const filesMap = {};
    if (Array.isArray(req.files)) {
      filesMap['images'] = req.files;
    } else if (typeof req.files === 'object') {
      Object.assign(filesMap, req.files);
    }

    for (const fieldName of Object.keys(filesMap)) {
      const filesList = filesMap[fieldName];
      if (!Array.isArray(filesList)) continue;
      
      for (const file of filesList) {
        // 1. Process with Sharp (Resize to max width 1200px, compress to WEBP format)
        const optimizedBuffer = await sharp(file.buffer)
          .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        if (isCloudinaryConfigured) {
          // 2. Upload to Cloudinary
          const result = await uploadToCloudinary(optimizedBuffer);
          processedImages.push({
            url: result.url,
            publicId: result.publicId,
            fieldName: fieldName
          });
        } else {
          // 3. Save Locally
          const filename = `product-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
          const filepath = path.join(uploadDir, filename);
          await fs.promises.writeFile(filepath, optimizedBuffer);
          
          processedImages.push({
            url: `/uploads/products/${filename}`,
            publicId: filename, // Save filename as publicId for easy local deletion later
            fieldName: fieldName
          });
        }
      }
    }

    req.processedImages = processedImages;
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: `Image optimization failed: ${error.message}` });
  }
};

const uploadMultipleWrapper = (req, res, next) => {
  const uploadFields = upload.fields([
    { name: 'primaryImage', maxCount: 1 },
    { name: 'secondaryImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 3 },
    { name: 'images', maxCount: 5 }
  ]);
  uploadFields(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
};

module.exports = {
  uploadMultiple: uploadMultipleWrapper,
  processImages
};
