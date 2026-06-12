/**
 * MAGIZHVAGAM V4 — Animation Config Schema
 * Presets + per-control overrides for site-wide animation behavior
 */

const mongoose = require('mongoose');

const AnimationConfigSchema = new mongoose.Schema({
  _id: { type: String, default: 'active' },
  version: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  preset: { type: String, enum: ['subtle', 'elevated', 'expressive', 'none'], default: 'elevated' },
  overrides: {
    cardHover:       { type: String, enum: ['lift', 'glow', 'morph', 'scale', 'none'], default: 'lift' },
    btnClick:        { type: String, enum: ['ripple', 'pulse', 'none'], default: 'ripple' },
    pageEntrance:    { type: String, enum: ['fade', 'slide-up', 'none'], default: 'fade' },
    scrollReveal:    { type: Boolean, default: true },
    countdownTick:   { type: String, enum: ['flip', 'fade', 'none'], default: 'fade' },
    skeletonShimmer: { type: String, enum: ['wave', 'pulse', 'none'], default: 'wave' }
  }
}, { _id: false, timestamps: false, collection: 'animation_config_v4' });

module.exports = mongoose.model('AnimationConfigV4', AnimationConfigSchema);
