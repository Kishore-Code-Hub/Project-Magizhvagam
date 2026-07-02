/**
 * Security Controller — Settings Workspace
 * Manages TOTP Multi-Factor Authentication (2FA), backup codes, and active device sessions.
 */
class SecuritySettingsController extends BaseController {
  constructor() {
    super('security');
    this._mfaEnabled = false;
    this._modalResolve = null;
  }

  getTemplateUrl() {
    return '/admin/workspaces/settings/security.html';
  }

  init() {
    // 1. TOTP Setup Action Buttons
    const startSetupBtn = this.$('#mfa-start-setup-btn');
    if (startSetupBtn) this.on(startSetupBtn, 'click', () => this._initiateMFASetup());

    const cancelSetupBtn = this.$('#mfa-cancel-setup-btn');
    if (cancelSetupBtn) this.on(cancelSetupBtn, 'click', () => this._toggleSetupSection(false));

    const confirmEnableBtn = this.$('#mfa-confirm-enable-btn');
    if (confirmEnableBtn) this.on(confirmEnableBtn, 'btn', () => {}); // placeholder, let's use direct click:
    if (confirmEnableBtn) this.on(confirmEnableBtn, 'click', () => this._verifyAndEnableMFA());

    // 2. TOTP Manage Buttons
    const showCodesBtn = this.$('#mfa-show-codes-btn');
    if (showCodesBtn) this.on(showCodesBtn, 'click', () => this._promptPasswordModal('view_codes'));

    const disableMfaBtn = this.$('#mfa-disable-btn');
    if (disableMfaBtn) this.on(disableMfaBtn, 'click', () => this._promptPasswordModal('disable_2fa'));

    const hideRecoveryBtn = this.$('#mfa-hide-recovery-btn');
    if (hideRecoveryBtn) this.on(hideRecoveryBtn, 'click', () => { this.$('#mfa-recovery-section').style.display = 'none'; });

    // 3. Sessions Buttons
    const sessionsRefreshBtn = this.$('#sessions-refresh-btn');
    if (sessionsRefreshBtn) this.on(sessionsRefreshBtn, 'click', () => this._loadSessions());

    const revokeOthersBtn = this.$('#sessions-revoke-others-btn');
    if (revokeOthersBtn) this.on(revokeOthersBtn, 'click', () => this._revokeOthers());

    const revokeAllBtn = this.$('#sessions-revoke-all-btn');
    if (revokeAllBtn) this.on(revokeAllBtn, 'click', () => this._revokeAll());

    // 4. Modal Buttons
    const modalCancelBtn = this.$('#mfa-modal-cancel-btn');
    if (modalCancelBtn) this.on(modalCancelBtn, 'click', () => this._closePasswordModal(false));

    const modalSubmitBtn = this.$('#mfa-modal-submit-btn');
    if (modalSubmitBtn) this.on(modalSubmitBtn, 'click', () => this._closePasswordModal(true));
  }

  async load() {
    this.state.loading = true;
    await this._loadMFAStatus();
    await this._loadSessions();
    this.state.loading = false;
  }

  // ─── TOTP 2FA Methods ─────────────────────────────────────────────────────────

  async _loadMFAStatus() {
    try {
      const res = await adminFetch('/api/auth/profile');
      const data = await res.json();
      if (data.success && data.user) {
        this._mfaEnabled = !!data.user.twoFactorEnabled;
        this._renderMFAStatusUI();
      }
    } catch (e) {
      console.warn('Failed to load profile MFA status:', e);
    }
  }

  _renderMFAStatusUI() {
    const banner = this.$('#mfa-status-banner');
    const indicator = this.$('#mfa-status-indicator');
    const textObj = this.$('#mfa-status-text');
    const activeSec = this.$('#mfa-active-section');
    const inactiveSec = this.$('#mfa-inactive-section');
    const setupSec = this.$('#mfa-setup-section');

    if (!banner || !indicator || !textObj) return;

    if (this._mfaEnabled) {
      banner.style.background = 'rgba(16, 185, 129, 0.08)';
      banner.style.border = '1px solid rgba(16, 185, 129, 0.3)';
      banner.style.color = '#10b981';
      indicator.style.backgroundColor = '#10b981';
      textObj.textContent = 'Active (Account Protected)';

      if (activeSec) activeSec.style.display = 'block';
      if (inactiveSec) inactiveSec.style.display = 'none';
      if (setupSec) setupSec.style.display = 'none';
    } else {
      banner.style.background = 'rgba(239, 68, 68, 0.08)';
      banner.style.border = '1px solid rgba(239, 68, 68, 0.3)';
      banner.style.color = '#ef4444';
      indicator.style.backgroundColor = '#ef4444';
      textObj.textContent = 'Disabled (Account Vulnerable)';

      if (activeSec) activeSec.style.display = 'none';
      if (inactiveSec) inactiveSec.style.display = 'block';
      if (setupSec) setupSec.style.display = 'none';
    }
  }

  async _initiateMFASetup() {
    try {
      const res = await adminFetch('/api/auth/admin/2fa/setup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const secretObj = this.$('#mfa-setup-secret');
        if (secretObj) secretObj.textContent = data.secret;

        this._toggleSetupSection(true);

        // Wait brief tick for DOM and Canvas representation, then render QR locally
        this.setManagedTimeout(() => {
          const canvas = this.$('#mfa-qr-canvas');
          if (canvas && typeof QRious !== 'undefined') {
            new QRious({
              element: canvas,
              value: data.otpauthUri,
              size: 200,
              level: 'H'
            });
          }
        }, 100);
      } else {
        showToast(data.error || 'Failed to initiate 2FA setup', 'error');
      }
    } catch (err) {
      showToast('Error setting up Two-Factor Authentication', 'error');
    }
  }

  _toggleSetupSection(show) {
    const setupSec = this.$('#mfa-setup-section');
    const inactiveSec = this.$('#mfa-inactive-section');
    if (setupSec) setupSec.style.display = show ? 'block' : 'none';
    if (inactiveSec) inactiveSec.style.display = show ? 'none' : 'block';
    
    // Clear code input on close
    const input = this.$('#mfa-verification-code');
    if (input) input.value = '';
  }

  async _verifyAndEnableMFA() {
    const codeInput = this.$('#mfa-verification-code');
    const code = codeInput ? codeInput.value.trim() : '';

    if (!/^\d{6}$/.test(code)) {
      showToast('Please enter a valid 6-digit numerical code.', 'error');
      return;
    }

    try {
      const res = await adminFetch('/api/auth/admin/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Two-Factor Authentication is active!', 'success');
        this._mfaEnabled = true;
        this._toggleSetupSection(false);
        this._renderMFAStatusUI();

        // Show recovery codes
        this._showRecoveryCodes(data.recoveryCodes);
      } else {
        showToast(data.error || 'Failed to verify verification code', 'error');
      }
    } catch (err) {
      showToast('Connection error enabling 2FA', 'error');
    }
  }

  _showRecoveryCodes(codes) {
    const section = this.$('#mfa-recovery-section');
    const grid = this.$('#mfa-recovery-codes-grid');
    if (!section || !grid) return;

    grid.innerHTML = codes.map(c => `
      <div style="background:rgba(0,0,0,0.1); padding:8px 12px; border-radius:4px; border:1px solid var(--card-border); text-align:center; font-weight:700;">${c}</div>
    `).join('');
    section.style.display = 'block';
  }

  // ─── Session Management Methods ──────────────────────────────────────────────

  async _loadSessions() {
    const container = this.$('#sessions-list-container');
    if (!container) return;

    try {
      const res = await adminFetch('/api/auth/admin/sessions');
      const data = await res.json();
      if (data.success && data.sessions) {
        container.innerHTML = data.sessions.map(s => {
          let deviceIcon = 'monitor';
          if (s.device === 'Mobile') deviceIcon = 'smartphone';
          else if (s.device === 'Tablet') deviceIcon = 'tablet';

          return `
            <div class="glass-panel" style="padding:15px; border-radius:8px; border:1px solid var(--card-border); display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; gap:12px; align-items:center;">
                <div style="background:rgba(255,255,255,0.03); width:36px; height:36px; border-radius:6px; display:flex; align-items:center; justify-content:center; border:1px solid var(--card-border);">
                  <i data-lucide="${deviceIcon}" style="width:20px; height:20px; color:var(--primary-color);"></i>
                </div>
                <div>
                  <div style="font-size:13px; font-weight:700; color:var(--text-color);">
                    ${s.browser} on ${s.os}
                    ${s.isCurrent ? '<span class="badge" style="background:rgba(16,185,129,0.1); color:#10b981; border:1px solid rgba(16,185,129,0.2); font-size:10px; padding:2px 6px; border-radius:4px; margin-left:6px;">Current Session</span>' : ''}
                  </div>
                  <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
                    IP: ${s.ipAddress} | Country: ${s.country}
                  </div>
                  <div style="font-size:10px; color:var(--text-muted); margin-top:2px;">
                    Login: ${new Date(s.loginTime).toLocaleString()} | Last Active: ${new Date(s.lastActivity).toLocaleString()}
                  </div>
                </div>
              </div>
              <div>
                ${s.isCurrent ? '' : `<button class="btn btn-secondary revoke-session-btn" data-id="${s.id}" style="font-size:11px; padding:4px 8px; background:#ef4444; color:white; border-color:#ef4444;">Revoke</button>`}
              </div>
            </div>
          `;
        }).join('');

        this.$$('.revoke-session-btn').forEach(btn => {
          this.on(btn, 'click', () => this._revokeSingleSession(btn.dataset.id));
        });

        if (typeof window.renderIcons === 'function') window.renderIcons();
      }
    } catch (err) {
      container.innerHTML = '<p style="color:#ef4444; font-size:12px;">Failed to load active sessions.</p>';
    }
  }

  async _revokeSingleSession(id) {
    if (!confirm('Are you sure you want to end this login session?')) return;
    try {
      const res = await adminFetch(`/api/auth/admin/sessions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Session ended successfully.', 'success');
        this._loadSessions();
      } else {
        showToast(data.error || 'Failed to revoke session', 'error');
      }
    } catch (err) {
      showToast('Error revoking device session', 'error');
    }
  }

  async _revokeOthers() {
    if (!confirm('Are you sure you want to log out of all other devices?')) return;
    try {
      const res = await adminFetch('/api/auth/admin/sessions/logout-others', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Successfully closed all other active sessions!', 'success');
        this._loadSessions();
      } else {
        showToast(data.error || 'Operation failed', 'error');
      }
    } catch (err) {
      showToast('Error revoking other sessions', 'error');
    }
  }

  async _revokeAll() {
    if (!confirm('Log out of all devices? This will close your current session as well.')) return;
    try {
      const res = await adminFetch('/api/auth/admin/sessions/logout-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Logged out of all sessions successfully. Redirecting...', 'success');
        localStorage.removeItem('adminAuth');
        setTimeout(() => {
          window.location.replace('/admin/login');
        }, 1500);
      } else {
        showToast(data.error || 'Operation failed', 'error');
      }
    } catch (err) {
      showToast('Error ending all active sessions', 'error');
    }
  }

  // ─── Modal Password Verify System ────────────────────────────────────────────

  _promptPasswordModal(action) {
    const modal = this.$('#mfa-confirm-modal');
    const title = this.$('#mfa-modal-title');
    const desc = this.$('#mfa-modal-desc');
    const passInput = this.$('#mfa-modal-password-input');

    if (!modal || !title || !desc || !passInput) return;

    passInput.value = '';

    if (action === 'disable_2fa') {
      title.textContent = 'Disable Two-Factor Authentication';
      desc.textContent = 'To turn off 2FA protection, please confirm your admin account password below.';
    } else if (action === 'view_codes') {
      title.textContent = 'View Recovery Backup Codes';
      desc.textContent = 'For security validation, please confirm your admin password to view or regenerate recovery codes.';
    }

    modal.style.display = 'flex';

    return new Promise((resolve) => {
      this._modalResolve = (confirmed) => {
        modal.style.display = 'none';
        if (confirmed) {
          const pass = passInput.value;
          this._handleModalAction(action, pass);
        }
        resolve();
      };
    });
  }

  _closePasswordModal(confirmed) {
    if (this._modalResolve) {
      this._modalResolve(confirmed);
      this._modalResolve = null;
    }
  }

  async _handleModalAction(action, password) {
    if (!password) {
      showToast('Password confirmation required!', 'error');
      return;
    }

    if (action === 'disable_2fa') {
      try {
        const res = await adminFetch('/api/auth/admin/2fa/disable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (data.success) {
          showToast('2FA disabled successfully.', 'success');
          this._mfaEnabled = false;
          this._renderMFAStatusUI();
          this.$('#mfa-recovery-section').style.display = 'none';
        } else {
          showToast(data.error || 'Incorrect password', 'error');
        }
      } catch (err) {
        showToast('Error disabling 2FA authentication', 'error');
      }
    } else if (action === 'view_codes') {
      try {
        const res = await adminFetch('/api/auth/admin/2fa/recovery-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (data.success) {
          this._showRecoveryCodes(data.recoveryCodes);
          showToast('Backup recovery codes loaded!', 'success');
        } else {
          showToast(data.error || 'Incorrect password', 'error');
        }
      } catch (err) {
        showToast('Error loading backup codes', 'error');
      }
    }
  }
}

window.SecuritySettingsController = SecuritySettingsController;
