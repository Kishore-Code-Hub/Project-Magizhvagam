/**
 * MAGIZHVAGAM V4 — Homepage Sections Schema
 * 
 * Stores the 15 configurable homepage sections with enable/disable, ordering, and config.
 * Admin can reorder via drag-drop in Appearance Studio.
 */

const mongoose = require('mongoose');

const SECTION_IDS = [
  'announcement_bar', 'hero', 'flash_sale', 'featured_categories',
  'collections_spotlight', 'featured_products', 'customization_preview',
  'testimonials', 'bulk_orders_cta', 'how_it_works', 'brand_story',
  'faq', 'newsletter', 'instagram', 'blog_preview'
];

const DEFAULT_SECTIONS = [
  { id: 'announcement_bar', enabled: false, order: 0, config: { message: '', link: '', dismissible: false } },
  {
    id: 'hero', enabled: true, order: 1, config: {
      headline: '',
      subtext: '',
      cta1Label: '', cta1Link: '',
      cta2Label: '', cta2Link: '',
      bgType: 'image',
      banners: []
    }
  },
  { id: 'flash_sale', enabled: false, order: 2, config: { endsAt: null, products: [], urgencyBadge: 'Limited Time!' } },
  { id: 'featured_categories', enabled: true, order: 3, config: { layout: 'image_cards', items: [] } },
  { id: 'collections_spotlight', enabled: true, order: 4, config: { heading: 'Curated Collections', collectionIds: [], rowCount: 1 } },
  { id: 'featured_products', enabled: true, order: 5, config: { count: 8, sort: 'newest', productIds: [] } },
  { id: 'customization_preview', enabled: true, order: 6, config: { heading: 'Make It Uniquely Yours', subtext: 'Add personalized messages, engraving, and event signatures to any gift.', demoImages: [] } },
  { id: 'testimonials', enabled: true, order: 7, config: { layout: 'grid', items: [] } },
  { id: 'bulk_orders_cta', enabled: true, order: 8, config: { heading: 'Planning a Big Event?', subtext: 'Get special pricing on bulk orders of 50+ items. We handle everything from customization to venue delivery.', formTriggerLabel: 'Get Bulk Quote', backgroundImage: '' } },
  {
    id: 'how_it_works', enabled: true, order: 9, config: {
      stepCount: 4, steps: [
        { icon: 'search', title: 'Browse & Select', description: 'Explore our curated collections of premium return gifts.' },
        { icon: 'palette', title: 'Customize', description: 'Add personal touches — engraving, messages, packaging.' },
        { icon: 'truck', title: 'We Deliver', description: 'Direct priority shipping to your event venue, fully tracked.' },
        { icon: 'heart', title: 'Celebrate', description: 'Delight your guests with gifts they\'ll treasure forever.' }
      ]
    }
  },
  { id: 'brand_story', enabled: true, order: 10, config: { richText: 'Born in the heart of Tamil Nadu, Magizhvagam is a celebration of culture, craftsmanship, and the joy of giving. Every gift we create carries the warmth of tradition and the elegance of modern design.', imageUrl: '', layout: 'right' } },
  {
    id: 'faq', enabled: true, order: 11, config: {
      pairs: [
        { q: 'What is the minimum order quantity for bulk orders?', a: 'We accept bulk orders starting from 50 pieces. Contact us for special pricing on larger quantities.' },
        { q: 'Can I customize the gifts with my event details?', a: 'Absolutely! We offer engraving, custom packaging, personalized messages, and event-themed designs on most of our products.' },
        { q: 'What is the delivery timeline?', a: 'Standard delivery takes 5-7 business days. Express delivery (2-3 days) is available for select locations at additional cost.' },
        { q: 'Do you offer returns or exchanges?', a: 'Yes, we accept returns within 7 days of delivery for non-customized items. Customized items are non-returnable.' }
      ]
    }
  },
  { id: 'newsletter', enabled: true, order: 12, config: { heading: 'Stay in the Loop', incentive: 'Stay Updated!', placeholder: 'Enter your email address', ctaLabel: 'Send' } },
  { id: 'instagram', enabled: false, order: 13, config: { images: [], embedToken: '' } },
  { id: 'blog_preview', enabled: false, order: 14, config: { postCount: 3, heading: 'Gift Ideas & Tips' } }
];

const HomepageSectionItemSchema = new mongoose.Schema({
  id: { type: String, enum: SECTION_IDS, required: true },
  enabled: { type: Boolean, default: true },
  order: { type: Number, required: true },
  config: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const HomepageSectionsSchema = new mongoose.Schema({
  _id: { type: String, default: 'active' },
  version: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  sections: { type: [HomepageSectionItemSchema], default: () => DEFAULT_SECTIONS.map(s => ({ ...s })) }
}, { _id: false, timestamps: false, collection: 'homepage_sections_v4' });

HomepageSectionsSchema.statics.SECTION_IDS = SECTION_IDS;
HomepageSectionsSchema.statics.DEFAULT_SECTIONS = DEFAULT_SECTIONS;

module.exports = mongoose.model('HomepageSectionsV4', HomepageSectionsSchema);
