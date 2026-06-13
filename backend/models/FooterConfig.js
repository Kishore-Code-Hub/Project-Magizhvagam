/**
 * MAGIZHVAGAM V4 — Footer Config Schema
 * Database-driven footer with brand, columns, social, contact, newsletter, copyright
 */

const mongoose = require('mongoose');

const FooterLinkSchema = new mongoose.Schema({
  label: { type: String, required: true },
  url: { type: String, required: true }
}, { _id: false });

const FooterColumnSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  links: { type: [FooterLinkSchema], default: [] }
}, { _id: false });

const SocialLinkSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  url: { type: String, required: true },
  visible: { type: Boolean, default: true }
}, { _id: false });

const FooterConfigSchema = new mongoose.Schema({
  _id: { type: String, default: 'active' },
  version: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  brand: {
    logoText: { type: String, default: 'MAGIZHVAGAM' },
    tagline: { type: String, default: 'Place of Happiness — மகிழ்வகம்' },
    originStatement: { type: String, default: 'Handcrafted with love in Tamil Nadu, India.' }
  },
  columnCount: { type: Number, enum: [2, 3, 4], default: 3 },
  columns: { type: [FooterColumnSchema], default: () => [
    { heading: 'Quick Links', links: [
      { label: 'Shop All', url: '/products.html' },
      { label: 'New Arrivals', url: '/products.html?sort=newest' },
      { label: 'Best Sellers', url: '/products.html?sort=bestSelling' },
      { label: 'About Us', url: '/about.html' }
    ]},
    { heading: 'Customer Care', links: [
      { label: 'Contact Us', url: '/contact.html' },
      { label: 'FAQs', url: '/#faq' },
      { label: 'Track Order', url: '/profile.html' },
      { label: 'Return Policy', url: '/about.html#returns' }
    ]},
    { heading: 'Categories', links: [
      { label: 'Wedding Return Gifts', url: '/products.html?category=wedding-return-gifts' },
      { label: 'Birthday Gifts', url: '/products.html?category=birthday-gifts' },
      { label: 'Eco-Friendly', url: '/products.html?category=eco-friendly-gifts' },
      { label: 'Gift Hampers', url: '/products.html?category=gift-hampers' }
    ]}
  ]},
  social: { type: [SocialLinkSchema], default: () => [
    { platform: 'instagram', url: '#', visible: true },
    { platform: 'facebook', url: '#', visible: true },
    { platform: 'whatsapp', url: '#', visible: true },
    { platform: 'youtube', url: '#', visible: false }
  ]},
  contact: {
    address: { value: { type: String, default: 'Chennai, Tamil Nadu - 600001' }, visible: { type: Boolean, default: true } },
    phone: { value: { type: String, default: '+91 98940 86929' }, visible: { type: Boolean, default: true } },
    email: { value: { type: String, default: 'hellomagizhvagam@gmail.com' }, visible: { type: Boolean, default: true } }
  },
  newsletter: {
    heading: { type: String, default: 'Join Our Community' },
    placeholder: { type: String, default: 'Enter your email' },
    ctaLabel: { type: String, default: 'Subscribe' },
    incentive: { type: String, default: 'Get 10% off your first order!' }
  },
  copyright: {
    text: { type: String, default: '© {YEAR} Magizhvagam. All rights reserved.' },
    autoYear: { type: Boolean, default: true }
  },
  paymentBadges: {
    visible: { type: Boolean, default: true },
    methods: { type: [String], default: ['UPI', 'Card', 'COD', 'WhatsApp'] }
  }
}, { _id: false, timestamps: false, collection: 'footer_config_v4' });

module.exports = mongoose.model('FooterConfigV4', FooterConfigSchema);
