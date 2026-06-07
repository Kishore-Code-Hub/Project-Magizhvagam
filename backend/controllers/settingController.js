const Setting = require('../models/Setting');
const Coupon = require('../models/Coupon');

// Default feature toggle values
const DEFAULT_FEATURE_TOGGLES = {
  wishlistEnabled: true,
  couponsEnabled: true,
  registrationEnabled: true,
  whatsappCheckoutEnabled: false,
  codEnabled: true,
  reviewsEnabled: true,
  recommendationsEnabled: true,
  promosEnabled: true,
  announcementBannerEnabled: true,
  themeAccentColor: '#6A0DAD',
  homepageLayoutFeatured: true,
  flashSaleActive: false,
  flashSaleText: "Mega Flash Sale! Get 20% off all return gifts!",
  flashSaleTargetDate: null
};

// @desc    Get feature toggles (cached helper for internal use)
// @access  Internal
const getFeatureToggleValues = async () => {
  try {
    const setting = await Setting.findOne({ key: 'featureToggles' });
    if (setting && setting.value) {
      return { ...DEFAULT_FEATURE_TOGGLES, ...setting.value };
    }
    return { ...DEFAULT_FEATURE_TOGGLES };
  } catch (err) {
    return { ...DEFAULT_FEATURE_TOGGLES };
  }
};
exports.getFeatureToggleValues = getFeatureToggleValues;

// @desc    Get feature toggles
// @route   GET /api/settings/feature-toggles
// @access  Public
exports.getFeatureToggles = async (req, res) => {
  try {
    const toggles = await getFeatureToggleValues();
    res.status(200).json({ success: true, toggles });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error fetching feature toggles: ${error.message}` });
  }
};

// @desc    Update feature toggles
// @route   PUT /api/settings/feature-toggles
// @access  Private (Admin Only)
exports.updateFeatureToggles = async (req, res) => {
  try {
    const { toggles } = req.body;
    if (!toggles || typeof toggles !== 'object') {
      return res.status(400).json({ success: false, error: 'Please provide toggles object' });
    }

    // Only allow known toggle keys
    const sanitized = {};
    if (toggles.wishlistEnabled !== undefined) sanitized.wishlistEnabled = !!toggles.wishlistEnabled;
    if (toggles.couponsEnabled !== undefined) sanitized.couponsEnabled = !!toggles.couponsEnabled;
    if (toggles.registrationEnabled !== undefined) sanitized.registrationEnabled = !!toggles.registrationEnabled;
    if (toggles.whatsappCheckoutEnabled !== undefined) sanitized.whatsappCheckoutEnabled = !!toggles.whatsappCheckoutEnabled;
    if (toggles.codEnabled !== undefined) sanitized.codEnabled = !!toggles.codEnabled;
    if (toggles.reviewsEnabled !== undefined) sanitized.reviewsEnabled = !!toggles.reviewsEnabled;
    if (toggles.recommendationsEnabled !== undefined) sanitized.recommendationsEnabled = !!toggles.recommendationsEnabled;
    if (toggles.promosEnabled !== undefined) sanitized.promosEnabled = !!toggles.promosEnabled;
    if (toggles.announcementBannerEnabled !== undefined) sanitized.announcementBannerEnabled = !!toggles.announcementBannerEnabled;
    if (toggles.themeAccentColor !== undefined) sanitized.themeAccentColor = String(toggles.themeAccentColor || '#6A0DAD').trim();
    if (toggles.homepageLayoutFeatured !== undefined) sanitized.homepageLayoutFeatured = !!toggles.homepageLayoutFeatured;
    if (toggles.flashSaleActive !== undefined) sanitized.flashSaleActive = !!toggles.flashSaleActive;
    if (toggles.flashSaleText !== undefined) sanitized.flashSaleText = String(toggles.flashSaleText || '').trim();
    if (toggles.flashSaleTargetDate !== undefined) sanitized.flashSaleTargetDate = toggles.flashSaleTargetDate ? new Date(toggles.flashSaleTargetDate) : null;

    let setting = await Setting.findOne({ key: 'featureToggles' });
    if (!setting) {
      setting = await Setting.create({ key: 'featureToggles', value: { ...DEFAULT_FEATURE_TOGGLES, ...sanitized } });
    } else {
      setting.value = { ...DEFAULT_FEATURE_TOGGLES, ...setting.value, ...sanitized };
      setting.markModified('value');
      await setting.save();
    }

    res.status(200).json({ success: true, message: 'Feature toggles updated successfully!', toggles: setting.value });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error updating feature toggles: ${error.message}` });
  }
};

// @desc    Get store setting by key (e.g., "homepage")
// @route   GET /api/settings/:key
// @access  Public
exports.getSetting = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
    if (!setting) {
      return res.status(404).json({ success: false, error: 'Setting not found' });
    }
    
    let val = setting.value;
    if (req.params.key === 'homepage' && process.env.WHATSAPP_PHONE) {
      let phone = process.env.WHATSAPP_PHONE.trim();
      if (phone.length === 10 && /^\d+$/.test(phone)) {
        phone = '91' + phone;
      }
      // Shallow clone and override
      val = JSON.parse(JSON.stringify(val));
      val.whatsappContact = phone;
    }

    res.status(200).json({ success: true, setting: val });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error fetching setting: ${error.message}` });
  }
};

// @desc    Update setting by key (Admin Homepage Builder)
// @route   PUT /api/settings/:key
// @access  Private (Admin Only)
exports.updateSetting = async (req, res) => {
  try {
    const { value } = req.body;
    if (!value) {
      return res.status(400).json({ success: false, error: 'Please provide setting value' });
    }

    let setting = await Setting.findOne({ key: req.params.key });
    if (!setting) {
      setting = await Setting.create({ key: req.params.key, value });
    } else {
      setting.value = value;
      setting.markModified('value');
      await setting.save();
    }

    res.status(200).json({ success: true, message: 'Settings updated successfully!', setting: setting.value });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error updating settings: ${error.message}` });
  }
};

// @desc    Get all coupons (Admin Only)
// @route   GET /api/settings/coupons
// @access  Private (Admin Only)
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    res.status(200).json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error fetching coupons: ${error.message}` });
  }
};

// @desc    Create promo coupon
// @route   POST /api/settings/coupons
// @access  Private (Admin Only)
exports.createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderValue, expiresAt, active } = req.body;
    if (!code || !discountType || !discountValue || !expiresAt) {
      return res.status(400).json({ success: false, error: 'Please provide code, type, value and expiry date' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      expiresAt: new Date(expiresAt),
      active: active !== undefined ? active : true
    });

    res.status(201).json({ success: true, message: 'Coupon created successfully!', coupon });
  } catch (error) {
    res.status(500).json({ success: false, error: `Coupon creation error: ${error.message}` });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/settings/coupons/:id
// @access  Private (Admin Only)
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Coupon not found' });
    }
    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: `Coupon deletion error: ${error.message}` });
  }
};

// @desc    Reset setting to defaults
// @route   POST /api/settings/:key/reset
// @access  Private (Admin Only)
exports.resetSetting = async (req, res) => {
  try {
    const key = req.params.key;
    if (key !== 'homepage') {
      return res.status(400).json({ success: false, error: 'Only homepage settings can be reset' });
    }

    const defaultValue = {
      brandName: 'MAGIZHVAGAM',
      logo: 'MAGIZHVAGAM',
      primaryColor: '#6A0DAD',
      secondaryColor: '#FF4F81',
      accentColor: '#FFD700',
      fontFamily: 'Outfit',
      buttonStyle: 'rounded',
      footerContent: 'Making Every Celebration Memorable. Premium Return Gifts and Customized Gifts for weddings, baby showers, birthdays, and corporate events.',
      contactDetails: '12 Luxury Palace St, Chennai, Tamil Nadu - 600001',
      paletteBgMain: '#ffffff',
      paletteBgSurface: '#f8f9fa',
      paletteTextMain: '#212529',
      paletteTextMuted: '#6c757d',
      paletteColorPrimary: '#8a2be2',
      paletteColorSecondary: '#ff1493',
      paletteColorSuccess: '#28a745',
      paletteColorError: '#dc3545',
      heroBanners: [
        {
          image: '/assets/images/default-banner.webp',
          title: 'Welcome to Magizhvagam',
          subtitle: 'Curated Premium Return Gifts for Every Celebration',
          link: '/products.html'
        },
        {
          image: '/assets/images/default-banner.webp',
          title: 'Luxury Made Memorable',
          subtitle: 'Explore Handcrafted Traditions & Modern Customs',
          link: '/products.html?category=wedding-return-gifts'
        }
      ],
      promotionalBanners: [
        {
          image: '/assets/images/default-banner.webp',
          title: 'Wedding Collection - Get Flat 15% Off on Bulk Orders',
          link: '/products.html?category=wedding-return-gifts'
        },
        {
          image: '/assets/images/default-banner.webp',
          title: 'Eco-Friendly Gifts - Go Green This Festival Season',
          link: '/products.html?category=eco-friendly-gifts'
        }
      ],
      featuredProductIds: [],
      bestSellerProductIds: [],
      newArrivalProductIds: [],
      trendingProductIds: [],
      recommendedProductIds: [],
      categoryHighlights: [],
      testimonials: [
        { author: 'Meera Krishnan', rating: 5, comment: 'Magizhvagam made my daughters wedding return gifts so memorable! Intricate quality and bulk delivery was perfectly on time.' },
        { author: 'Vikram Seth', rating: 5, comment: 'Extremely professional team. The customized keychains for our annual corporate meet were a massive hit.' },
        { author: 'Pooja Hegde', rating: 4, comment: 'Beautiful jute bags! Very eco-friendly and sturdy. Will definitely buy for all my family functions.' }
      ],
      whatsappContact: process.env.WHATSAPP_PHONE || '919876543210'
    };

    let setting = await Setting.findOne({ key });
    if (!setting) {
      setting = await Setting.create({ key, value: defaultValue });
    } else {
      setting.value = defaultValue;
      setting.markModified('value');
      await setting.save();
    }

    res.status(200).json({ success: true, message: 'Settings reset successfully', setting: setting.value });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Upload settings asset image (Logo, banners, category image, etc.)
// @route   POST /api/settings/upload
// @access  Private (Admin Only)
exports.uploadSettingsImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an image file' });
    }

    const sharp = require('sharp');
    const fs = require('fs');
    const path = require('path');
    const { isCloudinaryConfigured, uploadToCloudinary } = require('../services/cloudinary');

    // Process with sharp (Resize max width 1920, compress to webp format)
    const optimizedBuffer = await sharp(req.file.buffer)
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    if (isCloudinaryConfigured) {
      const result = await uploadToCloudinary(optimizedBuffer, 'magizhvagam_settings');
      return res.status(200).json({ success: true, url: result.url });
    } else {
      const uploadDir = path.join(__dirname, '../../uploads/settings');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filename = `setting-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
      const filepath = path.join(uploadDir, filename);
      await fs.promises.writeFile(filepath, optimizedBuffer);

      return res.status(200).json({ success: true, url: `/uploads/settings/${filename}` });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: `Upload error: ${error.message}` });
  }
};
