/**
 * Presets Controller — Appearance Studio Workspace
 * Manages premium theme styling presets.
 */
class PresetsController extends BaseController {
  constructor() {
    super('presets');
    this.presets = {
      velvet: {
        primary: '#D4A03A', secondary: '#E0A84A', accent: '#D4A03A',
        bg: '#0B0618', surface: '#171027', text: '#FFFFFF', muted: '#D8D8D8',
        btnBg: '#D4A03A', btnHover: '#211638'
      },
      royal: {
        primary: '#D4A03A', secondary: '#E0A84A', accent: '#D4A03A',
        bg: '#121212', surface: '#1E1E1E', text: '#F5F5F5', muted: '#AAAAAA',
        btnBg: '#D4A03A', btnHover: '#2A2A2A'
      },
      ivory: {
        primary: '#C9972E', secondary: '#B8860B', accent: '#C9972E',
        bg: '#F7F4EE', surface: '#FFFFFF', text: '#1A1A1A', muted: '#555555',
        btnBg: '#C9972E', btnHover: '#333333'
      },
      emerald: {
        primary: '#2ECC71', secondary: '#27AE60', accent: '#2ECC71',
        bg: '#081C15', surface: '#102820', text: '#E8F5E9', muted: '#90A4AE',
        btnBg: '#2ECC71', btnHover: '#0B1510'
      },
      corporate: {
        primary: '#38BDF8', secondary: '#0284C7', accent: '#38BDF8',
        bg: '#0F172A', surface: '#1E293B', text: '#F8FAFC', muted: '#94A3B8',
        btnBg: '#38BDF8', btnHover: '#0F172A'
      }
    };
  }

  getTemplateUrl() {
    return '/admin/workspaces/appearance/presets.html';
  }

  init() {
    this.$$('.preset-option-card').forEach(card => {
      this.on(card, 'click', () => {
        const presetId = card.getAttribute('data-preset');
        this._applyPreset(presetId);
      });
    });
  }

  async load() {
    this.state.loading = true;
    const theme = await window.MZThemeStore.load();
    if (theme) {
      const activePreset = theme.meta?.activePresetId || 'velvet';
      this._highlightPresetCard(activePreset);
    }
    
    // Subscribe to state updates
    this.unsubscribe = window.MZThemeStore.subscribe((state) => {
      const activePreset = state.meta?.activePresetId || 'velvet';
      this._highlightPresetCard(activePreset);
    });

    this.state.loading = false;
  }

  validate() {
    return true;
  }

  async save() {
    const success = await window.MZThemeStore.save();
    if (success) {
      showToast('Theme presets saved successfully!', 'success');
      
      const iframe = document.getElementById('viewport-iframe');
      if (iframe) iframe.contentWindow.location.reload();
    } else {
      showToast('Failed to save theme preset', 'error');
    }
  }

  async reset() {
    if (!confirm('Revert all adjustments to factory defaults?')) return;
    this.state.loading = true;
    const success = await window.MZThemeStore.reset();
    if (success) {
      showToast('Theme values reset to factory defaults!', 'success');
    } else {
      showToast('Reset failed', 'error');
    }
    this.state.loading = false;
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    super.destroy();
  }

  _highlightPresetCard(presetId) {
    this.$$('.preset-option-card').forEach(c => c.classList.remove('active'));
    const activeCard = this.$(`#preset-${presetId}`);
    if (activeCard) {
      activeCard.classList.add('active');
    }
  }

  _applyPreset(presetId) {
    const p = this.presets[presetId];
    if (!p) return;

    window.MZThemeStore.update((state) => {
      state.meta = state.meta || {};
      state.meta.activePresetId = presetId;

      state.theme = state.theme || {};
      const t = state.theme;
      t.hdr = t.hdr || {};
      t.nav = t.nav || {};
      t.hero = t.hero || {};
      t.pc = t.pc || {};
      t.btn = t.btn || {};

      // Map presets values to payload schema
      t.hdr.logo_text = p.primary;
      t.hdr.border = p.primary;
      t.hdr.nav_link_color = p.text;
      t.hdr.nav_link_hover = p.secondary;
      t.hdr.nav_link_active = p.secondary;
      t.hdr.icon_color = p.text;
      t.hdr.icon_hover = p.secondary;
      t.hdr.bg = p.bg;
      t.hdr.sticky_bg = p.bg;

      t.nav.dropdown_bg = p.surface;
      t.nav.dropdown_border = p.primary;
      t.nav.dropdown_item_color = p.text;
      t.nav.dropdown_item_hover_color = p.primary;
      t.nav.mobile_bg = p.bg;
      t.nav.mobile_item = p.text;

      t.hero.headline_color = p.text;
      t.hero.subheadline_color = p.muted;
      t.hero.cta_primary_bg = p.btnBg;
      t.hero.cta_primary_text = p.bg;
      t.hero.cta_primary_hover_bg = p.btnHover;
      t.hero.badge_text = p.accent;

      t.pc.bg = p.surface;
      t.pc.border = p.primary;
      t.pc.image_bg = p.bg;
      t.pc.name_color = p.text;
      t.pc.category_color = p.muted;
      t.pc.current_price_color = p.btnBg;
      t.pc.original_price_color = p.muted;
      t.pc.rating_color = p.primary;
      t.pc.btn_bg = p.btnBg;
      t.pc.btn_text = p.bg;
      t.pc.btn_hover_bg = p.btnHover;

      t.btn.primary_bg = p.btnBg;
      t.btn.primary_hover_bg = p.btnHover;
    });

    this._highlightPresetCard(presetId);
    showToast(`Preset theme: ${presetId} applied in-memory. Click Save to publish.`, 'success');
  }
}
window.PresetsController = PresetsController;
