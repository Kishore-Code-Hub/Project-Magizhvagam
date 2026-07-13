/**
 * MAGIZHVAGAM - Auth JS Client
 * Handles customer and admin sessions, registration, login, and profile dashboards
 */

const AUTH_API = '/api/auth';

// Customer login request handler
async function handleLogin(email, password, redirectUrl = '/index.html', options = {}) {
  try {
    const res = await fetch(`${AUTH_API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password }),
      ...options
    });

    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      console.error('Login response was not JSON:', parseErr);
      showToast('Server returned an invalid response. Please try again.', 'error');
      return false;
    }
    if (!data.success) {
      showToast(data.error || 'Login failed', 'error');
      return false;
    }

    if (typeof window.setSessionUser === 'function') {
      window.setSessionUser(data.user);
    }

    if (data.user.role === 'customer' && typeof window.mergeCartAndWishlistAfterLogin === 'function') {
      await window.mergeCartAndWishlistAfterLogin();
    }

    showToast('Logged in successfully!', 'success');

    // Determine proper redirect based on role
    let finalRedirect = redirectUrl;
    if (data.user.role === 'admin') {
      finalRedirect = '/admin';
    } else {
      if (redirectUrl.includes('/admin')) {
        finalRedirect = '/profile.html';
      }
    }
    
    // Redirect
    setTimeout(() => {
      window.location.replace(finalRedirect);
    }, 1000);
    return true;
  } catch (error) {
    showToast('Connection error during login', 'error');
    return false;
  }
}

// Customer sign-up handler
async function handleRegister(name, email, phone, password) {
  try {
    const res = await fetch(`${AUTH_API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ name, email, phone, password })
    });

    const data = await res.json();
    if (!data.success) {
      showToast(data.error || 'Registration failed', 'error');
      // Unlock inputs
      ['name', 'email', 'phone', 'password', 'confirm-password'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = false;
      });
      const submitBtn = document.querySelector('#register-form button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
      }
      return false;
    }

    showToast('Registration successful! Please check your email to verify your account.', 'success');
    setTimeout(() => {
      window.location.replace('/login.html?registered=true');
    }, 2000);
    return true;
  } catch (error) {
    showToast('Connection error during registration', 'error');
    // Unlock inputs
    ['name', 'email', 'phone', 'password', 'confirm-password'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = false;
    });
    const submitBtn = document.querySelector('#register-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      submitBtn.style.cursor = 'pointer';
    }
    return false;
  }
}

// Session logout handler (delegated to global handler in app.js)
window.handleLogout = window.handleLogout || (async () => {});

// Retrieve profile info from API
async function loadUserProfile(options = {}) {
  try {
    const res = await fetch(`${AUTH_API}/profile`, { credentials: 'same-origin', ...options });
    const data = await res.json();
    if (data.success) {
      return data.user;
    }
    return null;
  } catch (err) {
    return null;
  }
}

// Edit customer profiles
async function updateUserProfile(profileData, options = {}) {
  try {
    const res = await fetch(`${AUTH_API}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(profileData),
      ...options
    });
    const data = await res.json();
    if (data.success) {
      if (typeof window.setSessionUser === 'function') {
        window.setSessionUser(data.user);
      }
      showToast('Profile updated!', 'success');
      return data.user;
    }
    showToast(data.error || 'Failed to update profile', 'error');
    return null;
  } catch (err) {
    showToast('Connection error updating profile', 'error');
    return null;
  }
}
