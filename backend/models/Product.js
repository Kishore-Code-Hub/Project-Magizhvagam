const mongoose = require('mongoose');

const ProductImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, default: null } // Stored if Cloudinary is used
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: null },
  stock: { type: Number, default: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  images: [ProductImageSchema],
  imageFolder: { type: String, default: null },
  specifications: {
    material: { type: String, default: '' },
    dimensions: { type: String, default: '' },
    weight: { type: String, default: '' },
    color: { type: String, default: '' }
  },
  tags: [{ type: String }],
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

ProductSchema.index({ category: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ imageFolder: 1 });
ProductSchema.index({ isFeatured: 1 });

module.exports = mongoose.model('Product', ProductSchema);
