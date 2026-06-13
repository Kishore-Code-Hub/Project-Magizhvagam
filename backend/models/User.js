const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: '/assets/images/default-product.webp' },
  quantity: { type: Number, required: true, min: 1, default: 1 }
});

const WishlistItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: '/assets/images/default-product.webp' }
});

const AddressSchema = new mongoose.Schema({
  fullName: { type: String, default: '' },
  phone: { type: String, default: '' },
  street: { type: String, default: '' }, // Address Line 1
  street2: { type: String, default: '' },   // Address Line 2 (Optional)
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zipCode: { type: String, default: '' },
  country: { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false }
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  passwordHash: { type: String }, // Maintain for backward compatibility with old migrations/seeds
  role: { type: String, enum: ['customer', 'admin', 'staff'], default: 'customer' },
  
  // Verification & Self-Service Token Containers
  emailVerified: { type: Boolean, default: false },
  // Account active flags (used by auth flows)
  accountActive: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  verificationOtp: { type: String, default: null },
  verificationOtpExpires: { type: Date, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  
  // Free Brute-Force Lockout Counters
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  
  // Auditing Logs & Connected Media
  profilePicture: { type: String, default: 'https://res.cloudinary.com/demo/image/upload/v1/avatar.png' },
  lastLoginIP: { type: String, default: null },
  lastLoginTimestamp: { type: Date, default: null },
  
  // Legacy / Helper fields for checkout & backward compat
  phone: { type: String, trim: true, default: '' },
  phoneVerified: { type: Boolean, default: false },
  address1: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },

  // Nested Customer Arrays
  addresses: [AddressSchema],
  cartItems: { type: [CartItemSchema], default: [] },
  wishlistItems: { type: [WishlistItemSchema], default: [] },
  refreshToken: { type: String, default: null }
}, { timestamps: true });

UserSchema.pre('validate', function(next) {
  // Synchronize password and passwordHash if one is set but not the other
  if (this.password && !this.passwordHash) {
    this.passwordHash = this.password;
  } else if (this.passwordHash && !this.password) {
    this.password = this.passwordHash;
  }
  next();
});

UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password') && !this.isModified('passwordHash')) return next();

  try {
    if (this.password && !this.password.startsWith('$2')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      this.passwordHash = this.password; // Synchronize both fields cleanly
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', UserSchema);

