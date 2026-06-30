/**
 * Settings Controllers — System Workspace
 * Each controller manages one isolated settings sub-workspace.
 */

// ─── Helper: Generic Setting Loader ─────────────────────────────────────────────
async function _loadSettingGeneric(controller, key, defaults, mapping) {
  try {
    const res = await adminFetch(`/api/settings/${key}`);
    if (!res.ok) return;
    const data = await res.json();
    const values = (data && data.success && data.setting) ? data.setting : defaults;
    for (const [fieldId, valKey] of Object.entries(mapping)) {
      const el = controller.$('#' + fieldId);
      if (!el) continue;
      if (el.type === 'checkbox') {
        el.checked = !!values[valKey];
      } else {
        el.value = values[valKey] || '';
      }
    }
  } catch (err) {
    console.warn(`Failed loading setting: ${key}`, err);
  }
}

async function _saveSettingGeneric(key, payloadData, successMsg) {
  try {
    const res = await adminFetch(`/api/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: payloadData })
    });
    const data = await res.json();
    if (data.success) {
      showToast(successMsg, 'success');
    } else {
      showToast(data.error || 'Failed to save configuration', 'error');
    }
  } catch (err) {
    showToast('Error syncing system configurations', 'error');
  }
}

// ─── General Controller ─────────────────────────────────────────────────────────
class GeneralSettingsController extends BaseController {
  constructor() { super('general'); }
  getTemplateUrl() { return '/admin/workspaces/settings/general.html'; }

  init() {
    const form = this.$('#general-settings-form');
    if (form) this.on(form, 'submit', (e) => this.save(e));
  }

  async load() {
    await _loadSettingGeneric(this, 'general',
      { name: 'MAGIZHVAGAM', tagline: 'PREMIUM RETURN GIFTS', currency: '₹', email: 'contact@magizhvagam.com' },
      { 'general-store-name': 'name', 'general-store-tagline': 'tagline', 'general-currency': 'currency', 'general-support-email': 'email' }
    );
  }

  async save(e) {
    if (e) e.preventDefault();
    await _saveSettingGeneric('general', {
      name: this.$('#general-store-name')?.value.trim(),
      tagline: this.$('#general-store-tagline')?.value.trim(),
      currency: this.$('#general-currency')?.value.trim(),
      email: this.$('#general-support-email')?.value.trim()
    }, 'General profile settings updated!');
  }
}
window.GeneralSettingsController = GeneralSettingsController;

// ─── SEO Controller ─────────────────────────────────────────────────────────────
class SeoSettingsController extends BaseController {
  constructor() { super('seo'); }
  getTemplateUrl() { return '/admin/workspaces/settings/seo.html'; }

  init() {
    const form = this.$('#seo-settings-form');
    if (form) this.on(form, 'submit', (e) => this.save(e));
  }

  async load() {
    await _loadSettingGeneric(this, 'seo', { title: '', desc: '', keywords: '' },
      { 'seo-title': 'title', 'seo-desc': 'desc', 'seo-keywords': 'keywords' }
    );
  }

  async save(e) {
    if (e) e.preventDefault();
    await _saveSettingGeneric('seo', {
      title: this.$('#seo-title')?.value.trim(),
      desc: this.$('#seo-desc')?.value.trim(),
      keywords: this.$('#seo-keywords')?.value.trim()
    }, 'SEO metadata indexing updated!');
  }
}
window.SeoSettingsController = SeoSettingsController;

// ─── Analytics Controller ───────────────────────────────────────────────────────
class AnalyticsSettingsController extends BaseController {
  constructor() { super('analytics'); }
  getTemplateUrl() { return '/admin/workspaces/settings/analytics.html'; }

  init() {
    const form = this.$('#analytics-settings-form');
    if (form) this.on(form, 'submit', (e) => this.save(e));
  }

  async load() {
    await _loadSettingGeneric(this, 'analytics', { ga: '', pixel: '' },
      { 'analytics-ga': 'ga', 'analytics-pixel': 'pixel' }
    );
  }

  async save(e) {
    if (e) e.preventDefault();
    await _saveSettingGeneric('analytics', {
      ga: this.$('#analytics-ga')?.value.trim(),
      pixel: this.$('#analytics-pixel')?.value.trim()
    }, 'Analytics tracking codes updated!');
  }
}
window.AnalyticsSettingsController = AnalyticsSettingsController;

// ─── Integrations Controller ────────────────────────────────────────────────────
class IntegrationsSettingsController extends BaseController {
  constructor() { super('integrations'); }
  getTemplateUrl() { return '/admin/workspaces/settings/integrations.html'; }

  init() {
    const form = this.$('#integrations-settings-form');
    if (form) this.on(form, 'submit', (e) => this.save(e));
  }

  async load() {
    await _loadSettingGeneric(this, 'integrations', { paymentMode: 'Sandbox', shippingUrl: '' },
      { 'integration-payment-mode': 'paymentMode', 'integration-shipping-url': 'shippingUrl' }
    );
  }

  async save(e) {
    if (e) e.preventDefault();
    await _saveSettingGeneric('integrations', {
      paymentMode: this.$('#integration-payment-mode')?.value,
      shippingUrl: this.$('#integration-shipping-url')?.value.trim()
    }, 'External API settings saved!');
  }
}
window.IntegrationsSettingsController = IntegrationsSettingsController;

// ─── Mobile Controller ──────────────────────────────────────────────────────────
class MobileSettingsController extends BaseController {
  constructor() { super('mobile-settings'); }
  getTemplateUrl() { return '/admin/workspaces/settings/mobile.html'; }

  init() {
    const form = this.$('#mobile-settings-form');
    if (form) this.on(form, 'submit', (e) => this.save(e));
  }

  async load() {
    try {
      const res = await adminFetch('/api/site-settings/theme');
      const themeData = await res.json();
      if (themeData.success && themeData.data) {
        const t = themeData.data;
        const fontField = this.$('#mobile-font-scale-field');
        const heightField = this.$('#mobile-header-height-field');
        const bgField = this.$('#mobile-nav-bg-field');
        if (fontField) fontField.value = t.layout?.mobileFontScale || 0.9;
        if (heightField) heightField.value = t.theme?.hdr?.mobile_height || 64;
        if (bgField) bgField.value = t.theme?.nav?.mobile_bg || '#0b0618';
      }
    } catch (err) {
      console.warn('Failed loading mobile settings', err);
    }
  }

  async save(e) {
    if (e) e.preventDefault();
    const mobileFontScale = parseFloat(this.$('#mobile-font-scale-field')?.value) || 0.9;
    const mobile_height = parseInt(this.$('#mobile-header-height-field')?.value, 10) || 64;
    const mobile_bg = this.$('#mobile-nav-bg-field')?.value;

    try {
      const themeRes = await adminFetch('/api/site-settings/theme');
      const themeData = await themeRes.json();
      if (themeData.success && themeData.data) {
        const t = themeData.data;
        t.layout = t.layout || {};
        t.layout.mobileFontScale = mobileFontScale;
        t.theme = t.theme || {};
        t.theme.hdr = t.theme.hdr || {};
        t.theme.hdr.mobile_height = mobile_height;
        t.theme.nav = t.theme.nav || {};
        t.theme.nav.mobile_bg = mobile_bg;

        const saveRes = await adminFetch('/api/site-settings/theme', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(t)
        });
        const saveData = await saveRes.json();
        if (saveData.success) showToast('Mobile offsets saved!', 'success');
        else showToast(saveData.error || 'Failed to update mobile offsets', 'error');
      }
    } catch (err) {
      showToast('Error saving mobile layout parameters', 'error');
    }
  }
}
window.MobileSettingsController = MobileSettingsController;

// ─── Diagnostics Controller ─────────────────────────────────────────────────────
class DiagnosticsController extends BaseController {
  constructor() { super('diagnostics'); }
  getTemplateUrl() { return '/admin/workspaces/settings/diagnostics.html'; }

  init() {
    const refreshBtn = this.$('#refresh-diag');
    if (refreshBtn) this.on(refreshBtn, 'click', () => this._checkSmtp());

    const sendBtn = this.$('#send-test');
    if (sendBtn) this.on(sendBtn, 'click', () => this._sendTestEmail());
  }

  async load() {
    // No data to preload for diagnostics
  }

  async _checkSmtp() {
    const output = this.$('#diag-output');
    if (output) output.textContent = 'Checking server connectivity...';
    try {
      const res = await adminFetch('/api/admin/system/smtp-test');
      const data = await res.json();
      if (output) output.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      if (output) output.textContent = `Connection error: ${err.message}`;
    }
  }

  async _sendTestEmail() {
    const email = this.$('#test-recipient')?.value.trim();
    const output = this.$('#send-output');
    if (!email) {
      showToast('Recipient address required', 'warning');
      return;
    }
    if (output) output.textContent = `Queueing test mail to ${email}...`;
    try {
      const res = await adminFetch('/api/admin/system/smtp-send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email })
      });
      const data = await res.json();
      if (output) output.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      if (output) output.textContent = `Failed sending test mail: ${err.message}`;
    }
  }
}
window.DiagnosticsController = DiagnosticsController;
