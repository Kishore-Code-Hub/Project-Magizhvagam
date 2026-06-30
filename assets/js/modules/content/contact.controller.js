/**
 * Contact Controller — Content Workspace
 * Manages the corporate contact details: email, phone, location, maps.
 */
class ContactController extends BaseController {
  constructor() {
    super('contact');
  }

  getTemplateUrl() {
    return '/admin/workspaces/content/contact.html';
  }

  init() {
    const form = this.$('#contact-page-form');
    if (form) {
      this.on(form, 'submit', (e) => this.save(e));
    }
  }

  async load() {
    this.state.loading = true;
    try {
      const res = await adminFetch('/api/settings/contact');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.setting) {
          const val = data.setting;
          const fields = {
            'contact-phone': val.phone,
            'contact-email': val.email,
            'contact-address': val.address,
            'contact-hours': val.hours,
            'contact-map': val.map
          };
          for (const [id, v] of Object.entries(fields)) {
            const el = this.$('#' + id);
            if (el) el.value = v || '';
          }
        }
      }
    } catch (err) {
      console.warn('[ContactController] Failed loading contact details:', err);
    }
    this.state.loading = false;
  }

  validate() {
    const email = this.$('#contact-email')?.value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please provide a valid support email address', 'error');
      return false;
    }
    const phone = this.$('#contact-phone')?.value.trim();
    if (phone && !/^\+?[\d\s-]{8,15}$/.test(phone)) {
      showToast('Please provide a valid contact phone number', 'error');
      return false;
    }
    return true;
  }

  async save(e) {
    if (e) e.preventDefault();
    if (!this.validate()) return;

    this.state.loading = true;
    const payload = {
      phone: this.$('#contact-phone')?.value.trim(),
      email: this.$('#contact-email')?.value.trim(),
      address: this.$('#contact-address')?.value.trim(),
      hours: this.$('#contact-hours')?.value.trim(),
      map: this.$('#contact-map')?.value.trim()
    };

    try {
      const res = await adminFetch('/api/settings/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: payload })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Contact Page details saved!', 'success');
        this.state.dirty = false;
      } else {
        showToast(data.error || 'Failed to save contact details', 'error');
      }
    } catch (err) {
      showToast('Connection error updating contact data', 'error');
    }
    this.state.loading = false;
  }

  async reset() {
    if (!confirm('Revert unsaved changes on contact information?')) return;
    await this.load();
  }

  destroy() {
    super.destroy();
  }
}
window.ContactController = ContactController;
