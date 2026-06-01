const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['Percentage', 'FixedAmount'], required: true },
  discountValue: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Coupon', CouponSchema);
