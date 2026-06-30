/**
 * Content Controllers — Content Workspace
 * Each controller manages one isolated content sub-workspace.
 */

// ─── Shared Helpers ─────────────────────────────────────────────────────────────
function _escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function _pickImage(callback) {
  if (window.MZMediaLibrary && typeof window.MZMediaLibrary.openPicker === 'function') {
    window.MZMediaLibrary.openPicker(callback);
  } else {
    alert('Media Library is loading, please try again.');
  }
}

// ─── Homepage Controller ────────────────────────────────────────────────────────
class HomepageContentController extends BaseController {
  constructor() {
    super('homepage');
    this._homepageV4 = null;
    this._heroItems = [];
  }

  getTemplateUrl() { return '/admin/workspaces/content/homepage.html'; }

  init() {
    const saveSectionsBtn = this.$('#save-sections-order-btn');
    if (saveSectionsBtn) this.on(saveSectionsBtn, 'click', () => this._saveSectionsOrder());

    const saveHeroBtn = this.$('#save-hero-banners-btn');
    if (saveHeroBtn) this.on(saveHeroBtn, 'click', () => this._saveHeroBanners());
  }

  async load() {
    this.state.loading = true;
    try {
      const res = await adminFetch('/api/site-settings/homepage');
      const data = await res.json();
      if (data.success && data.data) {
        this._homepageV4 = data.data;
        this._renderSectionManager(data.data.sections);

        const heroSec = data.data.sections.find(s => s.id === 'hero');
        this._heroItems = (heroSec?.config?.banners) || [];
        this._renderHeroSliders();
      }
    } catch (err) {
      console.warn('Failed loading homepage contents', err);
    }
    this.state.loading = false;
  }

  _renderSectionManager(sections) {
    const container = this.$('#homepage-sections-manager');
    if (!container) return;
    const sorted = [...sections].sort((a, b) => a.order - b.order);

    container.innerHTML = sorted.map((sec, idx) => `
      <div class="glass-panel" style="padding:12px; border-radius:8px; border:1px solid var(--card-border); margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong style="text-transform:capitalize;">${sec.id.replace('_', ' ')}</strong>
          <div style="font-size:10px; color:var(--text-muted); margin-top:2px;">Sort Order: ${sec.order}</div>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <label class="toggle-switch" style="transform:scale(0.85);">
            <input type="checkbox" class="sec-toggle" data-id="${sec.id}" ${sec.enabled ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
          ${idx > 0 ? `<button class="btn btn-secondary sec-move" data-id="${sec.id}" data-dir="-1" style="padding:2px 8px; font-size:11px;">↑</button>` : ''}
          ${idx < sorted.length - 1 ? `<button class="btn btn-secondary sec-move" data-id="${sec.id}" data-dir="1" style="padding:2px 8px; font-size:11px;">↓</button>` : ''}
        </div>
      </div>
    `).join('');

    // Bind move buttons
    this.$$('.sec-move').forEach(btn => {
      this.on(btn, 'click', () => {
        this._moveSection(btn.dataset.id, parseInt(btn.dataset.dir));
      });
    });
  }

  _moveSection(id, direction) {
    if (!this._homepageV4) return;
    const sections = this._homepageV4.sections;
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const sortedIdx = sorted.findIndex(s => s.id === id);
    const targetIdx = sortedIdx + direction;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const temp = sorted[sortedIdx].order;
    sorted[sortedIdx].order = sorted[targetIdx].order;
    sorted[targetIdx].order = temp;
    this._renderSectionManager(sections);
  }

  async _saveSectionsOrder() {
    if (!this._homepageV4) return;
    this.$$('.sec-toggle').forEach(chk => {
      const sec = this._homepageV4.sections.find(s => s.id === chk.dataset.id);
      if (sec) sec.enabled = chk.checked;
    });
    try {
      const res = await adminFetch('/api/site-settings/homepage', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this._homepageV4)
      });
      const data = await res.json();
      if (data.success) showToast('Homepage layout order saved!', 'success');
      else showToast(data.error || 'Failed to save order', 'error');
    } catch (err) {
      showToast('Connection error saving homepage layout', 'error');
    }
  }

  _renderHeroSliders() {
    const container = this.$('#hero-banners-visual');
    if (!container) return;
    const items = this._heroItems;

    container.innerHTML = items.map((item, index) => `
      <div class="visual-editor-card" style="padding:15px; border:1px solid var(--card-border); border-radius:10px; margin-bottom:12px; background:rgba(255,255,255,0.01);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <strong>Slide ${index + 1}</strong>
          <div style="display:flex; gap:5px;">
            ${index > 0 ? `<button class="btn btn-secondary hero-up" data-i="${index}" style="padding:4px 8px; font-size:11px;">↑</button>` : ''}
            ${index < items.length - 1 ? `<button class="btn btn-secondary hero-down" data-i="${index}" style="padding:4px 8px; font-size:11px;">↓</button>` : ''}
            <button class="btn btn-secondary hero-remove" data-i="${index}" style="padding:4px 8px; font-size:11px; background:#ef4444; color:white;">Remove</button>
          </div>
        </div>
        ${item.image ? `<div style="position:relative; margin-bottom:8px;"><img src="${item.image}" style="width:100%; max-height:120px; object-fit:cover; border-radius:8px;"><div style="display:flex; gap:6px; margin-top:6px;"><button class="btn btn-secondary hero-pick" data-i="${index}" style="flex:1; padding:6px 10px; font-size:11px;">Replace Image</button><button class="btn btn-secondary hero-rmimg" data-i="${index}" style="padding:6px 10px; font-size:11px; background:#ef4444; color:white;">Remove Image</button></div></div>` : `<div style="border:1px dashed var(--card-border); border-radius:8px; padding:20px; text-align:center; font-size:12px; color:var(--text-muted); margin-bottom:8px;">No image selected</div><button class="btn btn-secondary hero-pick" data-i="${index}" style="width:100%; padding:6px; font-size:11px;">Select Image</button>`}
        <div class="admin-form-group" style="margin-top:8px;"><label style="font-size:11px; font-weight:700;">Headline Title</label><input type="text" class="admin-form-control hero-field" data-i="${index}" data-field="title" value="${_escapeHtml(item.title || '')}"></div>
        <div class="admin-form-group" style="margin-top:8px;"><label style="font-size:11px; font-weight:700;">Promo Subtitle</label><input type="text" class="admin-form-control hero-field" data-i="${index}" data-field="subtitle" value="${_escapeHtml(item.subtitle || '')}"></div>
        <div class="admin-form-group" style="margin-top:8px;"><label style="font-size:11px; font-weight:700;">Link URL</label><input type="text" class="admin-form-control hero-field" data-i="${index}" data-field="link" value="${_escapeHtml(item.link || '')}"></div>
      </div>
    `).join('') + `<button class="btn btn-secondary hero-add" style="width:100%; margin-top:8px;">+ Add Slide</button>`;

    // Bind events
    this.$$('.hero-field').forEach(input => this.on(input, 'input', () => { items[parseInt(input.dataset.i)][input.dataset.field] = input.value; }));
    this.$$('.hero-add').forEach(btn => this.on(btn, 'click', () => { items.push({ image: '', title: '', subtitle: '', link: '' }); this._renderHeroSliders(); }));
    this.$$('.hero-remove').forEach(btn => this.on(btn, 'click', () => { items.splice(parseInt(btn.dataset.i), 1); this._renderHeroSliders(); }));
    this.$$('.hero-up').forEach(btn => this.on(btn, 'click', () => { const i = parseInt(btn.dataset.i); [items[i - 1], items[i]] = [items[i], items[i - 1]]; this._renderHeroSliders(); }));
    this.$$('.hero-down').forEach(btn => this.on(btn, 'click', () => { const i = parseInt(btn.dataset.i); [items[i], items[i + 1]] = [items[i + 1], items[i]]; this._renderHeroSliders(); }));
    this.$$('.hero-pick').forEach(btn => this.on(btn, 'click', () => { _pickImage((asset) => { items[parseInt(btn.dataset.i)].image = asset.url; this._renderHeroSliders(); }); }));
    this.$$('.hero-rmimg').forEach(btn => this.on(btn, 'click', () => { items[parseInt(btn.dataset.i)].image = ''; this._renderHeroSliders(); }));
  }

  async _saveHeroBanners() {
    if (!this._homepageV4) return;
    const heroSec = this._homepageV4.sections.find(s => s.id === 'hero');
    if (heroSec) { heroSec.config = heroSec.config || {}; heroSec.config.banners = this._heroItems; }
    try {
      const res = await adminFetch('/api/site-settings/homepage', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this._homepageV4)
      });
      const data = await res.json();
      if (data.success) showToast('Hero sliders saved!', 'success');
      else showToast(data.error || 'Failed to save', 'error');
    } catch (err) { showToast('Error saving carousel slides', 'error'); }
  }

  destroy() {
    this._homepageV4 = null;
    this._heroItems = [];
    super.destroy();
  }
}
window.HomepageContentController = HomepageContentController;

// ─── Testimonials Controller ────────────────────────────────────────────────────
class TestimonialController extends BaseController {
  constructor() { super('testimonials'); this._items = []; this._homepageV4 = null; }
  getTemplateUrl() { return '/admin/workspaces/content/testimonial.html'; }

  init() {
    const saveBtn = this.$('#save-testimonials-btn');
    if (saveBtn) this.on(saveBtn, 'click', () => this._save());
  }

  async load() {
    try {
      const res = await adminFetch('/api/site-settings/homepage');
      const data = await res.json();
      if (data.success && data.data) {
        this._homepageV4 = data.data;
        const testSec = data.data.sections.find(s => s.id === 'testimonials');
        this._items = testSec?.config?.testimonials || [];
        this._render();
      }
    } catch (err) { console.warn('Failed loading testimonials', err); }
  }

  _render() {
    const container = this.$('#testimonials-visual');
    if (!container) return;
    const items = this._items;

    container.innerHTML = items.map((item, index) => `
      <div class="visual-editor-card" style="padding:15px; border:1px solid var(--card-border); border-radius:10px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <strong>Review ${index + 1}</strong>
          <button class="btn btn-secondary test-remove" data-i="${index}" style="padding:4px 8px; font-size:11px; background:#ef4444; color:white;">Remove</button>
        </div>
        <div class="admin-form-group"><label style="font-size:11px; font-weight:700;">Client Name</label><input type="text" class="admin-form-control test-field" data-i="${index}" data-field="name" value="${_escapeHtml(item.name || '')}"></div>
        <div class="admin-form-group"><label style="font-size:11px; font-weight:700;">Review Quote</label><textarea class="admin-form-control test-field" data-i="${index}" data-field="text" rows="3">${_escapeHtml(item.text || '')}</textarea></div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
          <div class="admin-form-group"><label style="font-size:11px; font-weight:700;">Rating (1-5)</label><input type="number" min="1" max="5" class="admin-form-control test-field" data-i="${index}" data-field="rating" value="${item.rating || 5}"></div>
          <div class="admin-form-group"><label style="font-size:11px; font-weight:700;">Occasion / Location</label><input type="text" class="admin-form-control test-field" data-i="${index}" data-field="location" value="${_escapeHtml(item.location || item.occasion || '')}"></div>
        </div>
      </div>
    `).join('') + `<button class="btn btn-secondary test-add" style="width:100%; font-size:12px;">+ Add Testimonial</button>`;

    this.$$('.test-field').forEach(input => this.on(input, 'input', () => { items[parseInt(input.dataset.i)][input.dataset.field] = input.value; }));
    this.$$('.test-remove').forEach(btn => this.on(btn, 'click', () => { items.splice(parseInt(btn.dataset.i), 1); this._render(); }));
    this.$$('.test-add').forEach(btn => this.on(btn, 'click', () => { items.push({ name: '', text: '', rating: 5, verified: true }); this._render(); }));
  }

  async _save() {
    if (!this._homepageV4) return;
    const testSec = this._homepageV4.sections.find(s => s.id === 'testimonials');
    if (testSec) { testSec.config = testSec.config || {}; testSec.config.testimonials = this._items; }
    try {
      const res = await adminFetch('/api/site-settings/homepage', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this._homepageV4) });
      const data = await res.json();
      if (data.success) showToast('Testimonials updated!', 'success');
      else showToast(data.error || 'Failed', 'error');
    } catch (err) { showToast('Error saving testimonials', 'error'); }
  }

  destroy() { this._items = []; this._homepageV4 = null; super.destroy(); }
}
window.TestimonialController = TestimonialController;

// ─── About Controller ───────────────────────────────────────────────────────────
class AboutController extends BaseController {
  constructor() { super('about'); }
  getTemplateUrl() { return '/admin/workspaces/content/about.html'; }

  init() {
    const form = this.$('#about-page-form');
    if (form) this.on(form, 'submit', (e) => this.save(e));

    const pickBtn = this.$('#about-pick-image');
    if (pickBtn) this.on(pickBtn, 'click', () => {
      _pickImage((asset) => {
        const field = this.$('#about-image-field');
        const preview = this.$('#about-image-preview');
        if (field) field.value = asset.url || '';
        if (preview) preview.innerHTML = `<img src="${asset.url}" style="width:100%; height:100%; object-fit:cover;">`;
      });
    });

    const clearBtn = this.$('#about-clear-image');
    if (clearBtn) this.on(clearBtn, 'click', () => {
      const field = this.$('#about-image-field');
      const preview = this.$('#about-image-preview');
      if (field) field.value = '';
      if (preview) preview.innerHTML = `<span style="color:var(--text-muted); font-size:12px;">No image selected</span>`;
    });
  }

  async load() {
    try {
      const res = await adminFetch('/api/about-page');
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const fields = { 'about-story-heading-field': d.storyHeading, 'about-story-intro-field': d.storyIntro, 'about-left-heading-field': d.leftHeading, 'about-left-p1-field': d.leftParagraph1, 'about-left-p2-field': d.leftParagraph2, 'about-image-field': d.image };
        for (const [id, val] of Object.entries(fields)) {
          const el = this.$('#' + id);
          if (el) el.value = val || '';
        }
        if (d.image) {
          const preview = this.$('#about-image-preview');
          if (preview) preview.innerHTML = `<img src="${d.image}" style="width:100%; height:100%; object-fit:cover;">`;
        }
      }
    } catch (err) { console.warn('Failed loading about page', err); }
  }

  async save(e) {
    if (e) e.preventDefault();
    const payload = {
      storyHeading: this.$('#about-story-heading-field')?.value.trim(),
      storyIntro: this.$('#about-story-intro-field')?.value.trim(),
      leftHeading: this.$('#about-left-heading-field')?.value.trim(),
      leftParagraph1: this.$('#about-left-p1-field')?.value.trim(),
      leftParagraph2: this.$('#about-left-p2-field')?.value.trim(),
      image: this.$('#about-image-field')?.value.trim()
    };
    try {
      const res = await adminFetch('/api/about-page', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) showToast('About Page details saved!', 'success');
      else showToast(data.error || 'Failed to save', 'error');
    } catch (err) { showToast('Error syncing about details', 'error'); }
  }
}
window.AboutController = AboutController;

// ─── Contact Controller ─────────────────────────────────────────────────────────
class ContactController extends BaseController {
  constructor() { super('contact'); }
  getTemplateUrl() { return '/admin/workspaces/content/contact.html'; }

  init() {
    const form = this.$('#contact-page-form');
    if (form) this.on(form, 'submit', (e) => this.save(e));
  }

  async load() {
    try {
      const res = await adminFetch('/api/settings/contact');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.setting) {
          const val = data.setting;
          const fields = { 'contact-phone': val.phone, 'contact-email': val.email, 'contact-address': val.address, 'contact-hours': val.hours, 'contact-map': val.map };
          for (const [id, v] of Object.entries(fields)) { const el = this.$('#' + id); if (el) el.value = v || ''; }
        }
      }
    } catch (err) { console.warn('Failed loading contact', err); }
  }

  async save(e) {
    if (e) e.preventDefault();
    const payload = { phone: this.$('#contact-phone')?.value.trim(), email: this.$('#contact-email')?.value.trim(), address: this.$('#contact-address')?.value.trim(), hours: this.$('#contact-hours')?.value.trim(), map: this.$('#contact-map')?.value.trim() };
    try {
      const res = await adminFetch('/api/settings/contact', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: payload }) });
      const data = await res.json();
      if (data.success) showToast('Contact Page details saved!', 'success');
      else showToast(data.error || 'Failed', 'error');
    } catch (err) { showToast('Connection error updating contact data', 'error'); }
  }
}
window.ContactController = ContactController;

// ─── Policies Controller ────────────────────────────────────────────────────────
class PoliciesController extends BaseController {
  constructor() { super('policies'); }
  getTemplateUrl() { return '/admin/workspaces/content/policies.html'; }

  init() {
    const privForm = this.$('#privacy-policy-form');
    if (privForm) this.on(privForm, 'submit', (e) => this._savePrivacy(e));
    const termsForm = this.$('#terms-service-form');
    if (termsForm) this.on(termsForm, 'submit', (e) => this._saveTerms(e));
  }

  async load() {
    try {
      const privRes = await adminFetch('/api/settings/privacy');
      if (privRes.ok) { const data = await privRes.json(); if (data.success && data.setting) { const el1 = this.$('#privacy-date'); const el2 = this.$('#privacy-text'); if (el1) el1.value = data.setting.date || ''; if (el2) el2.value = data.setting.text || ''; } }

      const termsRes = await adminFetch('/api/settings/terms');
      if (termsRes.ok) { const data = await termsRes.json(); if (data.success && data.setting) { const el1 = this.$('#terms-date'); const el2 = this.$('#terms-text'); if (el1) el1.value = data.setting.date || ''; if (el2) el2.value = data.setting.text || ''; } }
    } catch (err) { console.warn('Failed loading policies', err); }
  }

  async _savePrivacy(e) {
    if (e) e.preventDefault();
    try {
      const res = await adminFetch('/api/settings/privacy', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: { date: this.$('#privacy-date')?.value.trim(), text: this.$('#privacy-text')?.value.trim() } }) });
      const data = await res.json();
      if (data.success) showToast('Privacy Policy updated!', 'success');
      else showToast(data.error || 'Error', 'error');
    } catch (err) { showToast('Connection error', 'error'); }
  }

  async _saveTerms(e) {
    if (e) e.preventDefault();
    try {
      const res = await adminFetch('/api/settings/terms', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: { date: this.$('#terms-date')?.value.trim(), text: this.$('#terms-text')?.value.trim() } }) });
      const data = await res.json();
      if (data.success) showToast('Terms of Service updated!', 'success');
      else showToast(data.error || 'Error', 'error');
    } catch (err) { showToast('Connection error', 'error'); }
  }
}
window.PoliciesController = PoliciesController;

// ─── Navigation Controller ──────────────────────────────────────────────────────
class NavigationController extends BaseController {
  constructor() { super('navigation'); this._items = []; }
  getTemplateUrl() { return '/admin/workspaces/content/navigation.html'; }

  init() {
    const saveBtn = this.$('#save-navigation-btn');
    if (saveBtn) this.on(saveBtn, 'click', () => this._save());
  }

  async load() {
    try {
      const res = await adminFetch('/api/site-settings/navigation');
      const data = await res.json();
      if (data.success && data.data && data.data.items) {
        this._items = data.data.items;
        this._render();
      }
    } catch (err) { console.warn('Failed loading navigation', err); }
  }

  _render() {
    const container = this.$('#navigation-items-visual');
    if (!container) return;
    const items = this._items;

    container.innerHTML = items.map((item, index) => `
      <div class="visual-editor-card" style="padding:15px; border:1px solid var(--card-border); border-radius:10px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <strong>Link Item ${index + 1}</strong>
          <div style="display:flex; gap:5px;">
            ${index > 0 ? `<button class="btn btn-secondary nav-up" data-i="${index}" style="padding:2px 8px; font-size:11px;">↑</button>` : ''}
            ${index < items.length - 1 ? `<button class="btn btn-secondary nav-down" data-i="${index}" style="padding:2px 8px; font-size:11px;">↓</button>` : ''}
            <button class="btn btn-secondary nav-remove" data-i="${index}" style="padding:2px 8px; font-size:11px; background:#ef4444; color:white;">Remove</button>
          </div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
          <div class="admin-form-group"><label style="font-size:11px;">Link Label Text</label><input type="text" class="admin-form-control nav-field" data-i="${index}" data-field="label" value="${_escapeHtml(item.label || '')}"></div>
          <div class="admin-form-group"><label style="font-size:11px;">Destination URL</label><input type="text" class="admin-form-control nav-field" data-i="${index}" data-field="url" value="${_escapeHtml(item.url || '')}"></div>
        </div>
      </div>
    `).join('') + `<button class="btn btn-secondary nav-add" style="width:100%; font-size:12px;">+ Add Menu Item</button>`;

    this.$$('.nav-field').forEach(input => this.on(input, 'input', () => { items[parseInt(input.dataset.i)][input.dataset.field] = input.value; }));
    this.$$('.nav-add').forEach(btn => this.on(btn, 'click', () => { items.push({ label: '', url: '' }); this._render(); }));
    this.$$('.nav-remove').forEach(btn => this.on(btn, 'click', () => { items.splice(parseInt(btn.dataset.i), 1); this._render(); }));
    this.$$('.nav-up').forEach(btn => this.on(btn, 'click', () => { const i = parseInt(btn.dataset.i); [items[i - 1], items[i]] = [items[i], items[i - 1]]; this._render(); }));
    this.$$('.nav-down').forEach(btn => this.on(btn, 'click', () => { const i = parseInt(btn.dataset.i); [items[i], items[i + 1]] = [items[i + 1], items[i]]; this._render(); }));
  }

  async _save() {
    try {
      const res = await adminFetch('/api/site-settings/navigation', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: this._items }) });
      const data = await res.json();
      if (data.success) showToast('Navigation menu saved!', 'success');
      else showToast(data.error || 'Failed', 'error');
    } catch (err) { showToast('Error saving navigation', 'error'); }
  }

  destroy() { this._items = []; super.destroy(); }
}
window.NavigationController = NavigationController;
