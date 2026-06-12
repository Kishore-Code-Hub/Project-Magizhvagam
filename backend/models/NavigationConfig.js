/**
 * MAGIZHVAGAM V4 — Navigation Config Schema
 * Desktop mega menu + mobile drawer configuration
 */

const mongoose = require('mongoose');

const NavLinkSchema = new mongoose.Schema({
  label: { type: String, required: true },
  url: { type: String, required: true },
  featured: { type: Boolean, default: false }
}, { _id: false });

const NavColumnSchema = new mongoose.Schema({
  heading: { type: String, default: '' },
  links: { type: [NavLinkSchema], default: [] }
}, { _id: false });

const NavPromoSchema = new mongoose.Schema({
  imageUrl: { type: String, default: '' },
  headline: { type: String, default: '' },
  ctaLabel: { type: String, default: '' },
  ctaUrl: { type: String, default: '' }
}, { _id: false });

const NavPanelSchema = new mongoose.Schema({
  type: { type: String, enum: ['dropdown', 'mega', 'none'], default: 'none' },
  columns: { type: [NavColumnSchema], default: [] },
  promo: { type: NavPromoSchema, default: () => ({}) }
}, { _id: false });

const DesktopNavItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  url: { type: String, required: true },
  icon: { type: String, default: '' },
  order: { type: Number, required: true },
  featured: { type: Boolean, default: false },
  panel: { type: NavPanelSchema, default: () => ({ type: 'none' }) }
}, { _id: false });

const MobileNavItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  url: { type: String, required: true },
  children: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { _id: false });

const DEFAULT_DESKTOP_NAV = [
  { id: 'nav-home', label: 'Home', url: '/', icon: 'home', order: 0, featured: false, panel: { type: 'none' } },
  { id: 'nav-shop', label: 'Shop', url: '/products.html', icon: 'shopping-bag', order: 1, featured: true, panel: {
    type: 'mega',
    columns: [
      { heading: 'By Occasion', links: [
        { label: 'Wedding Return Gifts', url: '/products.html?category=wedding-return-gifts', featured: true },
        { label: 'Birthday Gifts', url: '/products.html?category=birthday-gifts', featured: false },
        { label: 'Baby Shower', url: '/products.html?category=baby-shower', featured: false },
        { label: 'Corporate Events', url: '/products.html?category=corporate-events', featured: false }
      ]},
      { heading: 'By Type', links: [
        { label: 'Eco-Friendly', url: '/products.html?category=eco-friendly-gifts', featured: false },
        { label: 'Engraved Items', url: '/products.html?category=engraved-items', featured: false },
        { label: 'Gift Hampers', url: '/products.html?category=gift-hampers', featured: true },
        { label: 'Custom Boxes', url: '/products.html?category=custom-boxes', featured: false }
      ]},
      { heading: 'Collections', links: [
        { label: 'New Arrivals', url: '/products.html?sort=newest', featured: true },
        { label: 'Best Sellers', url: '/products.html?sort=bestSelling', featured: false },
        { label: 'Flash Deals', url: '/products.html?tag=flash', featured: false }
      ]}
    ],
    promo: { imageUrl: '/assets/images/default-banner.webp', headline: 'New Collection Available', ctaLabel: 'Shop Now', ctaUrl: '/products.html?sort=newest' }
  }},
  { id: 'nav-about', label: 'About', url: '/about.html', icon: 'info', order: 2, featured: false, panel: { type: 'none' } },
  { id: 'nav-contact', label: 'Contact', url: '/contact.html', icon: 'phone', order: 3, featured: false, panel: { type: 'none' } }
];

const DEFAULT_MOBILE_NAV = [
  { label: 'Home', url: '/', children: [] },
  { label: 'Shop All', url: '/products.html', children: [
    { label: 'Wedding Return Gifts', url: '/products.html?category=wedding-return-gifts', children: [] },
    { label: 'Birthday Gifts', url: '/products.html?category=birthday-gifts', children: [] },
    { label: 'Eco-Friendly', url: '/products.html?category=eco-friendly-gifts', children: [] },
    { label: 'Gift Hampers', url: '/products.html?category=gift-hampers', children: [] }
  ]},
  { label: 'About', url: '/about.html', children: [] },
  { label: 'Contact', url: '/contact.html', children: [] }
];

const NavigationConfigSchema = new mongoose.Schema({
  _id: { type: String, default: 'active' },
  version: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  desktop: { type: [DesktopNavItemSchema], default: () => DEFAULT_DESKTOP_NAV.map(n => ({ ...n })) },
  mobile: { type: [MobileNavItemSchema], default: () => DEFAULT_MOBILE_NAV.map(n => ({ ...n })) }
}, { _id: false, timestamps: false, collection: 'navigation_config_v4' });

NavigationConfigSchema.statics.DEFAULT_DESKTOP_NAV = DEFAULT_DESKTOP_NAV;
NavigationConfigSchema.statics.DEFAULT_MOBILE_NAV = DEFAULT_MOBILE_NAV;

module.exports = mongoose.model('NavigationConfigV4', NavigationConfigSchema);
