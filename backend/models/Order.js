const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String, required: true }
});

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guestDetails: {
    fullName: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null }
  },
  items: [OrderItemSchema],
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  payment: {
    method: { type: String, enum: ['UPI', 'Card', 'COD'], required: true },
    status: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
    transactionId: { type: String, default: null }
  },
  summary: {
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    shipping: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  couponCode: { type: String, default: null },
  status: { 
    type: String, 
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
