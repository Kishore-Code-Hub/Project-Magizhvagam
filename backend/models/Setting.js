const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  flashSaleActive: { type: Boolean, default: false },
  flashSaleText: { type: String, default: "Mega Flash Sale! Get 20% off all return gifts!" },
  flashSaleTargetDate: { type: Date, default: null }
});

module.exports = mongoose.model('Setting', SettingSchema);
