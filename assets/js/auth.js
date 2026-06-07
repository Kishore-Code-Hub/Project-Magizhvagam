/**
 * MAGIZHVAGAM - Auth JS Client
 * Handles customer and admin sessions, registration, login, and profile dashboards
 */

const AUTH_API = '/api/auth';

// Customer login request handler
async function handleLogin(email, password, redirectUrl = '/index.html') {
  try {
    const res = await fetch(`${AUTH_API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password })
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
async function handleRegister(name, email, phone, password, address1, pincode, city, state) {
  try {
    const res = await fetch(`${AUTH_API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ name, email, phone, password, address1, pincode, city, state })
    });

    const data = await res.json();
    if (!data.success) {
      showToast(data.error || 'Registration failed', 'error');
      return false;
    }

    if (typeof window.setSessionUser === 'function') {
      window.setSessionUser(data.user);
    }

    if (data.user && data.user.role === 'customer' && typeof window.mergeCartAndWishlistAfterLogin === 'function') {
      await window.mergeCartAndWishlistAfterLogin();
    }

    showToast('Account created and logged in successfully!', 'success');
    setTimeout(() => {
      if (typeof window.setSessionUser === 'function') {
        window.setSessionUser(data.user);
      }
      window.location.replace('/profile.html');
    }, 1000);
    return true;
  } catch (error) {
    showToast('Connection error during registration', 'error');
    return false;
  }
}

// Session logout handler (delegated to global handler in app.js)
window.handleLogout = window.handleLogout || (async () => {});

// Retrieve profile info from API
async function loadUserProfile() {
  try {
    const res = await fetch(`${AUTH_API}/profile`, { credentials: 'same-origin' });
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
async function updateUserProfile(profileData) {
  try {
    const res = await fetch(`${AUTH_API}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(profileData)
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
