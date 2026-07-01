/**
 * Header Controller — Appearance Studio Workspace
 * Manages store title branding, logos, WhatsApp phone, and announcement settings.
 */
class HeaderController extends BaseController {
  constructor() {
    super('header');
  }

  getTemplateUrl() {
    return '/admin/workspaces/appearance/header.html';
  }

  init() {
    // Brand name input listener
    const brandInput = this.$('#brand-name-field');
    if (brandInput) {
      this.on(brandInput, 'input', (e) => {
        this._updateLocal('brandName', e.target.value.trim());
      });
    }

    // Logo visual pickers
    const pickBtn = this.$('#header-pick-logo');
    if (pickBtn) {
      this.on(pickBtn, 'click', () => {
        _pickImage((asset) => {
          const field = this.$('#logo-field');
          if (field) field.value = asset.url || '';
          this._updateLogoPreview(asset.url);
          this._updateLocal('logo', asset.url);
        });
      });
    }

    const clearBtn = this.$('#header-clear-logo');
    if (clearBtn) {
      this.on(clearBtn, 'click', () => {
        const field = this.$('#logo-field');
        if (field) field.value = '';
        this._updateLogoPreview(null);
        this._updateLocal('logo', '');
      });
    }

    // WhatsApp phone input
    const waInput = this.$('#whatsapp-contact-field');
    if (waInput) {
      this.on(waInput, 'input', (e) => {
        let phone = e.target.value.trim().replace(/\D/g, ''); // strip non-numeric
        this._updateLocal('whatsapp', phone);
      });
    }

    // Sticky toggle check
    const stickyCheck = this.$('#hdr-sticky-toggle');
    if (stickyCheck) {
      this.on(stickyCheck, 'change', (e) => {
        this._updateLocal('sticky', e.target.checked);
      });
    }

    // Announcement bar toggles
    const annCheck = this.$('#hdr-announcement-toggle');
    const annColorsGroup = this.$('#announcement-color-controls');
    if (annCheck) {
      this.on(annCheck, 'change', (e) => {
        if (annColorsGroup) {
          annColorsGroup.style.display = e.target.checked ? 'flex' : 'none';
        }
        this._updateLocal('announcement_active', e.target.checked);
      });
    }

    // Announcement colors dual bindings
    const annBg = this.$('#hdr-announcement-bg');
    const annBgText = this.$('#hdr-announcement-bg-text');
    if (annBg && annBgText) {
      this.on(annBg, 'input', (e) => {
        annBgText.value = e.target.value.toUpperCase();
        this._updateLocal('announcement_bg', e.target.value);
      });
      this.on(annBgText, 'input', (e) => {
        const val = e.target.value.trim();
        if (this._validateHex(val)) {
          annBg.value = val;
          this._updateLocal('announcement_bg', val);
        }
      });
    }

    const annTxt = this.$('#hdr-announcement-text');
    const annTxtText = this.$('#hdr-announcement-text-text');
    if (annTxt && annTxtText) {
      this.on(annTxt, 'input', (e) => {
        annTxtText.value = e.target.value.toUpperCase();
        this._updateLocal('announcement_text', e.target.value);
      });
      this.on(annTxtText, 'input', (e) => {
        const val = e.target.value.trim();
        if (this._validateHex(val)) {
          annTxt.value = val;
          this._updateLocal('announcement_text', val);
        }
      });
    }

    // Navigation styles dual bindings
    const navPairs = [
      { picker: 'nav-dropdown-bg-picker', text: 'nav-dropdown-bg-text', key: 'nav_dropdown_bg' },
      { picker: 'nav-dropdown-border-picker', text: 'nav-dropdown-border-text', key: 'nav_dropdown_border' },
      { picker: 'nav-item-picker', text: 'nav-item-text', key: 'nav_dropdown_item_color' },
      { picker: 'nav-mega-picker', text: 'nav-mega-text', key: 'nav_mega_accent' }
    ];

    navPairs.forEach(pair => {
      const p = this.$('#' + pair.picker);
      const t = this.$('#' + pair.text);
      if (p && t) {
        this.on(p, 'input', (e) => {
          t.value = e.target.value.toUpperCase();
          this._updateLocal(pair.key, e.target.value);
        });
        this.on(t, 'input', (e) => {
          const val = e.target.value.trim();
          if (this._validateHex(val)) {
            p.value = val;
            this._updateLocal(pair.key, val);
          }
        });
      }
    });
  }

  async load() {
    this.state.loading = true;
    const theme = await window.MZThemeStore.load();
    if (theme) {
      this._populateForm(theme);
    }
    
    this.unsubscribe = window.MZThemeStore.subscribe((state) => {
      this._populateForm(state);
    });
    this.state.loading = false;
  }

  validate() {
    const brand = this.$('#brand-name-field')?.value.trim();
    if (!brand) {
      showToast('Store branding title heading is required', 'error');
      return false;
    }
    const phone = this.$('#whatsapp-contact-field')?.value.trim();
    if (phone && !/^\d{10,15}$/.test(phone)) {
      showToast('WhatsApp number must contain only numbers (10 to 15 digits)', 'error');
      return false;
    }
    return true;
  }

  async save() {
    if (!this.validate()) return;
    const success = await window.MZThemeStore.save();
    if (success) {
      showToast('Header configuration settings saved!', 'success');
      
      const iframe = document.getElementById('viewport-iframe');
      if (iframe) iframe.contentWindow.location.reload();
    } else {
      showToast('Failed to save header settings', 'error');
    }
  }

  async reset() {
    if (!confirm('Discard unsaved adjustments on header options?')) return;
    await window.MZThemeStore.reload();
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    super.destroy();
  }

  _validateHex(str) {
    return /^#[0-9A-F]{6}$/i.test(str);
  }

  _populateForm(payload) {
    const t = payload.theme || {};
    
    const brand = this.$('#brand-name-field');
    if (brand) brand.value = payload.meta?.storeName || 'MAGIZHVAGAM';

    const logo = this.$('#logo-field');
    if (logo) logo.value = payload.logo || '';
    this._updateLogoPreview(payload.logo);

    const wa = this.$('#whatsapp-contact-field');
    if (wa) wa.value = payload.meta?.socialLinks?.whatsapp || '919876543210';

    const sticky = this.$('#hdr-sticky-toggle');
    if (sticky) sticky.checked = t.hdr?.sticky !== false;

    const ann = this.$('#hdr-announcement-toggle');
    const annColors = this.$('#announcement-color-controls');
    const showAnn = t.hdr?.announcement_active !== false;
    if (ann) ann.checked = showAnn;
    if (annColors) annColors.style.display = showAnn ? 'flex' : 'none';

    const bg = this.$('#hdr-announcement-bg');
    const bgText = this.$('#hdr-announcement-bg-text');
    if (bg) bg.value = t.hdr?.announcement_bg || '#C9913D';
    if (bgText) bgText.value = (t.hdr?.announcement_bg || '#C9913D').toUpperCase();

    const txt = this.$('#hdr-announcement-text');
    const txtText = this.$('#hdr-announcement-text-text');
    if (txt) txt.value = t.hdr?.announcement_text || '#0D0A14';
    if (txtText) txtText.value = (t.hdr?.announcement_text || '#0D0A14').toUpperCase();

    // Populate Nav colors
    const nav = t.nav || {};
    const setNavColors = (pickerId, textId, value) => {
      const p = this.$('#' + pickerId);
      const txtField = this.$('#' + textId);
      if (p) p.value = value || '#000000';
      if (txtField) txtField.value = (value || '#000000').toUpperCase();
    };

    setNavColors('nav-dropdown-bg-picker', 'nav-dropdown-bg-text', nav.dropdown_bg || '#171027');
    setNavColors('nav-dropdown-border-picker', 'nav-dropdown-border-text', nav.dropdown_border || '#3A2E4A');
    setNavColors('nav-item-picker', 'nav-item-text', nav.dropdown_item_color || '#FFFFFF');
    setNavColors('nav-mega-picker', 'nav-mega-text', nav.mega_accent || '#C9913D');

    window.syncLivePreview(payload);
  }

  _updateLogoPreview(url) {
    const box = this.$('#logo-preview-box');
    if (!box) return;
    if (url) {
      box.innerHTML = `<img src="${url}" style="max-height:80px; max-width:100%; object-fit:contain; border-radius:4px;">`;
    } else {
      box.innerHTML = `<span style="color:var(--studio-text-muted); font-size:11px;">No Logo Selected</span>`;
    }
  }

  _updateLocal(key, val) {
    window.MZThemeStore.update((state) => {
      state.meta = state.meta || {};
      state.theme = state.theme || {};
      const t = state.theme;
      t.hdr = t.hdr || {};
      t.nav = t.nav || {};

      if (key === 'brandName') {
        state.meta.storeName = val;
      } else if (key === 'logo') {
        state.logo = val;
      } else if (key === 'whatsapp') {
        state.meta.socialLinks = state.meta.socialLinks || {};
        state.meta.socialLinks.whatsapp = val;
      } else if (key === 'sticky') {
        t.hdr.sticky = val;
      } else if (key === 'announcement_active') {
        t.hdr.announcement_active = val;
      } else if (key === 'announcement_bg') {
        t.hdr.announcement_bg = val;
      } else if (key === 'announcement_text') {
        t.hdr.announcement_text = val;
      } else if (key === 'nav_dropdown_bg') {
        t.nav.dropdown_bg = val;
      } else if (key === 'nav_dropdown_border') {
        t.nav.dropdown_border = val;
      } else if (key === 'nav_dropdown_item_color') {
        t.nav.dropdown_item_color = val;
      } else if (key === 'nav_mega_accent') {
        t.nav.mega_accent = val;
      }
    });
  }
}
window.HeaderController = HeaderController;
