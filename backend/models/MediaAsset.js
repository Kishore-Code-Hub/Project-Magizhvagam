/**
 * MAGIZHVAGAM — Media Library Asset Schema
 * Stores metadata for uploaded images; files live in /uploads/media/
 */

const mongoose = require('mongoose');

const MediaAssetSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  url: { type: String, required: true },
  mimeType: { type: String, default: 'image/webp' },
  size: { type: Number, default: 0 },
  width: { type: Number, default: null },
  height: { type: Number, default: null },
  alt: { type: String, default: '' },
  tags: { type: [String], default: [] },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  folder: { type: String, default: 'media' }
}, { timestamps: true, collection: 'media_assets' });

MediaAssetSchema.index({ filename: 1 });
MediaAssetSchema.index({ originalName: 'text', alt: 'text', tags: 'text' });

module.exports = mongoose.model('MediaAsset', MediaAssetSchema);
