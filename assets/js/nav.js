/**
 * MAGIZHVAGAM V4 — Dynamic Navigation Renderer
 * 
 * Renders desktop mega menu and mobile hamburger drawer from navigation_config API.
 * All styling via --nav-* and --hdr-* CSS variables.
 */

(function() {
  'use strict';

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
    const hamburger = document.getElementById('mobile-menu-btn') || document.getElementById('hamburger-btn');
    const drawer = document.getElementById('mobile-nav-drawer') || document.getElementById('mobile-sidebar');
    const overlay = document.getElementById('mobile-nav-overlay') || document.getElementById('sidebar-backdrop');
    const closeBtn = document.getElementById('mobile-nav-close') || document.getElementById('sidebar-close-btn');

    if (!hamburger || !drawer) return;

    function openDrawer() {
      drawer.classList.add('open');
      if (overlay) overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      drawer.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);
  }

  // ─── Public render function ───────────────────────────────────────────────

  window.__mzNav = {
    render: async function(headerEl) {
      // Force navigation config lock client-side to keep layout stable and ignore legacy database overrides
      const DEFAULT_DESKTOP = [
        { id: 'nav-home', label: 'Home', url: '/index.html', icon: 'home', order: 0, featured: false, panel: { type: 'none' } },
        { id: 'nav-categories', label: 'Categories', url: '#', icon: 'grid', order: 1, featured: true, panel: {
          type: 'dropdown',
          columns: [
            { links: [
              { label: 'Wedding Return Gifts', url: '/products.html?category=wedding-return-gifts' },
              { label: 'Birthday Gifts', url: '/products.html?category=birthday-gifts' },
              { label: 'Baby Shower Gifts', url: '/products.html?category=baby-shower-gifts' },
              { label: 'Corporate Gifts', url: '/products.html?category=corporate-gifts' },
              { label: 'Eco Friendly', url: '/products.html?category=eco-friendly-gifts' },
              { label: 'Gift Hampers', url: '/products.html?category=gift-hampers' },
              { label: 'Engraved Items', url: '/products.html?category=engraved-items' },
              { label: 'Festival Gifts', url: '/products.html?category=festival-gifts' }
            ]}
          ]
        }},
        { id: 'nav-products', label: 'Products', url: '/products.html', icon: 'shopping-bag', order: 2, featured: false, panel: { type: 'none' } },
        { id: 'nav-about', label: 'About', url: '/about.html', icon: 'info', order: 3, featured: false, panel: { type: 'none' } },
        { id: 'nav-contact', label: 'Contact', url: '/contact.html', icon: 'phone', order: 4, featured: false, panel: { type: 'none' } }
      ];

      const DEFAULT_MOBILE = [
        { label: 'Home', url: '/index.html', children: [] },
        { label: 'Categories', url: '#', children: [
          { label: 'Wedding Return Gifts', url: '/products.html?category=wedding-return-gifts', children: [] },
          { label: 'Birthday Gifts', url: '/products.html?category=birthday-gifts', children: [] },
          { label: 'Baby Shower Gifts', url: '/products.html?category=baby-shower-gifts', children: [] },
          { label: 'Corporate Gifts', url: '/products.html?category=corporate-gifts', children: [] },
          { label: 'Eco Friendly', url: '/products.html?category=eco-friendly-gifts', children: [] },
          { label: 'Gift Hampers', url: '/products.html?category=gift-hampers', children: [] },
          { label: 'Engraved Items', url: '/products.html?category=engraved-items', children: [] },
          { label: 'Festival Gifts', url: '/products.html?category=festival-gifts', children: [] }
        ]},
        { label: 'Products', url: '/products.html', children: [] },
        { label: 'About', url: '/about.html', children: [] },
        { label: 'Contact', url: '/contact.html', children: [] }
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
    }
  };

})();
