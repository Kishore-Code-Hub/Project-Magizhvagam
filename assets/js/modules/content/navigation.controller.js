/**
 * Navigation Controller — Content Workspace
 * Manages header and footer menu items, URLs, and sorting order.
 */
class NavigationController extends BaseController {
  constructor() {
    super('navigation');
    this._items = [];
  }

  getTemplateUrl() {
    return '/admin/workspaces/content/navigation.html';
  }

  init() {
    const saveBtn = this.$('#save-navigation-btn');
    if (saveBtn) {
      this.on(saveBtn, 'click', () => this.save());
    }
  }

  async load() {
    this.state.loading = true;
    try {
      const res = await adminFetch('/api/site-settings/navigation');
      const data = await res.json();
      if (data.success && data.data && data.data.items) {
        this._items = data.data.items;
        this._render();
      }
    } catch (err) {
      console.warn('[NavigationController] Failed loading navigation menu:', err);
    }
    this.state.loading = false;
  }

  validate() {
    for (const item of this._items) {
      if (!item.label || item.label.trim() === '') {
        showToast('Link Label is required for all menu items', 'error');
        return false;
      }
      if (!item.url || item.url.trim() === '') {
        showToast('Destination URL is required for all menu items', 'error');
        return false;
      }
    }
    return true;
  }

  async save() {
    if (!this.validate()) return;
    this.state.loading = true;

    try {
      const res = await adminFetch('/api/site-settings/navigation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: this._items })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Navigation menu saved!', 'success');
        this.state.dirty = false;
      } else {
        showToast(data.error || 'Failed to save navigation menu', 'error');
      }
    } catch (err) {
      showToast('Error persisting navigation menu', 'error');
    }
    this.state.loading = false;
  }

  async reset() {
    if (!confirm('Discard navigation modifications and reload?')) return;
    await this.load();
  }

  destroy() {
    this._items = [];
    super.destroy();
  }

  _render() {
    const container = this.$('#navigation-items-visual');
    if (!container) return;
    const items = this._items;

    container.innerHTML = items.map((item, index) => `
      <div class="visual-editor-card" style="padding:15px; border:1px solid var(--card-border); border-radius:10px; margin-bottom:12px; background:rgba(255,255,255,0.01);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <strong>Link Item ${index + 1}</strong>
          <div style="display:flex; gap:5px;">
            ${index > 0 ? `<button class="btn btn-secondary nav-up" data-i="${index}" style="padding:2px 8px; font-size:11px;">↑</button>` : ''}
            ${index < items.length - 1 ? `<button class="btn btn-secondary nav-down" data-i="${index}" style="padding:2px 8px; font-size:11px;">↓</button>` : ''}
            <button class="btn btn-secondary nav-remove" data-i="${index}" style="padding:2px 8px; font-size:11px; background:#ef4444; color:white;">Remove</button>
          </div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
          <div class="admin-form-group"><label style="font-size:11px; font-weight:700;">Link Label Text</label><input type="text" class="admin-form-control nav-field" data-i="${index}" data-field="label" value="${_escapeHtml(item.label || '')}"></div>
          <div class="admin-form-group"><label style="font-size:11px; font-weight:700;">Destination URL</label><input type="text" class="admin-form-control nav-field" data-i="${index}" data-field="url" value="${_escapeHtml(item.url || '')}"></div>
        </div>
      </div>
    `).join('') + `<button class="btn btn-secondary nav-add" style="width:100%; font-size:12px; margin-top:8px;">+ Add Menu Item</button>`;

    // Bind fields & buttons
    this.$$('.nav-field').forEach(input => this.on(input, 'input', () => { items[parseInt(input.dataset.i)][input.dataset.field] = input.value; }));
    this.$$('.nav-add').forEach(btn => this.on(btn, 'click', () => { items.push({ label: '', url: '' }); this._render(); }));
    this.$$('.nav-remove').forEach(btn => this.on(btn, 'click', () => { items.splice(parseInt(btn.dataset.i), 1); this._render(); }));
    this.$$('.nav-up').forEach(btn => this.on(btn, 'click', () => { const i = parseInt(btn.dataset.i); [items[i - 1], items[i]] = [items[i], items[i - 1]]; this._render(); }));
    this.$$('.nav-down').forEach(btn => this.on(btn, 'click', () => { const i = parseInt(btn.dataset.i); [items[i], items[i + 1]] = [items[i + 1], items[i]]; this._render(); }));
  }
}
window.NavigationController = NavigationController;
