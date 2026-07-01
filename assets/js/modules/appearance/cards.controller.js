/**
 * Cards Controller — Appearance Studio Workspace
 * Manages category/product item cards styles (radius, shadows, transitions).
 */
class CardsController extends BaseController {
  constructor() {
    super('cards');
  }

  getTemplateUrl() {
    return '/admin/workspaces/appearance/cards.html';
  }

  init() {
    const cardRad = this.$('#card-radius-field');
    const radVal = this.$('#card-radius-val');
    if (cardRad && radVal) {
      this.on(cardRad, 'input', (e) => {
        const val = parseInt(e.target.value, 10) || 0;
        radVal.textContent = val;
        this._updateLocal('cardRadius', val);
      });
    }

    const cardShadow = this.$('#card-shadow-field');
    const shadowVal = this.$('#card-shadow-val');
    if (cardShadow && shadowVal) {
      this.on(cardShadow, 'input', (e) => {
        const val = parseFloat(e.target.value) || 0.0;
        shadowVal.textContent = val.toFixed(1);
        this._updateLocal('shadowStrength', val);
      });
    }

    const hoverY = this.$('#card-hover-y-field');
    const hoverVal = this.$('#card-hover-y-val');
    if (hoverY && hoverVal) {
      this.on(hoverY, 'input', (e) => {
        const val = parseInt(e.target.value, 10) || 0;
        hoverVal.textContent = val;
        this._updateLocal('hover_translate_y', val);
      });
    }

    const imgBg = this.$('#card-image-bg-field');
    const imgBgText = this.$('#card-image-bg-text');
    if (imgBg && imgBgText) {
      this.on(imgBg, 'input', (e) => {
        imgBgText.value = e.target.value.toUpperCase();
        this._updateLocal('image_bg', e.target.value);
      });
      this.on(imgBgText, 'input', (e) => {
        const val = e.target.value.trim();
        if (this._validateHex(val)) {
          imgBg.value = val;
          this._updateLocal('image_bg', val);
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
    const textEl = this.$('#card-image-bg-text');
    if (textEl) {
      const val = textEl.value.trim();
      if (!this._validateHex(val)) {
        showToast('Invalid card image background hex color code', 'error');
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
      showToast('Cards styles saved successfully!', 'success');
      
      const iframe = document.getElementById('viewport-iframe');
      if (iframe) iframe.contentWindow.location.reload();
    } else {
      showToast('Failed to save cards config', 'error');
    }
  }

  async reset() {
    if (!confirm('Revert all unsaved cards styles changes?')) return;
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
    const pc = t.pc || {};

    const rad = payload.layout?.cardRadius || 14;
    const radSlider = this.$('#card-radius-field');
    const radLabel = this.$('#card-radius-val');
    if (radSlider) radSlider.value = rad;
    if (radLabel) radLabel.textContent = rad;

    const shadow = payload.layout?.shadowStrength || 1.0;
    const shadowSlider = this.$('#card-shadow-field');
    const shadowLabel = this.$('#card-shadow-val');
    if (shadowSlider) shadowSlider.value = shadow;
    if (shadowLabel) shadowLabel.textContent = shadow.toFixed(1);

    const translate = pc.hover_translate_y || 6;
    const translateSlider = this.$('#card-hover-y-field');
    const translateLabel = this.$('#card-hover-y-val');
    if (translateSlider) translateSlider.value = translate;
    if (translateLabel) translateLabel.textContent = translate;

    const img = this.$('#card-image-bg-field');
    const imgText = this.$('#card-image-bg-text');
    if (img) img.value = pc.image_bg || '#0D0A14';
    if (imgText) imgText.value = (pc.image_bg || '#0D0A14').toUpperCase();
  }

  _updateLocal(key, val) {
    window.MZThemeStore.update((state) => {
      state.layout = state.layout || {};
      state.theme = state.theme || {};
      state.theme.pc = state.theme.pc || {};

      if (key === 'cardRadius') {
        state.layout.cardRadius = val;
      } else if (key === 'shadowStrength') {
        state.layout.shadowStrength = val;
      } else if (key === 'hover_translate_y') {
        state.theme.pc.hover_translate_y = val;
      } else if (key === 'image_bg') {
        state.theme.pc.image_bg = val;
      }
    });
  }
}
window.CardsController = CardsController;
