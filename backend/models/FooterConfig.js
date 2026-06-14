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
  columns: {
    type: [FooterColumnSchema], default: () => [
      {
        heading: 'Quick Links', links: [
          { label: 'Shop All', url: '/products.html' },
          { label: 'New Arrivals', url: '/products.html?sort=newest' },
          { label: 'Best Sellers', url: '/products.html?sort=bestSelling' },
          { label: 'About Us', url: '/about.html' }
        ]
      },
      {
        heading: 'Customer Care', links: [
          { label: 'Contact Us', url: '/contact.html' },
          { label: 'FAQs', url: '/about.html#faq' },
          { label: 'Track Your Order', url: '/profile.html' },
          { label: 'Return & Refund Policy', url: '/about.html#returns' },
          { label: 'Cancellation Policy', url: '/about.html#cancellation' },
          { label: 'Shipping Information', url: '/about.html#shipping' },
          { label: 'Privacy Policy', url: '/about.html#privacy' },
          { label: 'Terms & Conditions', url: '/about.html#terms' },
          { label: 'Bulk Orders & Corporate Gifts', url: '/contact.html' }
        ]
      },
      {
        heading: 'Categories', links: [
          { label: 'Wedding Return Gifts', url: '/products.html?category=wedding-return-gifts' },
          { label: 'Birthday Gifts', url: '/products.html?category=birthday-gifts' },
          { label: 'Eco-Friendly', url: '/products.html?category=eco-friendly-gifts' },
          { label: 'Gift Hampers', url: '/products.html?category=gift-hampers' }
        ]
      }
    ]
  },
  social: {
    type: [SocialLinkSchema], default: () => [
      { platform: 'instagram', url: '#', visible: true },
      { platform: 'facebook', url: '#', visible: true },
      { platform: 'whatsapp', url: '#', visible: true },
      { platform: 'youtube', url: '#', visible: false }
    ]
  },
  contact: {
    address: { value: { type: String, default: 'Chennai, Tamil Nadu' }, visible: { type: Boolean, default: true } },
    phone: { value: { type: String, default: '+91 98940 86929' }, visible: { type: Boolean, default: true } },
    email: { value: { type: String, default: 'hellomagizhvagam@gmail.com' }, visible: { type: Boolean, default: true } }
  },
  newsletter: {
    heading: { type: String, default: 'Join Our WhatsApp Community' },
    placeholder: { type: String, default: 'Enter your Email' },
    ctaLabel: { type: String, default: 'Join WhatsApp Community' },
    incentive: { type: String, default: 'Get Latest Updates, New Arrivals, Festival Collections & Special Announcements.' }
  },
  copyright: {
    text: { type: String, default: '© {YEAR} Magizhvagam. All rights reserved.' },
    autoYear: { type: Boolean, default: true }
  }
}, { _id: false, timestamps: false, collection: 'footer_config_v4' });

module.exports = mongoose.model('FooterConfigV4', FooterConfigSchema);
