/**
 * Products Controller — Appearance Studio Workspace
 * Manages Single Product Details Page (PDP) styles (gallery frames, active tabs focus).
 */
class ProductsController extends BaseController {
  constructor() {
    super('products');
  }

  getTemplateUrl() {
    return '/admin/workspaces/appearance/products.html';
  }

  init() {
    const fields = [
      { picker: 'pdp-gallery-border-field', text: 'pdp-gallery-border-text', key: 'gallery_active_border' },
      { picker: 'pdp-spec-heading-field', text: 'pdp-spec-heading-text', key: 'specs_heading_color' },
      { picker: 'pdp-tab-active-field', text: 'pdp-tab-active-text', key: 'tab_active_color' }
    ];

    fields.forEach(pair => {
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
    const fields = ['pdp-gallery-border-text', 'pdp-spec-heading-text', 'pdp-tab-active-text'];
    for (const id of fields) {
      const textEl = this.$('#' + id);
      if (textEl) {
        const val = textEl.value.trim();
        if (!this._validateHex(val)) {
          showToast(`Invalid hexadecimal color format in product details field: ${id.replace('-text', '')}`, 'error');
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
      showToast('Product pages visual accents saved!', 'success');
      
      const iframe = document.getElementById('viewport-iframe');
      if (iframe) iframe.contentWindow.location.reload();
    } else {
      showToast('Failed to save product accents', 'error');
    }
  }

  async reset() {
    if (!confirm('Revert all unsaved PDP customizer changes?')) return;
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
    const pdp = t.pdp || {};

    const setColors = (pickerId, textId, value) => {
      const p = this.$('#' + pickerId);
      const txt = this.$('#' + textId);
      if (p) p.value = value || '#000000';
      if (txt) txt.value = (value || '#000000').toUpperCase();
    };

    setColors('pdp-gallery-border-field', 'pdp-gallery-border-text', pdp.gallery_active_border || '#C9913D');
    setColors('pdp-spec-heading-field', 'pdp-spec-heading-text', pdp.specs_heading_color || '#F5F0E8');
    setColors('pdp-tab-active-field', 'pdp-tab-active-text', pdp.tab_active_color || '#C9913D');
  }

  _updateLocal(key, val) {
    window.MZThemeStore.update((state) => {
      state.theme = state.theme || {};
      state.theme.pdp = state.theme.pdp || {};
      const pdp = state.theme.pdp;

      if (key === 'gallery_active_border') {
        pdp.gallery_active_border = val;
      } else if (key === 'specs_heading_color') {
        pdp.specs_heading_color = val;
      } else if (key === 'tab_active_color') {
        pdp.tab_active_color = val;
        pdp.tab_active_border = val;
      }
    });
  }
}
window.ProductsController = ProductsController;
