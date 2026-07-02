/**
 * MAGIZHVAGAM V4 — Theme Loader
 * 
 * Loads in <head> as non-deferred. Runs BEFORE DOMContentLoaded.
 * Injects all CSS custom properties from the database into <style id="mz-theme-vars">.
 * Falls back to theme.defaults.css values if API is unavailable.
 * 
 * LOAD ORDER: theme-loader.js → DOMContentLoaded → app.js
 */

(function () {
  'use strict';

  // Theme is controlled exclusively by Appearance Studio presets via API
  // Attempt to set `data-theme` from cached theme to avoid paint flash of an old/default theme
  try {
    const cachedTheme = localStorage.getItem('mz-theme-cache');
    if (cachedTheme) {
      const parsed = JSON.parse(cachedTheme);
      const name = parsed && parsed.data && parsed.data.theme && parsed.data.theme.name;
      if (name && typeof name === 'string') {
        document.documentElement.setAttribute('data-theme', name);
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } else {
      // Default to light theme to avoid temporary dark flash
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  // ─── Settings-to-CSS Map (Single Source of Truth) ─────────────────────────
  // Maps MongoDB field paths → CSS variable names
  const SETTINGS_TO_CSS_MAP = {
    // GROUP 01 — HEADER
    'theme.hdr.bg': '--hdr-bg',
    'theme.hdr.border': '--hdr-border',
    'theme.hdr.logo_text': '--hdr-logo-text',
    'theme.hdr.logo_size': '--hdr-logo-size',
    'theme.hdr.nav_link_color': '--hdr-nav-link-color',
    'theme.hdr.nav_link_hover': '--hdr-nav-link-hover',
    'theme.hdr.nav_link_active': '--hdr-nav-link-active',
    'theme.hdr.nav_link_weight': '--hdr-nav-link-weight',
    'theme.hdr.icon_color': '--hdr-icon-color',
    'theme.hdr.icon_hover': '--hdr-icon-hover',
    'theme.hdr.sticky_bg': '--hdr-sticky-bg',
    'theme.hdr.sticky_shadow': '--hdr-sticky-shadow',
    'theme.hdr.sticky_height': '--hdr-sticky-height',
    'theme.hdr.height': '--hdr-height',
    'theme.hdr.announcement_bg': '--hdr-announcement-bg',
    'theme.hdr.announcement_text': '--hdr-announcement-text',
    'theme.hdr.mobile_height': '--hdr-mobile-height',
    'typography.scaleMultiplier': '--layout-font-scale',

    // GROUP 02 — NAVIGATION & MEGA MENU
    'theme.nav.dropdown_bg': '--nav-dropdown-bg',
    'theme.nav.dropdown_border': '--nav-dropdown-border',
    'theme.nav.dropdown_shadow': '--nav-dropdown-shadow',
    'theme.nav.dropdown_item_color': '--nav-dropdown-item-color',
    'theme.nav.dropdown_item_hover_bg': '--nav-dropdown-item-hover-bg',
    'theme.nav.dropdown_item_hover_color': '--nav-dropdown-item-hover-color',
    'theme.nav.mega_bg': '--nav-mega-bg',
    'theme.nav.mega_accent': '--nav-mega-accent',
    'theme.nav.mega_heading': '--nav-mega-heading',
    'theme.nav.mega_link': '--nav-mega-link',
    'theme.nav.mega_promo_bg': '--nav-mega-promo-bg',
    'theme.nav.mobile_bg': '--nav-mobile-bg',
    'theme.nav.mobile_item': '--nav-mobile-item',

    // GROUP 03 — HERO
    'theme.hero.bg_overlay': '--hero-bg-overlay',
    'theme.hero.overlay_opacity': '--hero-overlay-opacity',
    'theme.hero.headline_color': '--hero-headline-color',
    'theme.hero.subheadline_color': '--hero-subheadline-color',
    'theme.hero.cta_primary_bg': '--hero-cta-primary-bg',
    'theme.hero.cta_primary_text': '--hero-cta-primary-text',
    'theme.hero.cta_primary_hover_bg': '--hero-cta-primary-hover-bg',
    'theme.hero.cta_secondary_border': '--hero-cta-secondary-border',
    'theme.hero.cta_secondary_text': '--hero-cta-secondary-text',
    'theme.hero.badge_bg': '--hero-badge-bg',
    'theme.hero.badge_text': '--hero-badge-text',

    // GROUP 04 — PRODUCT CARDS
    'theme.pc.bg': '--pc-bg',
    'theme.pc.border': '--pc-border',
    'theme.pc.border_radius': '--pc-border-radius',
    'theme.pc.shadow': '--pc-shadow',
    'theme.pc.hover_shadow': '--pc-hover-shadow',
    'theme.pc.hover_translate_y': '--pc-hover-translate-y',
    'theme.pc.image_bg': '--pc-image-bg',
    'theme.pc.image_radius': '--pc-image-radius',
    'theme.pc.name_color': '--pc-name-color',
    'theme.pc.name_weight': '--pc-name-weight',
    'theme.pc.category_color': '--pc-category-color',
    'theme.pc.current_price_color': '--pc-current-price-color',
    'theme.pc.original_price_color': '--pc-original-price-color',
    'theme.pc.discount_badge_bg': '--pc-discount-badge-bg',
    'theme.pc.discount_badge_text': '--pc-discount-badge-text',
    'theme.pc.flash_badge_bg': '--pc-flash-badge-bg',
    'theme.pc.flash_badge_text': '--pc-flash-badge-text',
    'theme.pc.rating_color': '--pc-rating-color',
    'theme.pc.rating_empty_color': '--pc-rating-empty-color',
    'theme.pc.btn_bg': '--pc-btn-bg',
    'theme.pc.btn_text': '--pc-btn-text',
    'theme.pc.btn_hover_bg': '--pc-btn-hover-bg',
    'theme.pc.wishlist_icon_color': '--pc-wishlist-icon-color',
    'theme.pc.wishlist_icon_active': '--pc-wishlist-icon-active',
    'theme.pc.stock_in_color': '--pc-stock-in-color',
    'theme.pc.stock_out_color': '--pc-stock-out-color',
    'theme.pc.stock_low_color': '--pc-stock-low-color',

    // GROUP 05 — PDP
    'theme.pdp.gallery_border': '--pdp-gallery-border',
    'theme.pdp.gallery_active_border': '--pdp-gallery-active-border',
    'theme.pdp.gallery_thumb_radius': '--pdp-gallery-thumb-radius',
    'theme.pdp.title_color': '--pdp-title-color',
    'theme.pdp.title_size': '--pdp-title-size',
    'theme.pdp.price_color': '--pdp-price-color',
    'theme.pdp.compare_price_color': '--pdp-compare-price-color',
    'theme.pdp.specs_heading_color': '--pdp-specs-heading-color',
    'theme.pdp.specs_value_color': '--pdp-specs-value-color',
    'theme.pdp.tab_active_color': '--pdp-tab-active-color',
    'theme.pdp.tab_active_border': '--pdp-tab-active-border',
    'theme.pdp.tab_inactive_color': '--pdp-tab-inactive-color',
    'theme.pdp.review_star_color': '--pdp-review-star-color',
    'theme.pdp.customization_panel_bg': '--pdp-customization-panel-bg',
    'theme.pdp.customization_panel_border': '--pdp-customization-panel-border',
    'theme.pdp.3d_viewer_bg': '--pdp-3d-viewer-bg',
    'theme.pdp.3d_viewer_controls_color': '--pdp-3d-viewer-controls-color',

    // GROUP 06 — BUTTONS
    'theme.btn.primary_bg': '--btn-primary-bg',
    'theme.btn.primary_text': '--btn-primary-text',
    'theme.btn.primary_hover_bg': '--btn-primary-hover-bg',
    'theme.btn.primary_radius': '--btn-primary-radius',
    'theme.btn.primary_shadow': '--btn-primary-shadow',
    'theme.btn.secondary_bg': '--btn-secondary-bg',
    'theme.btn.secondary_text': '--btn-secondary-text',
    'theme.btn.secondary_border': '--btn-secondary-border',
    'theme.btn.secondary_hover_bg': '--btn-secondary-hover-bg',
    'theme.btn.ghost_bg': '--btn-ghost-bg',
    'theme.btn.ghost_border': '--btn-ghost-border',
    'theme.btn.ghost_text': '--btn-ghost-text',
    'theme.btn.danger_bg': '--btn-danger-bg',
    'theme.btn.danger_text': '--btn-danger-text',
    'theme.btn.disabled_bg': '--btn-disabled-bg',
    'theme.btn.disabled_text': '--btn-disabled-text',
    'theme.btn.font_weight': '--btn-font-weight',
    'theme.btn.letter_spacing': '--btn-letter-spacing',
    'theme.btn.transition': '--btn-transition',

    // GROUP 07 — CART
    'theme.cart.page_bg': '--cart-page-bg',
    'theme.cart.item_card_bg': '--cart-item-card-bg',
    'theme.cart.item_card_border': '--cart-item-card-border',
    'theme.cart.item_name_color': '--cart-item-name-color',
    'theme.cart.item_price_color': '--cart-item-price-color',
    'theme.cart.quantity_btn_bg': '--cart-quantity-btn-bg',
    'theme.cart.quantity_btn_border': '--cart-quantity-btn-border',
    'theme.cart.quantity_input_bg': '--cart-quantity-input-bg',
    'theme.cart.coupon_input_bg': '--cart-coupon-input-bg',
    'theme.cart.coupon_input_border': '--cart-coupon-input-border',
    'theme.cart.coupon_btn_bg': '--cart-coupon-btn-bg',
    'theme.cart.coupon_success_color': '--cart-coupon-success-color',
    'theme.cart.coupon_error_color': '--cart-coupon-error-color',
    'theme.cart.warning_banner_bg': '--cart-warning-banner-bg',
    'theme.cart.warning_banner_text': '--cart-warning-banner-text',
    'theme.cart.warning_banner_border': '--cart-warning-banner-border',
    'theme.cart.summary_card_bg': '--cart-summary-card-bg',
    'theme.cart.summary_card_border': '--cart-summary-card-border',
    'theme.cart.total_label_color': '--cart-total-label-color',
    'theme.cart.total_value_color': '--cart-total-value-color',
    'theme.cart.whatsapp_btn_bg': '--cart-whatsapp-btn-bg',
    'theme.cart.whatsapp_btn_text': '--cart-whatsapp-btn-text',
    'theme.cart.whatsapp_btn_hover_bg': '--cart-whatsapp-btn-hover-bg',
    'theme.cart.checkout_btn_bg': '--cart-checkout-btn-bg',
    'theme.cart.checkout_btn_text': '--cart-checkout-btn-text',

    // GROUP 08 — CHECKOUT
    'theme.co.page_bg': '--co-page-bg',
    'theme.co.step_indicator_active': '--co-step-indicator-active',
    'theme.co.step_indicator_complete': '--co-step-indicator-complete',
    'theme.co.step_indicator_pending': '--co-step-indicator-pending',
    'theme.co.step_line_color': '--co-step-line-color',
    'theme.co.address_card_bg': '--co-address-card-bg',
    'theme.co.address_card_border': '--co-address-card-border',
    'theme.co.address_card_selected_border': '--co-address-card-selected-border',
    'theme.co.address_card_selected_shadow': '--co-address-card-selected-shadow',
    'theme.co.form_label_color': '--co-form-label-color',
    'theme.co.form_input_bg': '--co-form-input-bg',
    'theme.co.form_input_border': '--co-form-input-border',
    'theme.co.form_input_focus_border': '--co-form-input-focus-border',
    'theme.co.form_input_error_border': '--co-form-input-error-border',
    'theme.co.payment_option_bg': '--co-payment-option-bg',
    'theme.co.payment_option_border': '--co-payment-option-border',
    'theme.co.payment_active_bg': '--co-payment-active-bg',
    'theme.co.order_summary_bg': '--co-order-summary-bg',
    'theme.co.place_order_btn_bg': '--co-place-order-btn-bg',
    'theme.co.place_order_btn_text': '--co-place-order-btn-text',

    // GROUP 09 — FOOTER
    'theme.ft.bg': '--ft-bg',
    'theme.ft.border_top': '--ft-border-top',
    'theme.ft.logo_text': '--ft-logo-text',
    'theme.ft.heading_color': '--ft-heading-color',
    'theme.ft.link_color': '--ft-link-color',
    'theme.ft.link_hover_color': '--ft-link-hover-color',
    'theme.ft.divider_color': '--ft-divider-color',
    'theme.ft.copyright_bg': '--ft-copyright-bg',
    'theme.ft.copyright_text': '--ft-copyright-text',
    'theme.ft.newsletter_input_bg': '--ft-newsletter-input-bg',
    'theme.ft.newsletter_input_border': '--ft-newsletter-input-border',
    'theme.ft.newsletter_btn_bg': '--ft-newsletter-btn-bg',
    'theme.ft.newsletter_btn_text': '--ft-newsletter-btn-text',
    'theme.ft.social_icon_color': '--ft-social-icon-color',
    'theme.ft.social_icon_hover_color': '--ft-social-icon-hover-color',
    'theme.ft.social_icon_bg': '--ft-social-icon-bg',
    'theme.ft.social_icon_hover_bg': '--ft-social-icon-hover-bg',

    // GROUP 10 — FORMS
    'theme.frm.input_bg': '--frm-input-bg',
    'theme.frm.input_border': '--frm-input-border',
    'theme.frm.input_border_radius': '--frm-input-border-radius',
    'theme.frm.input_focus_border': '--frm-input-focus-border',
    'theme.frm.input_focus_shadow': '--frm-input-focus-shadow',
    'theme.frm.input_placeholder_color': '--frm-input-placeholder-color',
    'theme.frm.input_text_color': '--frm-input-text-color',
    'theme.frm.input_error_border': '--frm-input-error-border',
    'theme.frm.input_error_text': '--frm-input-error-text',
    'theme.frm.input_success_border': '--frm-input-success-border',
    'theme.frm.input_success_text': '--frm-input-success-text',
    'theme.frm.label_color': '--frm-label-color',
    'theme.frm.label_weight': '--frm-label-weight',
    'theme.frm.helper_text_color': '--frm-helper-text-color',
    'theme.frm.strength_weak': '--frm-strength-weak',
    'theme.frm.strength_fair': '--frm-strength-fair',
    'theme.frm.strength_strong': '--frm-strength-strong',
    'theme.frm.strength_perfect': '--frm-strength-perfect',

    // GROUP 11 — MODALS
    'theme.mod.backdrop_color': '--mod-backdrop-color',
    'theme.mod.backdrop_blur': '--mod-backdrop-blur',
    'theme.mod.modal_bg': '--mod-modal-bg',
    'theme.mod.modal_border': '--mod-modal-border',
    'theme.mod.modal_radius': '--mod-modal-radius',
    'theme.mod.modal_shadow': '--mod-modal-shadow',
    'theme.mod.modal_header_bg': '--mod-modal-header-bg',
    'theme.mod.modal_header_border': '--mod-modal-header-border',
    'theme.mod.modal_title_color': '--mod-modal-title-color',
    'theme.mod.modal_close_color': '--mod-modal-close-color',
    'theme.mod.modal_close_hover_color': '--mod-modal-close-hover-color',
    'theme.mod.drawer_bg': '--mod-drawer-bg',
    'theme.mod.drawer_shadow': '--mod-drawer-shadow',
    'theme.mod.toast_success_bg': '--mod-toast-success-bg',
    'theme.mod.toast_error_bg': '--mod-toast-error-bg',
    'theme.mod.toast_warning_bg': '--mod-toast-warning-bg',
    'theme.mod.toast_info_bg': '--mod-toast-info-bg',
    'theme.mod.toast_text_color': '--mod-toast-text-color',

    // GROUP 12 — BADGES
    'theme.bdg.new_bg': '--bdg-new-bg',
    'theme.bdg.new_text': '--bdg-new-text',
    'theme.bdg.sale_bg': '--bdg-sale-bg',
    'theme.bdg.sale_text': '--bdg-sale-text',
    'theme.bdg.flash_bg': '--bdg-flash-bg',
    'theme.bdg.flash_text': '--bdg-flash-text',
    'theme.bdg.trending_bg': '--bdg-trending-bg',
    'theme.bdg.trending_text': '--bdg-trending-text',
    'theme.bdg.out_of_stock_bg': '--bdg-out-of-stock-bg',
    'theme.bdg.out_of_stock_text': '--bdg-out-of-stock-text',
    'theme.bdg.limited_bg': '--bdg-limited-bg',
    'theme.bdg.limited_text': '--bdg-limited-text',
    'theme.bdg.featured_bg': '--bdg-featured-bg',
    'theme.bdg.featured_text': '--bdg-featured-text',
    'theme.bdg.radius': '--bdg-radius',
    'theme.bdg.font_weight': '--bdg-font-weight',
    'theme.bdg.padding': '--bdg-padding',

    // GROUP 13 — COUNTDOWN
    'theme.cd.container_bg': '--cd-container-bg',
    'theme.cd.container_border': '--cd-container-border',
    'theme.cd.container_radius': '--cd-container-radius',
    'theme.cd.digit_bg': '--cd-digit-bg',
    'theme.cd.digit_text': '--cd-digit-text',
    'theme.cd.digit_border': '--cd-digit-border',
    'theme.cd.digit_radius': '--cd-digit-radius',
    'theme.cd.separator_color': '--cd-separator-color',
    'theme.cd.label_color': '--cd-label-color',
    'theme.cd.expired_bg': '--cd-expired-bg',
    'theme.cd.expired_text': '--cd-expired-text',
    'theme.cd.flash_sale_accent': '--cd-flash-sale-accent',

    // GROUP 14 — ACCOUNT
    'theme.acc.page_bg': '--acc-page-bg',
    'theme.acc.tab_active_color': '--acc-tab-active-color',
    'theme.acc.tab_active_border': '--acc-tab-active-border',
    'theme.acc.tab_inactive_color': '--acc-tab-inactive-color',
    'theme.acc.order_card_bg': '--acc-order-card-bg',
    'theme.acc.order_card_border': '--acc-order-card-border',
    'theme.acc.status_pending': '--acc-order-status-pending',
    'theme.acc.status_confirmed': '--acc-order-status-confirmed',
    'theme.acc.status_shipped': '--acc-order-status-shipped',
    'theme.acc.status_delivered': '--acc-order-status-delivered',
    'theme.acc.status_cancelled': '--acc-order-status-cancelled',
    'theme.acc.address_card_bg': '--acc-address-card-bg',
    'theme.acc.address_card_border': '--acc-address-card-border',
    'theme.acc.address_cap_warning_bg': '--acc-address-cap-warning-bg',
    'theme.acc.address_cap_warning_text': '--acc-address-cap-warning-text',

    // GROUP 15 — STATES
    'theme.st.empty_icon_color': '--st-empty-icon-color',
    'theme.st.empty_heading_color': '--st-empty-heading-color',
    'theme.st.empty_text_color': '--st-empty-text-color',
    'theme.st.empty_cta_bg': '--st-empty-cta-bg',
    'theme.st.error_icon_color': '--st-error-icon-color',
    'theme.st.error_heading_color': '--st-error-heading-color',
    'theme.st.error_text_color': '--st-error-text-color',
    'theme.st.success_icon_color': '--st-success-icon-color',
    'theme.st.success_heading_color': '--st-success-heading-color',
    'theme.st.success_text_color': '--st-success-text-color',
    'theme.st.loading_spinner_color': '--st-loading-spinner-color',
    'theme.st.skeleton_base_color': '--st-skeleton-base-color',
    'theme.st.skeleton_shimmer_color': '--st-skeleton-shimmer-color',

    // GROUP 16 — ADMIN
    'theme.adm.sidebar_bg': '--adm-sidebar-bg',
    'theme.adm.sidebar_border': '--adm-sidebar-border',
    'theme.adm.sidebar_link_color': '--adm-sidebar-link-color',
    'theme.adm.sidebar_link_hover_bg': '--adm-sidebar-link-hover-bg',
    'theme.adm.sidebar_link_active_bg': '--adm-sidebar-link-active-bg',
    'theme.adm.sidebar_link_active_text': '--adm-sidebar-link-active-text',
    'theme.adm.topbar_bg': '--adm-topbar-bg',
    'theme.adm.topbar_border': '--adm-topbar-border',
    'theme.adm.topbar_title_color': '--adm-topbar-title-color',
    'theme.adm.stat_card_bg': '--adm-stat-card-bg',
    'theme.adm.stat_card_border': '--adm-stat-card-border',
    'theme.adm.table_header_bg': '--adm-table-header-bg',
    'theme.adm.table_row_hover': '--adm-table-row-hover',
    'theme.adm.table_border': '--adm-table-border',
    'theme.adm.action_btn_edit_color': '--adm-action-btn-edit-color',
    'theme.adm.action_btn_delete_color': '--adm-action-btn-delete-color',
    'theme.adm.toggle_active_bg': '--adm-toggle-active-bg',
    'theme.adm.toggle_inactive_bg': '--adm-toggle-inactive-bg',
    'theme.adm.settings_tab_active': '--adm-settings-tab-active',

    // GROUP 17 — GLASSMORPHISM
    'theme.glass.enabled': '--glass-enabled',
    'theme.glass.blur': '--glass-blur',
    'theme.glass.bg_opacity': '--glass-bg-opacity',
    'theme.glass.border_opacity': '--glass-border-opacity',
    'theme.glass.shadow_intensity': '--glass-shadow-intensity',
    'theme.glass.border_radius': '--glass-border-radius',
    'theme.glass.brightness': '--glass-brightness',
    'theme.glass.contrast': '--glass-contrast',
    'theme.glass.hover_intensity': '--glass-hover-intensity',
    'theme.glass.header_enabled': '--glass-header-enabled',
    'theme.glass.product_card_enabled': '--glass-product-card-enabled',
    'theme.glass.modal_enabled': '--glass-modal-enabled',
    'theme.glass.sidebar_enabled': '--glass-sidebar-enabled',
    'theme.glass.footer_enabled': '--glass-footer-enabled',
    'theme.glass.form_enabled': '--glass-form-enabled',
    'theme.glass.hero_enabled': '--glass-hero-enabled'
  };

  // Layout config keys → CSS variables
  const LAYOUT_MAP = {
    'containerMaxWidth': '--layout-container-max-width',
    'sectionPaddingY': '--layout-section-padding-y',
    'sectionPaddingX': '--layout-section-padding-x',
    'gridGap': '--layout-grid-gap',
    'cardRadius': '--layout-card-radius',
    'btnRadius': '--layout-btn-radius',
    'inputRadius': '--layout-input-radius',
    'borderWidth': '--layout-border-width',
    'shadowStrength': '--layout-shadow-strength',
    'glassOpacity': '--layout-glass-opacity',
    'glassBlur': '--layout-glass-blur',
    'animationSpeed': '--layout-animation-speed',
    'mobileFontScale': '--layout-mobile-font-scale'
  };

  // Units for numeric values that need px suffix
  const PX_SUFFIX_KEYS = new Set([
    '--hdr-logo-size', '--hdr-sticky-height', '--hdr-height',
    '--pc-border-radius', '--pc-image-radius',
    '--pdp-gallery-thumb-radius', '--pdp-title-size',
    '--btn-primary-radius', '--frm-input-border-radius',
    '--mod-modal-radius', '--bdg-radius',
    '--cd-container-radius', '--cd-digit-radius',
    '--layout-container-max-width', '--layout-section-padding-y',
    '--layout-section-padding-x', '--layout-grid-gap',
    '--layout-card-radius', '--layout-btn-radius',
    '--layout-input-radius', '--layout-border-width',
    '--layout-glass-blur', '--mod-backdrop-blur',
    '--glass-blur', '--glass-border-radius',
    '--hdr-mobile-height'
  ]);

  /**
   * Resolve a dot-notation path from a nested object
   */
  function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, key) => {
      if (acc && typeof acc === 'object') return acc[key];
      return undefined;
    }, obj);
  }

  /**
   * Add px suffix to numeric values that need it
   */
  function formatValue(cssVar, value) {
    if (value === undefined || value === null || value === '') return null;
    const strVal = String(value);

    // If the value already has a unit or is a complex value, return as-is
    if (strVal.includes('px') || strVal.includes('em') || strVal.includes('%') ||
      strVal.includes('rgb') || strVal.includes('#') || strVal.includes('calc') ||
      strVal.includes('var(') || strVal.includes(' ')) {
      return strVal;
    }

    // Add px suffix for known numeric properties
    if (PX_SUFFIX_KEYS.has(cssVar) && !isNaN(strVal) && strVal !== '') {
      return strVal + 'px';
    }

    return strVal;
  }

  /**
   * Build CSS custom property declarations from settings data
   */
  function buildDeclarations(data) {
    const declarations = [];

    // Theme tokens
    if (data.theme) {
      for (const [path, cssVar] of Object.entries(SETTINGS_TO_CSS_MAP)) {
        const value = getNestedValue(data, path);
        const formatted = formatValue(cssVar, value);
        if (formatted !== null) {
          declarations.push(`  ${cssVar}: ${formatted};`);
        }
      }
    }

    // Layout tokens
    if (data.layout) {
      for (const [key, cssVar] of Object.entries(LAYOUT_MAP)) {
        const value = data.layout[key];
        const formatted = formatValue(cssVar, value);
        if (formatted !== null) {
          declarations.push(`  ${cssVar}: ${formatted};`);
        }
      }
    }

    // Semantic palette
    if (data.theme) {
      const semanticMap = {
        '--bg-main': data.theme.hdr?.bg ? null : '#0D0A14', // Derived from body bg
        '--bg-surface': data.theme.pc?.bg,
        '--text-main': data.theme.hdr?.nav_link_color || data.theme.hero?.headline_color,
        '--text-muted': data.theme.pc?.category_color,
        '--color-primary': data.theme.btn?.primary_bg,
        '--color-secondary': data.theme.btn?.primary_hover_bg,
        '--color-success': data.theme.pc?.stock_in_color,
        '--color-error': data.theme.btn?.danger_bg
      };

      for (const [cssVar, value] of Object.entries(semanticMap)) {
        if (value) declarations.push(`  ${cssVar}: ${value};`);
      }
    }

    return declarations;
  }

  /**
   * Inject Google Fonts <link> tags
   */
  function injectFonts(typography) {
    if (!typography) return;

    const existingLinks = new Set();
    document.querySelectorAll('link[data-mz-font]').forEach(el => {
      existingLinks.add(el.getAttribute('data-mz-font'));
    });

    const fontRoles = ['display', 'heading', 'body', 'price', 'button', 'badge'];
    const fontsToLoad = new Set();

    for (const role of fontRoles) {
      const config = typography[role];
      if (config && config.family && !existingLinks.has(config.family)) {
        const weights = (config.weights || [400, 500, 600, 700]).join(';');
        fontsToLoad.add({ family: config.family, weights });
      }
    }

    for (const font of fontsToLoad) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${font.family.replace(/\s+/g, '+')}:wght@${font.weights}&display=swap`;
      link.setAttribute('data-mz-font', font.family);
      document.head.appendChild(link);
    }

    // Set font CSS variables
    const fontVarMap = {
      display: '--font-display',
      heading: '--font-heading',
      body: '--font-body',
      price: '--font-price',
      button: '--font-button',
      badge: '--font-badge'
    };

    const declarations = [];
    for (const role of fontRoles) {
      const config = typography[role];
      if (config && config.family) {
        const fallback = config.fallback || 'system-ui, sans-serif';
        declarations.push(`  ${fontVarMap[role]}: '${config.family}', ${fallback};`);
      }
    }

    return declarations;
  }

  /**
   * Apply theme to the DOM
   */
  function applyTheme(data) {
    const styleEl = document.getElementById('mz-theme-vars');
    if (!styleEl) return;

    const declarations = buildDeclarations(data);
    const fontDeclarations = injectFonts(data.typography) || [];
    const allDeclarations = [...declarations, ...fontDeclarations];

    if (allDeclarations.length > 0) {
      styleEl.textContent = `:root {\n${allDeclarations.join('\n')}\n}`;
    }

    let scaleStyle = document.getElementById('mz-scale-vars');
    if (!scaleStyle) {
      scaleStyle = document.createElement('style');
      scaleStyle.id = 'mz-scale-vars';
      document.head.appendChild(scaleStyle);
    }
    const mainScale = parseFloat(data.typography?.scaleMultiplier) || 1.0;
    const mobScale = parseFloat(data.layout?.mobileFontScale) || 0.9;
    scaleStyle.textContent = `
      html { font-size: calc(16px * ${mainScale}) !important; }
      @media (max-width: 768px) {
        html { font-size: calc(16px * ${mobScale}) !important; }
      }
    `;

    let customCssEl = document.getElementById('mz-custom-css');
    if (!customCssEl) {
      customCssEl = document.createElement('style');
      customCssEl.id = 'mz-custom-css';
      document.head.appendChild(customCssEl);
    }
    customCssEl.textContent = data.customCss || '';

    // Toggle global glass mode class names
    const glassEnabled = getNestedValue(data, 'theme.glass.enabled') !== false;
    document.documentElement.classList.toggle('glass-enabled', glassEnabled);
    document.documentElement.classList.toggle('glass-disabled', !glassEnabled);

    // Component-level toggles
    const comps = ['header', 'product_card', 'modal', 'sidebar', 'footer', 'form', 'hero'];
    comps.forEach(comp => {
      const isEnabled = getNestedValue(data, `theme.glass.${comp}_enabled`) !== false;
      document.documentElement.classList.toggle(`glass-${comp}-enabled`, isEnabled);
      document.documentElement.classList.toggle(`glass-${comp}-disabled`, !isEnabled);
    });

    // Update animations attributes dynamically for live preview sync
    const animationsEnabled = data.layout?.animationsEnabled !== false;
    const hoverStyle = data.theme?.pc?.hover_style || 'lift';
    document.documentElement.setAttribute('data-mz-anim', animationsEnabled ? 'elevated' : 'none');
    document.documentElement.setAttribute('data-mz-card-hover', hoverStyle);
  }

  // Synchronously load from localStorage cache and apply to avoid paint flash
  try {
    const cached = localStorage.getItem('mz-theme-cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.data) {
        applyTheme(parsed.data);
      }
    }
  } catch (e) {}

  /**
   * Main execution flow
   */
  async function loadTheme() {
    try {
      // 1. Check localStorage cache
      const cacheKey = 'mz-theme-cache';
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.data) {
            // Already applied synchronously above, just check for updates in background
            fetchAndUpdate(parsed.version);
            return;
          }
        } catch (e) { /* cache invalid, proceed with fetch */ }
      }

      // 2. Fetch from API
      await fetchAndUpdate(null);
    } catch (err) {
      // 3. Fallback — theme.defaults.css values are already in the static stylesheet
      console.warn('[theme-loader] Using static CSS defaults:', err.message);
    }
  }

  async function fetchAndUpdate(cachedVersion) {
    try {
      const res = await fetch('/api/site-settings/theme');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      if (!json.success || !json.data) throw new Error('Invalid response');

      const data = json.data;
      const currentVersion = data.version || 0;

      // Skip if cached version matches
      if (cachedVersion !== null && currentVersion === cachedVersion) return;

      applyTheme(data);

      // Cache in localStorage
      try {
        localStorage.setItem('mz-theme-cache', JSON.stringify({
          version: currentVersion,
          data: data
        }));
      } catch (e) { /* localStorage full, ignore */ }
    } catch (err) {
      if (cachedVersion === null) {
        console.warn('[theme-loader] API unavailable, using CSS defaults');
      }
    }
  }

  // ─── Listen for live theme updates from Appearance Studio ─────────────────
  window.addEventListener('mz:theme-updated', function () {
    localStorage.removeItem('mz-theme-cache');
    localStorage.removeItem('mz-homepage-settings');
    localStorage.removeItem('mz-feature-toggles');
    fetchAndUpdate(null);
  });

  // Listen for real-time Visual Customizer updates via postMessage
  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'mz:sync-preview-theme') {
      const themeData = event.data.theme;
      if (themeData) {
        applyTheme(themeData);
      }
    }
  });

  // Listen for saved customizer changes across other tabs
  try {
    const bc = new BroadcastChannel('mz-theme-channel');
    bc.addEventListener('message', function (event) {
      if (event.data && event.data.type === 'mz:theme-saved') {
        localStorage.removeItem('mz-theme-cache');
        localStorage.removeItem('mz-homepage-settings');
        localStorage.removeItem('mz-feature-toggles');
        window.location.reload();
      }
    });
  } catch (e) {
    console.warn('[theme-loader] BroadcastChannel not supported:', e);
  }

  // ─── Execute immediately ──────────────────────────────────────────────────
  loadTheme();

  // If inside an iframe, advertise readiness immediately
  if (window.self !== window.top) {
    window.parent.postMessage({ type: 'mz:preview-iframe-ready' }, '*');
  }

  // Expose for external use
  window.__mzThemeLoader = {
    reload: function () {
      localStorage.removeItem('mz-theme-cache');
      localStorage.removeItem('mz-homepage-settings');
      localStorage.removeItem('mz-feature-toggles');
      return fetchAndUpdate(null);
    },
    getMap: function () { return SETTINGS_TO_CSS_MAP; }
  };

})();
