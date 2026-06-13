const mongoose = require('mongoose');

const UnverifiedStageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  passwordHash: { type: String },
  address1: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  verificationToken: { type: String, required: true },
  verificationTokenExpires: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('UnverifiedStage', UnverifiedStageSchema);
