const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const prisma = require('../services/prisma');
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
    const where = {};
    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { filename: { contains: term, mode: 'insensitive' } },
        { originalName: { contains: term, mode: 'insensitive' } },
        { alt: { contains: term, mode: 'insensitive' } },
        { tags: { has: term } }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [items, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.mediaAsset.count({ where })
    ]);

    const compatItems = items.map(item => ({
      ...item,
      _id: item.id
    }));

    res.status(200).json({
      success: true,
      data: compatItems,
      pagination: { total, page: parseInt(page, 10), limit: take }
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
    const item = await prisma.mediaAsset.findUnique({
      where: { id: req.params.id }
    });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Media asset not found' });
    }
    res.status(200).json({ success: true, data: { ...item, _id: item.id } });
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

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ success: false, error: 'Only image files are allowed' });
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

    const tagsList = req.body.tags ? String(req.body.tags).split(',').map(t => t.trim()).filter(Boolean) : [];

    const asset = await prisma.mediaAsset.create({
      data: {
        filename: uniqueName,
        originalName: req.file.originalname,
        url: publicUrl,
        mimeType: 'image/webp',
        size: optimized.length,
        width: meta.width || null,
        height: meta.height || null,
        alt: req.body.alt || baseName,
        tags: tagsList,
        uploadedBy: req.user?.id || null
      }
    });

    res.status(201).json({ success: true, message: 'Image uploaded successfully', data: { ...asset, _id: asset.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: `Upload failed: ${error.message}` });
  }
};

/**
 * @route DELETE /api/media/:id
 */
exports.deleteMedia = async (req, res) => {
  try {
    const item = await prisma.mediaAsset.findUnique({
      where: { id: req.params.id }
    });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Media asset not found' });
    }

    if (item.url.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, '../..', item.url);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }

    await prisma.mediaAsset.delete({
      where: { id: req.params.id }
    });
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

    const items = await prisma.mediaAsset.findMany({
      where: { id: { in: ids } }
    });
    for (const item of items) {
      if (item.url.startsWith('/uploads/')) {
        const localPath = path.join(__dirname, '../..', item.url);
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      }
    }

    await prisma.mediaAsset.deleteMany({
      where: { id: { in: ids } }
    });
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

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ success: false, error: 'Only image files are allowed' });
    }

    const asset = await prisma.mediaAsset.findUnique({
      where: { id: req.params.id }
    });
    if (!asset) {
      return res.status(404).json({ success: false, error: 'Media asset not found' });
    }

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

    const updated = await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: {
        filename: uniqueName,
        originalName: req.file.originalname,
        url: publicUrl,
        mimeType: 'image/webp',
        size: optimized.length,
        width: meta.width || null,
        height: meta.height || null
      }
    });

    res.status(200).json({ success: true, message: 'Image replaced successfully', data: { ...updated, _id: updated.id } });
  } catch (error) {
    res.status(500).json({ success: false, error: `Replace failed: ${error.message}` });
  }
};
