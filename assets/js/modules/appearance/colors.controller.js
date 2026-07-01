/**
 * Colors Controller — Appearance Studio Workspace
 * Manages color variables and validates contrast ratio accessibility.
 */
class ColorsController extends BaseController {
  constructor() {
    super('colors');
  }

  getTemplateUrl() {
    return '/admin/workspaces/appearance/colors.html';
  }

  init() {
    const colorFields = [
      { picker: 'primary-color-field', text: 'primary-color-text' },
      { picker: 'secondary-color-field', text: 'secondary-color-text' },
      { picker: 'accent-color-field', text: 'accent-color-text' },
      { picker: 'palette-bg-main', text: 'palette-bg-main-text' },
      { picker: 'palette-bg-surface', text: 'palette-bg-surface-text' },
      { picker: 'palette-text-main', text: 'palette-text-main-text' },
      { picker: 'palette-text-muted', text: 'palette-text-muted-text' },
      { picker: 'palette-color-primary', text: 'palette-color-primary-text' },
      { picker: 'palette-color-secondary', text: 'palette-color-secondary-text' },
      { picker: 'palette-color-success', text: 'palette-color-success-text' },
      { picker: 'palette-color-error', text: 'palette-color-error-text' }
    ];

    colorFields.forEach(pair => {
      const pickerEl = this.$('#' + pair.picker);
      const textEl = this.$('#' + pair.text);

      if (pickerEl && textEl) {
        // Picker input binds
        this.on(pickerEl, 'input', (e) => {
          const val = e.target.value;
          textEl.value = val.toUpperCase();
          textEl.style.borderColor = ''; // clear error
          this._updateLocalColor(pair.picker, val);
        });

        // Text field input binds
        this.on(textEl, 'input', (e) => {
          let val = e.target.value.trim();
          if (!val.startsWith('#')) val = '#' + val;
          if (this._validateHex(val)) {
            pickerEl.value = val;
            textEl.style.borderColor = '';
            this._updateLocalColor(pair.picker, val);
          } else {
            textEl.style.borderColor = '#ef4444'; // outline error
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
    const fields = [
      'primary-color-text', 'secondary-color-text', 'accent-color-text',
      'palette-bg-main-text', 'palette-bg-surface-text', 'palette-text-main-text',
      'palette-text-muted-text', 'palette-color-primary-text', 'palette-color-secondary-text',
      'palette-color-success-text', 'palette-color-error-text'
    ];

    for (const id of fields) {
      const textEl = this.$('#' + id);
      if (textEl) {
        const val = textEl.value.trim();
        if (!this._validateHex(val)) {
          showToast(`Invalid hexadecimal color format in field: ${id.replace('-text', '')}`, 'error');
          textEl.focus();
          return false;
        }
      }
    }
    return true;
  }

  async save() {
    if (!this.validate()) return;
    const success = await window.MZThemeStore.save();
    if (success) {
      showToast('Color settings saved successfully!', 'success');
      
      const iframe = document.getElementById('viewport-iframe');
      if (iframe) iframe.contentWindow.location.reload();
    } else {
      showToast('Failed to save colors', 'error');
    }
  }

  async reset() {
    if (!confirm('Revert current workspace modifications and reload colors?')) return;
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
    const setColors = (pickerId, textId, value) => {
      const p = this.$('#' + pickerId);
      const tField = this.$('#' + textId);
      if (p) p.value = value || '#000000';
      if (tField) tField.value = (value || '#000000').toUpperCase();
    };

    setColors('primary-color-field', 'primary-color-text', t.hdr?.logo_text || '#D4A03A');
    setColors('secondary-color-field', 'secondary-color-text', t.hdr?.nav_link_hover || '#E0A84A');
    setColors('accent-color-field', 'accent-color-text', t.hero?.badge_text || '#D4A03A');

    setColors('palette-bg-main', 'palette-bg-main-text', t.hdr?.bg || '#0B0618');
    setColors('palette-bg-surface', 'palette-bg-surface-text', t.nav?.dropdown_bg || '#171027');
    setColors('palette-text-main', 'palette-text-main-text', t.hdr?.nav_link_color || '#FFFFFF');
    setColors('palette-text-muted', 'palette-text-muted-text', t.hero?.subheadline_color || '#D8D8D8');

    setColors('palette-color-primary', 'palette-color-primary-text', t.btn?.primary_bg || '#D4A03A');
    setColors('palette-color-secondary', 'palette-color-secondary-text', t.btn?.primary_hover_bg || '#211638');
    setColors('palette-color-success', 'palette-color-success-text', t.pc?.stock_in_color || '#2ECC71');
    setColors('palette-color-error', 'palette-color-error-text', t.pc?.stock_out_color || '#E74C3C');

    window.syncLivePreview(payload);
    this._updateContrastIndicator();
  }

  _updateLocalColor(pickerId, hexVal) {
    window.MZThemeStore.update((state) => {
      state.theme = state.theme || {};
      const t = state.theme;
      t.hdr = t.hdr || {};
      t.nav = t.nav || {};
      t.hero = t.hero || {};
      t.pc = t.pc || {};
      t.btn = t.btn || {};

      // Synchronize to structured fields
      if (pickerId === 'primary-color-field') {
        t.hdr.logo_text = hexVal;
        t.hdr.border = hexVal;
        t.nav.dropdown_border = hexVal;
        t.pc.border = hexVal;
        t.pc.rating_color = hexVal;
      } else if (pickerId === 'secondary-color-field') {
        t.hdr.nav_link_hover = hexVal;
        t.hdr.nav_link_active = hexVal;
        t.hdr.icon_hover = hexVal;
        t.nav.dropdown_item_hover_color = hexVal;
      } else if (pickerId === 'accent-color-field') {
        t.hero.badge_text = hexVal;
      } else if (pickerId === 'palette-bg-main') {
        t.hdr.bg = hexVal;
        t.hdr.sticky_bg = hexVal;
        t.hero.cta_primary_text = hexVal;
        t.pc.image_bg = hexVal;
        t.pc.btn_text = hexVal;
      } else if (pickerId === 'palette-bg-surface') {
        t.nav.dropdown_bg = hexVal;
        t.pc.bg = hexVal;
      } else if (pickerId === 'palette-text-main') {
        t.hdr.nav_link_color = hexVal;
        t.hdr.icon_color = hexVal;
        t.nav.dropdown_item_color = hexVal;
        t.nav.mobile_item = hexVal;
        t.hero.headline_color = hexVal;
        t.pc.name_color = hexVal;
      } else if (pickerId === 'palette-text-muted') {
        t.hero.subheadline_color = hexVal;
        t.pc.category_color = hexVal;
        t.pc.original_price_color = hexVal;
      } else if (pickerId === 'palette-color-primary') {
        t.btn.primary_bg = hexVal;
        t.hero.cta_primary_bg = hexVal;
        t.pc.current_price_color = hexVal;
        t.pc.btn_bg = hexVal;
      } else if (pickerId === 'palette-color-secondary') {
        t.btn.primary_hover_bg = hexVal;
        t.hero.cta_primary_hover_bg = hexVal;
        t.pc.btn_hover_bg = hexVal;
      } else if (pickerId === 'palette-color-success') {
        t.pc.stock_in_color = hexVal;
      } else if (pickerId === 'palette-color-error') {
        t.pc.stock_out_color = hexVal;
      }
    });

    this._updateContrastIndicator();
  }

  _updateContrastIndicator() {
    if (window.ContrastEngine && typeof window.ContrastEngine.updateScore === 'function') {
      window.ContrastEngine.updateScore();
    } else {
      // Basic client verification fallback
      const textHex = this.$('#palette-text-main-text')?.value || '#FFFFFF';
      const bgHex = this.$('#palette-bg-main-text')?.value || '#0B0618';
      const indicator = this.$('#contrast-lock-indicator');
      const valEl = this.$('#contrast-score-val');
      if (!indicator || !valEl) return;

      const score = this._calculateContrast(textHex, bgHex);
      valEl.textContent = score.toFixed(1) + ':1';
      if (score >= 4.5) {
        indicator.style.backgroundColor = 'rgba(46, 204, 113, 0.1)';
        indicator.style.borderColor = 'rgba(46, 204, 113, 0.3)';
        indicator.style.color = '#2ecc71';
      } else {
        indicator.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
        indicator.style.borderColor = 'rgba(231, 76, 60, 0.3)';
        indicator.style.color = '#e74c3c';
      }
    }
  }

  _calculateContrast(hex1, hex2) {
    const getRGB = hex => {
      const h = hex.replace('#', '');
      return {
        r: parseInt(h.substring(0, 2), 16),
        g: parseInt(h.substring(2, 4), 16),
        b: parseInt(h.substring(4, 6), 16)
      };
    };
    const getLuminance = rgb => {
      const a = [rgb.r, rgb.g, rgb.b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    try {
      const l1 = getLuminance(getRGB(hex1));
      const l2 = getLuminance(getRGB(hex2));
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    } catch (e) {
      return 1.0;
    }
  }
}
window.ColorsController = ColorsController;
