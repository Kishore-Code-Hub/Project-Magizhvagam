const prisma = require('../services/prisma');

// Helper to synchronize flat homepage settings to SiteSettings document
async function syncSettingsToV4(homepageSettings) {
  try {
    let siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 'active' }
    });

    const v = homepageSettings;
    if (v) {
      const theme = siteSettings ? (typeof siteSettings.theme === 'string' ? JSON.parse(siteSettings.theme) : siteSettings.theme) : {};
      const typography = siteSettings ? (typeof siteSettings.typography === 'string' ? JSON.parse(siteSettings.typography) : siteSettings.typography) : {};
      const layout = siteSettings ? (typeof siteSettings.layout === 'string' ? JSON.parse(siteSettings.layout) : siteSettings.layout) : {};
      const meta = siteSettings ? (typeof siteSettings.meta === 'string' ? JSON.parse(siteSettings.meta) : siteSettings.meta) : {};

      // Sync meta information
      meta.storeName = v.brandName || meta.storeName;
      meta.contactAddress = v.contactDetails || meta.contactAddress;
      if (v.whatsappContact) {
        meta.socialLinks = meta.socialLinks || {};
        meta.socialLinks.whatsapp = v.whatsappContact;
      }

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
        typography.body = typography.body || {};
        typography.body.family = v.fontFamily;
        typography.heading = typography.heading || {};
        typography.heading.family = v.fontFamily;
      }

      // Button Style
      if (v.buttonStyle) {
        layout.btnRadius = v.buttonStyle === 'sharp' ? 0 : (v.buttonStyle === 'pill' ? 30 : 10);
        theme.btn.primary_radius = String(layout.btnRadius);
      }

      const updateData = {
        theme,
        typography,
        layout,
        meta,
        version: (siteSettings ? siteSettings.version : 0) + 1,
        updatedAt: new Date()
      };

      await prisma.siteSettings.upsert({
        where: { id: 'active' },
        update: updateData,
        create: { id: 'active', ...updateData }
      });
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
  recommendationsEnabled: true,
  promosEnabled: true,
  announcementBannerEnabled: true,
  themeAccentColor: '#6A0DAD',
  homepageLayoutFeatured: true,
  flashSaleActive: false,
  flashSaleText: "Mega Flash Sale! Get 20% off all return gifts!",
  flashSaleTargetDate: null,
  customerLoginRequirement: true
};

// @desc    Get feature toggles (cached helper for internal use)
// @access  Internal
const getFeatureToggleValues = async () => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'featureToggles' }
    });
    if (setting && setting.value) {
      return { ...DEFAULT_FEATURE_TOGGLES, ...(typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value) };
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
    const settingObj = await prisma.setting.findUnique({
      where: { key: 'allowSignup' }
    });
    toggles.allowSignup = settingObj ? settingObj.value === true : true;
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

    const sanitized = {};
    if (toggles.wishlistEnabled !== undefined) sanitized.wishlistEnabled = !!toggles.wishlistEnabled;
    if (toggles.couponsEnabled !== undefined) sanitized.couponsEnabled = !!toggles.couponsEnabled;
    if (toggles.registrationEnabled !== undefined) sanitized.registrationEnabled = !!toggles.registrationEnabled;
    if (toggles.whatsappCheckoutEnabled !== undefined) sanitized.whatsappCheckoutEnabled = !!toggles.whatsappCheckoutEnabled;
    if (toggles.codEnabled !== undefined) sanitized.codEnabled = !!toggles.codEnabled;
    if (toggles.recommendationsEnabled !== undefined) sanitized.recommendationsEnabled = !!toggles.recommendationsEnabled;
    if (toggles.promosEnabled !== undefined) sanitized.promosEnabled = !!toggles.promosEnabled;
    if (toggles.announcementBannerEnabled !== undefined) sanitized.announcementBannerEnabled = !!toggles.announcementBannerEnabled;
    if (toggles.themeAccentColor !== undefined) sanitized.themeAccentColor = String(toggles.themeAccentColor || '#6A0DAD').trim();
    if (toggles.homepageLayoutFeatured !== undefined) sanitized.homepageLayoutFeatured = !!toggles.homepageLayoutFeatured;
    if (toggles.customerLoginRequirement !== undefined) sanitized.customerLoginRequirement = !!toggles.customerLoginRequirement;
    if (toggles.flashSaleActive !== undefined) sanitized.flashSaleActive = !!toggles.flashSaleActive;
    if (toggles.flashSaleText !== undefined) sanitized.flashSaleText = String(toggles.flashSaleText || '').trim();
    if (toggles.flashSaleTargetDate !== undefined) sanitized.flashSaleTargetDate = toggles.flashSaleTargetDate ? new Date(toggles.flashSaleTargetDate) : null;

    const existing = await prisma.setting.findUnique({ where: { key: 'featureToggles' } });
    const currentValue = existing ? (typeof existing.value === 'string' ? JSON.parse(existing.value) : existing.value) : {};

    const updated = await prisma.setting.upsert({
      where: { key: 'featureToggles' },
      update: { value: { ...DEFAULT_FEATURE_TOGGLES, ...currentValue, ...sanitized } },
      create: { key: 'featureToggles', value: { ...DEFAULT_FEATURE_TOGGLES, ...sanitized } }
    });

    res.status(200).json({ success: true, message: 'Feature toggles updated successfully!', toggles: updated.value });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error updating feature toggles: ${error.message}` });
  }
};

// @desc    Get store setting by key (e.g., "homepage")
// @route   GET /api/settings/:key
// @access  Public
exports.getSetting = async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: req.params.key }
    });
    if (!setting) {
      return res.status(404).json({ success: false, error: 'Setting not found' });
    }

    let val = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
    if (req.params.key === 'homepage' && process.env.WHATSAPP_PHONE) {
      let phone = process.env.WHATSAPP_PHONE.trim();
      if (phone.length === 10 && /^\d+$/.test(phone)) {
        phone = '91' + phone;
      }
      val = JSON.parse(JSON.stringify(val));
      val.whatsappContact = phone;
    }

    res.status(200).json({ success: true, setting: val });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error fetching setting: ${error.message}` });
  }
};

// @desc    Update setting by key
// @route   PUT /api/settings/:key
// @access  Private (Admin Only)
exports.updateSetting = async (req, res) => {
  try {
    const { value } = req.body;
    if (!value) {
      return res.status(400).json({ success: false, error: 'Please provide setting value' });
    }

    const updated = await prisma.setting.upsert({
      where: { key: req.params.key },
      update: { value },
      create: { key: req.params.key, value }
    });

    res.status(200).json({ success: true, message: 'Settings updated successfully!', setting: updated.value });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error updating settings: ${error.message}` });
  }
};

// @desc    Get all coupons (Admin Only)
// @route   GET /api/settings/coupons
// @access  Private (Admin Only)
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({});
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

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: Number(minOrderValue) || 0,
        expiresAt: new Date(expiresAt),
        active: active !== undefined ? active : true
      }
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
    await prisma.coupon.delete({
      where: { id: req.params.id }
    });
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
      primaryColor: '#C9972E',
      secondaryColor: '#D4A03A',
      accentColor: '#C9972E',
      fontFamily: 'Outfit',
      buttonStyle: 'rounded',
      footerContent: 'Making Every Celebration Memorable. Premium Return Gifts and Customized Gifts for weddings, baby showers, birthdays, and corporate events.',
      contactDetails: 'Chennai, Tamil Nadu',
      paletteBgMain: '#F7F4EE',
      paletteBgSurface: '#FFFFFF',
      paletteTextMain: '#111111',
      paletteTextMuted: '#C9972E',
      paletteColorPrimary: '#C9972E',
      paletteColorSecondary: '#FFFFFF',
      paletteColorSuccess: '#2ECC71',
      paletteColorError: '#E74C3C',
      theme_tokens: {
        hdr: {
          bg: 'rgba(247, 244, 238, 0.85)',
          border: 'rgba(201, 151, 46, 0.1)',
          logo_text: 'linear-gradient(135deg, #C9972E 0%, #D4A03A 100%)',
          logo_size: '30px',
          nav_link_color: '#111111',
          nav_link_hover: '#C9972E',
          nav_link_active: '#C9972E',
          nav_link_weight: '600',
          icon_color: '#111111',
          icon_hover: '#C9972E',
          sticky_bg: 'rgba(247, 244, 238, 0.95)',
          sticky_shadow: '0 4px 24px rgba(201, 151, 46, 0.08)',
          sticky_height: '80px',
          height: '130px',
          announcement_bg: '#C9972E',
          announcement_text: '#ffffff'
        },
        nav: {
          dropdown_bg: '#FFFFFF',
          dropdown_border: 'rgba(201, 151, 46, 0.1)',
          dropdown_shadow: '0 10px 15px -3px rgba(201, 151, 46, 0.08)',
          dropdown_item_color: '#111111',
          dropdown_item_hover_bg: 'rgba(201, 151, 46, 0.05)',
          dropdown_item_hover_color: '#C9972E',
          mega_bg: '#FFFFFF',
          mega_accent: '#D4A03A',
          mega_heading: '#111111',
          mega_link: '#444444',
          mega_promo_bg: '#F7F4EE',
          mobile_bg: '#FFFFFF',
          mobile_item: '#111111'
        },
        hero: {
          bg_overlay: 'rgba(0, 0, 0, 0.25)',
          overlay_opacity: '0.25',
          headline_color: '#F5F0E8',
          subheadline_color: '#F5F0E8',
          cta_primary_bg: '#C9972E',
          cta_primary_text: '#FFFFFF',
          cta_primary_hover_bg: '#D4A03A',
          cta_secondary_bg: 'transparent',
          cta_secondary_text: '#C9972E',
          cta_secondary_border: '#C9972E',
          cta_secondary_hover_bg: 'rgba(201, 151, 46, 0.1)'
        },
        pc: {
          bg: '#FFFFFF',
          border: 'rgba(201, 151, 46, 0.08)',
          radius: '16px',
          shadow: '0 4px 6px -1px rgba(201, 151, 46, 0.05)',
          hover_shadow: '0 10px 20px rgba(201, 151, 46, 0.12)',
          image_bg: '#F7F4EE',
          name_color: '#111111',
          category_color: '#444444',
          current_price_color: '#C9972E',
          original_price_color: '#444444',
          btn_bg: '#C9972E',
          btn_text: '#FFFFFF',
          btn_hover_bg: '#D4A03A',
          rating_color: '#C9972E',
          wishlist_color: '#C9972E'
        },
        pdp: {
          title_color: '#111111',
          price_color: '#C9972E',
          compare_price_color: '#444444',
          tab_active_color: '#C9972E',
          tab_active_border: '#C9972E',
          tab_inactive_color: '#444444',
          specs_heading_color: '#111111',
          specs_value_color: '#444444',
          customization_panel_bg: '#FFFFFF',
          '3d_viewer_bg': '#F7F4EE',
          '3d_viewer_controls_color': '#C9972E'
        },
        btn: {
          primary_bg: '#C9972E',
          primary_text: '#FFFFFF',
          primary_hover_bg: '#D4A03A',
          primary_radius: '30',
          secondary_bg: 'transparent',
          secondary_text: '#C9972E',
          secondary_border: '#C9972E',
          secondary_hover_bg: 'rgba(201, 151, 46, 0.1)',
          ghost_text: '#C9972E',
          ghost_hover_bg: 'rgba(201, 151, 46, 0.05)'
        },
        cart: {
          page_bg: '#F7F4EE',
          item_card_bg: '#FFFFFF',
          item_card_border: 'rgba(201, 151, 46, 0.08)',
          item_name_color: '#111111',
          item_price_color: '#C9972E',
          quantity_btn_bg: '#F7F4EE',
          quantity_btn_border: 'rgba(201, 151, 46, 0.1)',
          total_label_color: '#444444',
          total_value_color: '#111111',
          summary_card_bg: '#FFFFFF',
          coupon_btn_bg: '#C9972E',
          checkout_btn_bg: '#C9972E',
          checkout_btn_hover_bg: '#D4A03A'
        },
        co: {
          page_bg: '#F7F4EE',
          step_indicator_active: '#C9972E',
          step_indicator_inactive: '#444444',
          address_card_bg: '#FFFFFF',
          address_card_border: 'rgba(201, 151, 46, 0.1)',
          address_card_selected_border: '#C9972E',
          form_label_color: '#444444',
          form_input_bg: '#FFFFFF',
          form_input_border: 'rgba(201, 151, 46, 0.1)',
          form_input_focus_border: '#C9972E',
          payment_option_bg: '#FFFFFF',
          payment_option_border: 'rgba(201, 151, 46, 0.1)',
          order_summary_bg: '#FFFFFF',
          place_order_btn_bg: '#C9972E'
        },
        ft: {
          bg: '#F7F4EE',
          border: 'rgba(201, 151, 46, 0.1)',
          heading_color: '#111111',
          text_color: '#444444',
          link_color: '#444444',
          link_hover_color: '#C9972E',
          newsletter_input_bg: '#FFFFFF',
          newsletter_btn_bg: '#C9972E',
          copyright_color: '#444444'
        },
        frm: {
          input_bg: '#FFFFFF',
          input_border: 'rgba(201, 151, 46, 0.1)',
          input_focus_border: '#C9972E',
          input_radius: '8px',
          input_placeholder_color: '#6c757d',
          input_text_color: '#111111',
          label_color: '#444444',
          helper_text_color: '#6c757d'
        },
        mod: {
          modal_bg: '#FFFFFF',
          modal_border: 'rgba(201, 151, 46, 0.1)',
          modal_radius: '16px',
          modal_shadow: '0 20px 25px -5px rgba(201, 151, 46, 0.1)',
          modal_title_color: '#111111',
          drawer_bg: '#FFFFFF',
          drawer_border: 'rgba(201, 151, 46, 0.1)',
          toast_info_bg: '#C9972E',
          toast_info_text: '#ffffff',
          toast_success_bg: '#2ECC71',
          toast_success_text: '#ffffff',
          toast_error_bg: '#E74C3C',
          toast_error_text: '#ffffff'
        },
        bdg: {
          new_bg: 'rgba(201, 151, 46, 0.1)',
          new_text: '#C9972E',
          sale_bg: 'rgba(231, 76, 60, 0.1)',
          sale_text: '#E74C3C',
          trending_bg: 'rgba(46, 204, 113, 0.1)',
          trending_text: '#2ECC71',
          featured_bg: 'rgba(201, 151, 46, 0.1)',
          featured_text: '#C9972E'
        },
        cd: {
          container_bg: '#F7F4EE',
          container_border: 'rgba(201, 151, 46, 0.1)',
          container_radius: '12px',
          digit_bg: '#FFFFFF',
          digit_text: '#111111',
          digit_radius: '8px',
          separator_color: '#C9972E',
          label_color: '#444444',
          flash_sale_accent: '#C9972E'
        },
        acc: {
          page_bg: '#F7F4EE',
          tab_active_color: '#C9972E',
          tab_active_border: '#C9972E',
          tab_inactive_color: '#444444',
          tab_inactive_bg: 'transparent',
          order_card_bg: '#FFFFFF',
          order_card_border: 'rgba(201, 151, 46, 0.1)',
          order_card_radius: '12px',
          address_card_bg: '#FFFFFF',
          address_card_border: 'rgba(201, 151, 46, 0.1)',
          address_card_selected_border: '#C9972E',
          status_pending: '#F39C12',
          status_processing: '#3498DB',
          status_shipped: '#9B59B6',
          status_delivered: '#2ECC71',
          status_cancelled: '#E74C3C'
        },
        st: {
          skeleton_base_color: '#FFFFFF',
          skeleton_highlight_color: '#F7F4EE',
          empty_icon_color: '#C9972E',
          empty_heading_color: '#111111',
          empty_text_color: '#444444',
          empty_cta_bg: '#C9972E',
          empty_cta_text: '#FFFFFF',
          loading_spinner_color: '#C9972E',
          error_icon_color: '#E74C3C',
          error_heading_color: '#111111',
          error_text_color: '#444444',
          success_icon_color: '#2ECC71',
          success_heading_color: '#111111',
          success_text_color: '#444444'
        },
        adm: {
          sidebar_bg: '#1e1e1e',
          sidebar_border: '#2e2e2e',
          sidebar_link_color: '#888888',
          sidebar_link_hover_bg: '#2d2d2d',
          sidebar_link_hover_text: '#ffffff',
          sidebar_link_active_bg: '#2d2d2d',
          sidebar_link_active_text: '#C9972E',
          topbar_bg: '#FFFFFF',
          topbar_border: 'rgba(201, 151, 46, 0.1)',
          topbar_title_color: '#111111',
          stat_card_bg: '#FFFFFF',
          stat_card_border: 'rgba(201, 151, 46, 0.1)',
          toggle_bg: '#e0e0e0',
          toggle_active_bg: '#C9972E',
          settings_tab_active: '#C9972E'
        }
      }
    };

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: defaultValue },
      create: { key, value: defaultValue }
    });

    try {
      await prisma.siteSettings.update({
        where: { id: 'active' },
        data: {
          theme: defaultValue.theme_tokens,
          version: { increment: 1 },
          updatedAt: new Date(),
          updatedBy: req.user ? req.user.id : null
        }
      });
    } catch (v4Err) {
      console.warn('[resetSetting] Site settings reset failed:', v4Err.message);
    }

    res.status(200).json({ success: true, message: 'Settings reset to Luxury Ivory Light defaults', setting: setting.value });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.uploadSettingsImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an image file' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ success: false, error: 'Only image files are allowed' });
    }

    const sharp = require('sharp');
    const fs = require('fs');
    const path = require('path');
    const { isCloudinaryConfigured, uploadToCloudinary } = require('../services/cloudinary');

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

// @desc    Subscribe to Newsletter
// @route   POST /api/settings/subscribe
// @access  Public
exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    const setting = await prisma.setting.findUnique({
      where: { key: 'subscribers' }
    });
    let subscribers = setting ? (Array.isArray(setting.value) ? setting.value : []) : [];
    if (!subscribers.includes(email)) {
      subscribers.push(email);
      await prisma.setting.upsert({
        where: { key: 'subscribers' },
        update: { value: subscribers },
        create: { key: 'subscribers', value: subscribers }
      });
    }
    res.status(200).json({ success: true, message: 'Subscribed successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, error: `Subscription error: ${error.message}` });
  }
};
