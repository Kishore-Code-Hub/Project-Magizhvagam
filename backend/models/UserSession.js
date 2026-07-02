const mongoose = require('mongoose');

const UserSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  refreshToken: { type: String, required: true, index: true },
  userAgent: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  browser: { type: String, default: 'Unknown' },
  os: { type: String, default: 'Unknown' },
  device: { type: String, default: 'Unknown' },
  country: { type: String, default: 'Unknown' },
  loginTime: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now }
});

UserSessionSchema.index({ userId: 1 });
UserSessionSchema.index({ lastActivity: -1 });

module.exports = mongoose.model('UserSession', UserSessionSchema);
