/**
 * MAGIZHVAGAM E-Commerce Platform - Global Script
 * Manages shared components, styling, session checking, cart states, and alerts
 */

// Global price formatter — consistent UTF-8 rupee symbol, never NaN/null
window.formatPrice = (price) => {
  const num = Number(price);
  if (!Number.isFinite(num) || num < 0) {
    return '\u20B9 0';
  }
  return '\u20B9 ' + Math.round(num).toLocaleString('en-IN');
};

let globalSettings = null;
// Set only after /api/auth/profile succeeds — never trust localStorage alone for header auth
window.__sessionUser = null;

window.setSessionUser = (user) => {
  if (!user) {
    window.__sessionUser = null;
    localStorage.removeItem('magizhvagam_user');
    
    // Reset user name displays to default guest state
    const userNameEl = document.getElementById('user-name-display');
    if (userNameEl) userNameEl.textContent = 'Guest';
    const profileNameEls = document.querySelectorAll('.profile-name');
    profileNameEls.forEach(el => { el.textContent = 'Guest'; });
    const memberNameEl = document.getElementById('member-name');
    if (memberNameEl) memberNameEl.textContent = 'Name';
    
    return;
  }
  const normalized = {
    id: user._id || user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  window.__sessionUser = normalized;
  localStorage.setItem('magizhvagam_user', JSON.stringify(normalized));
  
  // Update user name displays dynamically
  const userNameEl = document.getElementById('user-name-display');
  if (userNameEl) userNameEl.textContent = normalized.name;
  const profileNameEls = document.querySelectorAll('.profile-name');
  profileNameEls.forEach(el => { el.textContent = normalized.name; });
  const memberNameEl = document.getElementById('member-name');
  if (memberNameEl) memberNameEl.textContent = normalized.name;

  // Legacy global wishlist/cart keys must not leak across users
  localStorage.removeItem('magizhvagam_wishlist');
  localStorage.removeItem('magizhvagam_cart');
};

function getStoredUser() {
  return window.__sessionUser || null;
}
window.getStoredUser = getStoredUser;

window.resolveProductImage = (url) => {
  if (!url || typeof url !== 'string') {
    return '/assets/images/default-product.webp';
  }
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
    return '/assets/images/default-product.webp';
  }
  return trimmed;
};

// Dynamic settings fetcher
async function fetchSettings() {
  if (globalSettings) return globalSettings;
  try {
    const res = await fetch('/api/settings/homepage');
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse settings JSON. Raw response:', text);
      throw e;
    }
    if (data.success && data.setting) {
      globalSettings = data.setting;
    }
  } catch (err) {
    console.error('Error fetching settings:', err);
  }
  return globalSettings;
}

// Session validation handler
window.validateUserSession = async function validateUserSession() {
  try {
    const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse auth session JSON. Raw response:', text);
      throw e;
    }
    
    if (data.success && data.user) {
      setSessionUser(data.user);
      if (data.user.role === 'customer') {
        await syncCartFromServer();
        await syncWishlistFromServer();
      }
      return data.user;
    } else {
      throw new Error('Verification failed');
    }
  } catch (err) {
    setSessionUser(null);
    localStorage.removeItem('magizhvagam_wishlist');

    const path = window.location.pathname;
    const isAuthPage = ['/login.html', '/register.html'].some((p) => path.endsWith(p));
    const isProtected = ['/profile.html', '/wishlist.html', '/checkout.html', '/cart.html'].some(p => path.endsWith(p)) || path.includes('/admin/');
    if (isProtected && !isAuthPage) {
      const redirectPath = window.location.pathname.substring(1) + window.location.search;
      if (path.includes('/admin/')) {
        window.location.replace('/admin/login?redirect=' + encodeURIComponent(redirectPath));
      } else {
        showToast('Please login or create a customer account to continue.', 'error');
        setTimeout(() => {
          window.location.replace('/login.html?redirect=' + encodeURIComponent(redirectPath));
        }, 1500);
      }
    }
    return null;
  }
};

// Global dynamic layout customizer
function applyAppearanceSettings(settings) {
  if (!settings) return;

  // 1. Dynamic document title
  if (settings.brandName) {
    const baseTitle = document.title;
    if (!baseTitle.includes(settings.brandName)) {
      document.title = baseTitle.replace(/MAGIZHVAGAM/i, settings.brandName);
    }
  }

  // Hex-to-HSL Helper
  const hexToHslString = (hex) => {
    if (!hex) return null;
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h}, ${s}%, ${l}%`;
  };

  // 2. Override Colors
  if (settings.primaryColor) {
    const pHsl = hexToHslString(settings.primaryColor);
    if (pHsl) document.documentElement.style.setProperty('--primary-purple', pHsl);
  }
  if (settings.secondaryColor) {
    const sHsl = hexToHslString(settings.secondaryColor);
    if (sHsl) document.documentElement.style.setProperty('--rose-pink', sHsl);
  }
  if (settings.accentColor) {
    const aHsl = hexToHslString(settings.accentColor);
    if (aHsl) document.documentElement.style.setProperty('--primary-gold', aHsl);
  }

  // 3. Override Font Family
  if (settings.fontFamily) {
    const font = settings.fontFamily;
    if (font !== 'Inter' && font !== 'Outfit') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800&display=swap`;
      document.head.appendChild(link);
    }
    document.body.style.fontFamily = `'${font}', 'Inter', sans-serif`;
  }

  // 4. Override Button Style
  if (settings.buttonStyle) {
    let r = '8px';
    if (settings.buttonStyle === 'sharp') r = '0px';
    if (settings.buttonStyle === 'pill') r = '30px';

    let styleEl = document.getElementById('dynamic-button-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dynamic-button-style';
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
      .btn { border-radius: ${r} !important; }
      .product-card { border-radius: ${settings.buttonStyle === 'sharp' ? '0px' : '16px'} !important; }
    `;
  }
}

// Global session logout handler
window.handleLogout = async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } catch (err) {
    console.error('Logout API request failed:', err);
  }
  
  const prevUser = getStoredUser();
  setSessionUser(null);
  localStorage.removeItem('magizhvagam_cart');
  localStorage.removeItem('magizhvagam_wishlist');
  if (prevUser?.id) {
    localStorage.removeItem(`magizhvagam_cart_${prevUser.id}`);
    localStorage.removeItem(`magizhvagam_wishlist_${prevUser.id}`);
  }
  localStorage.removeItem('magizhvagam_applied_coupon');
  sessionStorage.clear();
  showToast('Logged out successfully', 'success');
  const logoutTarget = window.location.pathname.includes('/admin/')
    ? '/admin/login'
    : '/login.html';
  setTimeout(() => {
    window.location.replace(logoutTarget);
  }, 1000);
};

function isStandaloneAdminLoginPage() {
  const path = window.location.pathname.toLowerCase();
  return path.includes('/admin/login');
}

document.addEventListener('DOMContentLoaded', async () => {
  if (isStandaloneAdminLoginPage()) {
    initIcons();
    return;
  }

  const user = await validateUserSession();

  const settings = await fetchSettings();
  applyAppearanceSettings(settings);
  injectComponents(settings, user);

  syncCartCounters();
  setupWhatsApp(settings);
  initIcons();
  initGlobalClickHandlers();
});

function initGlobalClickHandlers() {
  document.addEventListener('click', (e) => {
    // Intercept guest attempts to open Cart/Checkout
    const cartOrCheckoutLink = e.target.closest('a[href*="cart.html"], a[href*="checkout.html"]');
    if (cartOrCheckoutLink) {
      if (!getStoredUser()) {
        e.preventDefault();
        e.stopPropagation();
        showToast('Please login or create a customer account to continue.', 'error');
        window.showLoginRegisterModal('cart');
        return;
      }
    }

    // Intercept guest attempts to open Wishlist from header
    const wishlistLink = e.target.closest('#header-wishlist-link');
    if (wishlistLink) {
      if (!getStoredUser()) {
        e.preventDefault();
        e.stopPropagation();
        showToast('Please login or create a customer account to continue.', 'error');
        window.showLoginRegisterModal('wishlist');
        return;
      }
    }

    // Intercept guest clicks on "Buy Now" elements/text
    const buyBtn = e.target.closest('.buy-now-btn, .buy-now, [data-buy-now]');
    const isBuyNowText = e.target.textContent && e.target.textContent.toLowerCase().includes('buy now');
    if (buyBtn || (e.target.closest('button, a') && isBuyNowText)) {
      if (!getStoredUser()) {
        e.preventDefault();
        e.stopPropagation();
        showToast('Please login or create a customer account to continue.', 'error');
        window.showLoginRegisterModal('cart');
        return;
      }
    }

    const wishlistBtn = e.target.closest('.wishlist-btn[data-product-id]');
    if (wishlistBtn) {
      e.preventDefault();
      e.stopPropagation();
      const id = wishlistBtn.getAttribute('data-product-id');
      const name = decodeURIComponent(wishlistBtn.getAttribute('data-product-name') || '');
      const price = Number(wishlistBtn.getAttribute('data-product-price')) || 0;
      const image = decodeURIComponent(wishlistBtn.getAttribute('data-product-image') || '/assets/images/default-product.webp');
      toggleWishlistBtn(wishlistBtn, id, name, price, image);
      return;
    }

    const addBtn = e.target.closest('[data-add-to-cart]');
    if (addBtn && !addBtn.disabled) {
      e.preventDefault();
      const id = addBtn.getAttribute('data-product-id');
      const name = decodeURIComponent(addBtn.getAttribute('data-product-name') || '');
      const price = Number(addBtn.getAttribute('data-product-price')) || 0;
      const image = decodeURIComponent(addBtn.getAttribute('data-product-image') || '/assets/images/default-product.webp');
      const qty = Number(addBtn.getAttribute('data-quantity')) || 1;
      addToCart(id, name, price, image, qty);
    }
  });
}

// Load Lucide script dynamically
function initIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/lucide@latest';
  script.onload = () => {
    window.renderIcons();
  };
  document.head.appendChild(script);
}

window.renderIcons = () => {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
};

// Toast notification helper
window.showToast = (message, type = 'success') => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type} scale-in`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.5s ease';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
};

// Theme toggle removed â€” site uses premium light theme only.

// Cart & Wishlist — server persistence for customers; local cache for UI
function isLoggedInCustomer() {
  const user = getStoredUser();
  return user && user.role === 'customer';
}

function getCartStorageKey() {
  const user = getStoredUser();
  if (user && user.role === 'customer' && user.id) {
    return `magizhvagam_cart_${user.id}`;
  }
  return null;
}

function setCartCache(cart) {
  const key = getCartStorageKey();
  if (key) {
    localStorage.setItem(key, JSON.stringify(cart || []));
  }
  localStorage.removeItem('magizhvagam_cart');
}
window.setCartCache = setCartCache;

function getWishlistStorageKey() {
  const user = getStoredUser();
  if (user && user.role === 'customer' && user.id) {
    return `magizhvagam_wishlist_${user.id}`;
  }
  return null;
}

function consumeLegacyWishlistCache() {
  try {
    const legacy = localStorage.getItem('magizhvagam_wishlist');
    if (!legacy || legacy === 'undefined' || legacy === 'null') return [];
    localStorage.removeItem('magizhvagam_wishlist');
    const parsed = JSON.parse(legacy);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem('magizhvagam_wishlist');
    return [];
  }
}

function setWishlistCache(wishlist) {
  const key = getWishlistStorageKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(wishlist || []));
  localStorage.removeItem('magizhvagam_wishlist');
}
window.setWishlistCache = setWishlistCache;

window.getCart = () => {
  if (!isLoggedInCustomer()) return [];
  const key = getCartStorageKey();
  if (!key) return [];
  try {
    const val = localStorage.getItem(key);
    if (!val || val === 'undefined' || val === 'null') return [];
    return JSON.parse(val) || [];
  } catch (err) {
    return [];
  }
};

window.getWishlist = () => {
  if (!isLoggedInCustomer()) return [];
  const key = getWishlistStorageKey();
  if (!key) return [];
  try {
    const val = localStorage.getItem(key);
    if (!val || val === 'undefined' || val === 'null') return [];
    return JSON.parse(val) || [];
  } catch (err) {
    return [];
  }
};

window.syncCartFromServer = async () => {
  if (!isLoggedInCustomer()) return;
  try {
    const res = await fetch('/api/cart', { credentials: 'same-origin' });
    const data = await res.json();
    if (data.success) {
      setCartCache(data.cart);
      syncCartCounters();
    }
  } catch (err) {
    console.error('Failed to sync cart from server:', err);
  }
};

window.syncWishlistFromServer = async () => {
  if (!isLoggedInCustomer()) return;
  try {
    const res = await fetch('/api/wishlist', { credentials: 'same-origin' });
    const data = await res.json();
    if (data.success) {
      setWishlistCache(data.wishlist);
      syncCartCounters();
    }
  } catch (err) {
    console.error('Failed to sync wishlist from server:', err);
  }
};

window.mergeCartAndWishlistAfterLogin = async () => {
  if (!isLoggedInCustomer()) return;
  const cart = getCart();
  const legacyWishlist = consumeLegacyWishlistCache();
  let wishlist = getWishlist();
  if (legacyWishlist.length) {
    const seen = new Set(wishlist.map((i) => String(i.productId)));
    for (const item of legacyWishlist) {
      if (item?.productId && !seen.has(String(item.productId))) {
        wishlist.push(item);
        seen.add(String(item.productId));
      }
    }
  }
  try {
    if (cart.length) {
      const res = await fetch('/api/cart/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ items: cart })
      });
      const data = await res.json();
      if (data.success) setCartCache(data.cart);
    }
    if (wishlist.length) {
      const res = await fetch('/api/wishlist/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ items: wishlist })
      });
      const data = await res.json();
      if (data.success) setWishlistCache(data.wishlist);
    }
    await syncCartFromServer();
    await syncWishlistFromServer();
    window.dispatchEvent(new Event('cartUpdated'));
    window.dispatchEvent(new Event('wishlistUpdated'));
  } catch (err) {
    console.error('Failed to merge cart/wishlist after login:', err);
  }
};

window.clearServerCart = async () => {
  if (!isLoggedInCustomer()) {
    localStorage.removeItem('magizhvagam_cart');
    const key = getCartStorageKey();
    if (key) localStorage.removeItem(key);
    syncCartCounters();
    window.dispatchEvent(new Event('cartUpdated'));
    return;
  }
  try {
    const res = await fetch('/api/cart', { method: 'DELETE', credentials: 'same-origin' });
    const data = await res.json();
    if (data.success) {
      setCartCache([]);
      syncCartCounters();
      window.dispatchEvent(new Event('cartUpdated'));
    }
  } catch (err) {
    console.error('Failed to clear server cart:', err);
    localStorage.removeItem('magizhvagam_cart');
    const key = getCartStorageKey();
    if (key) localStorage.removeItem(key);
    syncCartCounters();
    window.dispatchEvent(new Event('cartUpdated'));
  }
};

async function addToCartAsync(productId, name, price, image, quantity, silent) {
  try {
    const res = await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ productId, name, price, image, quantity: Number(quantity) })
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.error || 'Failed to add to cart', 'error');
      return;
    }
    setCartCache(data.cart);
    syncCartCounters();
    if (!silent) showToast(`Added "${name}" to Cart!`, 'success');
    window.dispatchEvent(new Event('cartUpdated'));
  } catch (err) {
    console.error('Add to cart failed:', err);
    showToast('Connection error adding to cart', 'error');
  }
}

window.addToCart = (productId, name, price, image, quantity = 1, silent = false) => {
  const user = getStoredUser();
  if (!user) {
    showToast('Please login or create a customer account to continue.', 'error');
    window.showLoginRegisterModal('cart');
    return;
  }
  if (user.role !== 'customer') {
    if (!silent) showToast('Cart is available for customer accounts only', 'error');
    return;
  }
  addToCartAsync(productId, name, price, image, quantity, silent);
};

async function toggleWishlistAsync(productId, name, price, image) {
  try {
    const res = await fetch('/api/wishlist/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ productId, name, price, image })
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.error || 'Wishlist update failed', 'error');
      return false;
    }
    setWishlistCache(data.wishlist);
    syncCartCounters();
    const added = !!data.added;
    showToast(added ? `Added "${name}" to Wishlist!` : `Removed "${name}" from Wishlist`, 'success');
    window.dispatchEvent(new Event('wishlistUpdated'));
    return added;
  } catch (err) {
    console.error('Wishlist toggle failed:', err);
    showToast('Connection error updating wishlist', 'error');
    return false;
  }
}

window.toggleWishlist = async (productId, name, price, image) => {
  const user = getStoredUser();
  if (!user) {
    showToast('Please login or create a customer account to continue.', 'error');
    window.showLoginRegisterModal('wishlist');
    return false;
  }
  if (user.role !== 'customer') {
    showToast('Wishlist is available for customer accounts only', 'error');
    return false;
  }
  return toggleWishlistAsync(productId, name, price, image);
};

function syncCartCounters() {
  const cartCountEl = document.getElementById('cart-badge-count');
  const wishlistCountEl = document.getElementById('wishlist-badge-count');
  
  if (cartCountEl) {
    const totalQty = getCart().reduce((sum, item) => sum + item.quantity, 0);
    cartCountEl.textContent = totalQty;
    cartCountEl.style.display = totalQty > 0 ? 'inline-flex' : 'none';
  }
  
  if (wishlistCountEl) {
    const totalQty = isLoggedInCustomer() ? getWishlist().length : 0;
    wishlistCountEl.textContent = totalQty;
    wishlistCountEl.style.display = totalQty > 0 ? 'inline-flex' : 'none';
  }
}

// Inject Shared Components — user must be API-validated (window.__sessionUser)
function injectComponents(settings, user = null) {
  user = user || getStoredUser();
  const headerEl = document.getElementById('main-header');
  const footerEl = document.getElementById('main-footer');

  const brandName = (settings && settings.brandName) || 'MAGIZHVAGAM';
  const logo = (settings && settings.logo) || null;

  // Build logo HTML â€” image if URL, else styled text
  let logoInnerHtml;
  if (logo && (logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('/') || logo.includes('.'))) {
    logoInnerHtml = `<img src="${logo}" alt="${brandName}" style="max-height:44px; object-fit:contain;">`;
  } else {
    logoInnerHtml = `
      <span class="logo-title">${brandName}</span>
      <span class="logo-subtitle">Premium Return Gifts</span>
    `;
  }

  // ── UTILITY ICONS (Right side of Row 1) ──────────────────────────────────
  // Wishlist icon (visible for guest and customer, not admin)
  const wishlistIconHtml = (!user || user.role === 'customer') ? `
    <a href="${!user ? '#' : '/wishlist.html'}" class="header-icon-link" aria-label="Wishlist" id="header-wishlist-link" ${!user ? 'onclick="window.showLoginRegisterModal(\'wishlist\'); return false;"' : ''}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
      <span class="badge-count" id="wishlist-badge-count" style="display:none;">0</span>
    </a>` : '';

  // Cart icon (visible for guest and customer, not admin)
  const cartIconHtml = (!user || user.role === 'customer') ? `
    <a href="/cart.html" class="header-icon-link" aria-label="Cart" id="header-cart-link">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
      <span class="badge-count" id="cart-badge-count" style="display:none;">0</span>
    </a>` : '';

  // Search icon + expandable input (Desktop)
  const searchHtml = `
    <div class="search-wrapper" id="header-search-wrapper">
      <button class="header-icon-btn" id="search-toggle-btn" aria-label="Search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
      <form action="/products.html" method="GET" id="desktop-search-form" style="display:flex; align-items:center; position:relative;">
        <input type="text" name="search" id="search-input-desktop" class="search-input-desktop" placeholder="Search gifts..." autocomplete="off">
        <div id="search-autocomplete-box"></div>
      </form>
    </div>`;

  // â”€â”€ AUTH-AWARE SECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let authUtilHtml = '';
  if (!user) {
    // GUEST: Login + Register buttons
    authUtilHtml = `
      <a href="/login.html" class="guest-btn guest-btn-login" id="header-login-btn">Login</a>
      <a href="/register.html" class="guest-btn guest-btn-register" id="header-register-btn">Register</a>`;
  } else if (user.role === 'admin') {
    // ADMIN browsing storefront: Browse Store + Logout only
    authUtilHtml = `
      <a href="/index.html" class="guest-btn guest-btn-login" id="header-browse-store-btn">Browse Store</a>
      <div class="account-menu-wrapper" id="account-menu-wrapper">
        <button class="header-icon-btn" aria-label="Admin session">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
        <div class="account-dropdown">
          <a href="#" class="dropdown-link logout-link" onclick="window.handleLogout(); return false;">Logout</a>
        </div>
      </div>`;
  } else {
    // LOGGED-IN USER: Account icon with dropdown
    authUtilHtml = `
      <div class="account-menu-wrapper" id="account-menu-wrapper">
        <button class="header-icon-btn" aria-label="My Account">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
        <div class="account-dropdown">
          <div class="dropdown-link" style="font-weight: 700; border-bottom: 1px solid var(--card-border); padding-bottom: 8px; color: var(--text-color);">Hello, <span id="user-name-display" class="profile-name">${user.name}</span></div>
          <a href="/profile.html" class="dropdown-link">My Profile</a>
          <a href="/profile.html#orders" class="dropdown-link">My Orders</a>
          <a href="/wishlist.html" class="dropdown-link">Wishlist</a>
          <a href="#" class="dropdown-link logout-link" onclick="window.handleLogout(); return false;">Logout</a>
        </div>
      </div>`;
  }

  // â”€â”€ NAV LINKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const navLinksHtml = `
    <nav class="nav-menu" id="desktop-nav" aria-label="Main navigation">
      <a href="/index.html" class="nav-link">Home</a>
      <a href="/products.html" class="nav-link">Products</a>
      <a href="/index.html#categories" class="nav-link">Categories</a>
      <a href="/about.html" class="nav-link">About</a>
      <a href="/contact.html" class="nav-link">Contact</a>
    </nav>`;

  // â”€â”€ BUILD MOBILE SIDEBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let mobileSidebarAuthLinks = '';
  if (!user) {
    mobileSidebarAuthLinks = `
      <a href="/login.html" class="sidebar-link">Login</a>
      <a href="/register.html" class="sidebar-link">Register</a>`;
  } else if (user.role === 'admin') {
    mobileSidebarAuthLinks = `
      <a href="/index.html" class="sidebar-link">Browse Store</a>
      <a href="#" class="sidebar-link logout-btn" onclick="window.handleLogout(); return false;">Logout</a>`;
  } else {
    // Accordion: tap Account to expand sub-links
    mobileSidebarAuthLinks = `
      <button class="sidebar-account-toggle" id="sidebar-account-toggle" type="button">Account (<span class="profile-name">${user.name}</span>) <span class="arrow" id="sidebar-account-arrow">&#9658;</span></button>
      <div class="sidebar-account-submenu" id="sidebar-account-submenu">
        <a href="/profile.html">My Profile</a>
        <a href="/profile.html#orders">My Orders</a>
        <a href="/wishlist.html">Wishlist</a>
        <a href="#" class="sidebar-logout" onclick="window.handleLogout(); return false;">Logout</a>
      </div>`;
  }

  // â”€â”€ INJECT HEADER HTML â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (headerEl) {
    headerEl.innerHTML = `
      <div class="header-container-wrapper">
        <div class="container">

          <!-- ROW 1: Contact info | Centered Logo | Utility Icons -->
          <div class="header-row-1">

            <!-- Left: Contact info -->
            <div class="header-contact-info" id="header-contact-left">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.15a16 16 0 006.93 6.93l1.51-1.51a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              <a href="/contact.html">Get in Touch</a>
            </div>

            <!-- Center: Logo -->
            <a href="/index.html" class="logo-wrapper" id="header-logo" aria-label="${brandName} Home">
              ${logoInnerHtml}
            </a>

            <!-- Right: Utility icons + auth -->
            <div class="header-utilities" id="header-utilities-right">
              ${searchHtml}
              ${wishlistIconHtml}
              ${cartIconHtml}
              ${authUtilHtml}

              <!-- Hamburger (mobile only) -->
              <button class="hamburger" id="hamburger-btn" aria-label="Open menu">
                <div></div>
                <div></div>
                <div></div>
              </button>
            </div>
          </div>

          <!-- ROW 2: Navigation links (desktop only) -->
          <div class="header-row-2" id="header-nav-row">
            ${navLinksHtml}
          </div>
        </div>
      </div>

      <!-- Mobile slide-in sidebar -->
      <div class="mobile-sidebar" id="mobile-sidebar" aria-hidden="true">
        <div class="sidebar-header">
          <a href="/index.html" class="logo-wrapper" style="flex-direction:row; gap:8px;">
            <span class="logo-title" style="font-size:20px;">${brandName}</span>
          </a>
          <button class="sidebar-close-btn" id="sidebar-close-btn" aria-label="Close menu">&times;</button>
        </div>
        <ul class="sidebar-menu">
          <li><a href="/index.html" class="sidebar-link">Home</a></li>
          <li><a href="/products.html" class="sidebar-link">Products</a></li>
          <li><a href="/index.html#categories" class="sidebar-link">Categories</a></li>
          <li><a href="/about.html" class="sidebar-link">About Us</a></li>
          <li><a href="/contact.html" class="sidebar-link">Contact</a></li>
          ${mobileSidebarAuthLinks}
        </ul>
      </div>

      <!-- Backdrop overlay -->
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>

      <!-- Mobile search overlay -->
      <div class="mobile-search-overlay" id="mobile-search-overlay">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
          <button id="mobile-search-close" style="background:none; border:none; font-size:24px; font-weight:700; cursor:pointer; color:var(--text-color);">&times;</button>
          <span style="font-family:'Outfit'; font-size:18px; font-weight:700;">Search Gifts</span>
        </div>
        <form action="/products.html" method="GET" style="position:relative;">
          <input type="text" name="search" id="mobile-search-input" placeholder="Search for gifts..." autocomplete="off"
            style="width:100%; padding:14px 20px; border-radius:12px; border:2px solid hsl(var(--primary-purple)); font-size:16px; font-family:'Outfit'; background:#fff; color:var(--text-color); outline:none;">
          <button type="submit" style="position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:hsl(var(--primary-purple));">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </form>
        <div id="mobile-autocomplete-results" style="margin-top:16px; display:flex; flex-direction:column; gap:8px;"></div>
      </div>
    `;

    // Admin storefront: no cart/wishlist controls; no warning banner
    window.addEventListener('scroll', () => {
      if (window.scrollY > 30) {
        headerEl.classList.add('scrolled');
      } else {
        headerEl.classList.remove('scrolled');
      }
    }, { passive: true });

    // â”€â”€ DESKTOP SEARCH EXPAND â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const searchToggleBtn = document.getElementById('search-toggle-btn');
    const searchInputDesktop = document.getElementById('search-input-desktop');
    const searchAutocompleteBox = document.getElementById('search-autocomplete-box');

    if (searchToggleBtn && searchInputDesktop) {
      searchToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // On mobile, open the full-screen overlay
        if (window.innerWidth <= 768) {
          const overlay = document.getElementById('mobile-search-overlay');
          if (overlay) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
              const msi = document.getElementById('mobile-search-input');
              if (msi) msi.focus();
            }, 100);
          }
          return;
        }
        const isExpanded = searchInputDesktop.classList.contains('expanded');
        if (isExpanded) {
          // If there's text, submit the form
          if (searchInputDesktop.value.trim()) {
            document.getElementById('desktop-search-form').submit();
          } else {
            searchInputDesktop.classList.remove('expanded');
            searchInputDesktop.value = '';
            if (searchAutocompleteBox) searchAutocompleteBox.style.display = 'none';
          }
        } else {
          searchInputDesktop.classList.add('expanded');
          searchInputDesktop.focus();
        }
      });

      // ESC to close search
      searchInputDesktop.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          searchInputDesktop.classList.remove('expanded');
          searchInputDesktop.value = '';
          if (searchAutocompleteBox) searchAutocompleteBox.style.display = 'none';
          searchToggleBtn.focus();
        }
      });

      // Click outside to close
      document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('header-search-wrapper');
        if (wrapper && !wrapper.contains(e.target)) {
          searchInputDesktop.classList.remove('expanded');
          if (searchAutocompleteBox) searchAutocompleteBox.style.display = 'none';
        }
      });

      // Autocomplete
      if (searchAutocompleteBox) {
        searchInputDesktop.addEventListener('input', async (e) => {
          const val = e.target.value.trim();
          if (val.length < 2) { searchAutocompleteBox.style.display = 'none'; return; }
          try {
            const res = await fetch(`/api/products?search=${encodeURIComponent(val)}&limit=6`);
            const text = await res.text();
            let data;
            try { data = JSON.parse(text); } catch(ex) { searchAutocompleteBox.style.display = 'none'; return; }
            if (data.success && data.products && data.products.length > 0) {
              searchAutocompleteBox.innerHTML = data.products.map(p => `
                <a href="/product-details.html?id=${p._id}" style="padding:10px 14px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--card-border); color:var(--text-color); font-weight:500; font-size:13px;">
                  <span>${p.name}</span>
                  <span style="color:hsl(var(--primary-purple)); font-weight:700;">${formatPrice(p.discountPrice !== null ? p.discountPrice : p.price)}</span>
                </a>
              `).join('');
              searchAutocompleteBox.style.display = 'flex';
            } else {
              searchAutocompleteBox.innerHTML = '<div style="padding:12px 14px; color:var(--text-muted); font-size:13px;">No results found.</div>';
              searchAutocompleteBox.style.display = 'flex';
            }
          } catch(err) { searchAutocompleteBox.style.display = 'none'; }
        });
      }
    }

    // â”€â”€ HAMBURGER + MOBILE SIDEBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');

    function openMobileSidebar() {
      if (!mobileSidebar || !sidebarBackdrop) return;
      mobileSidebar.classList.add('active');
      sidebarBackdrop.classList.add('active');
      mobileSidebar.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeMobileSidebar() {
      if (!mobileSidebar || !sidebarBackdrop) return;
      mobileSidebar.classList.remove('active');
      sidebarBackdrop.classList.remove('active');
      mobileSidebar.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', openMobileSidebar);
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
    if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeMobileSidebar);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMobileSidebar();
        const mobileOverlay = document.getElementById('mobile-search-overlay');
        if (mobileOverlay) mobileOverlay.classList.remove('active');
      }
    });

    // â”€â”€ MOBILE SEARCH OVERLAY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // The search icon on mobile opens the full-screen overlay instead of expanding inline
    const mobileSearchOverlay = document.getElementById('mobile-search-overlay');
    const mobileSearchClose = document.getElementById('mobile-search-close');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const mobileAutocompleteResults = document.getElementById('mobile-autocomplete-results');

    if (mobileSearchClose && mobileSearchOverlay) {
      mobileSearchClose.addEventListener('click', () => {
        mobileSearchOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    // Mobile autocomplete
    if (mobileSearchInput && mobileAutocompleteResults) {
      mobileSearchInput.addEventListener('input', async (e) => {
        const val = e.target.value.trim();
        if (val.length < 2) { mobileAutocompleteResults.innerHTML = ''; return; }
        try {
          const res = await fetch(`/api/products?search=${encodeURIComponent(val)}&limit=6`);
          const text = await res.text();
          let data;
          try { data = JSON.parse(text); } catch(ex) { return; }
          if (data.success && data.products && data.products.length > 0) {
            mobileAutocompleteResults.innerHTML = data.products.map(p => `
              <a href="/product-details.html?id=${p._id}" class="glass" style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-radius:8px; color:var(--text-color); font-weight:500; font-size:14px;">
                <span>${p.name}</span>
                <span style="color:hsl(var(--primary-purple)); font-weight:700;">${formatPrice(p.discountPrice !== null ? p.discountPrice : p.price)}</span>
              </a>
            `).join('');
          } else {
            mobileAutocompleteResults.innerHTML = '<div style="color:var(--text-muted); font-size:14px;">No results found.</div>';
          }
        } catch(err) { mobileAutocompleteResults.innerHTML = ''; }
      });
    }

    // ── DYNAMIC HEADER HEIGHT (Issue #2 fix) ──────────────────────────────────
    // After header renders, measure its actual height and apply as CSS variable.
    // Inner pages get body padding-top; home page hero gets margin-top.
    requestAnimationFrame(() => {
      const hh = headerEl.offsetHeight;
      document.documentElement.style.setProperty('--header-height', hh + 'px');
      const isHomePage = document.body.classList.contains('home-page');
      if (!isHomePage) {
        document.body.classList.add('inner-page');
        document.body.style.paddingTop = hh + 'px';
      } else {
        const heroEl = document.getElementById('hero-slider-container');
        if (heroEl) heroEl.style.marginTop = hh + 'px';
      }
    });

    // ── SIDEBAR ACCOUNT ACCORDION (Issue #4 fix) ──────────────────────────────
    const sidebarAccordionBtn = document.getElementById('sidebar-account-toggle');
    const sidebarAccordionMenu = document.getElementById('sidebar-account-submenu');
    const sidebarAccordionArrow = document.getElementById('sidebar-account-arrow');
    if (sidebarAccordionBtn && sidebarAccordionMenu) {
      sidebarAccordionBtn.addEventListener('click', () => {
        const isOpen = sidebarAccordionMenu.classList.toggle('open');
        if (sidebarAccordionArrow) {
          sidebarAccordionArrow.textContent = isOpen ? '\u25be' : '\u25b8';
        }
      });
    }
  }

  // â”€â”€ INJECT FOOTER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (footerEl) {
    footerEl.style.backgroundColor = 'var(--footer-bg)';
    footerEl.style.color = '#FFFFFF';
    footerEl.style.padding = '60px 0 30px';
    footerEl.style.marginTop = '60px';

    footerEl.innerHTML = `
      <div class="container grid grid-4" style="margin-bottom:40px;">
        <div>
          <h3 style="color:white; font-size:20px; margin-bottom:16px;">${brandName}</h3>
          <p style="color:#A59AB0; font-size:14px; margin-bottom:20px;">Making Every Celebration Memorable. Premium Return Gifts and Customized Gifts for weddings, baby showers, birthdays, and corporate events.</p>
          <div style="display:flex; gap:12px;">
            <a href="#" style="background:#2C1C3E; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:12px;">FB</a>
            <a href="#" style="background:#2C1C3E; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:12px;">IG</a>
            <a href="#" style="background:#2C1C3E; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:12px;">WA</a>
          </div>
        </div>
        <div>
          <h4 style="color:white; font-size:16px; margin-bottom:16px;">Gift Categories</h4>
          <ul style="list-style:none; display:flex; flex-direction:column; gap:10px; font-size:14px; color:#A59AB0;">
            <li><a href="/products.html?category=wedding-return-gifts" style="color:#A59AB0;">Wedding Return Gifts</a></li>
            <li><a href="/products.html?category=birthday-return-gifts" style="color:#A59AB0;">Birthday Return Gifts</a></li>
            <li><a href="/products.html?category=baby-shower-gifts" style="color:#A59AB0;">Baby Shower Return Gifts</a></li>
            <li><a href="/products.html?category=eco-friendly-gifts" style="color:#A59AB0;">Eco-Friendly Gifts</a></li>
          </ul>
        </div>
        <div>
          <h4 style="color:white; font-size:16px; margin-bottom:16px;">Quick Links</h4>
          <ul style="list-style:none; display:flex; flex-direction:column; gap:10px; font-size:14px; color:#A59AB0;">
            <li><a href="/about.html" style="color:#A59AB0;">Our Story</a></li>
            <li><a href="/contact.html" style="color:#A59AB0;">Contact Us</a></li>
            <li><a href="/profile.html" style="color:#A59AB0;">My Account</a></li>
            <li><a href="/sitemap.xml" style="color:#A59AB0;">Sitemap</a></li>
          </ul>
        </div>
        <div>
          <h4 style="color:white; font-size:16px; margin-bottom:16px;">Contact Support</h4>
          <p style="color:#A59AB0; font-size:14px; margin-bottom:10px;">12 Luxury Palace St, Chennai, Tamil Nadu - 600001</p>
          <p style="color:#A59AB0; font-size:14px; margin-bottom:10px;">Email: support@magizhvagam.com</p>
          <p class="contact-phone-val" style="color:#A59AB0; font-size:14px;">WhatsApp: +91 98765 43210</p>
        </div>
      </div>
      <div class="container" style="border-top:1px solid #2C1C3E; padding-top:20px; text-align:center; color:#A59AB0; font-size:13px;">
        <p>&copy; ${new Date().getFullYear()} ${brandName}. All Rights Reserved. Crafted for premium experiences.</p>
      </div>
    `;
    window.renderIcons && window.renderIcons();
  }
}

// Float WhatsApp support injector
async function setupWhatsApp() {
  let number = '919876543210';
  
  // Try fetching active contact number from server setting
  try {
    const res = await fetch('/api/settings/homepage');
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse WhatsApp settings JSON. Raw response:', text);
      throw e;
    }
    if (data.success && data.setting && data.setting.whatsappContact) {
      number = data.setting.whatsappContact;
    }
  } catch (err) {
    console.error('Failed to load WhatsApp settings:', err);
  }

  // Update footer text dynamically if present
  const footerWhatsappEl = Array.from(document.querySelectorAll('#main-footer p')).find(p => p.textContent.includes('WhatsApp:'));
  if (footerWhatsappEl) {
    footerWhatsappEl.textContent = `WhatsApp: +${number}`;
  }

  // Update contact page elements dynamically if present
  const contactPhoneEls = document.querySelectorAll('.contact-phone-val');
  contactPhoneEls.forEach(el => {
    el.textContent = `+${number}`;
  });

  const contactChatLink = document.querySelector('.contact-chat-link');
  if (contactChatLink) {
    contactChatLink.href = `https://wa.me/${number}?text=Hello%20Magizhvagam%2C%20I%20have%20a%20query%20about%20your%20customized%20gifts.`;
  }

  // Check if button already exists
  if (document.getElementById('floating-whatsapp-btn')) return;

  const btn = document.createElement('a');
  btn.id = 'floating-whatsapp-btn';
  btn.className = 'pulse-green';
  btn.href = `https://wa.me/${number}?text=Hello%20Magizhvagam%2C%20I%20have%20a%20query%20about%20your%20customized%20gifts.`;
  btn.target = '_blank';
  btn.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 30px;
    width: 60px;
    height: 60px;
    background-color: #25D366;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    z-index: 9999;
    text-decoration: none;
    font-size: 26px;
    font-weight: bold;
  `;
  // Simple inner icon
  btn.innerHTML = `
    <svg style="width:30px; height:30px; fill:white;" viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.32a8.188 8.188 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.15 0-.41.06-.63.29-.22.23-.84.82-.84 2s.87 2.33.99 2.49c.12.17 1.71 2.61 4.15 3.66.58.25 1.03.4 1.39.51.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.17.2-.58.2-1.07.14-1.17-.06-.1-.23-.16-.49-.29-.26-.13-1.53-.76-1.77-.85-.24-.09-.41-.13-.58.13-.17.26-.66.85-.81 1.02-.15.17-.3.19-.56.06-.26-.13-1.1-.41-2.1-1.3-.78-.7-1.31-1.56-1.46-1.82-.15-.26-.02-.4.11-.53.12-.11.26-.3.39-.46.13-.17.17-.29.26-.49.09-.19.04-.37-.02-.49-.06-.12-.58-1.4-1.8-1.82c-.22-.05-.44-.05-.63-.05z"/></svg>
  `;
  document.body.appendChild(btn);
}

// Dynamic login/register modal for guests
window.showLoginRegisterModal = (context = 'action') => {
  const existing = document.getElementById('guest-auth-modal');
  if (existing) existing.remove();

  const redirectPath = encodeURIComponent(window.location.pathname.substring(1) + window.location.search);
  const modal = document.createElement('div');
  modal.id = 'guest-auth-modal';
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.style.zIndex = '10000';
  
  let reasonText = 'Please login or create a customer account to continue.';
  if (context === 'wishlist') reasonText = 'Please login or create a customer account to continue.';
  if (context === 'cart') reasonText = 'Please login or create a customer account to continue.';

  modal.innerHTML = `
    <div class="modal-content glass scale-in" style="max-width: 420px; padding: 30px; text-align: center; border-radius: 16px; position:relative; background:#FAF9F6; border:1px solid var(--card-border); color:var(--text-color);">
      <button onclick="document.getElementById('guest-auth-modal').remove()" style="position:absolute; top:15px; right:15px; background:transparent; font-size:18px; font-weight:bold; color:var(--text-muted); cursor:pointer; border:none;">✕</button>
      <div style="font-size: 40px; margin-bottom:15px;">🔒</div>
      <h3 style="font-family:'Outfit'; font-size:22px; margin-bottom:10px; color:var(--text-color);">Session Required</h3>
      <p style="font-size:14px; color:var(--text-muted); line-height:1.6; margin-bottom:24px;">${reasonText}</p>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <a href="/login.html?redirect=${redirectPath}" class="btn btn-primary" style="padding:10px; border-radius:8px; font-weight:600; text-decoration:none; text-align:center; display:block;">Sign In / Login</a>
        <a href="/register.html?redirect=${redirectPath}" class="btn btn-secondary" style="padding:10px; border-radius:8px; border-width:1px; font-weight:600; text-decoration:none; text-align:center; display:block; border-color:hsl(var(--primary-purple)); color:hsl(var(--primary-purple));">Create An Account</a>
        <button onclick="document.getElementById('guest-auth-modal').remove()" class="btn" style="background:transparent; color:var(--text-muted); font-size:13px; font-weight:600; cursor:pointer; border:none; margin-top:5px;">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

// Redirect helpers for dynamic search URL extraction
window.getQueryParam = (name) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
};

// Global Quick View Modal
window.openQuickViewModal = async (productId) => {
  try {
    const res = await fetch(`/api/products/${productId}`);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse Quick View product JSON. Raw response:', text);
      throw e;
    }
    if (!data.success || !data.product) {
      showToast('Could not load product details', 'error');
      return;
    }

    const p = data.product;
    const price = typeof p.price === 'number' ? p.price : Number(p.price) || 0;
    const isDiscounted = p.discountPrice !== undefined && p.discountPrice !== null;
    const finalPrice = isDiscounted ? p.discountPrice : price;
    const imgUrl = p.images && p.images[0] ? p.images[0].url : '/assets/images/default-product.webp';

    // Remove existing quick view modal if any
    const existing = document.getElementById('global-quickview-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'global-quickview-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.style.zIndex = '9999';

    // Badges HTML
    let badgesHtml = '';
    if (p.stock === 0) {
      badgesHtml += `<span class="badge" style="background:#ef4444; color:white; margin-right:5px;">OUT OF STOCK</span>`;
    }
    if (isDiscounted) {
      const saving = (price > 0) ? Math.round(((price - p.discountPrice) / price) * 100) : 0;
      badgesHtml += `<span class="badge badge-new" style="margin-right:5px;">-${saving}% OFF</span>`;
    }
    if (p.tags && (p.tags.includes('new') || p.tags.includes('new-arrival'))) {
      badgesHtml += `<span class="badge" style="background:#8b5cf6; color:white; margin-right:5px;">NEW ARRIVAL</span>`;
    }
    if (p.tags && (p.tags.includes('bestseller') || p.tags.includes('best-seller'))) {
      badgesHtml += `<span class="badge badge-featured" style="margin-right:5px;">BESTSELLER</span>`;
    }

    modal.innerHTML = `
      <div class="modal-content glass animated scale-in" style="max-width: 800px; padding: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; position:relative;">
        <button onclick="document.getElementById('global-quickview-modal').remove()" style="position:absolute; top:15px; right:15px; background:transparent; font-size:20px; font-weight:bold; color:var(--text-muted); cursor:pointer;">✕</button>
        
        <!-- Left: Images -->
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="height:300px; border-radius:12px; overflow:hidden; border:1px solid var(--card-border); background:#FAF9F6; display:flex; align-items:center; justify-content:center;">
            <img id="qv-main-img" src="${imgUrl}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='/assets/images/default-product.webp'">
          </div>
          <div style="display:flex; gap:10px; overflow-x:auto;">
            ${(p.images || []).map((img, idx) => `
              <button onclick="document.getElementById('qv-main-img').src='${img.url}'" style="width:60px; height:60px; border-radius:6px; overflow:hidden; border:1px solid var(--card-border); cursor:pointer;">
                <img src="${img.url}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='/assets/images/default-product.webp'">
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Right: Info -->
        <div style="display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="margin-bottom:10px;">${badgesHtml}</div>
            <h3 style="font-size:24px; font-family:'Outfit'; margin-bottom:8px; color:var(--text-color);">${p.name}</h3>
            <span style="font-size:12px; color:hsl(var(--primary-purple)); font-weight:700; text-transform:uppercase;">${p.category ? p.category.name : 'Catalogue'}</span>
            
            <div style="display:flex; align-items:baseline; gap:10px; margin:15px 0;">
              <span style="font-size:24px; font-weight:800; color:hsl(var(--primary-purple));">${formatPrice(finalPrice)}</span>
              ${isDiscounted ? `<span style="font-size:16px; text-decoration:line-through; color:var(--text-muted);">${formatPrice(price)}</span>` : ''}
            </div>
            
            <p style="font-size:14px; color:var(--text-muted); line-height:1.6; margin-bottom:20px;">${p.description}</p>
            
            <div style="font-size:13px; color:var(--text-color); margin-bottom:20px; display:grid; grid-template-columns:1fr 1fr; gap:10px; border-top:1px solid var(--card-border); padding-top:15px;">
              <div><strong>Material:</strong> ${p.specifications.material || 'N/A'}</div>
              <div><strong>Dimensions:</strong> ${p.specifications.dimensions || 'N/A'}</div>
              <div><strong>Weight:</strong> ${p.specifications.weight || 'N/A'}</div>
              <div><strong>Color:</strong> ${p.specifications.color || 'N/A'}</div>
            </div>
          </div>

          <div style="display:flex; gap:12px;">
            <button class="btn btn-primary" onclick="addToCart('${p._id}', '${p.name.replace(/'/g, "\\'").replace(/"/g, "&quot;")}', ${finalPrice}, '${imgUrl}'); document.getElementById('global-quickview-modal').remove();" style="flex-grow:1; border-radius:8px; padding:10px;" ${p.stock === 0 ? 'disabled' : ''}>
              ${p.stock === 0 ? 'Sold Out' : 'Add To Cart'}
            </button>
            <button class="btn btn-secondary" onclick="toggleWishlist('${p._id}', '${p.name.replace(/'/g, "\\'").replace(/"/g, "&quot;")}', ${finalPrice}, '${imgUrl}'); document.getElementById('global-quickview-modal').remove();" style="border-radius:8px; padding:10px; border-width:1px;" aria-label="Add to Wishlist">
              ❤️ 
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  } catch (err) {
    showToast('Failed to open Quick View', 'error');
  }
};

// Global Reusable Product Card HTML Compiler
window.createProductCardHTML = (p) => {
  if (!p) return '';
  const viewer = getStoredUser();
  const hideShopActions = viewer && viewer.role === 'admin';
  const pId = p._id ? p._id.toString() : '';
  const name = p.name || 'Unnamed Gift';
  const description = p.description || '';
  
  // Safe price parsing
  const price = typeof p.price === 'number' ? p.price : Number(p.price) || 0;
  const discountPrice = (p.discountPrice !== undefined && p.discountPrice !== null && p.discountPrice !== '') ? Number(p.discountPrice) : null;
  const finalPrice = discountPrice !== null ? discountPrice : price;
  const isDiscounted = discountPrice !== null && discountPrice < price;
  const saving = (isDiscounted && price > 0) ? Math.round(((price - discountPrice) / price) * 100) : 0;

  // Images
  const imgUrl = resolveProductImage(p.images && p.images[0] ? p.images[0].url : null);
  const rawSecondary = p.images && p.images[1] ? p.images[1].url : null;
  const secondaryImgUrl = rawSecondary ? resolveProductImage(rawSecondary) : imgUrl;
  const hasAltImage = !!(rawSecondary && secondaryImgUrl !== imgUrl);
  const altImageClass = hasAltImage ? ' has-alt-image' : '';
  
  // Dynamic wishlist check
  const wishlist = getWishlist();
  const isInWishlist = wishlist.some(item => item.productId === pId);
  const heartFill = isInWishlist ? 'fill:hsl(var(--rose-pink)); stroke:hsl(var(--rose-pink));' : 'fill:none; stroke:#2E2538;';

  // Dynamic stacked badges
  let badgesHtml = '';
  const stock = typeof p.stock === 'number' ? p.stock : Number(p.stock) || 0;
  if (stock === 0) {
    badgesHtml += `<span class="badge" style="background:#ef4444; color:white; font-size:9px;">SOLD OUT</span>`;
  }
  if (isDiscounted) {
    badgesHtml += `<span class="badge badge-new" style="font-size:9px;">-${saving}% OFF</span>`;
  }
  const tags = p.tags || [];
  if (tags.includes('new') || tags.includes('new-arrival')) {
    badgesHtml += `<span class="badge" style="background:#8b5cf6; color:white; font-size:9px;">NEW</span>`;
  }
  if (tags.includes('bestseller') || tags.includes('best-seller')) {
    badgesHtml += `<span class="badge badge-featured" style="font-size:9px;">BESTSELLER</span>`;
  }

  const nameEscaped = name.replace(/'/g, "\\'").replace(/"/g, "&quot;");
  const ratingAvg = typeof p.averageRating === 'number' ? p.averageRating : Number(p.averageRating) || 0;
  const totalRev = typeof p.totalReviews === 'number' ? p.totalReviews : Number(p.totalReviews) || 0;

  const html = `
    <div class="product-card glass hover-lift animated fadeInUp${altImageClass}" style="border-radius:16px; overflow:hidden; position:relative; display:flex; flex-direction:column; justify-content:space-between; height:100%;">
      
      <!-- Badges Stack -->
      <div class="product-badge-stack" style="position:absolute; top:12px; left:12px; z-index:10; display:flex; flex-direction:column; gap:4px; align-items:flex-start;">
        ${badgesHtml}
      </div>
      
      <div class="image-zoom-container" style="height:220px; background:#FAF9F6; display:flex; align-items:center; justify-content:center; position:relative; border-bottom:1px solid var(--card-border); overflow:hidden;">
        <a href="/product-details.html?id=${pId}" style="width:100%; height:100%; display:block; position:relative;">
          <img src="${imgUrl}" alt="${nameEscaped}" class="product-primary-img" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='/assets/images/default-product.webp'">
          ${hasAltImage ? `<img src="${secondaryImgUrl}" alt="${nameEscaped}" class="product-secondary-img" onerror="this.src='/assets/images/default-product.webp'">` : ''}
        </a>
        
        <!-- Quick View Overlay Button -->
        <button class="quickview-overlay-btn" onclick="window.openQuickViewModal('${pId}')" style="position:absolute; bottom:12px; left:50%; transform:translateX(-50%); padding:6px 14px; font-size:12px; font-weight:700; font-family:'Outfit'; border-radius:20px; background:rgba(255,255,255,0.9); border:1px solid var(--card-border); color:var(--text-color); cursor:pointer; opacity:0; transition:all 0.3s ease; box-shadow:0 4px 10px rgba(0,0,0,0.1); z-index:11;">
          Quick View
        </button>

        ${hideShopActions ? '' : `<button type="button" class="wishlist-btn" data-product-id="${pId}" data-product-name="${encodeURIComponent(name)}" data-product-price="${finalPrice}" data-product-image="${encodeURIComponent(imgUrl)}" style="position:absolute; top:12px; right:12px; width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,0.85); display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:10; border:none; box-shadow:0 2px 5px rgba(0,0,0,0.1);" aria-label="Add to wishlist">
          <svg style="width:18px; height:18px; ${heartFill} stroke-width:2; pointer-events:none;" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </button>`}
      </div>

      <div style="padding:20px; display:flex; flex-direction:column; flex-grow:1; justify-content:space-between;">
        <div>
          <a href="/product-details.html?id=${pId}">
            <h4 style="font-size:15px; font-family:'Outfit'; font-weight:600; margin-bottom:8px; line-height:1.4; color:var(--text-color);">${nameEscaped}</h4>
          </a>
          <div style="display:flex; align-items:center; gap:4px; font-size:12px; color:#D4AF37; margin-bottom:14px;">
            <span>★</span>
            <strong style="color:var(--text-color);">${ratingAvg}</strong>
            <span style="color:var(--text-muted);">(${totalRev})</span>
          </div>
        </div>
        
        <div>
          <div style="display:flex; align-items:baseline; gap:8px; margin-bottom:16px;">
            <span style="font-size:18px; font-weight:800; color:hsl(var(--primary-purple));">${formatPrice(finalPrice)}</span>
            ${isDiscounted ? `<span style="font-size:14px; text-decoration:line-through; color:var(--text-muted);">${formatPrice(price)}</span>` : ''}
          </div>
          
          ${hideShopActions
            ? ''
            : `<button type="button" class="btn btn-primary" data-add-to-cart data-product-id="${pId}" data-product-name="${encodeURIComponent(name)}" data-product-price="${finalPrice}" data-product-image="${encodeURIComponent(imgUrl)}" data-quantity="1" style="width:100%; border-radius:8px; padding:8px 16px; font-size:13px;" ${stock === 0 ? 'disabled' : ''}>
            ${stock === 0 ? 'Sold Out' : 'Add to Cart'}
          </button>`}
        </div>
      </div>
    </div>
  `;

  return html;
};

window.toggleWishlistBtn = async (btn, id, name, price, img) => {
  const added = await toggleWishlist(id, name, price, img);
  const svg = btn.querySelector('svg');
  if (!svg) return;
  if (added) {
    svg.style.fill = 'hsl(var(--rose-pink))';
    svg.style.stroke = 'hsl(var(--rose-pink))';
  } else {
    svg.style.fill = 'none';
    svg.style.stroke = '#2E2538';
  }
};
