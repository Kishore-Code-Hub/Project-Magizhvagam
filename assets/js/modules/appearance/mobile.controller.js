/**
 * Mobile Controller — Appearance Studio Workspace
 * Manages viewport optimization parameters and layouts optimized for small viewport screens.
 */
class MobileController extends BaseController {
  constructor() {
    super('mobile');
  }

  getTemplateUrl() {
    return '/admin/workspaces/appearance/mobile.html';
  }

  init() {
    const fontScale = this.$('#mobile-font-scale-field');
    const fontVal = this.$('#mobile-font-scale-val');
    if (fontScale && fontVal) {
      this.on(fontScale, 'input', (e) => {
        const val = parseFloat(e.target.value) || 0.9;
        fontVal.textContent = val.toFixed(2);
        this._updateLocal('mobileFontScale', val);
      });
    }

    const hHeight = this.$('#mobile-header-height-field');
    const hVal = this.$('#mobile-header-height-val');
    if (hHeight && hVal) {
      this.on(hHeight, 'input', (e) => {
        const val = parseInt(e.target.value, 10) || 64;
        hVal.textContent = val;
        this._updateLocal('mobile_height', val);
      });
    }

    const navBg = this.$('#mobile-nav-bg-field');
    const navText = this.$('#mobile-nav-bg-text');
    if (navBg && navText) {
      this.on(navBg, 'input', (e) => {
        navText.value = e.target.value.toUpperCase();
        this._updateLocal('mobile_bg', e.target.value);
      });
      this.on(navText, 'input', (e) => {
        const val = e.target.value.trim();
        if (this._validateHex(val)) {
          navBg.value = val;
          this._updateLocal('mobile_bg', val);
        }
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
    const textEl = this.$('#mobile-nav-bg-text');
    if (textEl) {
      const val = textEl.value.trim();
      if (!this._validateHex(val)) {
        showToast('Invalid hexadecimal color format for mobile navigation menu background', 'error');
        textEl.focus();
        return false;
      }
    }
    return true;
  }

  async save() {
    if (!this.validate()) return;
    const success = await window.MZThemeStore.save();
    if (success) {
      showToast('Mobile layout options saved successfully!', 'success');
      
      const iframe = document.getElementById('viewport-iframe');
      if (iframe) iframe.contentWindow.location.reload();
    } else {
      showToast('Failed to save mobile settings', 'error');
    }
  }

  async reset() {
    if (!confirm('Revert all unsaved mobile styling parameters?')) return;
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
    
    const scale = payload.layout?.mobileFontScale || 0.9;
    const fontScale = this.$('#mobile-font-scale-field');
    const fontVal = this.$('#mobile-font-scale-val');
    if (fontScale) fontScale.value = scale;
    if (fontVal) fontVal.textContent = scale.toFixed(2);

    const height = t.hdr?.mobile_height || 64;
    const hHeight = this.$('#mobile-header-height-field');
    const hVal = this.$('#mobile-header-height-val');
    if (hHeight) hHeight.value = height;
    if (hVal) hVal.textContent = height;

    const nav = this.$('#mobile-nav-bg-field');
    const navText = this.$('#mobile-nav-bg-text');
    if (nav) nav.value = t.nav?.mobile_bg || '#0D0A14';
    if (navText) navText.value = (t.nav?.mobile_bg || '#0D0A14').toUpperCase();
  }

  _updateLocal(key, val) {
    window.MZThemeStore.update((state) => {
      state.layout = state.layout || {};
      state.theme = state.theme || {};
      state.theme.hdr = state.theme.hdr || {};
      state.theme.nav = state.theme.nav || {};

      if (key === 'mobileFontScale') {
        state.layout.mobileFontScale = val;
      } else if (key === 'mobile_height') {
        state.theme.hdr.mobile_height = val;
      } else if (key === 'mobile_bg') {
        state.theme.nav.mobile_bg = val;
      }
    });
  }
}
window.MobileController = MobileController;
