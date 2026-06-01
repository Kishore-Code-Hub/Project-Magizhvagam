const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./db');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const Coupon = require('../models/Coupon');

const seedData = async () => {
  try {
    await connectDB();

    console.log('Clearing database collections...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Setting.deleteMany({});
    await Coupon.deleteMany({});

    console.log('Seeding Admin User...');
    const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
    const admin = await User.create({
      name: 'Magizhvagam Admin',
      email: 'admin@magizhvagam.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      addresses: [{
        fullName: 'Admin Main Office',
        phone: '9876543210',
        street: '12 Luxury Palace St',
        city: 'Chennai',
        state: 'Tamil Nadu',
        zipCode: '600001',
        country: 'India'
      }]
    });
    console.log(`Admin user created: ${admin.email}`);

    console.log('Seeding Categories...');
    const categoriesData = [
      { name: 'Birthday Return Gifts', slug: 'birthday-return-gifts', image: '/assets/images/categories/birthday.jpg' },
      { name: 'Wedding Return Gifts', slug: 'wedding-return-gifts', image: '/assets/images/categories/wedding.jpg' },
      { name: 'Baby Shower Gifts', slug: 'baby-shower-gifts', image: '/assets/images/categories/babyshower.jpg' },
      { name: 'Corporate Gifts', slug: 'corporate-gifts', image: '/assets/images/categories/corporate.jpg' },
      { name: 'Festival Gifts', slug: 'festival-gifts', image: '/assets/images/categories/festival.jpg' },
      { name: 'Kids Return Gifts', slug: 'kids-return-gifts', image: '/assets/images/categories/kids.jpg' },
      { name: 'Customized Gifts', slug: 'customized-gifts', image: '/assets/images/categories/customized.jpg' },
      { name: 'Eco-Friendly Gifts', slug: 'eco-friendly-gifts', image: '/assets/images/categories/ecofriendly.jpg' }
    ];

    const categories = await Category.insertMany(categoriesData);
    console.log(`${categories.length} Categories created.`);

    // Map categories for easy product linkage
    const catMap = {};
    categories.forEach(c => {
      catMap[c.name] = c._id;
    });

    console.log('Seeding Products...');
    const productsData = [
      {
        name: 'Premium Brass Kumkum Holder',
        description: 'An elegant, hand-carved traditional brass kumkum holder, perfect for weddings, baby showers, and housewarming functions. Features intricate peacock designs.',
        price: 250,
        discountPrice: 199,
        stock: 500,
        category: catMap['Wedding Return Gifts'],
        images: [{ url: '/assets/images/products/kumkum_holder.jpg' }],
        specifications: { material: 'Brass', dimensions: '3.5 x 2 inches', weight: '150g', color: 'Gold' },
        tags: ['brass', 'kumkum', 'traditional', 'wedding', 'return-gift'],
        averageRating: 4.8,
        totalReviews: 24
      },
      {
        name: 'Eco-Friendly Jute Bag Set',
        description: 'Eco-friendly, reusable jute return gift bags with cotton handles and floral design overlays. Durable, stylish, and perfect for carrying fruits, coconuts, and sweets.',
        price: 80,
        discountPrice: 65,
        stock: 1200,
        category: catMap['Eco-Friendly Gifts'],
        images: [{ url: '/assets/images/products/jute_bag.jpg' }],
        specifications: { material: 'Natural Jute', dimensions: '12 x 10 inches', weight: '80g', color: 'Natural Cream & Pink' },
        tags: ['jute', 'bag', 'eco-friendly', 'green', 'wedding', 'bulk'],
        averageRating: 4.5,
        totalReviews: 12
      },
      {
        name: 'Handcrafted Wooden Sindoor Box',
        description: 'Premium wooden box with red felt lining, hand-painted by local artisans. Adds a traditional rustic charm to any festival return gift pack.',
        price: 150,
        discountPrice: 120,
        stock: 350,
        category: catMap['Festival Gifts'],
        images: [{ url: '/assets/images/products/wooden_box.jpg' }],
        specifications: { material: 'Rosewood', dimensions: '3 x 3 inches', weight: '110g', color: 'Mahogany Red' },
        tags: ['wooden', 'box', 'handcrafted', 'sindoor', 'festival'],
        averageRating: 4.7,
        totalReviews: 8
      },
      {
        name: 'Luxury Silver Plated Puja Plate',
        description: 'Beautiful 8-inch silver plated puja plate decorated with flower motifs. Ideal return gift for weddings, housewarmings, and religious functions.',
        price: 499,
        discountPrice: 399,
        stock: 200,
        category: catMap['Wedding Return Gifts'],
        images: [{ url: '/assets/images/products/puja_plate.jpg' }],
        specifications: { material: 'Silver Plated Steel', dimensions: '8 inches diameter', weight: '220g', color: 'Silver' },
        tags: ['silver', 'puja', 'plate', 'luxury', 'wedding', 'religious'],
        averageRating: 4.9,
        totalReviews: 32
      },
      {
        name: 'Clay Ganesha Idol on Leaf',
        description: 'Eco-friendly terracotta Ganesha idol resting on a decorative betel leaf, painted with water-soluble colors. A serene return gift choice for baby showers and housewarmings.',
        price: 180,
        discountPrice: 149,
        stock: 800,
        category: catMap['Baby Shower Gifts'],
        images: [{ url: '/assets/images/products/ganesha_leaf.jpg' }],
        specifications: { material: 'Clay / Terracotta', dimensions: '4 x 4 inches', weight: '180g', color: 'Green & Ochre' },
        tags: ['clay', 'ganesha', 'idol', 'baby-shower', 'housewarming'],
        averageRating: 4.6,
        totalReviews: 15
      },
      {
        name: 'Personalized Leather Keychain',
        description: 'Genuine leather keychain custom engraved with names or initials. Comes in premium gold-trimmed gift box packaging. Suitable for corporate and birthday events.',
        price: 300,
        discountPrice: 220,
        stock: 600,
        category: catMap['Customized Gifts'],
        images: [{ url: '/assets/images/products/keychain.jpg' }],
        specifications: { material: 'Full Grain Leather', dimensions: '4 x 1 inches', weight: '30g', color: 'Tan Brown' },
        tags: ['leather', 'keychain', 'personalized', 'corporate', 'birthday'],
        averageRating: 4.4,
        totalReviews: 19
      },
      {
        name: 'Premium Cartoon Activity Mug',
        description: 'Colorful ceramic mugs featuring funny cartoon characters with built-in straw holders. The perfect return gift for children\'s birthday parties.',
        price: 120,
        discountPrice: 99,
        stock: 450,
        category: catMap['Kids Return Gifts'],
        images: [{ url: '/assets/images/products/kids_mug.jpg' }],
        specifications: { material: 'Ceramic', dimensions: '11oz capacity', weight: '300g', color: 'Multi-Color' },
        tags: ['mug', 'kids', 'ceramic', 'birthday', 'cartoon'],
        averageRating: 4.3,
        totalReviews: 5
      },
      {
        name: 'Silver-Finish Executive Pen Set',
        description: 'Exquisite rollerball pen set with silver finish and matching textured case. Ideal for corporate delegates, office functions, and executive giveaways.',
        price: 750,
        discountPrice: 599,
        stock: 150,
        category: catMap['Corporate Gifts'],
        images: [{ url: '/assets/images/products/pen_set.jpg' }],
        specifications: { material: 'Alloy & Silver Overlay', dimensions: '6 x 2 inches case', weight: '200g', color: 'Metallic Silver' },
        tags: ['pen', 'corporate', 'executive', 'office', 'gift-set'],
        averageRating: 4.8,
        totalReviews: 21
      }
    ];

    const seededProducts = await Product.insertMany(productsData);
    console.log(`${seededProducts.length} Products created.`);

    // Map seeded product IDs
    const featuredIds = seededProducts.slice(0, 4).map(p => p._id);
    const bestSellersIds = seededProducts.slice(2, 6).map(p => p._id);
    const newArrivalsIds = seededProducts.slice(4, 8).map(p => p._id);

    console.log('Seeding Homepage Settings...');
    const rawPhone = process.env.WHATSAPP_PHONE || '919876543210';
    let seededPhone = rawPhone.trim();
    if (seededPhone.length === 10 && /^\d+$/.test(seededPhone)) {
      seededPhone = '91' + seededPhone;
    }
    await Setting.create({
      key: 'homepage',
      value: {
        heroBanners: [
          {
            image: '/assets/images/banners/hero_slide_1.jpg',
            title: 'Welcome to Magizhvagam',
            subtitle: 'Curated Premium Return Gifts for Every Celebration',
            link: '/products.html'
          },
          {
            image: '/assets/images/banners/hero_slide_2.jpg',
            title: 'Luxury Made Memorable',
            subtitle: 'Explore Handcrafted Traditions & Modern Customs',
            link: '/products.html?category=wedding-return-gifts'
          }
        ],
        promotionalBanners: [
          {
            image: '/assets/images/banners/promo_1.jpg',
            title: 'Wedding Collection - Get Flat 15% Off on Bulk Orders',
            link: '/products.html?category=wedding-return-gifts'
          },
          {
            image: '/assets/images/banners/promo_2.jpg',
            title: 'Eco-Friendly Gifts - Go Green This Festival Season',
            link: '/products.html?category=eco-friendly-gifts'
          }
        ],
        featuredProductIds: featuredIds,
        bestSellerProductIds: bestSellersIds,
        newArrivalProductIds: newArrivalsIds,
        trendingProductIds: featuredIds,
        recommendedProductIds: newArrivalsIds,
        categoryHighlights: categories.slice(0, 4).map(c => c._id),
        testimonials: [
          { author: 'Meera Krishnan', rating: 5, comment: 'Magizhvagam made my daughters wedding return gifts so memorable! Intricate quality and bulk delivery was perfectly on time.' },
          { author: 'Vikram Seth', rating: 5, comment: 'Extremely professional team. The customized keychains for our annual corporate meet were a massive hit.' },
          { author: 'Pooja Hegde', rating: 4, comment: 'Beautiful jute bags! Very eco-friendly and sturdy. Will definitely buy for all my family functions.' }
        ],
        whatsappContact: seededPhone
      }
    });
    console.log('Homepage settings seeded successfully.');

    console.log('Seeding Sample Coupon...');
    await Coupon.create({
      code: 'WELCOME10',
      discountType: 'Percentage',
      discountValue: 10,
      minOrderValue: 500,
      expiresAt: new Date('2030-12-31'),
      active: true
    });
    console.log('Sample coupon WELCOME10 seeded.');

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Database seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
