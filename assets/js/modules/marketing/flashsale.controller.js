/**
 * Flash Sale Controller — Marketing Workspace
 * Manages flash sale countdown toggle, text, and target date.
 */
class FlashSaleController extends BaseController {
  constructor() {
    super('flash-sales');
  }

  getTemplateUrl() {
    return '/admin/workspaces/marketing/flashsale.html';
  }

  init() {
    const toggle = this.$('#toggle-flashSaleActive');
    if (toggle) {
      this.on(toggle, 'change', () => this._updateToggle('flashSaleActive', toggle.checked));
    }

    const saveBtn = this.$('#save-flash-sale-btn');
    if (saveBtn) {
      this.on(saveBtn, 'click', () => this._saveAll());
    }
  }

  async load() {
    this.state.loading = true;
    const cacheKey = 'marketing:flashsale';
    const cached = this._routerCache?.get(cacheKey);
    if (cached) {
      this._populateFields(cached);
      this.state.loading = false;
      return;
    }

    try {
      const res = await adminFetch('/api/settings/featureToggles');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.setting) {
          this.state.data = data.setting;
          this._routerCache?.set(cacheKey, data.setting);
          this._populateFields(data.setting);
        }
      }
    } catch (err) {
      console.warn('Failed to load flash sale settings', err);
    }
    this.state.loading = false;
  }

  _populateFields(val) {
    const toggle = this.$('#toggle-flashSaleActive');
    const textInput = this.$('#input-flashSaleText');
    const dateInput = this.$('#input-flashSaleTargetDate');

    if (toggle) toggle.checked = !!val.flashSaleActive;
    if (textInput) textInput.value = val.flashSaleText || '';
    if (dateInput && val.flashSaleTargetDate) {
      dateInput.value = new Date(val.flashSaleTargetDate).toISOString().slice(0, 16);
    }
  }

  async _updateToggle(key, val) {
    try {
      const res = await adminFetch('/api/settings/feature-toggles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggles: { [key]: val } })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Flash sale status updated!', 'success');
        this._routerCache?.invalidate('marketing:flashsale');
      } else {
        showToast(data.error || 'Failed to update toggle', 'error');
      }
    } catch (err) {
      showToast('Error syncing toggle state', 'error');
    }
  }

  async _saveAll() {
    const text = this.$('#input-flashSaleText')?.value || '';
    const dateVal = this.$('#input-flashSaleTargetDate')?.value;
    const payloadDate = dateVal ? new Date(dateVal).toISOString() : null;

    try {
      const res = await adminFetch('/api/settings/feature-toggles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggles: { flashSaleText: text, flashSaleTargetDate: payloadDate } })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Flash sale settings saved!', 'success');
        this._routerCache?.invalidate('marketing:flashsale');
      } else {
        showToast(data.error || 'Failed to save', 'error');
      }
    } catch (err) {
      showToast('Error saving flash sale', 'error');
    }
  }
}

window.FlashSaleController = FlashSaleController;
