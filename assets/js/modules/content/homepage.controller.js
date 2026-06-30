/**
 * Homepage Content Controller — Content Workspace
 * Manages homepage block sorting order and hero slide carousels.
 */
class HomepageContentController extends BaseController {
  constructor() {
    super('homepage');
    this._homepageV4 = null;
    this._heroItems = [];
  }

  getTemplateUrl() {
    return '/admin/workspaces/content/homepage.html';
  }

  init() {
    const saveSectionsBtn = this.$('#save-sections-order-btn');
    if (saveSectionsBtn) {
      this.on(saveSectionsBtn, 'click', () => this.save());
    }

    const saveHeroBtn = this.$('#save-hero-banners-btn');
    if (saveHeroBtn) {
      this.on(saveHeroBtn, 'click', () => this.save());
    }
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
      console.warn('[HomepageController] Failed loading homepage details:', err);
    }
    this.state.loading = false;
  }

  validate() {
    // Basic verification: ensure titles are set for banner slides
    for (const slide of this._heroItems) {
      if (slide.title && slide.title.trim().length > 100) {
        showToast('Headline cannot exceed 100 characters', 'error');
        return false;
      }
    }
    return true;
  }

  async save() {
    if (!this.validate()) return;
    if (!this._homepageV4) return;

    this.state.loading = true;
    
    // Sync toggle values
    this.$$('.sec-toggle').forEach(chk => {
      const sec = this._homepageV4.sections.find(s => s.id === chk.dataset.id);
      if (sec) sec.enabled = chk.checked;
    });

    // Update banners config
    const heroSec = this._homepageV4.sections.find(s => s.id === 'hero');
    if (heroSec) {
      heroSec.config = heroSec.config || {};
      heroSec.config.banners = this._heroItems;
    }

    try {
      const res = await adminFetch('/api/site-settings/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this._homepageV4)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Homepage layout changes saved!', 'success');
        this.state.dirty = false;
      } else {
        showToast(data.error || 'Failed to save changes', 'error');
      }
    } catch (err) {
      showToast('Error persisting homepage layout', 'error');
    }
    this.state.loading = false;
  }

  async reset() {
    if (!confirm('Revert homepage sections order and banners to default Ivory Light theme?')) return;
    this.state.loading = true;
    try {
      const res = await adminFetch('/api/settings/homepage/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Homepage settings reset to defaults!', 'success');
        await this.load();
      } else {
        showToast(data.error || 'Reset failed', 'error');
      }
    } catch (err) {
      showToast('Connection error resetting homepage', 'error');
    }
    this.state.loading = false;
  }

  destroy() {
    this._homepageV4 = null;
    this._heroItems = [];
    super.destroy();
  }

  // ─── Visual Rendering Helpers ──────────────────────────────────────────────

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

    // Bind buttons
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

    // Bind fields & buttons
    this.$$('.hero-field').forEach(input => this.on(input, 'input', () => { items[parseInt(input.dataset.i)][input.dataset.field] = input.value; }));
    this.$$('.hero-add').forEach(btn => this.on(btn, 'click', () => { items.push({ image: '', title: '', subtitle: '', link: '' }); this._renderHeroSliders(); }));
    this.$$('.hero-remove').forEach(btn => this.on(btn, 'click', () => { items.splice(parseInt(btn.dataset.i), 1); this._renderHeroSliders(); }));
    this.$$('.hero-up').forEach(btn => this.on(btn, 'click', () => { const i = parseInt(btn.dataset.i); [items[i - 1], items[i]] = [items[i], items[i - 1]]; this._renderHeroSliders(); }));
    this.$$('.hero-down').forEach(btn => this.on(btn, 'click', () => { const i = parseInt(btn.dataset.i); [items[i], items[i + 1]] = [items[i + 1], items[i]]; this._renderHeroSliders(); }));
    this.$$('.hero-pick').forEach(btn => this.on(btn, 'click', () => { _pickImage((asset) => { items[parseInt(btn.dataset.i)].image = asset.url; this._renderHeroSliders(); }); }));
    this.$$('.hero-rmimg').forEach(btn => this.on(btn, 'click', () => { items[parseInt(btn.dataset.i)].image = ''; this._renderHeroSliders(); }));
  }
}
window.HomepageContentController = HomepageContentController;
