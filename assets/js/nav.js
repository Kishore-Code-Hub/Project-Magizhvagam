/**
 * MAGIZHVAGAM V4 — Dynamic Navigation Renderer
 * 
 * Renders desktop mega menu and mobile hamburger drawer from navigation_config API.
 * All styling via --nav-* and --hdr-* CSS variables.
 */

(function() {
  'use strict';

  // Force scroll restoration to manual and scroll to top immediately to prevent auto-scrolling
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;

  window.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0);
  });
  window.addEventListener('load', () => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 10);
  });

  let navConfig = null;

  async function fetchNavConfig() {
    try {
      const res = await fetch('/api/site-settings/navigation');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        navConfig = json.data;
        return navConfig;
      }
    } catch (err) {
      console.warn('[nav.js] Could not load navigation config, using inline defaults');
    }
    return null;
  }

  function renderDesktopNav(items) {
    if (!items || !items.length) return '';

    return items
      .sort((a, b) => a.order - b.order)
      .map(item => {
        let panelHtml = '';

        if (item.panel && item.panel.type === 'mega' && item.panel.columns) {
          const columnsHtml = item.panel.columns.map(col => `
            <div class="mega-column">
              <h4 class="mega-column-heading">${col.heading || ''}</h4>
              <ul class="mega-column-links">
                ${(col.links || []).map(link => `
                  <li><a href="${link.url}" class="mega-link${link.featured ? ' mega-link-featured' : ''}">${link.label}</a></li>
                `).join('')}
              </ul>
            </div>
          `).join('');

          const promoHtml = item.panel.promo && item.panel.promo.headline ? `
            <div class="mega-promo">
              ${item.panel.promo.imageUrl ? `<img src="${item.panel.promo.imageUrl}" alt="${item.panel.promo.headline}" class="mega-promo-img" loading="lazy">` : ''}
              <p class="mega-promo-headline">${item.panel.promo.headline}</p>
              ${item.panel.promo.ctaUrl ? `<a href="${item.panel.promo.ctaUrl}" class="mega-promo-cta">${item.panel.promo.ctaLabel || 'Shop Now'}</a>` : ''}
            </div>
          ` : '';

          panelHtml = `
            <div class="mega-panel" id="mega-${item.id}">
              <div class="mega-panel-inner">
                <div class="mega-columns">${columnsHtml}</div>
                ${promoHtml}
              </div>
            </div>
          `;
        } else if (item.panel && item.panel.type === 'dropdown' && item.panel.columns) {
          const links = item.panel.columns.flatMap(col => col.links || []);
          panelHtml = `
            <div class="nav-dropdown" id="dropdown-${item.id}">
              <ul class="dropdown-links">
                ${links.map(link => `<li><a href="${link.url}" class="dropdown-link">${link.label}</a></li>`).join('')}
              </ul>
            </div>
          `;
        }

        const hasPanel = item.panel && item.panel.type !== 'none';
        const panelTypeClass = hasPanel ? ` has-${item.panel.type}` : '';
        return `
          <li class="nav-item${hasPanel ? ' has-panel' : ''}${panelTypeClass}">
            <a href="${item.url}" class="nav-link" data-nav-id="${item.id}">${item.label}</a>
            ${panelHtml}
          </li>
        `;
      }).join('');
  }

  function renderMobileNav(items, depth) {
    if (!items || !items.length) return '';
    depth = depth || 0;
    if (depth > 2) return ''; // Max depth 3

    return items.map(item => {
      const hasChildren = item.children && item.children.length > 0;
      return `
        <li class="mobile-nav-item${hasChildren ? ' has-children' : ''}" data-depth="${depth}">
          <div class="mobile-nav-link-row">
            <a href="${item.url}" class="mobile-nav-link">${item.label}</a>
            ${hasChildren ? '<button class="mobile-nav-toggle" aria-label="Expand submenu"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button>' : ''}
          </div>
          ${hasChildren ? `<ul class="mobile-nav-children" style="display:none;">${renderMobileNav(item.children, depth + 1)}</ul>` : ''}
        </li>
      `;
    }).join('');
  }

  function initMobileToggle() {
    if (window.__mzNavToggleInitialized) return;
    window.__mzNavToggleInitialized = true;
    document.addEventListener('click', function(e) {
      const toggle = e.target.closest('.mobile-nav-toggle');
      if (!toggle) return;
      e.preventDefault();
      e.stopPropagation();

      const item = toggle.closest('.mobile-nav-item');
      const children = item.querySelector('.mobile-nav-children');
      if (children) {
        const isOpen = children.style.display !== 'none';
        children.style.display = isOpen ? 'none' : 'block';
        toggle.classList.toggle('expanded', !isOpen);
      }
    });
  }

  function initMobileDrawer() {
    // Mobile sidebar/drawer toggle event bindings are fully managed by app.js
  }

  // ─── Public render function ───────────────────────────────────────────────

  window.__mzNav = {
    render: async function(headerEl) {
      // Force navigation config lock client-side to keep layout stable and ignore legacy database overrides
      const DEFAULT_DESKTOP = [
        { id: 'nav-home', label: 'Home', url: '/', icon: 'home', order: 0, featured: false, panel: { type: 'none' } },
        { id: 'nav-categories', label: 'Categories', url: '#', icon: 'grid', order: 1, featured: true, panel: {
          type: 'dropdown',
          columns: [
            { links: [
              { label: 'Wedding Return Gifts', url: '/products?category=wedding-return-gifts' },
              { label: 'Birthday Gifts', url: '/products?category=birthday-gifts' },
              { label: 'Baby Shower Gifts', url: '/products?category=baby-shower-gifts' },
              { label: 'Corporate Gifts', url: '/products?category=corporate-gifts' },
              { label: 'Eco Friendly', url: '/products?category=eco-friendly-gifts' },
              { label: 'Gift Hampers', url: '/products?category=gift-hampers' },
              { label: 'Engraved Items', url: '/products?category=engraved-items' },
              { label: 'Festival Gifts', url: '/products?category=festival-gifts' }
            ]}
          ]
        }},
        { id: 'nav-products', label: 'Products', url: '/products', icon: 'shopping-bag', order: 2, featured: false, panel: { type: 'none' } },
        { id: 'nav-about', label: 'About', url: '/about', icon: 'info', order: 3, featured: false, panel: { type: 'none' } },
        { id: 'nav-contact', label: 'Contact', url: '/contact', icon: 'phone', order: 4, featured: false, panel: { type: 'none' } }
      ];

      const DEFAULT_MOBILE = [
        { label: 'Home', url: '/', children: [] },
        { label: 'Categories', url: '#', children: [
          { label: 'Wedding Return Gifts', url: '/products?category=wedding-return-gifts', children: [] },
          { label: 'Birthday Gifts', url: '/products?category=birthday-gifts', children: [] },
          { label: 'Baby Shower Gifts', url: '/products?category=baby-shower-gifts', children: [] },
          { label: 'Corporate Gifts', url: '/products?category=corporate-gifts', children: [] },
          { label: 'Eco Friendly', url: '/products?category=eco-friendly-gifts', children: [] },
          { label: 'Gift Hampers', url: '/products?category=gift-hampers', children: [] },
          { label: 'Engraved Items', url: '/products?category=engraved-items', children: [] },
          { label: 'Festival Gifts', url: '/products?category=festival-gifts', children: [] }
        ]},
        { label: 'Products', url: '/products', children: [] },
        { label: 'About', url: '/about', children: [] },
        { label: 'Contact', url: '/contact', children: [] }
      ];

      const config = { desktop: DEFAULT_DESKTOP, mobile: DEFAULT_MOBILE };

      if (headerEl) {
        const desktopNavList = headerEl.querySelector('.desktop-nav-list');
        if (desktopNavList && config.desktop) {
          desktopNavList.innerHTML = renderDesktopNav(config.desktop);
        }

        const mobileNavList = headerEl.querySelector('.mobile-nav-list');
        if (mobileNavList && config.mobile) {
          mobileNavList.innerHTML = renderMobileNav(config.mobile);
        }
      }

      initMobileToggle();
      initMobileDrawer();
      injectBottomNavBar();
    }
  };

  function injectBottomNavBar() {
    if (document.querySelector('.mobile-bottom-nav-bar')) return;

    const navBar = document.createElement('div');
    navBar.className = 'mobile-bottom-nav-bar';
    navBar.innerHTML = `
      <a href="/" class="mobile-bottom-nav-item" id="bottom-nav-home">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Home</span>
      </a>
      <a href="/products" class="mobile-bottom-nav-item" id="bottom-nav-shop">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span>Shop</span>
      </a>
      <a href="/cart" class="mobile-bottom-nav-item" id="bottom-nav-cart">
        <div style="position:relative;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          <span class="badge-count bottom-nav-badge" id="bottom-cart-badge" style="display:none;">0</span>
        </div>
        <span>Cart</span>
      </a>
      <a href="/wishlist" class="mobile-bottom-nav-item" id="bottom-nav-wishlist">
        <div style="position:relative;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span class="badge-count bottom-nav-badge" id="bottom-wishlist-badge" style="display:none;">0</span>
        </div>
        <span>Wishlist</span>
      </a>
      <a href="/account" class="mobile-bottom-nav-item" id="bottom-nav-account">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>Account</span>
      </a>
    `;
    document.body.appendChild(navBar);

    // Highlight active navigation item
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') {
      document.getElementById('bottom-nav-home')?.classList.add('active');
    } else if (path.includes('products.html') || path.includes('/products') || path.includes('/product/')) {
      document.getElementById('bottom-nav-shop')?.classList.add('active');
    } else if (path.includes('cart.html') || path.includes('/cart')) {
      document.getElementById('bottom-nav-cart')?.classList.add('active');
    } else if (path.includes('wishlist.html') || path.includes('/wishlist')) {
      document.getElementById('bottom-nav-wishlist')?.classList.add('active');
    } else if (path.includes('profile.html') || path.includes('/account')) {
      document.getElementById('bottom-nav-account')?.classList.add('active');
    }

    // Bind event loop for synchronizing badge counts
    setInterval(syncBottomNavCounters, 1000);
    syncBottomNavCounters();
  }

  function syncBottomNavCounters() {
    try {
      const cartCountEl = document.getElementById('bottom-cart-badge');
      if (cartCountEl) {
        const cartData = JSON.parse(localStorage.getItem('mz-cart') || '[]');
        const totalQty = cartData.reduce((sum, item) => sum + (item.quantity || 0), 0);
        cartCountEl.textContent = totalQty;
        cartCountEl.style.display = totalQty > 0 ? 'flex' : 'none';
      }

      const wishlistCountEl = document.getElementById('bottom-wishlist-badge');
      if (wishlistCountEl) {
        const wishlistData = JSON.parse(localStorage.getItem('mz-wishlist') || '[]');
        const totalWish = wishlistData.length;
        wishlistCountEl.textContent = totalWish;
        wishlistCountEl.style.display = totalWish > 0 ? 'flex' : 'none';
      }
    } catch (e) {
      // safe fallback
    }
  }

})();
