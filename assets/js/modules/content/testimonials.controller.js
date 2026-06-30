/**
 * Testimonials Controller — Content Workspace
 * Manages client reviews and ratings.
 */
class TestimonialsController extends BaseController {
  constructor() {
    super('testimonials');
    this._items = [];
    this._homepageV4 = null;
  }

  getTemplateUrl() {
    return '/admin/workspaces/content/testimonials.html';
  }

  init() {
    const saveBtn = this.$('#save-testimonials-btn');
    if (saveBtn) {
      this.on(saveBtn, 'click', () => this.save());
    }
  }

  async load() {
    this.state.loading = true;
    try {
      const res = await adminFetch('/api/site-settings/homepage');
      const data = await res.json();
      if (data.success && data.data) {
        this._homepageV4 = data.data;
        const testSec = data.data.sections.find(s => s.id === 'testimonials');
        this._items = (testSec?.config?.testimonials) || [];
        this._render();
      }
    } catch (err) {
      console.warn('[TestimonialsController] Failed loading testimonials:', err);
    }
    this.state.loading = false;
  }

  validate() {
    for (const item of this._items) {
      if (!item.name || item.name.trim() === '') {
        showToast('Client Name is required for all testimonials', 'error');
        return false;
      }
      if (!item.text || item.text.trim() === '') {
        showToast('Review quote text is required for all testimonials', 'error');
        return false;
      }
      const rating = Number(item.rating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        showToast('Rating must be between 1 and 5 stars', 'error');
        return false;
      }
    }
    return true;
  }

  async save() {
    if (!this.validate()) return;
    if (!this._homepageV4) return;

    this.state.loading = true;
    const testSec = this._homepageV4.sections.find(s => s.id === 'testimonials');
    if (testSec) {
      testSec.config = testSec.config || {};
      testSec.config.testimonials = this._items;
    }

    try {
      const res = await adminFetch('/api/site-settings/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this._homepageV4)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Testimonials saved successfully!', 'success');
        this.state.dirty = false;
      } else {
        showToast(data.error || 'Failed to save testimonials', 'error');
      }
    } catch (err) {
      showToast('Error persisting testimonials', 'error');
    }
    this.state.loading = false;
  }

  async reset() {
    if (!confirm('Discard changes and reload testimonials?')) return;
    await this.load();
  }

  destroy() {
    this._items = [];
    this._homepageV4 = null;
    super.destroy();
  }

  _render() {
    const container = this.$('#testimonials-visual');
    if (!container) return;
    const items = this._items;

    container.innerHTML = items.map((item, index) => `
      <div class="visual-editor-card" style="padding:15px; border:1px solid var(--card-border); border-radius:10px; margin-bottom:12px; background:rgba(255,255,255,0.01);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <strong>Review ${index + 1}</strong>
          <button class="btn btn-secondary test-remove" data-i="${index}" style="padding:4px 8px; font-size:11px; background:#ef4444; color:white;">Remove</button>
        </div>
        <div class="admin-form-group"><label style="font-size:11px; font-weight:700;">Client Name</label><input type="text" class="admin-form-control test-field" data-i="${index}" data-field="name" value="${_escapeHtml(item.name || '')}"></div>
        <div class="admin-form-group" style="margin-top:8px;"><label style="font-size:11px; font-weight:700;">Review Quote</label><textarea class="admin-form-control test-field" data-i="${index}" data-field="text" rows="3">${_escapeHtml(item.text || '')}</textarea></div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-top:8px;">
          <div class="admin-form-group"><label style="font-size:11px; font-weight:700;">Rating (1-5)</label><input type="number" min="1" max="5" class="admin-form-control test-field" data-i="${index}" data-field="rating" value="${item.rating || 5}"></div>
          <div class="admin-form-group"><label style="font-size:11px; font-weight:700;">Occasion / Location</label><input type="text" class="admin-form-control test-field" data-i="${index}" data-field="location" value="${_escapeHtml(item.location || item.occasion || '')}"></div>
        </div>
      </div>
    `).join('') + `<button class="btn btn-secondary test-add" style="width:100%; font-size:12px; margin-top:8px;">+ Add Testimonial</button>`;

    // Bind fields & buttons
    this.$$('.test-field').forEach(input => this.on(input, 'input', () => { items[parseInt(input.dataset.i)][input.dataset.field] = input.value; }));
    this.$$('.test-remove').forEach(btn => this.on(btn, 'click', () => { items.splice(parseInt(btn.dataset.i), 1); this._render(); }));
    this.$$('.test-add').forEach(btn => this.on(btn, 'click', () => { items.push({ name: '', text: '', rating: 5, verified: true }); this._render(); }));
  }
}
window.TestimonialsController = TestimonialsController;
window.TestimonialController = TestimonialsController; // compatibility fallback
