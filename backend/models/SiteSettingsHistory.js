/**
 * MAGIZHVAGAM V4 — Site Settings History (Audit Log)
 * Stores snapshots of config documents before each update for rollback support.
 * TTL: 90 days, keeps last 50 versions per collection.
 */

const mongoose = require('mongoose');

const SiteSettingsHistorySchema = new mongoose.Schema({
  savedAt: { type: Date, default: Date.now, index: { expires: 90 * 24 * 60 * 60 } }, // 90-day TTL
  savedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  configCollection: { type: String, required: true, index: true }, // "site_settings_v4" | "homepage_sections_v4" etc.
  version: { type: Number, required: true },
  snapshot: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: false, collection: 'site_settings_history' });

// Compound index for efficient lookups by collection + version
SiteSettingsHistorySchema.index({ configCollection: 1, version: -1 });
SiteSettingsHistorySchema.index({ configCollection: 1, savedAt: -1 });

module.exports = mongoose.model('SiteSettingsHistory', SiteSettingsHistorySchema);
