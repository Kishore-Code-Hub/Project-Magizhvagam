const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  email: { type: String, required: true },
  action: { type: String, required: true }, // 'login_success', 'login_failure', 'logout', 'product_create', 'product_update', 'product_delete', 'settings_export', 'settings_import', 'settings_reset', 'settings_update', 'bulk_import'
  details: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
