/**
 * Policies Controller — Content Workspace
 * Manages Refund Policies, Terms of Service, and Privacy policy content text blocks.
 */
class PoliciesController extends BaseController {
  constructor() {
    super('policies');
  }

  getTemplateUrl() {
    return '/admin/workspaces/content/policies.html';
  }

  init() {
    const privForm = this.$('#privacy-policy-form');
    if (privForm) {
      this.on(privForm, 'submit', (e) => this._savePrivacy(e));
    }
    const termsForm = this.$('#terms-service-form');
    if (termsForm) {
      this.on(termsForm, 'submit', (e) => this._saveTerms(e));
    }
  }

  async load() {
    this.state.loading = true;
    try {
      const privRes = await adminFetch('/api/settings/privacy');
      if (privRes.ok) {
        const data = await privRes.ok && await privRes.json();
        if (data.success && data.setting) {
          const el1 = this.$('#privacy-date');
          const el2 = this.$('#privacy-text');
          if (el1) el1.value = data.setting.date || '';
          if (el2) el2.value = data.setting.text || '';
        }
      }

      const termsRes = await adminFetch('/api/settings/terms');
      if (termsRes.ok) {
        const data = await termsRes.json();
        if (data.success && data.setting) {
          const el1 = this.$('#terms-date');
          const el2 = this.$('#terms-text');
          if (el1) el1.value = data.setting.date || '';
          if (el2) el2.value = data.setting.text || '';
        }
      }
    } catch (err) {
      console.warn('[PoliciesController] Failed loading policies page details:', err);
    }
    this.state.loading = false;
  }

  validate() {
    // Both text blocks must be filled if specified
    return true;
  }

  // Generic save method maps to saving both forms
  async save() {
    this.state.loading = true;
    await Promise.all([
      this._savePrivacy(),
      this._saveTerms()
    ]);
    this.state.loading = false;
  }

  async _savePrivacy(e) {
    if (e) e.preventDefault();
    try {
      const res = await adminFetch('/api/settings/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: {
            date: this.$('#privacy-date')?.value.trim(),
            text: this.$('#privacy-text')?.value.trim()
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Privacy Policy updated!', 'success');
      } else {
        showToast(data.error || 'Error saving Privacy Policy', 'error');
      }
    } catch (err) {
      showToast('Connection error updating Privacy Policy', 'error');
    }
  }

  async _saveTerms(e) {
    if (e) e.preventDefault();
    try {
      const res = await adminFetch('/api/settings/terms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: {
            date: this.$('#terms-date')?.value.trim(),
            text: this.$('#terms-text')?.value.trim()
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Terms of Service updated!', 'success');
      } else {
        showToast(data.error || 'Error saving Terms of Service', 'error');
      }
    } catch (err) {
      showToast('Connection error updating Terms of Service', 'error');
    }
  }

  async reset() {
    if (!confirm('Discard changes and reload policy parameters?')) return;
    await this.load();
  }

  destroy() {
    super.destroy();
  }
}
window.PoliciesController = PoliciesController;
