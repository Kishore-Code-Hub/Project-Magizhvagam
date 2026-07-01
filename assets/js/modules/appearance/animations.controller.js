/**
 * Animations Controller — Appearance Studio Workspace
 * Manages storefront animation toggles and speeds.
 */
class AnimationsController extends BaseController {
  constructor() {
    super('animations');
  }

  getTemplateUrl() {
    return '/admin/workspaces/appearance/animations.html';
  }

  init() {
    const enableToggle = this.$('#anim-enable-toggle');
    const speedControls = this.$('#animation-speed-container');
    if (enableToggle) {
      this.on(enableToggle, 'change', (e) => {
        if (speedControls) {
          speedControls.style.opacity = e.target.checked ? '1' : '0.5';
          speedControls.querySelectorAll('input').forEach(i => i.disabled = !e.target.checked);
        }
        this._updateLocal('animationsEnabled', e.target.checked);
      });
    }

    const speedSlider = this.$('#anim-speed-field');
    const speedVal = this.$('#anim-speed-val');
    if (speedSlider && speedVal) {
      this.on(speedSlider, 'input', (e) => {
        const val = parseFloat(e.target.value) || 0.3;
        speedVal.textContent = val.toFixed(2);
        this._updateLocal('animationSpeed', val);
      });
    }

    const hoverSelect = this.$('#anim-hover-style-field');
    if (hoverSelect) {
      this.on(hoverSelect, 'change', (e) => {
        this._updateLocal('hover_style', e.target.value);
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
    const slider = this.$('#anim-speed-field');
    if (slider) {
      const val = parseFloat(slider.value);
      if (isNaN(val) || val < 0.05 || val > 3.0) {
        showToast('Animation duration speed must be between 0.05s and 3.0s', 'error');
        return false;
      }
    }
    return true;
  }

  async save() {
    if (!this.validate()) return;
    const success = await window.MZThemeStore.save();
    if (success) {
      showToast('Animations settings saved successfully!', 'success');
      
      const iframe = document.getElementById('viewport-iframe');
      if (iframe) iframe.contentWindow.location.reload();
    } else {
      showToast('Failed to save animations settings', 'error');
    }
  }

  async reset() {
    if (!confirm('Revert all animation configurations to factory defaults?')) return;
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
    const pc = t.pc || {};

    const enable = payload.layout?.animationsEnabled !== false;
    const enableToggle = this.$('#anim-enable-toggle');
    const speedControls = this.$('#animation-speed-container');
    if (enableToggle) enableToggle.checked = enable;
    if (speedControls) {
      speedControls.style.opacity = enable ? '1' : '0.5';
      speedControls.querySelectorAll('input').forEach(i => i.disabled = !enable);
    }

    const speed = payload.layout?.animationSpeed || 0.3;
    const speedSlider = this.$('#anim-speed-field');
    const speedVal = this.$('#anim-speed-val');
    if (speedSlider) speedSlider.value = speed;
    if (speedVal) speedVal.textContent = speed.toFixed(2);

    const hover = pc.hover_style || 'lift';
    const hoverSelect = this.$('#anim-hover-style-field');
    if (hoverSelect) hoverSelect.value = hover;
  }

  _updateLocal(key, val) {
    window.MZThemeStore.update((state) => {
      state.layout = state.layout || {};
      state.theme = state.theme || {};
      state.theme.pc = state.theme.pc || {};

      if (key === 'animationsEnabled') {
        state.layout.animationsEnabled = val;
      } else if (key === 'animationSpeed') {
        state.layout.animationSpeed = val;
      } else if (key === 'hover_style') {
        state.theme.pc.hover_style = val;
      }
    });
  }
}
window.AnimationsController = AnimationsController;
