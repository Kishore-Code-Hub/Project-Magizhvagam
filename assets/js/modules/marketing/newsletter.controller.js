/**
 * Newsletter Controller — Marketing Workspace
 * Manages mailing list settings and subscriber display.
 */
class NewsletterController extends BaseController {
  constructor() {
    super('newsletter');
  }

  getTemplateUrl() {
    return '/admin/workspaces/marketing/newsletter.html';
  }

  init() {
    const form = this.$('#newsletter-settings-form');
    if (form) {
      this.on(form, 'submit', (e) => this._handleSave(e));
    }
  }

  async load() {
    this.state.loading = true;
    try {
      // Load newsletter settings
      const res = await adminFetch('/api/settings/newsletter');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.setting) {
          const titleField = this.$('#newsletter-title-field');
          const incentiveField = this.$('#newsletter-incentive-field');
          if (titleField) titleField.value = data.setting.title || '';
          if (incentiveField) incentiveField.value = data.setting.incentive || '';
        }
      }

      // Load subscribers
      const subRes = await adminFetch('/api/settings/subscribers');
      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.success && subData.subscribers) {
          const container = this.$('#newsletter-subscribers-container');
          if (!container) return;
          if (subData.subscribers.length === 0) {
            container.innerHTML = '<div class="glass-panel" style="padding:15px; border-radius:6px; text-align:center; color:var(--text-muted); border:1px solid var(--card-border);">No subscribers registered yet.</div>';
            return;
          }
          container.innerHTML = subData.subscribers.map(email => `
            <div class="glass-panel" style="padding:12px; border-radius:8px; border:1px solid var(--card-border); display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:13px; font-weight:600; color:var(--text-color);">${email}</span>
              <i data-lucide="mail" style="width:16px; height:16px; color:var(--text-muted);"></i>
            </div>
          `).join('');
          if (typeof window.renderIcons === 'function') window.renderIcons();
        }
      }
    } catch (err) {
      console.warn('Failed to load newsletter data', err);
    }
    this.state.loading = false;
  }

  async _handleSave(e) {
    e.preventDefault();
    const title = this.$('#newsletter-title-field')?.value.trim();
    const incentive = this.$('#newsletter-incentive-field')?.value.trim();

    try {
      const res = await adminFetch('/api/settings/newsletter', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: { title, incentive } })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Mailing list settings updated!', 'success');
      } else {
        showToast(data.error || 'Failed to save settings', 'error');
      }
    } catch (err) {
      showToast('Connection error updating newsletter settings', 'error');
    }
  }
}

window.NewsletterController = NewsletterController;
