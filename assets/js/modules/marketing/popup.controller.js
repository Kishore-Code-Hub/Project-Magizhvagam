/**
 * Popup Builder Controller — Marketing Workspace
 * Manages promotional lightbox popup configuration.
 */
class PopupController extends BaseController {
  constructor() {
    super('popup');
  }

  getTemplateUrl() {
    return '/admin/workspaces/marketing/popup.html';
  }

  init() {
    const form = this.$('#popup-builder-form');
    if (form) {
      this.on(form, 'submit', (e) => this._handleSave(e));
    }
  }

  async load() {
    this.state.loading = true;
    try {
      const res = await adminFetch('/api/settings/popup');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.setting) {
          const val = data.setting;
          const fields = {
            'popup-active': { type: 'checkbox', value: !!val.active },
            'popup-title': { type: 'text', value: val.title || '' },
            'popup-desc': { type: 'text', value: val.desc || '' },
            'popup-delay': { type: 'text', value: val.delay || 5 },
            'popup-cta-text': { type: 'text', value: val.ctaText || '' },
            'popup-cta-link': { type: 'text', value: val.ctaLink || '' }
          };
          for (const [id, config] of Object.entries(fields)) {
            const el = this.$('#' + id);
            if (!el) continue;
            if (config.type === 'checkbox') {
              el.checked = config.value;
            } else {
              el.value = config.value;
            }
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load popup config', err);
    }
    this.state.loading = false;
  }

  async _handleSave(e) {
    e.preventDefault();
    const active = this.$('#popup-active')?.checked;
    const title = this.$('#popup-title')?.value.trim();
    const desc = this.$('#popup-desc')?.value.trim();
    const delay = parseInt(this.$('#popup-delay')?.value, 10) || 5;
    const ctaText = this.$('#popup-cta-text')?.value.trim();
    const ctaLink = this.$('#popup-cta-link')?.value.trim();

    try {
      const res = await adminFetch('/api/settings/popup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: { active, title, desc, delay, ctaText, ctaLink } })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Promotional lightbox popup saved!', 'success');
      } else {
        showToast(data.error || 'Failed to save configuration', 'error');
      }
    } catch (err) {
      showToast('Connection error saving popup settings', 'error');
    }
  }
}

window.PopupController = PopupController;
