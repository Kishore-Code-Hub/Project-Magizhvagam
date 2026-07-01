/**
 * Footer Controller — Appearance Studio Workspace
 * Manages footer background colors, heading accents, link colors, and copyright details.
 */
class FooterController extends BaseController {
  constructor() {
    super('footer');
  }

  getTemplateUrl() {
    return '/admin/workspaces/appearance/footer.html';
  }

  init() {
    // Color bindings
    const bgPicker = this.$('#ft-bg-picker');
    const bgText = this.$('#ft-bg-text');
    if (bgPicker && bgText) {
      this.on(bgPicker, 'input', (e) => {
        bgText.value = e.target.value.toUpperCase();
        this._updateLocal('bg', e.target.value);
      });
      this.on(bgText, 'input', (e) => {
        const val = e.target.value.trim();
        if (this._validateHex(val)) {
          bgPicker.value = val;
          this._updateLocal('bg', val);
        }
      });
    }

    const hPicker = this.$('#ft-heading-picker');
    const hText = this.$('#ft-heading-text');
    if (hPicker && hText) {
      this.on(hPicker, 'input', (e) => {
        hText.value = e.target.value.toUpperCase();
        this._updateLocal('heading_color', e.target.value);
      });
      this.on(hText, 'input', (e) => {
        const val = e.target.value.trim();
        if (this._validateHex(val)) {
          hPicker.value = val;
          this._updateLocal('heading_color', val);
        }
      });
    }

    const lPicker = this.$('#ft-link-picker');
    const lText = this.$('#ft-link-text');
    if (lPicker && lText) {
      this.on(lPicker, 'input', (e) => {
        lText.value = e.target.value.toUpperCase();
        this._updateLocal('link_color', e.target.value);
      });
      this.on(lText, 'input', (e) => {
        const val = e.target.value.trim();
        if (this._validateHex(val)) {
          lPicker.value = val;
          this._updateLocal('link_color', val);
        }
      });
    }

    // Text details input
    const footerContent = this.$('#footer-content-field');
    if (footerContent) {
      this.on(footerContent, 'input', (e) => {
        this._updateLocal('contactAddress', e.target.value.trim());
      });
    }
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
    const fields = ['ft-bg-text', 'ft-heading-text', 'ft-link-text'];
    for (const id of fields) {
      const textEl = this.$('#' + id);
      if (textEl) {
        const val = textEl.value.trim();
        if (!this._validateHex(val)) {
          showToast(`Invalid hexadecimal color format in footer field: ${id.replace('-text', '')}`, 'error');
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
      showToast('Footer settings saved successfully!', 'success');
      
      const iframe = document.getElementById('viewport-iframe');
      if (iframe) iframe.contentWindow.location.reload();
    } else {
      showToast('Failed to save footer config', 'error');
    }
  }

  async reset() {
    if (!confirm('Revert all unsaved footer changes?')) return;
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
    const ft = t.ft || {};

    const setColors = (pickerId, textId, value) => {
      const p = this.$('#' + pickerId);
      const txt = this.$('#' + textId);
      if (p) p.value = value || '#000000';
      if (txt) txt.value = (value || '#000000').toUpperCase();
    };

    setColors('ft-bg-picker', 'ft-bg-text', ft.bg || '#0A0810');
    setColors('ft-heading-picker', 'ft-heading-text', ft.heading_color || '#F5F0E8');
    setColors('ft-link-picker', 'ft-link-text', ft.link_color || '#7A6E8A');

    const desc = this.$('#footer-content-field');
    if (desc) desc.value = payload.meta?.contactAddress || '';

    window.syncLivePreview(payload);
  }

  _updateLocal(key, val) {
    window.MZThemeStore.update((state) => {
      state.theme = state.theme || {};
      state.theme.ft = state.theme.ft || {};
      const ft = state.theme.ft;

      if (key === 'bg') {
        ft.bg = val;
        ft.copyright_bg = val;
      } else if (key === 'heading_color') {
        ft.heading_color = val;
        ft.logo_text = val;
      } else if (key === 'link_color') {
        ft.link_color = val;
        ft.social_icon_color = val;
        ft.copyright_text = val;
        ft.link_hover_color = state.theme.hdr?.logo_text || '#D4A03A';
      } else if (key === 'contactAddress') {
        state.meta = state.meta || {};
        state.meta.contactAddress = val;
      }
    });
  }
}
window.FooterController = FooterController;
