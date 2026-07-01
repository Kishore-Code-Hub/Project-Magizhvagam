/**
 * Buttons Controller — Appearance Studio Workspace
 * Manages buttons styling options (radius, font weights, shadows).
 */
class ButtonsController extends BaseController {
  constructor() {
    super('buttons');
  }

  getTemplateUrl() {
    return '/admin/workspaces/appearance/buttons.html';
  }

  init() {
    const shapeSelect = this.$('#button-style-field');
    if (shapeSelect) {
      this.on(shapeSelect, 'change', (e) => {
        const val = e.target.value;
        const radius = val === 'sharp' ? 0 : (val === 'pill' ? 30 : 10);
        this._updateLocal('btnRadius', radius);
      });
    }

    const shadowSelect = this.$('#button-shadow-field');
    if (shadowSelect) {
      this.on(shadowSelect, 'change', (e) => {
        this._updateLocal('primary_shadow', e.target.value === 'pronounced');
      });
    }

    const weightSelect = this.$('#button-weight-field');
    if (weightSelect) {
      this.on(weightSelect, 'change', (e) => {
        this._updateLocal('font_weight', e.target.value);
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
    return true;
  }

  async save() {
    const success = await window.MZThemeStore.save();
    if (success) {
      showToast('Buttons configurations saved successfully!', 'success');
      
      const iframe = document.getElementById('viewport-iframe');
      if (iframe) iframe.contentWindow.location.reload();
    } else {
      showToast('Failed to save buttons settings', 'error');
    }
  }

  async reset() {
    if (!confirm('Revert all unsaved buttons style options?')) return;
    await window.MZThemeStore.reload();
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    super.destroy();
  }

  _populateForm(payload) {
    const t = payload.theme || {};
    const btnRadius = payload.layout?.btnRadius || 10;
    
    let btnStyle = 'rounded';
    if (btnRadius === 0) btnStyle = 'sharp';
    else if (btnRadius >= 30) btnStyle = 'pill';

    const shape = this.$('#button-style-field');
    if (shape) shape.value = btnStyle;

    const shadow = this.$('#button-shadow-field');
    if (shadow) shadow.value = t.btn?.primary_shadow ? 'pronounced' : 'soft';

    const weight = this.$('#button-weight-field');
    if (weight) weight.value = t.btn?.font_weight || '600';
  }

  _updateLocal(key, val) {
    window.MZThemeStore.update((state) => {
      state.layout = state.layout || {};
      state.theme = state.theme || {};
      state.theme.btn = state.theme.btn || {};

      if (key === 'btnRadius') {
        state.layout.btnRadius = val;
      } else if (key === 'primary_shadow') {
        state.theme.btn.primary_shadow = val;
      } else if (key === 'font_weight') {
        state.theme.btn.font_weight = val;
      }
    });
  }
}
window.ButtonsController = ButtonsController;
