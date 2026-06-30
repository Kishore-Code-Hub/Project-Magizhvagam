/**
 * Coupon Controller — Marketing Workspace
 * Manages coupon CRUD operations with full lifecycle isolation.
 */
class CouponController extends BaseController {
  constructor() {
    super('coupon');
  }

  getTemplateUrl() {
    return '/admin/workspaces/marketing/coupon.html';
  }

  init() {
    const form = this.$('#coupon-creator-form');
    if (form) {
      this.on(form, 'submit', (e) => this._handleCreate(e));
    }
  }

  async load() {
    this.state.loading = true;
    const cacheKey = 'marketing:coupons';
    const cached = this._routerCache?.get(cacheKey);
    if (cached) {
      this._renderList(cached);
      this.state.loading = false;
      return;
    }

    const container = this.$('#coupons-list-container');
    if (!container) return;

    try {
      const res = await adminFetch('/api/settings/coupons');
      const data = await res.json();
      if (data.success && data.coupons) {
        this.state.data = data.coupons;
        this._routerCache?.set(cacheKey, data.coupons);
        this._renderList(data.coupons);
      }
    } catch (err) {
      container.innerHTML = '<p style="color:#ef4444; font-size:12px;">Error loading coupons.</p>';
    }
    this.state.loading = false;
  }

  _renderList(coupons) {
    const container = this.$('#coupons-list-container');
    if (!container) return;

    if (!coupons || coupons.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted); font-size:12px; text-align:center;">No coupons created yet.</p>';
      return;
    }

    container.innerHTML = coupons.map(c => `
      <div class="glass-panel" style="padding:12px; border-radius:8px; border:1px solid var(--card-border); display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong style="color:var(--primary-color);">${c.code}</strong>
          <span style="font-size:11px; margin-left:8px; color:var(--text-muted);">${c.discountType === 'Percentage' ? c.discountValue + '%' : '₹' + c.discountValue} OFF</span>
          <div style="color:var(--text-muted); font-size:10px; margin-top:2px;">Min spend: ₹${c.minOrderValue} | Expires: ${new Date(c.expiresAt).toLocaleDateString()}</div>
        </div>
        <button class="coupon-delete-btn" data-id="${c._id}" style="background:transparent; border:none; cursor:pointer; padding:4px;" title="Delete Coupon">
          <i data-lucide="trash-2" style="width:16px; height:16px; color:#ef4444;"></i>
        </button>
      </div>
    `).join('');

    // Bind delete buttons using managed listeners
    this.$$('.coupon-delete-btn').forEach(btn => {
      this.on(btn, 'click', () => this._handleDelete(btn.dataset.id));
    });

    if (typeof window.renderIcons === 'function') window.renderIcons();
  }

  async _handleCreate(e) {
    e.preventDefault();
    const code = this.$('#cp-code').value.toUpperCase().trim();
    const discountType = this.$('#cp-type').value;
    const discountValue = this.$('#cp-value').value;
    const minOrderValue = this.$('#cp-min-value').value;
    const expiresAt = this.$('#cp-expiry').value;

    try {
      const res = await adminFetch('/api/settings/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, discountType, discountValue, minOrderValue, expiresAt })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Discount coupon created successfully!', 'success');
        this.$('#coupon-creator-form').reset();
        this._routerCache?.invalidate('marketing:coupons');
        await this.load();
      } else {
        showToast(data.error || 'Failed to save coupon', 'error');
      }
    } catch (err) {
      showToast('Error saving coupon', 'error');
    }
  }

  async _handleDelete(id) {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await adminFetch(`/api/settings/coupons/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Coupon deleted successfully!', 'success');
        this._routerCache?.invalidate('marketing:coupons');
        await this.load();
      } else {
        showToast(data.error || 'Failed to delete coupon', 'error');
      }
    } catch (err) {
      showToast('Connection error during deletion', 'error');
    }
  }
}

window.CouponController = CouponController;
