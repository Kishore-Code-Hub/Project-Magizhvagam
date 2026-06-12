/**
 * MAGIZHVAGAM — Media Library Controller
 */

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const MediaAsset = require('../models/MediaAsset');
const { isCloudinaryConfigured, uploadToCloudinary } = require('../services/cloudinary');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/media');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * @route GET /api/media
 */
exports.listMedia = async (req, res) => {
  try {
    const { search, page = 1, limit = 48 } = req.query;
    const query = {};
    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { filename: new RegExp(term, 'i') },
        { originalName: new RegExp(term, 'i') },
        { alt: new RegExp(term, 'i') },
        { tags: new RegExp(term, 'i') }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [items, total] = await Promise.all([
      MediaAsset.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      MediaAsset.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: items,
      pagination: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error listing media: ${error.message}` });
  }
};

/**
 * @route GET /api/media/:id
 */
exports.getMedia = async (req, res) => {
  try {
    const item = await MediaAsset.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Media asset not found' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error fetching media: ${error.message}` });
  }
};

/**
 * @route POST /api/media/upload
 */
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    ensureUploadDir();

    const baseName = path.parse(req.file.originalname).name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'image';
    const uniqueName = `${baseName}-${Date.now()}.webp`;

    const optimized = await sharp(req.file.buffer)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const meta = await sharp(optimized).metadata();
    let publicUrl;

    if (isCloudinaryConfigured) {
      const result = await uploadToCloudinary(optimized, 'magizhvagam/media', uniqueName);
      publicUrl = result.secure_url || result.url;
    } else {
      const filePath = path.join(UPLOAD_DIR, uniqueName);
      fs.writeFileSync(filePath, optimized);
      publicUrl = `/uploads/media/${uniqueName}`;
    }

    const asset = await MediaAsset.create({
      filename: uniqueName,
      originalName: req.file.originalname,
      url: publicUrl,
      mimeType: 'image/webp',
      size: optimized.length,
      width: meta.width || null,
      height: meta.height || null,
      alt: req.body.alt || baseName,
      tags: req.body.tags ? String(req.body.tags).split(',').map(t => t.trim()).filter(Boolean) : [],
      uploadedBy: req.user?._id || null
    });

    res.status(201).json({ success: true, message: 'Image uploaded successfully', data: asset });
  } catch (error) {
    res.status(500).json({ success: false, error: `Upload failed: ${error.message}` });
  }
};

/**
 * @route DELETE /api/media/:id
 */
exports.deleteMedia = async (req, res) => {
  try {
    const item = await MediaAsset.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Media asset not found' });
    }

    if (item.url.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, '../..', item.url);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }

    await MediaAsset.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: `Delete failed: ${error.message}` });
  }
};

/**
 * @route DELETE /api/media/bulk
 */
exports.bulkDeleteMedia = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'No media IDs provided' });
    }

    const items = await MediaAsset.find({ _id: { $in: ids } });
    for (const item of items) {
      if (item.url.startsWith('/uploads/')) {
        const localPath = path.join(__dirname, '../..', item.url);
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      }
    }

    await MediaAsset.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ success: true, message: `${items.length} media item(s) deleted` });
  } catch (error) {
    res.status(500).json({ success: false, error: `Bulk delete failed: ${error.message}` });
  }
};

/**
 * @route PUT /api/media/:id
 */
exports.replaceMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    const asset = await MediaAsset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, error: 'Media asset not found' });
    }

    // Delete old local file if present
    if (asset.url && asset.url.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '../..', asset.url);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.warn('Failed to delete old file:', e.message);
        }
      }
    }

    ensureUploadDir();

    const baseName = path.parse(req.file.originalname).name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'image';
    const uniqueName = `${baseName}-${Date.now()}.webp`;

    const optimized = await sharp(req.file.buffer)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const meta = await sharp(optimized).metadata();
    let publicUrl;

    if (isCloudinaryConfigured) {
      const result = await uploadToCloudinary(optimized, 'magizhvagam/media', uniqueName);
      publicUrl = result.secure_url || result.url;
    } else {
      const filePath = path.join(UPLOAD_DIR, uniqueName);
      fs.writeFileSync(filePath, optimized);
      publicUrl = `/uploads/media/${uniqueName}`;
    }

    // Update fields
    asset.filename = uniqueName;
    asset.originalName = req.file.originalname;
    asset.url = publicUrl;
    asset.mimeType = 'image/webp';
    asset.size = optimized.length;
    asset.width = meta.width || null;
    asset.height = meta.height || null;
    await asset.save();

    res.status(200).json({ success: true, message: 'Image replaced successfully', data: asset });
  } catch (error) {
    res.status(500).json({ success: false, error: `Replace failed: ${error.message}` });
  }
};
