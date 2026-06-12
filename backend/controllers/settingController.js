const Setting = require('../models/Setting');
const Coupon = require('../models/Coupon');
const SiteSettingsV4 = require('../models/SiteSettings');

// Helper to synchronize flat homepage settings to SiteSettingsV4 document
async function syncSettingsToV4(homepageSettings) {
  try {
    let siteSettings = await SiteSettingsV4.findOne({ _id: 'active' });
    if (!siteSettings) {
      siteSettings = new SiteSettingsV4({ _id: 'active' });
    }

    const v = homepageSettings;
    if (v) {
      // Sync meta information
      siteSettings.meta = siteSettings.meta || {};
      if (v.brandName) siteSettings.meta.storeName = v.brandName;
      if (v.contactDetails) siteSettings.meta.contactAddress = v.contactDetails;
      if (v.whatsappContact) {
        siteSettings.meta.socialLinks = siteSettings.meta.socialLinks || {};
        siteSettings.meta.socialLinks.whatsapp = v.whatsappContact;
      }

      siteSettings.theme = siteSettings.theme || {};
      const theme = siteSettings.theme;

      // Ensure sections are initialized
      theme.hdr = theme.hdr || {};
      theme.nav = theme.nav || {};
      theme.hero = theme.hero || {};
      theme.pc = theme.pc || {};
      theme.pdp = theme.pdp || {};
      theme.btn = theme.btn || {};
      theme.cart = theme.cart || {};
      theme.co = theme.co || {};
      theme.ft = theme.ft || {};
      theme.frm = theme.frm || {};
      theme.mod = theme.mod || {};
      theme.bdg = theme.bdg || {};
      theme.cd = theme.cd || {};
      theme.acc = theme.acc || {};
      theme.st = theme.st || {};
      theme.adm = theme.adm || {};

      // Sync backgrounds
      if (v.paletteBgMain) {
        theme.hdr.bg = v.paletteBgMain;
        theme.hdr.sticky_bg = v.paletteBgMain;
        theme.cart.page_bg = v.paletteBgMain;
        theme.co.page_bg = v.paletteBgMain;
        theme.ft.bg = v.paletteBgMain;
        theme.acc.page_bg = v.paletteBgMain;
      }

      // Sync surfaces/cards
      if (v.paletteBgSurface) {
        theme.nav.dropdown_bg = v.paletteBgSurface;
        theme.nav.mega_bg = v.paletteBgSurface;
        theme.nav.mobile_bg = v.paletteBgSurface;
        theme.pc.bg = v.paletteBgSurface;
        theme.pc.image_bg = v.paletteBgMain || v.paletteBgSurface;
        theme.pdp.customization_panel_bg = v.paletteBgSurface;
        theme.pdp['3d_viewer_bg'] = v.paletteBgMain || v.paletteBgSurface;
        theme.cart.item_card_bg = v.paletteBgSurface;
        theme.cart.summary_card_bg = v.paletteBgSurface;
        theme.co.address_card_bg = v.paletteBgSurface;
        theme.co.form_input_bg = v.paletteBgSurface;
        theme.co.payment_option_bg = v.paletteBgSurface;
        theme.co.order_summary_bg = v.paletteBgSurface;
        theme.ft.newsletter_input_bg = v.paletteBgSurface;
        theme.frm.input_bg = v.paletteBgSurface;
        theme.mod.modal_bg = v.paletteBgSurface;
        theme.mod.drawer_bg = v.paletteBgSurface;
        theme.cd.digit_bg = v.paletteBgSurface;
        theme.acc.order_card_bg = v.paletteBgSurface;
        theme.acc.address_card_bg = v.paletteBgSurface;
        theme.st.skeleton_base_color = v.paletteBgSurface;
        theme.adm.topbar_bg = v.paletteBgSurface;
        theme.adm.stat_card_bg = v.paletteBgSurface;
      }

      // Sync text colors
      if (v.paletteTextMain) {
        theme.hdr.nav_link_color = v.paletteTextMain;
        theme.hdr.icon_color = v.paletteTextMain;
        theme.nav.dropdown_item_color = v.paletteTextMain;
        theme.nav.mega_heading = v.paletteTextMain;
        theme.nav.mobile_item = v.paletteTextMain;
        theme.hero.headline_color = v.paletteTextMain;
        theme.pc.name_color = v.paletteTextMain;
        theme.pdp.title_color = v.paletteTextMain;
        theme.pdp.specs_heading_color = v.paletteTextMain;
        theme.cart.item_name_color = v.paletteTextMain;
        theme.cart.total_value_color = v.paletteTextMain;
        theme.ft.heading_color = v.paletteTextMain;
        theme.frm.input_text_color = v.paletteTextMain;
        theme.mod.modal_title_color = v.paletteTextMain;
        theme.cd.digit_text = v.paletteTextMain;
        theme.st.empty_heading_color = v.paletteTextMain;
        theme.st.error_heading_color = v.paletteTextMain;
        theme.st.success_heading_color = v.paletteTextMain;
        theme.adm.topbar_title_color = v.paletteTextMain;
      }

      // Sync muted text
      if (v.paletteTextMuted) {
        theme.nav.mega_link = v.paletteTextMuted;
        theme.hero.subheadline_color = v.paletteTextMuted;
        theme.pc.category_color = v.paletteTextMuted;
        theme.pc.original_price_color = v.paletteTextMuted;
        theme.pdp.compare_price_color = v.paletteTextMuted;
        theme.pdp.specs_value_color = v.paletteTextMuted;
        theme.pdp.tab_inactive_color = v.paletteTextMuted;
        theme.cart.total_label_color = v.paletteTextMuted;
        theme.co.form_label_color = v.paletteTextMuted;
        theme.ft.link_color = v.paletteTextMuted;
        theme.frm.label_color = v.paletteTextMuted;
        theme.frm.helper_text_color = v.paletteTextMuted;
        theme.cd.label_color = v.paletteTextMuted;
        theme.acc.tab_inactive_color = v.paletteTextMuted;
        theme.st.empty_text_color = v.paletteTextMuted;
        theme.st.error_text_color = v.paletteTextMuted;
        theme.st.success_text_color = v.paletteTextMuted;
        theme.adm.sidebar_link_color = v.paletteTextMuted;
      }

      // Sync primary accents
      if (v.paletteColorPrimary) {
        theme.hdr.logo_text = v.paletteColorPrimary;
        theme.hdr.nav_link_hover = v.paletteColorPrimary;
        theme.hdr.nav_link_active = v.paletteColorPrimary;
        theme.hdr.icon_hover = v.paletteColorPrimary;
        theme.hdr.announcement_bg = v.paletteColorPrimary;
        theme.nav.mega_accent = v.paletteColorPrimary;
        theme.hero.cta_primary_bg = v.paletteColorPrimary;
        theme.hero.cta_secondary_text = v.paletteColorPrimary;
        theme.pc.current_price_color = v.paletteColorPrimary;
        theme.pc.btn_bg = v.paletteColorPrimary;
        theme.pc.rating_color = v.paletteColorPrimary;
        theme.pdp.price_color = v.paletteColorPrimary;
        theme.pdp.tab_active_color = v.paletteColorPrimary;
        theme.pdp.tab_active_border = v.paletteColorPrimary;
        theme.pdp['3d_viewer_controls_color'] = v.paletteColorPrimary;
        theme.btn.primary_bg = v.paletteColorPrimary;
        theme.btn.secondary_text = v.paletteColorPrimary;
        theme.btn.secondary_border = v.paletteColorPrimary;
        theme.cart.item_price_color = v.paletteColorPrimary;
        theme.cart.coupon_btn_bg = v.paletteColorPrimary;
        theme.cart.checkout_btn_bg = v.paletteColorPrimary;
        theme.co.step_indicator_active = v.paletteColorPrimary;
        theme.co.address_card_selected_border = v.paletteColorPrimary;
        theme.co.form_input_focus_border = v.paletteColorPrimary;
        theme.co.place_order_btn_bg = v.paletteColorPrimary;
        theme.ft.link_hover_color = v.paletteColorPrimary;
        theme.ft.newsletter_btn_bg = v.paletteColorPrimary;
        theme.frm.input_focus_border = v.paletteColorPrimary;
        theme.mod.toast_info_bg = v.paletteColorPrimary;
        theme.bdg.new_text = v.paletteColorPrimary;
        theme.bdg.featured_text = v.paletteColorPrimary;
        theme.cd.separator_color = v.paletteColorPrimary;
        theme.cd.flash_sale_accent = v.paletteColorPrimary;
        theme.acc.tab_active_color = v.paletteColorPrimary;
        theme.acc.tab_active_border = v.paletteColorPrimary;
        theme.acc.address_card_selected_border = v.paletteColorPrimary;
        theme.st.empty_cta_bg = v.paletteColorPrimary;
        theme.st.loading_spinner_color = v.paletteColorPrimary;
        theme.adm.sidebar_link_active_text = v.paletteColorPrimary;
        theme.adm.toggle_active_bg = v.paletteColorPrimary;
        theme.adm.settings_tab_active = v.paletteColorPrimary;
      }

      // Sync secondary accents
      if (v.paletteColorSecondary) {
        theme.hero.cta_primary_hover_bg = v.paletteColorSecondary;
        theme.pc.btn_hover_bg = v.paletteColorSecondary;
        theme.btn.primary_hover_bg = v.paletteColorSecondary;
        theme.cart.checkout_btn_hover_bg = v.paletteColorSecondary;
      }

      // Sync success accents
      if (v.paletteColorSuccess) {
        theme.pc.stock_in_color = v.paletteColorSuccess;
        theme.cart.coupon_success_color = v.paletteColorSuccess;
        theme.co.step_indicator_complete = v.paletteColorSuccess;
        theme.bdg.trending_text = v.paletteColorSuccess;
        theme.acc.status_delivered = v.paletteColorSuccess;
        theme.st.success_icon_color = v.paletteColorSuccess;
      }

      // Sync error accents
      if (v.paletteColorError) {
        theme.pc.stock_out_color = v.paletteColorError;
        theme.pc.wishlist_icon_active = v.paletteColorError;
        theme.btn.danger_bg = v.paletteColorError;
        theme.cart.coupon_error_color = v.paletteColorError;
        theme.cart.warning_banner_text = v.paletteColorError;
        theme.co.form_input_error_border = v.paletteColorError;
        theme.bdg.sale_text = v.paletteColorError;
        theme.acc.status_cancelled = v.paletteColorError;
        theme.st.error_icon_color = v.paletteColorError;
      }

      // Font Family
      if (v.fontFamily) {
        siteSettings.typography = siteSettings.typography || {};
        siteSettings.typography.body = siteSettings.typography.body || {};
        siteSettings.typography.body.family = v.fontFamily;
        siteSettings.typography.heading = siteSettings.typography.heading || {};
        siteSettings.typography.heading.family = v.fontFamily;
      }

      // Button Style
      if (v.buttonStyle) {
        siteSettings.layout = siteSettings.layout || {};
        let r = 10;
        if (v.buttonStyle === 'sharp') r = 0;
        if (v.buttonStyle === 'pill') r = 30;
        siteSettings.layout.btnRadius = r;
        theme.btn.primary_radius = String(r);
      }

      siteSettings.theme = theme;
      siteSettings.version = (siteSettings.version || 0) + 1;
      siteSettings.updatedAt = new Date();
      siteSettings.markModified('theme');
      siteSettings.markModified('typography');
      siteSettings.markModified('layout');
      siteSettings.markModified('meta');
      await siteSettings.save();
    }
  } catch (err) {
    console.error('[syncSettingsToV4] Error synchronizing settings:', err.message);
  }
}

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

    // Legacy homepage -> V4 sync removed to prevent overwriting Appearance Studio / HomepageSectionsV4
    // if (req.params.key === 'homepage') {
    //   await syncSettingsToV4(setting.value);
    // }

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
      theme_tokens: {
        hdr: {
          bg: 'rgba(250, 249, 246, 0.85)',
          border: 'rgba(106, 13, 173, 0.1)',
          logo_text: 'linear-gradient(135deg, #8a2be2 0%, #ff1493 100%)',
          logo_size: '30px',
          nav_link_color: '#212529',
          nav_link_hover: '#8a2be2',
          nav_link_active: '#8a2be2',
          nav_link_weight: '600',
          icon_color: '#212529',
          icon_hover: '#8a2be2',
          sticky_bg: 'rgba(250, 249, 246, 0.95)',
          sticky_shadow: '0 4px 24px rgba(106, 13, 173, 0.08)',
          sticky_height: '80px',
          height: '130px',
          announcement_bg: '#8a2be2',
          announcement_text: '#ffffff'
        },
        nav: {
          dropdown_bg: '#ffffff',
          dropdown_border: 'rgba(106, 13, 173, 0.1)',
          dropdown_shadow: '0 10px 15px -3px rgba(106, 13, 173, 0.08)',
          dropdown_item_color: '#212529',
          dropdown_item_hover_bg: 'rgba(106, 13, 173, 0.05)',
          dropdown_item_hover_color: '#8a2be2',
          mega_bg: '#ffffff',
          mega_accent: '#ff1493',
          mega_heading: '#212529',
          mega_link: '#6c757d',
          mega_promo_bg: '#f8f9fa',
          mobile_bg: '#ffffff',
          mobile_item: '#212529'
        },
        hero: {
          bg_overlay: 'rgba(0, 0, 0, 0.35)',
          overlay_opacity: '0.35',
          headline_color: '#ffffff',
          subheadline_color: '#ffffff',
          cta_primary_bg: '#8a2be2',
          cta_primary_text: '#ffffff',
          cta_primary_hover_bg: '#ff1493',
          cta_secondary_border: '#ffffff',
          cta_secondary_text: '#ffffff',
          badge_bg: 'rgba(255, 215, 0, 0.15)',
          badge_text: '#D4AF37'
        },
        pc: {
          bg: '#ffffff',
          border: 'rgba(106, 13, 173, 0.1)',
          border_radius: '16px',
          shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          hover_shadow: '0 10px 15px -3px rgba(106, 13, 173, 0.08)',
          hover_translate_y: '5',
          image_bg: '#f8f9fa',
          image_radius: '12px',
          name_color: '#212529',
          name_weight: '600',
          category_color: '#6c757d',
          current_price_color: '#8a2be2',
          original_price_color: '#6c757d',
          discount_badge_bg: '#ff1493',
          discount_badge_text: '#ffffff',
          flash_badge_bg: '#dc3545',
          flash_badge_text: '#ffffff',
          rating_color: '#ffbb00',
          rating_empty_color: '#cccccc',
          btn_bg: '#8a2be2',
          btn_text: '#ffffff',
          btn_hover_bg: '#ff1493',
          wishlist_icon_color: '#212529',
          wishlist_icon_active: '#ff1493',
          stock_in_color: '#28a745',
          stock_out_color: '#dc3545',
          stock_low_color: '#ffc107'
        },
        pdp: {
          gallery_border: 'rgba(106, 13, 173, 0.1)',
          gallery_active_border: '#8a2be2',
          gallery_thumb_radius: '8px',
          title_color: '#212529',
          title_size: '28px',
          price_color: '#8a2be2',
          compare_price_color: '#6c757d',
          specs_heading_color: '#212529',
          specs_value_color: '#6c757d',
          tab_active_color: '#8a2be2',
          tab_active_border: '#8a2be2',
          tab_inactive_color: '#6c757d',
          review_star_color: '#ffbb00',
          customization_panel_bg: '#f8f9fa',
          customization_panel_border: 'rgba(106, 13, 173, 0.1)',
          '3d_viewer_bg': '#f8f9fa',
          '3d_viewer_controls_color': '#8a2be2'
        },
        btn: {
          primary_bg: '#8a2be2',
          primary_text: '#ffffff',
          primary_hover_bg: '#ff1493',
          primary_radius: '30px',
          primary_shadow: '0 4px 15px rgba(106, 13, 173, 0.4)',
          secondary_bg: 'transparent',
          secondary_text: '#212529',
          secondary_border: '#8a2be2',
          secondary_hover_bg: 'rgba(106, 13, 173, 0.05)',
          ghost_bg: 'transparent',
          ghost_border: 'transparent',
          ghost_text: '#8a2be2',
          danger_bg: '#dc3545',
          danger_text: '#ffffff',
          disabled_bg: '#e9ecef',
          disabled_text: '#6c757d',
          btn_font_weight: '600',
          btn_letter_spacing: '0.05em',
          btn_transition: 'all 0.3s ease'
        },
        cart: {
          page_bg: '#ffffff',
          item_card_bg: '#f8f9fa',
          item_card_border: 'rgba(106, 13, 173, 0.1)',
          item_name_color: '#212529',
          item_price_color: '#8a2be2',
          quantity_btn_bg: '#e9ecef',
          quantity_btn_border: 'transparent',
          quantity_input_bg: '#ffffff',
          coupon_input_bg: '#ffffff',
          coupon_input_border: 'rgba(106, 13, 173, 0.1)',
          coupon_btn_bg: '#8a2be2',
          coupon_success_color: '#28a745',
          coupon_error_color: '#dc3545',
          warning_banner_bg: '#fff3cd',
          warning_banner_text: '#856404',
          warning_banner_border: '#ffeeba',
          summary_card_bg: '#f8f9fa',
          summary_card_border: 'rgba(106, 13, 173, 0.1)',
          total_label_color: '#212529',
          total_value_color: '#8a2be2',
          whatsapp_btn_bg: '#25d366',
          whatsapp_btn_text: '#ffffff',
          whatsapp_btn_hover_bg: '#20ba5a',
          checkout_btn_bg: '#8a2be2',
          checkout_btn_text: '#ffffff'
        },
        co: {
          page_bg: '#ffffff',
          step_indicator_active: '#8a2be2',
          step_indicator_complete: '#28a745',
          step_indicator_pending: '#6c757d',
          step_line_color: '#e9ecef',
          address_card_bg: '#ffffff',
          address_card_border: 'rgba(106, 13, 173, 0.1)',
          address_selected_border: '#8a2be2',
          address_selected_shadow: '0 4px 15px rgba(106, 13, 173, 0.15)',
          form_label_color: '#212529',
          form_input_bg: '#ffffff',
          form_input_border: 'rgba(106, 13, 173, 0.1)',
          form_input_focus_border: '#8a2be2',
          form_input_error_border: '#dc3545',
          payment_option_bg: '#ffffff',
          payment_option_border: 'rgba(106, 13, 173, 0.1)',
          payment_active_bg: 'rgba(106, 13, 173, 0.05)',
          order_summary_bg: '#f8f9fa',
          place_order_btn_bg: '#8a2be2',
          place_order_btn_text: '#ffffff'
        },
        ft: {
          bg: '#1B0F26',
          border_top: 'rgba(255, 255, 255, 0.1)',
          logo_text: 'linear-gradient(135deg, #ffd700 0%, #e5c100 100%)',
          heading_color: '#ffffff',
          link_color: '#cccccc',
          link_hover_color: '#ffd700',
          divider_color: 'rgba(255, 255, 255, 0.1)',
          copyright_bg: '#110919',
          copyright_text: '#888888',
          newsletter_input_bg: 'rgba(255, 255, 255, 0.05)',
          newsletter_input_border: 'rgba(255, 255, 255, 0.1)',
          newsletter_btn_bg: '#ffd700',
          newsletter_btn_text: '#1B0F26',
          social_icon_color: '#cccccc',
          social_icon_hover_color: '#ffd700',
          social_icon_bg: 'rgba(255, 255, 255, 0.05)',
          social_icon_hover_bg: 'rgba(255, 255, 255, 0.15)'
        },
        frm: {
          input_bg: '#ffffff',
          input_border: 'rgba(106, 13, 173, 0.1)',
          input_border_radius: '8px',
          input_focus_border: '#8a2be2',
          input_focus_shadow: '0 0 0 3px rgba(106, 13, 173, 0.15)',
          input_placeholder_color: '#6c757d',
          input_text_color: '#212529',
          input_error_border: '#dc3545',
          input_error_text: '#dc3545',
          input_success_border: '#28a745',
          input_success_text: '#28a745',
          label_color: '#212529',
          label_weight: '500',
          helper_text_color: '#6c757d',
          strength_weak: '#dc3545',
          strength_fair: '#ffc107',
          strength_strong: '#17a2b8',
          strength_perfect: '#28a745'
        },
        mod: {
          backdrop_color: 'rgba(0, 0, 0, 0.5)',
          backdrop_blur: '16px',
          modal_bg: '#ffffff',
          modal_border: 'rgba(106, 13, 173, 0.1)',
          modal_radius: '16px',
          modal_shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
          modal_header_bg: 'transparent',
          modal_header_border: 'rgba(106, 13, 173, 0.05)',
          modal_title_color: '#212529',
          modal_close_color: '#6c757d',
          modal_close_hover_color: '#212529',
          drawer_bg: '#ffffff',
          drawer_shadow: '0 -10px 25px rgba(0, 0, 0, 0.1)',
          toast_success_bg: '#28a745',
          toast_error_bg: '#dc3545',
          toast_warning_bg: '#ffc107',
          toast_info_bg: '#17a2b8',
          toast_text_color: '#ffffff'
        },
        bdg: {
          new_bg: 'rgba(255, 79, 129, 0.15)',
          new_text: '#FF4F81',
          sale_bg: 'rgba(220, 53, 69, 0.15)',
          sale_text: '#dc3545',
          flash_bg: 'rgba(255, 215, 0, 0.15)',
          flash_text: '#D4AF37',
          trending_bg: 'rgba(138, 43, 226, 0.15)',
          trending_text: '#8a2be2',
          out_of_stock_bg: 'rgba(108, 117, 125, 0.15)',
          out_of_stock_text: '#6c757d',
          limited_bg: 'rgba(255, 193, 7, 0.15)',
          limited_text: '#856404',
          featured_bg: 'rgba(255, 215, 0, 0.15)',
          featured_text: '#D4AF37',
          radius: '20px',
          font_weight: '700',
          padding: '4px 10px'
        },
        cd: {
          container_bg: '#f8f9fa',
          container_border: 'rgba(106, 13, 173, 0.1)',
          container_radius: '12px',
          digit_bg: '#ffffff',
          digit_text: '#212529',
          digit_border: 'rgba(106, 13, 173, 0.05)',
          digit_radius: '8px',
          separator_color: '#212529',
          label_color: '#6c757d',
          expired_bg: '#f8d7da',
          expired_text: '#721c24',
          flash_sale_accent: '#dc3545'
        },
        acc: {
          page_bg: '#ffffff',
          tab_active_color: '#8a2be2',
          tab_active_border: '#8a2be2',
          tab_inactive_color: '#6c757d',
          order_card_bg: '#f8f9fa',
          order_card_border: 'rgba(106, 13, 173, 0.1)',
          status_pending: '#ffc107',
          status_confirmed: '#17a2b8',
          status_shipped: '#8a2be2',
          status_delivered: '#28a745',
          status_cancelled: '#dc3545',
          address_card_bg: '#ffffff',
          address_card_border: 'rgba(106, 13, 173, 0.1)',
          address_cap_warning_bg: '#f8d7da',
          address_cap_warning_text: '#721c24'
        },
        st: {
          empty_icon_color: '#6c757d',
          empty_heading_color: '#212529',
          empty_text_color: '#6c757d',
          empty_cta_bg: '#8a2be2',
          error_icon_color: '#dc3545',
          error_heading_color: '#212529',
          error_text_color: '#6c757d',
          success_icon_color: '#28a745',
          success_heading_color: '#212529',
          success_text_color: '#6c757d',
          loading_spinner_color: '#8a2be2',
          skeleton_base_color: '#e9ecef',
          skeleton_shimmer_color: '#f5f5f5'
        },
        adm: {
          sidebar_bg: '#1B0F26',
          sidebar_border: 'rgba(255, 255, 255, 0.1)',
          sidebar_link_color: '#cccccc',
          sidebar_link_hover_bg: 'rgba(255, 255, 255, 0.05)',
          sidebar_link_active_bg: '#8a2be2',
          sidebar_link_active_text: '#ffffff',
          topbar_bg: '#ffffff',
          topbar_border: 'rgba(106, 13, 173, 0.1)',
          topbar_title_color: '#212529',
          stat_card_bg: '#ffffff',
          stat_card_border: 'rgba(106, 13, 173, 0.1)',
          table_header_bg: '#f8f9fa',
          table_row_hover: 'rgba(106, 13, 173, 0.02)',
          table_border: 'rgba(106, 13, 173, 0.05)',
          action_btn_edit_color: '#17a2b8',
          action_btn_delete_color: '#dc3545',
          toggle_active_bg: '#28a745',
          toggle_inactive_bg: '#dc3545',
          settings_tab_active: '#8a2be2'
        }
      },
      layout_config: {
        containerMaxWidth: '1200px',
        sectionPaddingY: '60px',
        sectionPaddingX: '24px',
        gridGap: '30px',
        cardRadius: '16px',
        btnRadius: '30px',
        inputRadius: '8px',
        borderWidth: '1px',
        shadowStrength: '0.1',
        glassOpacity: '0.85',
        glassBlur: '16px',
        animationSpeed: '1.0'
      },
      animation_config: {
        speed_mode: 'elevated',
        card_hover_style: 'lift'
      },
      heroBanners: [],
      promotionalBanners: [],
      featuredProductIds: [],
      bestSellerProductIds: [],
      newArrivalProductIds: [],
      trendingProductIds: [],
      recommendedProductIds: [],
      categoryHighlights: [],
        testimonials: [],
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

    // Legacy sync disabled: avoid writing legacy flat settings into V4 structures
    // await syncSettingsToV4(setting.value);

    res.status(200).json({ success: true, message: 'Settings reset successfully', setting: setting.value });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
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
