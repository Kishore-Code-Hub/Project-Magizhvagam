/**
 * Typography Controller — Appearance Studio Workspace
 * Manages Google Fonts selection and global scaling factors.
 */
class TypographyController extends BaseController {
  constructor() {
    super('typography');
  }

  getTemplateUrl() {
    return '/admin/workspaces/appearance/typography.html';
  }

  init() {
    const fontSelect = this.$('#font-family-field');
    if (fontSelect) {
      this.on(fontSelect, 'change', (e) => {
        this._updateFontFamily(e.target.value);
      });
    }

    const scaleSlider = this.$('#font-scale-field');
    const scaleVal = this.$('#font-scale-val');
    if (scaleSlider && scaleVal) {
      this.on(scaleSlider, 'input', (e) => {
        const val = parseFloat(e.target.value) || 1.0;
        scaleVal.textContent = val.toFixed(2);
        this._updateFontScale(val);
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
    const scaleSlider = this.$('#font-scale-field');
    if (scaleSlider) {
      const val = parseFloat(scaleSlider.value);
      if (isNaN(val) || val < 0.5 || val > 2.0) {
        showToast('Typography scale factor must be between 0.5 and 2.0', 'error');
        return false;
      }
    }
    return true;
  }

  async save() {
    if (!this.validate()) return;
    const success = await window.MZThemeStore.save();
    if (success) {
      showToast('Typography settings saved!', 'success');
      
      const iframe = document.getElementById('viewport-iframe');
      if (iframe) iframe.contentWindow.location.reload();
    } else {
      showToast('Failed to save typography', 'error');
    }
  }

  async reset() {
    if (!confirm('Revert typography settings to default Outfit font?')) return;
    window.MZThemeStore.update((state) => {
      state.typography = state.typography || {};
      state.typography.body = state.typography.body || {};
      state.typography.body.family = 'Outfit';
      state.typography.heading = state.typography.heading || {};
      state.typography.heading.family = 'Outfit';
      state.typography.scaleMultiplier = 1.0;
      state.layout = state.layout || {};
      state.layout.mobileFontScale = 0.9;
    });

    const select = this.$('#font-family-field');
    if (select) select.value = 'Outfit';
    const slider = this.$('#font-scale-field');
    if (slider) slider.value = 1.0;
    const scaleVal = this.$('#font-scale-val');
    if (scaleVal) scaleVal.textContent = '1.00';
    showToast('Typography options reset!', 'info');
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    super.destroy();
  }

  _populateForm(payload) {
    const family = payload.typography?.body?.family || 'Outfit';
    const scale = payload.typography?.scaleMultiplier || 1.0;

    const select = this.$('#font-family-field');
    if (select) select.value = family;

    const slider = this.$('#font-scale-field');
    if (slider) slider.value = scale;

    const scaleVal = this.$('#font-scale-val');
    if (scaleVal) scaleVal.textContent = scale.toFixed(2);
  }

  _updateFontFamily(family) {
    window.MZThemeStore.update((state) => {
      state.typography = state.typography || {};
      state.typography.body = state.typography.body || {};
      state.typography.body.family = family;

      state.typography.heading = state.typography.heading || {};
      state.typography.heading.family = family;
    });
  }

  _updateFontScale(multiplier) {
    window.MZThemeStore.update((state) => {
      state.typography = state.typography || {};
      state.typography.scaleMultiplier = multiplier;

      state.layout = state.layout || {};
      state.layout.mobileFontScale = parseFloat((multiplier * 0.9).toFixed(2));
    });
  }
}
window.TypographyController = TypographyController;
