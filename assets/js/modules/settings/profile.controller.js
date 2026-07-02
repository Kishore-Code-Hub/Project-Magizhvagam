/**
 * Profile Controller — Settings Workspace
 * Manages administrator name, email, profile picture, and strong password update.
 */
class ProfileSettingsController extends BaseController {
  constructor() {
    super('profile');
  }

  getTemplateUrl() {
    return '/admin/workspaces/settings/profile.html';
  }

  init() {
    // 1. Details form submit
    const infoForm = this.$('#admin-profile-info-form');
    if (infoForm) {
      this.on(infoForm, 'submit', (e) => this._handleInfoSave(e));
    }

    // 2. Avatar picker bindings
    const pickBtn = this.$('#admin-profile-pick-pic');
    if (pickBtn) {
      this.on(pickBtn, 'click', () => {
        if (window.MZMediaLibrary && typeof window.MZMediaLibrary.openPicker === 'function') {
          window.MZMediaLibrary.openPicker((asset) => {
            const field = this.$('#admin-profile-pic-field');
            const preview = this.$('#admin-profile-pic-preview');
            if (field) field.value = asset.url || '';
            if (preview) {
              preview.innerHTML = `<img src="${asset.url}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            }
          });
        } else {
          alert('Media Library is loading. Please try again.');
        }
      });
    }

    const clearBtn = this.$('#admin-profile-clear-pic');
    if (clearBtn) {
      this.on(clearBtn, 'click', () => {
        const field = this.$('#admin-profile-pic-field');
        const preview = this.$('#admin-profile-pic-preview');
        if (field) field.value = '';
        if (preview) {
          preview.innerHTML = `<span style="color:var(--text-muted); font-size:12px;">No Image</span>`;
        }
      });
    }

    // 3. Password visibility toggles
    this.$$('.toggle-pass-visibility').forEach(btn => {
      this.on(btn, 'click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = this.$('#' + targetId);
        if (input) {
          const show = input.type === 'password';
          input.type = show ? 'text' : 'password';
          btn.textContent = show ? 'Hide' : 'Show';
        }
      });
    });

    // 4. Live password strength checker
    const newPassInput = this.$('#admin-new-pass');
    if (newPassInput) {
      this.on(newPassInput, 'input', () => this._checkPassStrength(newPassInput.value));
    }

    // 5. Password form submit
    const passForm = this.$('#admin-password-form');
    if (passForm) {
      this.on(passForm, 'submit', (e) => this._handlePasswordSave(e));
    }
  }

  async load() {
    this.state.loading = true;
    try {
      const res = await adminFetch('/api/auth/profile');
      const data = await res.json();
      if (data.success && data.user) {
        const u = data.user;
        const nameInput = this.$('#admin-profile-name');
        const emailInput = this.$('#admin-profile-email');
        const picField = this.$('#admin-profile-pic-field');
        const preview = this.$('#admin-profile-pic-preview');

        if (nameInput) nameInput.value = u.name || '';
        if (emailInput) emailInput.value = u.email || '';
        if (picField) picField.value = u.profilePicture || '';
        
        if (preview && u.profilePicture) {
          preview.innerHTML = `<img src="${u.profilePicture}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        }
      }
    } catch (err) {
      console.warn('Failed to load admin profile info:', err);
    }
    this.state.loading = false;
  }

  _checkPassStrength(password) {
    const meterBar = this.$('#pass-strength-bar');
    const label = this.$('#pass-strength-label');

    // Requirements nodes
    const reqs = {
      len: { node: this.$('#req-len'), valid: password.length >= 12 },
      upper: { node: this.$('#req-upper'), valid: /[A-Z]/.test(password) },
      lower: { node: this.$('#req-lower'), valid: /[a-z]/.test(password) },
      num: { node: this.$('#req-num'), valid: /\d/.test(password) },
      spec: { node: this.$('#req-spec'), valid: /[^A-Za-z0-9]/.test(password) }
    };

    // Update list styles
    let score = 0;
    for (const [key, req] of Object.entries(reqs)) {
      if (req.node) {
        req.node.style.color = req.valid ? '#10b981' : 'var(--text-muted)';
        req.node.style.textDecoration = req.valid ? 'line-through' : 'none';
      }
      if (req.valid) score++;
    }

    // Update bar & label
    let color = '#ef4444';
    let text = 'Too Weak';
    let width = '20%';

    if (score >= 5) {
      color = '#10b981';
      text = 'Excellent (Secure)';
      width = '100%';
    } else if (score >= 4) {
      color = '#eab308';
      text = 'Good (Moderate)';
      width = '80%';
    } else if (score >= 3) {
      color = '#f97316';
      text = 'Weak';
      width = '60%';
    } else if (score >= 2) {
      color = '#f97316';
      text = 'Weak';
      width = '40%';
    }

    if (meterBar) {
      meterBar.style.width = width;
      meterBar.style.backgroundColor = color;
    }
    if (label) {
      label.textContent = text;
      label.style.color = color;
    }
  }

  async _handleInfoSave(e) {
    e.preventDefault();
    const name = this.$('#admin-profile-name')?.value.trim();
    const email = this.$('#admin-profile-email')?.value.trim();
    const profilePicture = this.$('#admin-profile-pic-field')?.value.trim();

    try {
      const res = await adminFetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, profilePicture })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Profile details updated successfully!', 'success');
        
        // Sync local auth details if stored
        try {
          const auth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
          if (auth && auth.user) {
            auth.user.name = name;
            auth.user.email = email;
            localStorage.setItem('adminAuth', JSON.stringify(auth));
            if (typeof window.injectAdminTopbar === 'function') window.injectAdminTopbar();
          }
        } catch (e) {}
      } else {
        showToast(data.error || 'Failed to update details', 'error');
      }
    } catch (err) {
      showToast('Connection error updating profile details', 'error');
    }
  }

  async _handlePasswordSave(e) {
    e.preventDefault();
    const currentPassword = this.$('#admin-current-pass')?.value;
    const newPassword = this.$('#admin-new-pass')?.value;
    const confirmPassword = this.$('#admin-confirm-pass')?.value;

    if (newPassword.length < 12 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      showToast('New password does not meet strength requirements!', 'error');
      return;
    }

    try {
      const res = await adminFetch('/api/auth/admin/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Password updated! Redirecting to login...', 'success');
        localStorage.removeItem('adminAuth');
        setTimeout(() => {
          window.location.replace('/admin/login');
        }, 1500);
      } else {
        showToast(data.error || 'Password update failed', 'error');
      }
    } catch (err) {
      showToast('Error updating account credentials', 'error');
    }
  }
}

window.ProfileSettingsController = ProfileSettingsController;
