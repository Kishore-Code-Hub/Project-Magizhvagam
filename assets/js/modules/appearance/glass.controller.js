/**
 * Glass Controller — Appearance Studio Workspace
 * Manages global and sub-section glassmorphism options, blurs, and transparencies.
 */
class GlassController extends BaseController {
  constructor() {
    super('glass');
  }

  getTemplateUrl() {
    return '/admin/workspaces/appearance/glass.html';
  }

  init() {
    const globalToggle = this.$('#glass-global-toggle');
    const controls = this.$('#glass-specular-controls');
    if (globalToggle) {
      this.on(globalToggle, 'change', (e) => {
        if (controls) {
          controls.style.opacity = e.target.checked ? '1' : '0.4';
          controls.querySelectorAll('input').forEach(i => i.disabled = !e.target.checked);
        }
        this._updateLocal('enabled', e.target.checked);
      });
    }

    const sliders = [
      { id: 'glass-blur-field', label: 'glass-blur-val', key: 'blur' },
      { id: 'glass-bg-opacity-field', label: 'glass-bg-opacity-val', key: 'bg_opacity', isFloat: true },
      { id: 'glass-border-opacity-field', label: 'glass-border-opacity-val', key: 'border_opacity', isFloat: true },
      { id: 'glass-shadow-intensity-field', label: 'glass-shadow-intensity-val', key: 'shadow_intensity', isFloat: true },
      { id: 'glass-border-radius-field', label: 'glass-border-radius-val', key: 'border_radius' },
      { id: 'glass-brightness-field', label: 'glass-brightness-val', key: 'brightness', isFloat: true },
      { id: 'glass-contrast-field', label: 'glass-contrast-val', key: 'contrast', isFloat: true },
      { id: 'glass-hover-intensity-field', label: 'glass-hover-intensity-val', key: 'hover_intensity', isFloat: true }
    ];

    sliders.forEach(slide => {
      const slider = this.$('#' + slide.id);
      const label = this.$('#' + slide.label);
      if (slider && label) {
        this.on(slider, 'input', (e) => {
          const val = slide.isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
          label.textContent = slide.isFloat ? val.toFixed(2) : val;
          this._updateLocal(slide.key, val);
        });
      }
    });

    const toggles = [
      { id: 'glass-header-toggle', key: 'header_enabled' },
      { id: 'glass-product-toggle', key: 'product_card_enabled' },
      { id: 'glass-modal-toggle', key: 'modal_enabled' },
      { id: 'glass-sidebar-toggle', key: 'sidebar_enabled' },
      { id: 'glass-footer-toggle', key: 'footer_enabled' },
      { id: 'glass-form-toggle', key: 'form_enabled' },
      { id: 'glass-hero-toggle', key: 'hero_enabled' }
    ];

    toggles.forEach(tog => {
      const el = this.$('#' + tog.id);
      if (el) {
        this.on(el, 'change', (e) => {
          this._updateLocal(tog.key, e.target.checked);
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
    return true;
  }

  async save() {
    const success = await window.MZThemeStore.save();
    if (success) {
      showToast('Glassmorphism options saved successfully!', 'success');
      
      const iframe = document.getElementById('viewport-iframe');
      if (iframe) iframe.contentWindow.location.reload();
    } else {
      showToast('Failed to save glass settings', 'error');
    }
  }

  async reset() {
    if (!confirm('Revert all unsaved glassmorphism changes?')) return;
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
    const gl = t.glass || {};

    const enable = gl.enabled !== false;
    const globalToggle = this.$('#glass-global-toggle');
    const controls = this.$('#glass-specular-controls');
    if (globalToggle) globalToggle.checked = enable;
    if (controls) {
      controls.style.opacity = enable ? '1' : '0.4';
      controls.querySelectorAll('input').forEach(i => i.disabled = !enable);
    }

    const setSlider = (id, labelId, value, isFloat = false) => {
      const slider = this.$('#' + id);
      const label = this.$('#' + labelId);
      if (slider) slider.value = value;
      if (label) label.textContent = isFloat ? parseFloat(value).toFixed(2) : value;
    };

    setSlider('glass-blur-field', 'glass-blur-val', gl.blur || '12');
    setSlider('glass-bg-opacity-field', 'glass-bg-opacity-val', gl.bg_opacity || '0.12', true);
    setSlider('glass-border-opacity-field', 'glass-border-opacity-val', gl.border_opacity || '0.15', true);
    setSlider('glass-shadow-intensity-field', 'glass-shadow-intensity-val', gl.shadow_intensity || '1.0', true);
    setSlider('glass-border-radius-field', 'glass-border-radius-val', gl.border_radius || '16');
    setSlider('glass-brightness-field', 'glass-brightness-val', gl.brightness || '1.0', true);
    setSlider('glass-contrast-field', 'glass-contrast-val', gl.contrast || '1.0', true);
    setSlider('glass-hover-intensity-field', 'glass-hover-intensity-val', gl.hover_intensity || '1.1', true);

    const check = (id, value) => {
      const el = this.$('#' + id);
      if (el) el.checked = value !== false;
    };

    check('glass-header-toggle', gl.header_enabled);
    check('glass-product-toggle', gl.product_card_enabled);
    check('glass-modal-toggle', gl.modal_enabled);
    check('glass-sidebar-toggle', gl.sidebar_enabled);
    check('glass-footer-toggle', gl.footer_enabled);
    check('glass-form-toggle', gl.form_enabled);
    check('glass-hero-toggle', gl.hero_enabled);
  }

  _updateLocal(key, val) {
    window.MZThemeStore.update((state) => {
      state.theme = state.theme || {};
      state.theme.glass = state.theme.glass || {};
      const gl = state.theme.glass;
      gl[key] = val;
    });
  }
}
window.GlassController = GlassController;
