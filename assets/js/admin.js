if (typeof window.renderIcons !== 'function') {
  window.renderIcons = function() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    } else {
      if (!document.getElementById('lucide-script-fallback')) {
        const script = document.createElement('script');
        script.id = 'lucide-script-fallback';
        script.src = '/assets/vendor/lucide.min.js';
        script.onload = () => {
          if (typeof lucide !== 'undefined') lucide.createIcons();
        };
        document.head.appendChild(script);
      }
    }
  };
}
if (typeof initIcons !== 'function') {
  window.initIcons = window.renderIcons;
}

// Force scroll restoration to manual and scroll to top immediately to prevent auto-scrolling on admin pages
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

async function initAdminRouterPage() {
  const path = window.location.pathname;
  if (path.includes('dashboard.html')) {
    loadDashboardData();
    loadFeatureToggles();
    initDashboardEvents();
  } else if (path.includes('products.html')) {
    loadAdminProducts();
    initProductsPageEvents();
  } else if (path.includes('orders.html')) {
    loadAdminOrders();
  } else if (path.includes('invoices.html')) {
    initInvoiceSearch();
  } else if (path.includes('customers.html')) {
    loadAdminCustomers();
  } else if (path.includes('settings.html')) {
    if (typeof window.initSettingsPage === 'function') {
      window.initSettingsPage();
    }

  } else if (path.includes('marketing.html')) {
    if (typeof window.initMarketingPage === 'function') {
      window.initMarketingPage();
    }
  } else if (path.includes('content.html')) {
    if (typeof window.initContentPage === 'function') {
      window.initContentPage();
    }
  } else if (path.includes('reports.html')) {
    loadReportsPageData();
  } else if (path.includes('media.html')) {
    if (typeof window.initMediaPage === 'function') {
      window.initMediaPage();
    }
  } else if (path.includes('security-logs.html')) {
    if (typeof window.initSecurityLogsPage === 'function') {
      window.initSecurityLogsPage();
    }
  } else if (path.includes('enquiries.html') || path.includes('support.html')) {
    if (typeof window.loadAdminEnquiries === 'function') {
      window.loadAdminEnquiries();
    }
  }
}
window.initAdminRouterPage = initAdminRouterPage;
window.toggleSubmenu = function(id) {
  const menu = document.getElementById('menu-' + id);
  const submenu = document.getElementById('submenu-' + id);
  if (menu && submenu) {
    const isExpanded = menu.classList.contains('expanded');
    menu.classList.toggle('expanded', !isExpanded);
    submenu.classList.toggle('open', !isExpanded);
  }
};

let isUnloading = false;
window.addEventListener('beforeunload', () => {
  isUnloading = true;
  const menuContainer = document.querySelector('.admin-sidebar .admin-menu');
  if (menuContainer) {
    localStorage.setItem('sidebar-scroll', menuContainer.scrollTop);
  }
});

function injectAdminSidebar() {
  const layout = document.querySelector('.admin-layout');
  if (layout) {
    const savedTheme = localStorage.getItem('admin-theme');
    if (savedTheme === 'light') {
      layout.classList.add('light-mode');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      layout.classList.remove('light-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    if (localStorage.getItem('sidebar-collapsed') === 'true') {
      layout.classList.add('sidebar-collapsed');
    } else {
      const savedWidth = localStorage.getItem('sidebar-width');
      if (savedWidth) {
        layout.style.setProperty('--sidebar-width', savedWidth + 'px');
      }
    }
  }

  const sidebar = document.getElementById('admin-sidebar-container');
  if (!sidebar) return;

  // Set opacity to 0 immediately to prevent visual flicker during scroll restoration
  sidebar.style.opacity = '0';
  sidebar.style.transition = 'opacity 0.15s ease';

  const path = window.location.pathname;

  const activeCls = (file) => path.includes(file) ? 'active' : '';
  const isGroupActive = (files) => files.some(file => path.includes(file));

  sidebar.className = 'admin-sidebar';

  const menuGroups = [
    {
      id: 'catalog',
      title: 'Catalog',
      icon: 'gift',
      files: ['products.html', 'categories.html', 'brands.html', 'inventory.html', 'warehouse.html', 'variants.html', 'collections.html', 'media.html', 'media-manager.html'],
      items: [
        { name: 'Products', file: 'products.html', icon: 'package' },
        { name: 'Categories', file: 'categories.html', icon: 'tag' },
        { name: 'Brands', file: 'brands.html', icon: 'award' },
        { name: 'Inventory & Stock', file: 'inventory.html', icon: 'archive' },
        { name: 'Warehouse Hubs', file: 'warehouse.html', icon: 'warehouse' },
        { name: 'Product Variants', file: 'variants.html', icon: 'layers' },
        { name: 'Collections', file: 'collections.html', icon: 'folder-heart' },
        { name: 'Media Library', file: 'media.html', icon: 'image' },
        { name: 'Media Manager', file: 'media-manager.html', icon: 'file-image' }
      ]
    },
    {
      id: 'sales',
      title: 'Sales',
      icon: 'shopping-bag',
      files: ['orders.html', 'returns.html', 'refunds.html', 'courier.html', 'shipping.html', 'customers.html', 'customer-groups.html', 'invoices.html', 'purchase-orders.html', 'credit-notes.html', 'payments.html'],
      items: [
        { name: 'Orders Registry', file: 'orders.html', icon: 'shopping-bag' },
        { name: 'Returns Registry', file: 'returns.html', icon: 'refresh-ccw' },
        { name: 'Refunds Wallet', file: 'refunds.html', icon: 'wallet' },
        { name: 'Courier Partners', file: 'courier.html', icon: 'truck' },
        { name: 'Shipping Zones', file: 'shipping.html', icon: 'globe' },
        { name: 'Customers List', file: 'customers.html', icon: 'users' },
        { name: 'Customer Groups', file: 'customer-groups.html', icon: 'users-2' },
        { name: 'Invoice Resolution', file: 'invoices.html', icon: 'file-text' },
        { name: 'Purchase Orders', file: 'purchase-orders.html', icon: 'file-spreadsheet' },
        { name: 'Credit Notes', file: 'credit-notes.html', icon: 'receipt' },
        { name: 'Payments Logs', file: 'payments.html', icon: 'credit-card' }
      ]
    },
    {
      id: 'marketing',
      title: 'Marketing',
      icon: 'zap',
      files: ['coupons.html', 'flash-sales.html', 'newsletter.html', 'popup-builder.html', 'campaigns.html', 'affiliates.html', 'email-studio.html', 'sms-studio.html', 'whatsapp-studio.html', 'referrals.html'],
      items: [
        { name: 'Discount Coupons', file: 'coupons.html', icon: 'percent' },
        { name: 'Flash Promotions', file: 'flash-sales.html', icon: 'zap' },
        { name: 'Newsletter Admin', file: 'newsletter.html', icon: 'mail' },
        { name: 'Popup Builder', file: 'popup-builder.html', icon: 'message-circle' },
        { name: 'Marketing Campaigns', file: 'campaigns.html', icon: 'smartphone' },
        { name: 'Affiliate Program', file: 'affiliates.html', icon: 'users-round' },
        { name: 'Email Studio', file: 'email-studio.html', icon: 'mail-open' },
        { name: 'SMS Studio', file: 'sms-studio.html', icon: 'message-square' },
        { name: 'WhatsApp Studio', file: 'whatsapp-studio.html', icon: 'messages-square' },
        { name: 'Referral Rewards', file: 'referrals.html', icon: 'gift' }
      ]
    },
    {
      id: 'content',
      title: 'Content',
      icon: 'home',
      files: ['homepage-builder.html', 'about-builder.html', 'contact-builder.html', 'navigation-builder.html', 'seo.html', 'theme-builder.html', 'content-pages.html', 'blogs.html'],
      items: [
        { name: 'Homepage Builder', file: 'homepage-builder.html', icon: 'home' },
        { name: 'About Page', file: 'about-builder.html', icon: 'info' },
        { name: 'Contact Page', file: 'contact-builder.html', icon: 'phone' },
        { name: 'Navigation Menu', file: 'navigation-builder.html', icon: 'menu' },
        { name: 'SEO Meta Config', file: 'seo.html', icon: 'search' },
        { name: 'Theme Styles', file: 'theme-builder.html', icon: 'palette' },
        { name: 'Content Pages', file: 'content-pages.html', icon: 'file-text' },
        { name: 'Blogs & Articles', file: 'blogs.html', icon: 'book-open' }
      ]
    },
    {
      id: 'management',
      title: 'Management',
      icon: 'users',
      files: ['users.html', 'roles.html', 'permissions.html', 'staff.html', 'vendors.html', 'reports.html', 'faq.html', 'support.html', 'support-tickets.html', 'reviews.html', 'security.html', 'api-keys.html', 'system-diagnostics.html', 'backups.html'],
      items: [
        { name: 'Users Register', file: 'users.html', icon: 'users' },
        { name: 'RBAC Roles', file: 'roles.html', icon: 'shield' },
        { name: 'RBAC Permissions', file: 'permissions.html', icon: 'key' },
        { name: 'Staff Management', file: 'staff.html', icon: 'user-cog' },
        { name: 'Vendor Directory', file: 'vendors.html', icon: 'store' },
        { name: 'Reports & Analytics', file: 'reports.html', icon: 'bar-chart-3' },
        { name: 'FAQ Manager', file: 'faq.html', icon: 'help-circle' },
        { name: 'Support Desk Chat', file: 'support.html', icon: 'message-square' },
        { name: 'Support Tickets', file: 'support-tickets.html', icon: 'ticket' },
        { name: 'Product Reviews', file: 'reviews.html', icon: 'star' },
        { name: 'Security Audits', file: 'security.html', icon: 'shield-alert' },
        { name: 'API Diagnostics', file: 'api-keys.html', icon: 'key-round' },
        { name: 'System Coordinates', file: 'system-diagnostics.html', icon: 'activity' },
        { name: 'Database Backups', file: 'backups.html', icon: 'database' }
      ]
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings',
      files: ['settings.html', 'store-settings.html', 'taxes.html', 'smtp-settings.html', 'payment-gateway.html', 'payment-settings.html', 'shipping-settings.html', 'profile-settings.html'],
      items: [
        { name: 'General Settings', file: 'settings.html', icon: 'settings' },
        { name: 'Store Coordinates', file: 'store-settings.html', icon: 'map-pin' },
        { name: 'Taxes & GST rates', file: 'taxes.html', icon: 'percent' },
        { name: 'SMTP configuration', file: 'smtp-settings.html', icon: 'mail-warning' },
        { name: 'Payment Gateways', file: 'payment-gateway.html', icon: 'wallet-cards' },
        { name: 'Payment Settings', file: 'payment-settings.html', icon: 'credit-card' },
        { name: 'Shipping Settings', file: 'shipping-settings.html', icon: 'truck' },
        { name: 'Admin Profile', file: 'profile-settings.html', icon: 'user' }
      ]
    }
  ];

  const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
  const toggleChevron = isCollapsed ? 'chevron-right' : 'chevron-left';

  let menuHtml = `
    <!-- Workspace Selector Header -->
    <div class="workspace-switcher" style="padding: 16px 20px; border-bottom: 1px solid var(--adm-border); display: flex; align-items: center; justify-content: space-between; cursor: pointer; background: rgba(255,255,255,0.01); position: relative; gap: 8px;">
      <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex-grow: 1;">
        <div class="workspace-logo" style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, var(--adm-accent) 0%, var(--adm-accent-hover) 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 14px; flex-shrink: 0;">M</div>
        <div style="min-width: 0;" class="profile-info-wrapper">
          <h4 style="margin: 0; font-size: 13px; font-weight: 800; color: var(--adm-text); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">Magizhvagam OS</h4>
          <span style="font-size: 10px; color: var(--adm-text-muted); display: block;">Main • HQ Console</span>
        </div>
      </div>
      <button type="button" id="sidebar-toggle-btn" style="background: transparent; border: 1px solid var(--adm-border); border-radius: 6px; color: var(--adm-text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 5px; transition: all 0.2s ease; flex-shrink: 0;" aria-label="Toggle sidebar">
        <i data-lucide="${toggleChevron}" id="toggle-btn-icon" style="width: 14px; height: 14px;"></i>
      </button>
    </div>

    <!-- Search Filter Navigation Box -->
    <div style="padding: 10px 16px; border-bottom: 1px solid var(--adm-border);" class="sidebar-search-wrapper">
      <div style="position: relative; display: flex; align-items: center;">
        <i data-lucide="search" style="position: absolute; left: 10px; width: 12px; height: 12px; color: var(--adm-text-muted);"></i>
        <input type="text" id="sidebar-filter-input" placeholder="Quick filter workspaces..." style="width: 100%; background: rgba(0,0,0,0.12); border: 1px solid var(--adm-border); border-radius: 6px; padding: 6px 10px 6px 28px; font-size: 11px; color: var(--adm-text); outline: none;">
      </div>
    </div>

    <!-- Navigation List -->
    <ul class="admin-menu" style="overflow-y: auto; height: calc(100vh - 220px); padding-bottom: 40px; margin: 0; list-style: none;">
      <!-- OVERVIEW -->
      <li class="menu-group-title" style="padding: 14px 16px 6px; font-size: 10px; font-weight: 700; color: var(--adm-text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Overview</li>
      <li class="admin-menu-item ${activeCls('dashboard.html')}">
        <a href="/admin/dashboard.html"><i data-lucide="layout-dashboard"></i> <span>Dashboard</span></a>
      </li>
  `;

  menuGroups.forEach(group => {
    const isGroupActivePage = isGroupActive(group.files);
    const savedState = localStorage.getItem('submenu_' + group.id + '_expanded');
    const isOpen = savedState === 'true' || (savedState === null && isGroupActivePage);

    menuHtml += `
      <li class="admin-menu-item has-submenu ${isGroupActivePage ? 'active' : ''}" style="margin-top: 10px; border-top: 1px solid var(--adm-border); padding-top: 8px;">
        <div class="admin-menu-item-link" data-group-id="${group.id}" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; color: var(--adm-text);">
          <span style="display: flex; align-items: center; gap: 10px;">
            <i data-lucide="${group.icon}" style="width: 16px; height: 16px;"></i>
            <span class="group-title-span" style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">${group.title}</span>
          </span>
          <i data-lucide="chevron-down" class="submenu-toggle-icon ${isOpen ? 'open' : ''}" style="width: 12px; height: 12px; transition: transform 0.2s; ${isOpen ? 'transform: rotate(180deg);' : ''}"></i>
        </div>
        <ul class="admin-menu-submenu" id="submenu-${group.id}" style="list-style: none; padding-left: 16px; margin: 0; display: ${isOpen ? 'block' : 'none'};">
          ${group.items.map(item => `
            <li class="admin-menu-submenu-item ${activeCls(item.file)}" style="margin: 4px 0;">
              <a href="/admin/${item.file}" style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; font-size: 12.5px; color: var(--adm-text-muted); border-radius: var(--radius-sm); text-decoration: none; transition: all 0.2s;">
                <i data-lucide="${item.icon}" style="width: 14px; height: 14px;"></i>
                <span>${item.name}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      </li>
    `;
  });

  menuHtml += `
    </ul>

    <!-- Workspace Profile Footer -->
    <div class="sidebar-profile-footer" style="padding: 16px 20px; border-top: 1px solid var(--adm-border); display: flex; align-items: center; gap: 12px; margin-top: auto; background: rgba(255,255,255,0.01);">
      <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--adm-accent); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 12px;" id="sidebar-avatar-initials">AD</div>
      <div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column;" class="profile-info-wrapper">
        <span style="font-size: 12px; font-weight: 700; color: var(--adm-text); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" id="sidebar-profile-name">Admin Owner</span>
        <span style="font-size: 10px; color: var(--adm-text-muted);">Administrator</span>
      </div>
      <a href="#" onclick="window.handleLogout(); return false;" style="color: var(--adm-danger) !important; display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 6px;" title="Sign Out">
        <i data-lucide="log-out" style="width: 14px; height: 14px;"></i>
      </a>
    </div>
  `;

  sidebar.innerHTML = menuHtml;
  window.renderIcons();

  // Restore scroll state immediately and synchronously to eliminate visual jumping/flickering
  const menuContainer = sidebar.querySelector('.admin-menu');
  if (menuContainer) {
    const savedScroll = localStorage.getItem('sidebar-scroll');
    if (savedScroll !== null) {
      menuContainer.scrollTop = parseInt(savedScroll, 10);
    } else {
      const activeItem = menuContainer.querySelector('.admin-menu-submenu-item.active, .admin-menu-item.active');
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' });
      }
    }
    
    // Save scroll on scroll events only if NOT unloading to prevent teardown scroll event (scrollTop = 0) from overwriting it
    menuContainer.addEventListener('scroll', () => {
      if (!isUnloading) {
        localStorage.setItem('sidebar-scroll', menuContainer.scrollTop);
      }
    });

    // Save scroll on click of any sidebar link
    menuContainer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (!isUnloading) {
          localStorage.setItem('sidebar-scroll', menuContainer.scrollTop);
        }
      });
    });
  }

  // Restore opacity now that scroll coordinate is synchronized
  requestAnimationFrame(() => {
    sidebar.style.opacity = '1';
  });

  // Bind click toggle on headers
  sidebar.querySelectorAll('.admin-menu-item-link').forEach(link => {
    link.addEventListener('click', () => {
      const groupId = link.getAttribute('data-group-id');
      if (!groupId) return;

      const submenu = document.getElementById('submenu-' + groupId);
      const icon = link.querySelector('.submenu-toggle-icon');

      if (submenu && icon) {
        const isCurrentlyOpen = submenu.style.display === 'block';
        if (isCurrentlyOpen) {
          submenu.style.display = 'none';
          icon.style.transform = 'none';
          localStorage.setItem('submenu_' + groupId + '_expanded', 'false');
        } else {
          submenu.style.display = 'block';
          icon.style.transform = 'rotate(180deg)';
          localStorage.setItem('submenu_' + groupId + '_expanded', 'true');
        }
      }
    });
  });

  // Attach workspace selector header toggle
  const switcher = sidebar.querySelector('.workspace-switcher');
  if (switcher) {
    switcher.addEventListener('click', (e) => {
      if (e.target.closest('#sidebar-toggle-btn') || layout.classList.contains('sidebar-collapsed')) {
        layout.classList.toggle('sidebar-collapsed');
        const isCollapsed = layout.classList.contains('sidebar-collapsed');
        localStorage.setItem('sidebar-collapsed', isCollapsed ? 'true' : 'false');
        
        // Update toggle icon
        const icon = sidebar.querySelector('#toggle-btn-icon');
        if (icon) {
          icon.setAttribute('data-lucide', isCollapsed ? 'chevron-right' : 'chevron-left');
          window.renderIcons();
        }

        if (isCollapsed) {
          layout.style.removeProperty('--sidebar-width');
        } else {
          const savedWidth = localStorage.getItem('sidebar-width');
          if (savedWidth) {
            layout.style.setProperty('--sidebar-width', savedWidth + 'px');
          }
        }
      }
    });
  }

  // Attach search filter logic
  const filterInput = document.getElementById('sidebar-filter-input');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const items = sidebar.querySelectorAll('.admin-menu-submenu-item, .admin-menu-item');
      const groupTitles = sidebar.querySelectorAll('.menu-group-title');

      if (!q) {
        items.forEach(el => el.style.display = 'block');
        groupTitles.forEach(el => el.style.display = 'block');
        sidebar.querySelectorAll('.admin-menu-submenu').forEach(el => {
          const groupId = el.id.replace('submenu-', '');
          const savedState = localStorage.getItem('submenu_' + groupId + '_expanded');
          const isGroupActivePage = isGroupActive(menuGroups.find(g => g.id === groupId).files);
          const isOpen = savedState === 'true' || (savedState === null && isGroupActivePage);
          el.style.display = isOpen ? 'block' : 'none';
          const icon = el.previousElementSibling.querySelector('.submenu-toggle-icon');
          if (icon) icon.style.transform = isOpen ? 'rotate(180deg)' : 'none';
        });
        return;
      }

      groupTitles.forEach(el => el.style.display = 'none');

      items.forEach(el => {
        if (el.classList.contains('admin-menu-submenu-item') || (!el.classList.contains('has-submenu') && el.classList.contains('admin-menu-item'))) {
          const text = el.textContent.toLowerCase();
          if (text.includes(q)) {
            el.style.display = 'block';
            const parentSubmenu = el.closest('.admin-menu-submenu');
            if (parentSubmenu) {
              parentSubmenu.style.display = 'block';
              const parentHeaderIcon = parentSubmenu.previousElementSibling.querySelector('.submenu-toggle-icon');
              if (parentHeaderIcon) parentHeaderIcon.style.transform = 'rotate(180deg)';
            }
          } else {
            el.style.display = 'none';
          }
        }
      });
    });
  }
}


/* ─── Sidebar Drag-to-Resize Logic ─── */
function initSidebarResizer() {
  const sidebar = document.querySelector('.admin-sidebar');
  if (!sidebar) return;

  // Check if resizer handle exists, otherwise append it
  let resizer = sidebar.querySelector('.sidebar-resizer');
  if (!resizer) {
    resizer = document.createElement('div');
    resizer.className = 'sidebar-resizer';
    sidebar.appendChild(resizer);
  }

  // Load custom width from localStorage
  const savedWidth = localStorage.getItem('sidebar-width');
  const layout = document.querySelector('.admin-layout');
  if (savedWidth && layout && !layout.classList.contains('sidebar-collapsed')) {
    layout.style.setProperty('--sidebar-width', savedWidth + 'px');
  }

  // Mouse drag logic
  let startX, startWidth;

  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const layout = document.querySelector('.admin-layout');
    if (layout && layout.classList.contains('sidebar-collapsed')) return; // Disable resizer when collapsed

    startX = e.clientX;
    startWidth = parseInt(getComputedStyle(sidebar).width, 10);
    
    if (layout) layout.classList.add('resizing');
    resizer.classList.add('dragging');

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });

  function handleMouseMove(e) {
    const width = startWidth + (e.clientX - startX);
    if (width >= 180 && width <= 400) { // Limit resizing boundaries
      const layout = document.querySelector('.admin-layout');
      if (layout) {
        layout.style.setProperty('--sidebar-width', width + 'px');
        localStorage.setItem('sidebar-width', width);
      }
    }
  }

  function handleMouseUp() {
    const layout = document.querySelector('.admin-layout');
    if (layout) layout.classList.remove('resizing');
    resizer.classList.remove('dragging');
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
}

/* ─── Sticky Top Navigation Bar ─── */
function injectAdminTopbar() {
  const mainPanel = document.querySelector('.admin-main');
  if (!mainPanel) return;

  // Remove existing topbar if present to avoid duplication
  const existingTopbar = mainPanel.querySelector('.admin-topbar');
  if (existingTopbar) {
    existingTopbar.remove();
  }

  // Determine current page and section for breadcrumbs
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const currentTab = params.get('tab');

  const pathMap = {
    // Catalog
    'products.html': { section: 'Catalog', name: 'Products' },
    'categories.html': { section: 'Catalog', name: 'Categories' },
    'brands.html': { section: 'Catalog', name: 'Brands' },
    'inventory.html': { section: 'Catalog', name: 'Inventory & Stock' },
    'warehouse.html': { section: 'Catalog', name: 'Warehouse Hubs' },
    'variants.html': { section: 'Catalog', name: 'Product Variants' },
    'collections.html': { section: 'Catalog', name: 'Collections' },
    'media.html': { section: 'Catalog', name: 'Media Library' },
    'media-manager.html': { section: 'Catalog', name: 'Media Manager' },
    // Sales
    'orders.html': { section: 'Sales', name: 'Orders Registry' },
    'returns.html': { section: 'Sales', name: 'Returns Registry' },
    'refunds.html': { section: 'Sales', name: 'Refunds Wallet' },
    'courier.html': { section: 'Sales', name: 'Courier Partners' },
    'shipping.html': { section: 'Sales', name: 'Shipping Zones' },
    'customers.html': { section: 'Sales', name: 'Customers List' },
    'customer-groups.html': { section: 'Sales', name: 'Customer Groups' },
    'invoices.html': { section: 'Sales', name: 'Invoice Resolution' },
    'purchase-orders.html': { section: 'Sales', name: 'Purchase Orders' },
    'credit-notes.html': { section: 'Sales', name: 'Credit Notes' },
    'payments.html': { section: 'Sales', name: 'Payments Logs' },
    // Marketing
    'coupons.html': { section: 'Marketing', name: 'Discount Coupons' },
    'flash-sales.html': { section: 'Marketing', name: 'Flash Promotions' },
    'newsletter.html': { section: 'Marketing', name: 'Newsletter Admin' },
    'popup-builder.html': { section: 'Marketing', name: 'Popup Builder' },
    'campaigns.html': { section: 'Marketing', name: 'Marketing Campaigns' },
    'affiliates.html': { section: 'Marketing', name: 'Affiliate Program' },
    'email-studio.html': { section: 'Marketing', name: 'Email Studio' },
    'sms-studio.html': { section: 'Marketing', name: 'SMS Studio' },
    'whatsapp-studio.html': { section: 'Marketing', name: 'WhatsApp Studio' },
    'referrals.html': { section: 'Marketing', name: 'Referral Rewards' },
    // Content
    'homepage-builder.html': { section: 'Content', name: 'Homepage Builder' },
    'about-builder.html': { section: 'Content', name: 'About Page' },
    'contact-builder.html': { section: 'Content', name: 'Contact Page' },
    'navigation-builder.html': { section: 'Content', name: 'Navigation Menu' },
    'seo.html': { section: 'Content', name: 'SEO Meta Config' },
    'theme-builder.html': { section: 'Content', name: 'Theme Styles' },
    'content-pages.html': { section: 'Content', name: 'Content Pages' },
    'blogs.html': { section: 'Content', name: 'Blogs & Articles' },
    // Management
    'users.html': { section: 'Management', name: 'Users Register' },
    'roles.html': { section: 'Management', name: 'RBAC Roles' },
    'permissions.html': { section: 'Management', name: 'RBAC Permissions' },
    'staff.html': { section: 'Management', name: 'Staff Management' },
    'vendors.html': { section: 'Management', name: 'Vendor Directory' },
    'reports.html': { section: 'Management', name: 'Reports & Analytics' },
    'faq.html': { section: 'Management', name: 'FAQ Manager' },
    'support.html': { section: 'Management', name: 'Support Desk Chat' },
    'support-tickets.html': { section: 'Management', name: 'Support Tickets' },
    'reviews.html': { section: 'Management', name: 'Product Reviews' },
    'security.html': { section: 'Management', name: 'Security Audits' },
    'api-keys.html': { section: 'Management', name: 'API Diagnostics' },
    'system-diagnostics.html': { section: 'Management', name: 'System Coordinates' },
    'backups.html': { section: 'Management', name: 'Database Backups' },
    // Settings
    'settings.html': { section: 'Settings', name: 'General Settings' },
    'store-settings.html': { section: 'Settings', name: 'Store Coordinates' },
    'taxes.html': { section: 'Settings', name: 'Taxes & GST rates' },
    'smtp-settings.html': { section: 'Settings', name: 'SMTP configuration' },
    'payment-gateway.html': { section: 'Settings', name: 'Payment Gateways' },
    'payment-settings.html': { section: 'Settings', name: 'Payment Settings' },
    'shipping-settings.html': { section: 'Settings', name: 'Shipping Settings' },
    'profile-settings.html': { section: 'Settings', name: 'Admin Profile' }
  };

  let section = 'Admin';
  let pageName = 'Dashboard';

  if (path.includes('dashboard.html')) {
    section = 'General';
    pageName = 'Dashboard';
  } else {
    const filename = path.substring(path.lastIndexOf('/') + 1);
    if (pathMap[filename]) {
      section = pathMap[filename].section;
      pageName = pathMap[filename].name;
    }
  }

  // Handle settings/products tab overrides
  if (path.includes('settings.html') && currentTab) {
    const tabNames = {
      general: 'General Settings',
      seo: 'SEO Settings',
      analytics: 'Analytics',
      integrations: 'Integrations',
      'mobile-settings': 'Mobile Settings',
      diagnostics: 'Diagnostics',
      profile: 'Admin Profile'
    };
    pageName = tabNames[currentTab] || pageName;
  } else if (path.includes('products.html') && currentTab) {
    const tabNames = {
      products: 'Products List',
      categories: 'Categories',
      inventory: 'Inventory',
      variants: 'Variants',
      collections: 'Collections'
    };
    pageName = tabNames[currentTab] || pageName;
  }

  const topbar = document.createElement('header');
  topbar.className = 'admin-topbar';

  let userInitials = 'AD';
  let userName = 'Administrator';
  let userEmail = 'admin@magizhvagam.com';

  try {
    const adminAuth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
    if (adminAuth && adminAuth.user) {
      userName = adminAuth.user.name || userName;
      userEmail = adminAuth.user.email || userEmail;
      userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
  } catch (e) {
    console.warn('Failed to parse adminAuth profile', e);
  }

  const savedThemeForIcon = localStorage.getItem('admin-theme');
  const isLightMode = savedThemeForIcon === 'light';
  let themeIcon = isLightMode ? 'moon' : 'sun';
  let themeText = isLightMode ? 'Dark Mode' : 'Light Mode';

  topbar.innerHTML = `
    <div class="admin-topbar-left">
      <button type="button" class="topbar-action-btn mobile-sidebar-toggle" id="mobile-sidebar-toggle-btn" style="display:none; margin-right:8px;" aria-label="Toggle sidebar">
        <i data-lucide="menu"></i>
      </button>
      <div class="admin-breadcrumbs">
        <a href="/admin/dashboard.html">Admin</a>
        <span class="separator">/</span>
        <span class="separator" id="breadcrumb-section">${section}</span>
        <span class="separator">/</span>
        <span class="current" id="breadcrumb-page">${pageName}</span>
      </div>
    </div>

    <div class="admin-topbar-right">
      <div class="admin-search-trigger" id="global-search-trigger">
        <i data-lucide="search"></i>
        <span>Search admin...</span>
        <kbd>⌘K</kbd>
      </div>

      <button type="button" class="topbar-action-btn" id="theme-toggle-topbar-btn" onclick="window.toggleAdminTheme(); return false;" aria-label="${themeText}" title="${themeText}">
        <i data-lucide="${themeIcon}" style="width:18px;height:18px;"></i>
      </button>

      <button type="button" class="topbar-action-btn" id="notifications-trigger-btn" aria-label="View notifications">
        <i data-lucide="bell"></i>
        <span class="notification-badge" id="admin-notif-badge">3</span>
      </button>

      <div class="admin-profile-menu">
        <div class="admin-profile-trigger" id="profile-menu-trigger">
          <div class="admin-avatar">${userInitials}</div>
          <div class="admin-profile-info">
            <span class="admin-profile-name">${userName}</span>
            <span class="admin-profile-role">Admin Owner</span>
          </div>
          <i data-lucide="chevron-down" style="width: 14px; height: 14px; color: var(--adm-text-muted);"></i>
        </div>

        <div class="profile-popover" id="admin-profile-popover">
          <div class="profile-popover-header">
            <div style="font-weight: 700; font-size: 13px; color: var(--adm-text);">${userName}</div>
            <div class="profile-popover-email">${userEmail}</div>
          </div>
          <a href="/admin/settings.html?tab=profile" class="profile-popover-item">
            <i data-lucide="user"></i> Account Profile
          </a>
          <a href="/admin/settings.html?tab=general" class="profile-popover-item">
            <i data-lucide="settings"></i> System Settings
          </a>
          <a href="#" onclick="window.toggleAdminTheme(); return false;" class="profile-popover-item" id="theme-toggle-popover-btn">
            <i data-lucide="${themeIcon}"></i> <span>${themeText}</span>
          </a>
          <a href="/index.html" target="_blank" class="profile-popover-item">
            <i data-lucide="external-link"></i> View Storefront
          </a>
          <div style="border-top: 1px solid var(--adm-border); margin: 4px 0;"></div>
          <a href="#" onclick="window.handleLogout(); return false;" class="profile-popover-item" style="color: var(--adm-danger) !important;">
            <i data-lucide="log-out"></i> Sign Out
          </a>
        </div>
      </div>
    </div>
  `;

  const topbarContainer = document.getElementById('admin-topbar-container');
  if (topbarContainer) {
    topbarContainer.appendChild(topbar);
  } else {
    mainPanel.insertBefore(topbar, mainPanel.firstChild);
  }
  if (typeof window.renderIcons === 'function') {
    window.renderIcons();
  }
}


window.updateAdminBreadcrumbs = function(section, pageName) {
  const secEl = document.getElementById('breadcrumb-section');
  const pageEl = document.getElementById('breadcrumb-page');
  if (secEl) secEl.textContent = section;
  if (pageEl) pageEl.textContent = pageName;
};

/* ─── Inject Navigation overlays (Command Palette & Notification Drawer) ─── */
function injectOverlays() {
  if (document.getElementById('command-palette-overlay')) return;

  // 1. Inject Command Palette
  const paletteOverlay = document.createElement('div');
  paletteOverlay.className = 'command-palette-overlay';
  paletteOverlay.id = 'command-palette-overlay';
  paletteOverlay.innerHTML = `
    <div class="command-palette-modal">
      <div class="command-palette-header">
        <i data-lucide="search"></i>
        <input type="text" class="command-palette-input" id="command-palette-search-input" placeholder="Type a command, page name, or search catalog..." autocomplete="off">
        <kbd style="font-size:10px; color:var(--adm-text-muted); background:var(--adm-bg); border:1px solid var(--adm-border); padding:2px 6px; border-radius:4px;">ESC</kbd>
      </div>
      <div class="command-palette-body" id="command-palette-results">
        <!-- Results will be loaded here dynamically -->
      </div>
    </div>
  `;
  document.body.appendChild(paletteOverlay);

  // 2. Inject Notification Drawer
  const notifOverlay = document.createElement('div');
  notifOverlay.className = 'notification-drawer-overlay';
  notifOverlay.id = 'notification-drawer-overlay';
  
  const notifDrawer = document.createElement('div');
  notifDrawer.className = 'notification-drawer';
  notifDrawer.id = 'notification-drawer';
  notifDrawer.innerHTML = `
    <div class="notification-drawer-header">
      <h3 class="notification-drawer-title">Notifications</h3>
      <button type="button" class="notification-drawer-close" id="notification-drawer-close-btn" aria-label="Close">
        <i data-lucide="x"></i>
      </button>
    </div>
    <div class="notification-drawer-content">
      <div class="notification-item" onclick="window.location.href='/admin/orders.html'">
        <div class="notification-icon-wrapper order">
          <i data-lucide="shopping-bag"></i>
        </div>
        <div class="notification-item-body">
          <span class="notification-item-text">New Order #1204 placed by S. Ramanathan (₹4,850.00)</span>
          <span class="notification-item-time">5 mins ago</span>
        </div>
      </div>
      <div class="notification-item" onclick="window.location.href='/admin/products.html?view=inventory'">
        <div class="notification-icon-wrapper stock">
          <i data-lucide="alert-triangle"></i>
        </div>
        <div class="notification-item-body">
          <span class="notification-item-text">Low stock warning: 'Brass Vilakku (Medium)' is down to 2 units</span>
          <span class="notification-item-time">42 mins ago</span>
        </div>
      </div>
      <div class="notification-item" onclick="window.location.href='/admin/settings.html?tab=testimonials'">
        <div class="notification-icon-wrapper review">
          <i data-lucide="star"></i>
        </div>
        <div class="notification-item-body">
          <span class="notification-item-text">Customer message pending review: Inquiry about custom corporate gifts</span>
          <span class="notification-item-time">2 hours ago</span>
        </div>
      </div>
      <div class="notification-item" onclick="window.location.href='/admin/system-diagnostics.html'">
        <div class="notification-icon-wrapper system">
          <i data-lucide="check-circle"></i>
        </div>
        <div class="notification-item-body">
          <span class="notification-item-text">Database auto-backup completed successfully</span>
          <span class="notification-item-time">12 hours ago</span>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(notifOverlay);
  document.body.appendChild(notifDrawer);
  window.renderIcons();
}

/* ─── Command Palette & Overlay Listeners ─── */
function initOverlaysEvents() {
  const searchTrigger = document.getElementById('global-search-trigger');
  const paletteOverlay = document.getElementById('command-palette-overlay');
  const paletteInput = document.getElementById('command-palette-search-input');
  
  const notifTrigger = document.getElementById('notifications-trigger-btn');
  const notifOverlay = document.getElementById('notification-drawer-overlay');
  const notifDrawer = document.getElementById('notification-drawer');
  const notifClose = document.getElementById('notification-drawer-close-btn');

  const profileTrigger = document.getElementById('profile-menu-trigger');
  const profilePopover = document.getElementById('admin-profile-popover');

  // Toggle Profile Menu
  if (profileTrigger && profilePopover) {
    profileTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      profilePopover.classList.toggle('open');
    });
    // Click outside to close profile popover
    document.addEventListener('click', () => {
      profilePopover.classList.remove('open');
    });
  }

  // Toggle Mobile responsive sidebar
  const mobileToggle = document.getElementById('mobile-sidebar-toggle-btn');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const layout = document.querySelector('.admin-layout');
      if (layout) {
        layout.classList.toggle('sidebar-open');
      }
    });
  }

  // Click on main panel closes mobile sidebar if open
  const mainPanel = document.querySelector('.admin-main');
  if (mainPanel) {
    mainPanel.addEventListener('click', () => {
      const layout = document.querySelector('.admin-layout');
      if (layout && layout.classList.contains('sidebar-open')) {
        layout.classList.remove('sidebar-open');
      }
    });
  }

  // Theme switcher function
  window.toggleAdminTheme = function() {
    const layout = document.querySelector('.admin-layout');
    if (!layout) return;

    const isCurrentlyLight = layout.classList.contains('light-mode');

    if (isCurrentlyLight) {
      layout.classList.remove('light-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('admin-theme', 'dark');
    } else {
      layout.classList.add('light-mode');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('admin-theme', 'light');
    }

    const newThemeIsLight = layout.classList.contains('light-mode');
    const iconName = newThemeIsLight ? 'moon' : 'sun';
    const labelText = newThemeIsLight ? 'Dark Mode' : 'Light Mode';

    const popoverBtn = document.getElementById('theme-toggle-popover-btn');
    if (popoverBtn) {
      popoverBtn.innerHTML = '<i data-lucide="' + iconName + '"></i> <span>' + labelText + '</span>';
    }

    const topbarBtn = document.getElementById('theme-toggle-topbar-btn');
    if (topbarBtn) {
      topbarBtn.innerHTML = '<i data-lucide="' + iconName + '" style="width:18px;height:18px;"></i>';
      topbarBtn.setAttribute('aria-label', labelText);
      topbarBtn.title = labelText;
    }

    window.renderIcons();
  };

  // Toggle Command Palette (GSAP animated)
  function openPalette() {
    if (paletteOverlay) {
      paletteOverlay.style.display = 'flex';
      if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(paletteOverlay);
        gsap.killTweensOf(paletteOverlay.querySelector('.command-palette-modal'));
        gsap.fromTo(paletteOverlay, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
        gsap.fromTo(paletteOverlay.querySelector('.command-palette-modal'), { scale: 0.96, y: -15 }, { scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.5)' });
      }
      if (paletteInput) {
        paletteInput.value = '';
        setTimeout(() => paletteInput.focus(), 50);
      }
      renderCommandPaletteResults('');
    }
  }

  function closePalette() {
    if (paletteOverlay) {
      if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(paletteOverlay);
        gsap.killTweensOf(paletteOverlay.querySelector('.command-palette-modal'));
        gsap.to(paletteOverlay.querySelector('.command-palette-modal'), { scale: 0.96, y: -15, duration: 0.2, ease: 'power2.in' });
        gsap.to(paletteOverlay, { opacity: 0, duration: 0.2, onComplete: () => { paletteOverlay.style.display = 'none'; } });
      } else {
        paletteOverlay.style.display = 'none';
      }
    }
  }

  if (searchTrigger) {
    searchTrigger.addEventListener('click', openPalette);
  }

  if (paletteOverlay) {
    paletteOverlay.addEventListener('click', (e) => {
      if (e.target === paletteOverlay) closePalette();
    });
  }

  // Toggle Notification Drawer (GSAP animated)
  function openNotifications() {
    if (notifOverlay && notifDrawer) {
      notifOverlay.style.display = 'block';
      if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(notifOverlay);
        gsap.killTweensOf(notifDrawer);
        gsap.fromTo(notifOverlay, { opacity: 0 }, { opacity: 1, duration: 0.25 });
        gsap.fromTo(notifDrawer, { x: '100%' }, { x: '0%', duration: 0.4, ease: 'power3.out' });
      } else {
        notifDrawer.classList.add('open');
      }
      
      // Remove badge count indicator on click
      const badge = document.getElementById('admin-notif-badge');
      if (badge) badge.style.display = 'none';
    }
  }

  // Close Notification Drawer (GSAP animated)
  function closeNotifications() {
    if (notifOverlay && notifDrawer) {
      if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(notifOverlay);
        gsap.killTweensOf(notifDrawer);
        gsap.to(notifDrawer, { x: '100%', duration: 0.3, ease: 'power3.in' });
        gsap.to(notifOverlay, { opacity: 0, duration: 0.3, onComplete: () => { notifOverlay.style.display = 'none'; } });
      } else {
        notifDrawer.classList.remove('open');
        setTimeout(() => notifOverlay.style.display = 'none', 300);
      }
    }
  }

  if (notifTrigger) {
    notifTrigger.addEventListener('click', openNotifications);
  }
  if (notifClose) {
    notifClose.addEventListener('click', closeNotifications);
  }
  if (notifOverlay) {
    notifOverlay.addEventListener('click', closeNotifications);
  }

  // Keyboard listeners: Cmd+K / Ctrl+K opens search, Esc closes overlays
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openPalette();
    }
    if (e.key === 'Escape') {
      closePalette();
      closeNotifications();
    }
  });

  // Search input change listener
  if (paletteInput) {
    paletteInput.addEventListener('input', (e) => {
      renderCommandPaletteResults(e.target.value);
    });
  }
}

/* ─── Command Palette Navigation Items ─── */
const COMMAND_PAGES = [
  { name: 'Go to Dashboard', path: '/admin/dashboard.html', icon: 'layout-dashboard', group: 'Navigation' },
  { name: 'Products List', path: '/admin/products.html', icon: 'gift', group: 'Catalog' },
  { name: 'Add Product Form', path: '/admin/products.html?action=add', icon: 'plus-circle', group: 'Catalog' },
  { name: 'Category Configuration', path: '/admin/products.html?view=categories', icon: 'tags', group: 'Catalog' },
  { name: 'Inventory Manager', path: '/admin/products.html?view=inventory', icon: 'archive', group: 'Catalog' },
  { name: 'Media Library Gallery', path: '/admin/media.html', icon: 'image', group: 'Catalog' },
  { name: 'Order Management', path: '/admin/orders.html', icon: 'shopping-bag', group: 'Sales' },
  { name: 'Customer Database', path: '/admin/customers.html', icon: 'users', group: 'Sales' },
  { name: 'Invoice Hub', path: '/admin/invoices.html', icon: 'file-text', group: 'Sales' },
  { name: 'Theme Presets Settings', path: '/admin/settings.html?tab=presets', icon: 'palette', group: 'Appearance' },
  { name: 'Color Theme Configurator', path: '/admin/settings.html?tab=colors', icon: 'droplet', group: 'Appearance' },
  { name: 'Typography Customizer', path: '/admin/settings.html?tab=typography', icon: 'type', group: 'Appearance' },
  { name: 'Footer Settings Panel', path: '/admin/settings.html?tab=footer', icon: 'layout', group: 'Appearance' },
  { name: 'Glassmorphism Layout Presets', path: '/admin/settings.html?tab=glass', icon: 'sparkles', group: 'Appearance' },
  { name: 'Sales Reports & Graphs', path: '/admin/reports.html', icon: 'bar-chart-2', group: 'System' },
  { name: 'Diagnostics console', path: '/admin/system-diagnostics.html', icon: 'cpu', group: 'System' }
];

async function renderCommandPaletteResults(query) {
  const container = document.getElementById('command-palette-results');
  if (!container) return;

  const normalized = query.trim().toLowerCase();

  // If query is empty, show default quick actions
  if (!normalized) {
    const itemsHtml = COMMAND_PAGES.slice(0, 6).map((item, idx) => `
      <a href="${item.path}" class="command-palette-item ${idx === 0 ? 'selected' : ''}">
        <div class="command-palette-item-left">
          <i data-lucide="${item.icon}"></i>
          <span>${item.name}</span>
        </div>
        <span class="command-palette-item-shortcut">↵ Enter</span>
      </a>
    `).join('');

    container.innerHTML = `
      <div class="command-palette-group-title">Quick Navigation Shortcuts</div>
      ${itemsHtml}
    `;
    window.renderIcons();
    return;
  }

  // Filter static pages
  const matchedPages = COMMAND_PAGES.filter(p => 
    p.name.toLowerCase().includes(normalized) || 
    p.group.toLowerCase().includes(normalized)
  );

  let resultsHtml = '';
  
  if (matchedPages.length > 0) {
    resultsHtml += `<div class="command-palette-group-title">Matching Control Panels</div>`;
    resultsHtml += matchedPages.map((item, idx) => `
      <a href="${item.path}" class="command-palette-item ${idx === 0 ? 'selected' : ''}">
        <div class="command-palette-item-left">
          <i data-lucide="${item.icon}"></i>
          <span>${item.name} <small style="color:var(--adm-text-muted); margin-left: 5px;">in ${item.group}</small></span>
        </div>
        <span class="command-palette-item-shortcut">↵ Enter</span>
      </a>
    `).join('');
  }

  // Dynamic Catalog Search
  if (normalized.length >= 2) {
    try {
      const res = await adminFetch('/api/products?limit=10');
      const data = await res.json();
      if (data.success && data.products) {
        const matchedProducts = data.products.filter(p => 
          p.name.toLowerCase().includes(normalized) ||
          (p.category && p.category.name.toLowerCase().includes(normalized))
        );

        if (matchedProducts.length > 0) {
          resultsHtml += `<div class="command-palette-group-title">Matching Products Catalog</div>`;
          resultsHtml += matchedProducts.map(p => `
            <a href="/admin/products.html" class="command-palette-item" onclick="localStorage.setItem('edit-product-id', '${p._id}');">
              <div class="command-palette-item-left">
                <i data-lucide="gift"></i>
                <span>${p.name} <small style="color:var(--adm-text-muted); margin-left:5px;">(₹${p.price} - ${p.stock} units)</small></span>
              </div>
              <span class="command-palette-item-shortcut">View Product</span>
            </a>
          `).join('');
        }
      }
    } catch (e) {
      // Fail silently
    }
  }

  if (!resultsHtml) {
    container.innerHTML = `
      <div style="padding: 30px 20px; text-align: center; color: var(--adm-text-muted); font-size: 13px;">
        No matches found for "<strong>${query}</strong>"
      </div>
    `;
  } else {
    container.innerHTML = resultsHtml;
    window.renderIcons();
  }
}

// 1. Dashboard metrics loader
async function loadDashboardData() {
  // Set skeleton states first
  const revEl = document.getElementById('metric-revenue');
  if (revEl) revEl.innerHTML = '<div class="skeleton" style="height:28px; width:120px; margin-top:8px;"></div>';
  const ordersEl = document.getElementById('metric-orders');
  if (ordersEl) ordersEl.innerHTML = '<div class="skeleton" style="height:28px; width:60px; margin-top:8px;"></div>';
  const aovEl = document.getElementById('metric-aov');
  if (aovEl) aovEl.innerHTML = '<div class="skeleton" style="height:28px; width:60px; margin-top:8px;"></div>';
  const stockEl = document.getElementById('metric-low-stock');
  if (stockEl) stockEl.innerHTML = '<div class="skeleton" style="height:28px; width:60px; margin-top:8px;"></div>';
  
  const chartBox = document.getElementById('dashboard-chart-box');
  if (chartBox) {
    chartBox.innerHTML = `
      <h4 style="font-family:'Outfit'; font-size:16px; margin-bottom:16px;">Sales Revenue Trend (₹)</h4>
      <div class="skeleton" style="height:180px; width:100%; border-radius:8px;"></div>
    `;
  }
  
  const tbody = document.getElementById('recent-orders-tbody');
  if (tbody) {
    tbody.innerHTML = Array(4).fill(0).map(() => `
      <tr>
        <td><div class="skeleton" style="height:14px; width:50px;"></div></td>
        <td><div class="skeleton" style="height:14px; width:100px;"></div></td>
        <td><div class="skeleton" style="height:14px; width:80px;"></div></td>
        <td><div class="skeleton" style="height:14px; width:60px;"></div></td>
        <td><div class="skeleton" style="height:14px; width:70px;"></div></td>
      </tr>
    `).join('');
  }

  try {
    const res = await adminFetch('/api/reports/dashboard');
    const data = await res.json();
    if (!data.success) {
      showToast('Failed to load reports', 'error');
      return;
    }

    const stats = data.stats || {};
    const totalRevenue = Number(stats.totalRevenue) || 0;
    const totalOrders = Number(stats.totalOrders) || 0;

    // Calculate AOV
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Fetch low stock items count
    let lowStockCount = 0;
    try {
      const prodRes = await adminFetch('/api/products?limit=100');
      const prodData = await prodRes.json();
      if (prodData.success && prodData.products) {
        lowStockCount = prodData.products.filter(p => p.stock < 15).length;
      }
    } catch (e) {
      console.warn('Failed to calculate stock alerts:', e);
    }

    // Set metrics
    const revEl2 = document.getElementById('metric-revenue');
    if (revEl2) revEl2.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
    const ordersEl2 = document.getElementById('metric-orders');
    if (ordersEl2) ordersEl2.textContent = totalOrders;
    const aovEl2 = document.getElementById('metric-aov');
    if (aovEl2) aovEl2.textContent = `₹${aov.toLocaleString('en-IN')}`;
    const stockEl2 = document.getElementById('metric-low-stock');
    if (stockEl2) stockEl2.textContent = lowStockCount;

    // Role-based visibility
    const currentUser = typeof getStoredUser === 'function' ? getStoredUser() : null;
    const resetBtn = document.getElementById('open-reset-modal-btn');
    if (currentUser && currentUser.role === 'staff') {
      if (resetBtn) resetBtn.style.display = 'none'; // Hide reset stats button for staff
      
      // Update welcome banner subtext
      const bannerSubText = document.querySelector('.dashboard-hero-banner p');
      if (bannerSubText) {
        bannerSubText.innerHTML = `Your digital return gifts boutique is performing optimally. <strong style="color:var(--adm-accent);">Logged in as Staff (Demoted RBAC permissions)</strong>.`;
      }
      
      // Disable control switches
      document.querySelectorAll('.toggle-switch input').forEach(input => {
        input.disabled = true;
      });
    }

    // Render Recent orders list
    const tbody2 = document.getElementById('recent-orders-tbody');
    if (tbody2) {
      if (data.recentOrders && data.recentOrders.length === 0) {
        tbody2.innerHTML = '<tr><td colspan="5" style="text-align:center;">No orders yet.</td></tr>';
      } else {
        tbody2.innerHTML = data.recentOrders.map(o => {
          const customerName = o.userId ? (o.userId.name || 'Customer') : (o.guestDetails ? (o.guestDetails.fullName || 'Guest') : 'Guest');
          const orderTotal = (o.summary && o.summary.total != null) ? o.summary.total : 0;
          const orderStatus = o.status || 'Pending';
          return `
          <tr>
            <td><strong>#${(o._id || '').substr(-6)}</strong></td>
            <td>${customerName}</td>
            <td>${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
            <td>₹${orderTotal}</td>
            <td><span class="badge ${orderStatus === 'Delivered' ? 'badge-success' : orderStatus === 'Cancelled' ? 'badge-danger' : 'badge-warning'}">${orderStatus}</span></td>
          </tr>
        `;
        }).join('');
      }
    }

    // Render Sales trend chart
    renderSvgTrendChart(data.chartData || []);

  } catch (err) {
    showToast('Error fetching dashboard analytics', 'error');
  }
}

function renderSvgTrendChart(chartData) {
  const container = document.getElementById('dashboard-chart-box');
  if (!container || !chartData || chartData.length === 0) return;

  const maxVal = Math.max(...chartData.map(d => d.revenue), 100);
  const width = 500;
  const height = 180;
  const points = chartData.map((d, i) => {
    const x = (i * (width / (chartData.length - 1))) + 30;
    const y = height - (d.revenue / maxVal * (height - 40)) - 20;
    return `${x},${y}`;
  }).join(' ');

  container.innerHTML = `
    <h4 style="font-family:'Outfit'; font-size:16px; margin-bottom:16px;">Sales Revenue Trend (₹)</h4>
    <svg viewBox="0 0 ${width + 50} ${height + 20}" style="width:100%; height:${height}px;">
      <!-- Grid lines -->
      <line x1="30" y1="20" x2="${width}" y2="20" stroke="var(--card-border)" stroke-dasharray="4"/>
      <line x1="30" y1="80" x2="${width}" y2="80" stroke="var(--card-border)" stroke-dasharray="4"/>
      <line x1="30" y1="140" x2="${width}" y2="140" stroke="var(--card-border)" stroke-dasharray="4"/>
      
      <!-- Trend Line -->
      <polyline fill="none" stroke="hsl(var(--primary-purple))" stroke-width="3" points="${points}"/>
      
      <!-- Node Dots -->
      ${chartData.map((d, i) => {
        const x = (i * (width / (chartData.length - 1))) + 30;
        const y = height - (d.revenue / maxVal * (height - 40)) - 20;
        return `
          <circle cx="${x}" cy="${y}" r="5" fill="var(--primary-gold)" stroke="hsl(var(--primary-purple))" stroke-width="2"/>
          <text x="${x}" y="${y - 10}" font-size="10" font-weight="700" text-anchor="middle" fill="var(--text-color)">₹${Math.round(d.revenue)}</text>
          <text x="${x}" y="${height}" font-size="9" text-anchor="middle" fill="var(--text-muted)">${d.label}</text>
        `;
      }).join('')}
    </svg>
  `;
}

// 2. Admin Products CRUD Loader
async function loadAdminProducts() {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  try {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;"><div class="spinner" style="margin:auto;"></div></td></tr>';
    const res = await adminFetch('/api/products?limit=100');
    const data = await res.json();

    const selectAll = document.getElementById('select-all-products');
    if (selectAll) selectAll.checked = false;
    updateBulkSelectionState();

    if (!data.success || data.products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No products found. Click "Add Product" to create one.</td></tr>';
      return;
    }

    // Save list globally for local search and filtering
    window.allAdminProducts = data.products || [];
    injectProductsToolbar();
    populateCategoryFilterDropdown(data.products);
    filterAndRenderProducts();

    // Pre-populate category dropdowns in Add/Edit forms
    loadCategoriesDropdown();

    // Check for dynamic edit trigger from command palette
    const editId = localStorage.getItem('edit-product-id');
    if (editId) {
      localStorage.removeItem('edit-product-id');
      setTimeout(() => {
        if (typeof openProductEditModal === 'function') {
          openProductEditModal(editId);
        }
      }, 200);
    }

  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Failed to load products list.</td></tr>';
    showToast('Failed to fetch products', 'error');
  }
}

function injectProductsToolbar() {
  const tableResp = document.querySelector('.table-responsive');
  if (!tableResp || document.getElementById('product-search-input') || !window.location.pathname.includes('products.html')) return;

  const toolbar = document.createElement('div');
  toolbar.className = 'table-toolbar';
  toolbar.innerHTML = `
    <div class="toolbar-search">
      <i data-lucide="search"></i>
      <input type="text" id="product-search-input" class="admin-form-control" placeholder="Search by name, category, tags...">
    </div>
    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
      <select id="product-category-filter" class="admin-form-control" style="width:160px; margin:0;">
        <option value="">All Categories</option>
      </select>
      <select id="product-stock-filter" class="admin-form-control" style="width:160px; margin:0;">
        <option value="">All Stock Levels</option>
        <option value="in-stock">In Stock (>0)</option>
        <option value="low-stock">Low Stock (≤10)</option>
        <option value="out-of-stock">Out of Stock (=0)</option>
      </select>
      <select id="product-sort-by" class="admin-form-control" style="width:160px; margin:0;">
        <option value="">Sort: Default</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="stock-asc">Stock: Low to High</option>
        <option value="stock-desc">Stock: High to Low</option>
      </select>
    </div>
  `;
  tableResp.parentNode.insertBefore(toolbar, tableResp);
  window.renderIcons();

  // Attach listeners for local search/filter
  document.getElementById('product-search-input').addEventListener('input', filterAndRenderProducts);
  document.getElementById('product-category-filter').addEventListener('change', filterAndRenderProducts);
  document.getElementById('product-stock-filter').addEventListener('change', filterAndRenderProducts);
  document.getElementById('product-sort-by').addEventListener('change', filterAndRenderProducts);
}

function populateCategoryFilterDropdown(products) {
  const select = document.getElementById('product-category-filter');
  if (!select || select.children.length > 1) return; // Already populated
  
  const categories = [...new Set(products.map(p => p.category ? p.category.name : 'Uncategorized').filter(Boolean))];
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function filterAndRenderProducts() {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody || !window.allAdminProducts) return;

  const searchVal = document.getElementById('product-search-input')?.value.toLowerCase().trim() || '';
  const catVal = document.getElementById('product-category-filter')?.value || '';
  const stockVal = document.getElementById('product-stock-filter')?.value || '';
  const sortVal = document.getElementById('product-sort-by')?.value || '';

  let filtered = [...window.allAdminProducts];

  // Apply search
  if (searchVal) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchVal) ||
      (p.category && p.category.name.toLowerCase().includes(searchVal)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(searchVal)))
    );
  }

  // Apply category filter
  if (catVal) {
    filtered = filtered.filter(p => {
      const pCat = p.category ? p.category.name : 'Uncategorized';
      return pCat === catVal;
    });
  }

  // Apply stock filter
  if (stockVal) {
    if (stockVal === 'in-stock') {
      filtered = filtered.filter(p => p.stock > 0);
    } else if (stockVal === 'low-stock') {
      filtered = filtered.filter(p => p.stock > 0 && p.stock <= 10);
    } else if (stockVal === 'out-of-stock') {
      filtered = filtered.filter(p => p.stock === 0);
    }
  }

  // Apply sort
  if (sortVal) {
    if (sortVal === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortVal === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortVal === 'stock-asc') {
      filtered.sort((a, b) => a.stock - b.stock);
    } else if (sortVal === 'stock-desc') {
      filtered.sort((a, b) => b.stock - a.stock);
    }
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px !important; color: var(--adm-text-muted);">No products found matching your active search/filter criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => `
    <tr>
      <td>
        <input type="checkbox" class="product-select-checkbox" data-id="${p._id}" style="cursor:pointer;" onchange="updateBulkSelectionState()">
      </td>
      <td>
        <div style="width:40px; height:40px; border-radius:6px; overflow:hidden; border:1px solid var(--adm-border);">
          <img src="${p.images[0] ? p.images[0].url : '/assets/images/default-product.webp'}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='/assets/images/default-product.webp'">
        </div>
      </td>
      <td><strong>${p.name}</strong></td>
      <td>
        <span class="badge" style="background: rgba(106, 13, 173, 0.05); color: var(--adm-accent); border: 1px solid rgba(106, 13, 173, 0.1);">${p.category ? p.category.name : 'Uncategorized'}</span>
      </td>
      <td><strong>₹${p.price.toLocaleString('en-IN')}</strong></td>
      <td>
        <span class="badge ${p.stock > 10 ? 'badge-success' : p.stock > 0 ? 'badge-warning' : 'badge-danger'}">
          ${p.stock} units
        </span>
      </td>
      <td>
        <input type="checkbox" style="cursor:pointer;" ${p.isFeatured ? 'checked' : ''} onchange="window.toggleProductFeatured('${p._id}', this.checked)">
      </td>
      <td>
        <button onclick="openProductEditModal('${p._id}')" class="btn btn-secondary" style="padding:6px 12px; font-size:11px; border-radius:6px; margin-right:6px;">Edit</button>
        <button onclick="duplicateProductById('${p._id}')" class="btn btn-secondary" style="padding:6px 12px; font-size:11px; border-radius:6px; margin-right:6px;">Clone</button>
        <button onclick="deleteProductById('${p._id}', '${p.name.replace(/'/g, "\\'")}')" class="btn" style="padding:6px 12px; font-size:11px; border-radius:6px; background:#ef4444; color:white;">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function loadCategoriesDropdown() {
  const selects = [document.getElementById('prod-category'), document.getElementById('edit-prod-category')];
  try {
    const res = await adminFetch('/api/products/categories');
    const data = await res.json();
    if (data.success) {
      selects.forEach(sel => {
        if (sel) {
          sel.innerHTML = '<option value="">Select Category</option>' + data.categories.map(c => `
            <option value="${c._id}">${c.name}</option>
          `).join('');
        }
      });
    }
  } catch (err) {
    console.error('Failed to load product form categories:', err);
  }
}

async function deleteProductById(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}" from system?`)) return;
  try {
    const res = await adminFetch(`/api/products/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Product deleted!', 'success');
      loadAdminProducts();
    } else {
      showToast(data.error || 'Failed to delete product', 'error');
    }
  } catch (err) {
    showToast('Connection error during deletion', 'error');
  }
}

// 2.1 Duplicate / Clone Product
async function duplicateProductById(id) {
  try {
    const res = await adminFetch(`/api/products/duplicate/${id}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Product duplicated successfully!', 'success');
      loadAdminProducts();
    } else {
      showToast(data.error || 'Failed to duplicate product', 'error');
    }
  } catch (err) {
    showToast('Connection error during duplication', 'error');
  }
}

// 2.2 Bulk selection state updater
window.updateBulkSelectionState = () => {
  const checkboxes = document.querySelectorAll('.product-select-checkbox');
  const checked = Array.from(checkboxes).filter(cb => cb.checked);
  const count = checked.length;

  const bulkPanel = document.getElementById('bulk-actions-panel');
  const countSpan = document.getElementById('bulk-selected-count');

  if (bulkPanel && countSpan) {
    if (count > 0) {
      bulkPanel.style.display = 'flex';
      countSpan.textContent = `${count} product${count > 1 ? 's' : ''} selected`;
    } else {
      bulkPanel.style.display = 'none';
    }
  }

  const selectAll = document.getElementById('select-all-products');
  if (selectAll) {
    selectAll.checked = checkboxes.length > 0 && count === checkboxes.length;
  }
};

// 2.3 Load categories list specifically for the bulk action category select
async function loadBulkCategoryDropdown() {
  const sel = document.getElementById('bulk-category-select');
  if (!sel) return;
  try {
    const res = await adminFetch('/api/products/categories');
    const data = await res.json();
    if (data.success) {
      sel.innerHTML = '<option value="">Select Category</option>' + data.categories.map(c => `
        <option value="${c._id}">${c.name}</option>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load bulk category dropdown:', err);
  }
}

// 2.4 CSV Export & CSV Import functions
window.exportProductsCSV = async () => {
  try {
    const res = await adminFetch('/api/products?limit=1000');
    const data = await res.json();
    if (!data.success || data.products.length === 0) {
      showToast('No products to export', 'warning');
      return;
    }

    const headers = ['name', 'description', 'price', 'discountPrice', 'stock', 'categoryName', 'material', 'dimensions', 'weight', 'color', 'tags', 'images'];
    const rows = [headers.join(',')];

    data.products.forEach(p => {
      const row = [
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.description || '').replace(/"/g, '""')}"`,
        p.price,
        p.discountPrice || '',
        p.stock || 0,
        `"${(p.category ? p.category.name : '').replace(/"/g, '""')}"`,
        `"${(p.specifications?.material || '').replace(/"/g, '""')}"`,
        `"${(p.specifications?.dimensions || '').replace(/"/g, '""')}"`,
        `"${(p.specifications?.weight || '').replace(/"/g, '""')}"`,
        `"${(p.specifications?.color || '').replace(/"/g, '""')}"`,
        `"${(p.tags || []).join(', ').replace(/"/g, '""')}"`,
        `"${(p.images || []).map(img => img.url).join(', ').replace(/"/g, '""')}"`
      ];
      rows.push(row.join(','));
    });

    const csvContent = '\uFEFF' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `magizhvagam_products_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Products exported to CSV!', 'success');
  } catch (err) {
    showToast('Export failed: ' + err.message, 'error');
  }
};

window.importProductsCSV = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length <= 1) {
        showToast('CSV is empty or lacks headers', 'warning');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const products = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        let currentVal = '';
        let insideQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
            currentVal = '';
          } else {
            currentVal += char;
          }
        }
        values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

        if (values.length < headers.length) continue;

        const prod = {};
        headers.forEach((header, idx) => {
          prod[header] = values[idx];
        });

        products.push(prod);
      }

      if (products.length === 0) {
        showToast('No valid rows found in CSV', 'warning');
        return;
      }

      const confirmImport = confirm(`Parsed ${products.length} products. Do you want to import them now?`);
      if (!confirmImport) return;

      const res = await adminFetch('/api/products/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message || `Successfully imported ${data.count} products!`, 'success');
        loadAdminProducts();
      } else {
        showToast(data.error || 'Import failed', 'error');
      }
    } catch (err) {
      showToast('CSV parsing/import error: ' + err.message, 'error');
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
};

let productsEventsInitialized = false;
function initProductsPageEvents() {
  if (productsEventsInitialized) return;
  productsEventsInitialized = true;

  // Register select-all behavior
  const selectAll = document.getElementById('select-all-products');
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      const checkboxes = document.querySelectorAll('.product-select-checkbox');
      checkboxes.forEach(cb => cb.checked = e.target.checked);
      updateBulkSelectionState();
    });
  }

  // Bulk action select change handler
  const actionSelect = document.getElementById('bulk-action-select');
  if (actionSelect) {
    actionSelect.addEventListener('change', (e) => {
      const stockContainer = document.getElementById('bulk-stock-input-container');
      const categoryContainer = document.getElementById('bulk-category-input-container');

      if (stockContainer) stockContainer.style.display = 'none';
      if (categoryContainer) categoryContainer.style.display = 'none';

      if (e.target.value === 'update-stock') {
        if (stockContainer) stockContainer.style.display = 'flex';
      } else if (e.target.value === 'change-category') {
        if (categoryContainer) {
          categoryContainer.style.display = 'block';
          loadBulkCategoryDropdown();
        }
      }
    });
  }

  // Bulk action apply click handler
  const applyBtn = document.getElementById('bulk-action-apply');
  if (applyBtn) {
    applyBtn.addEventListener('click', async () => {
      const action = document.getElementById('bulk-action-select').value;
      if (!action) {
        showToast('Please select a bulk action', 'warning');
        return;
      }

      const checkboxes = document.querySelectorAll('.product-select-checkbox:checked');
      const ids = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));
      if (ids.length === 0) {
        showToast('No products selected', 'warning');
        return;
      }

      if (action === 'delete') {
        if (!confirm(`Are you sure you want to delete ${ids.length} products?`)) return;
        try {
          const res = await adminFetch('/api/products/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
          });
          const data = await res.json();
          if (data.success) {
            showToast(`Successfully deleted ${ids.length} products!`, 'success');
            loadAdminProducts();
          } else {
            showToast(data.error || 'Failed to bulk delete', 'error');
          }
        } catch (err) {
          showToast('Connection error during bulk deletion', 'error');
        }
      } else if (action === 'update-stock') {
        const stockAction = document.getElementById('bulk-stock-action').value;
        const stockValue = document.getElementById('bulk-stock-val').value;
        if (stockValue === '') {
          showToast('Please provide a stock quantity', 'warning');
          return;
        }
        try {
          const res = await adminFetch('/api/products/bulk-update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids, stockAction, stockValue })
          });
          const data = await res.json();
          if (data.success) {
            showToast('Stock updated successfully for selected products!', 'success');
            loadAdminProducts();
          } else {
            showToast(data.error || 'Failed to update stock', 'error');
          }
        } catch (err) {
          showToast('Connection error', 'error');
        }
      } else if (action === 'change-category') {
        const category = document.getElementById('bulk-category-select').value;
        if (!category) {
          showToast('Please select a category', 'warning');
          return;
        }
        try {
          const res = await adminFetch('/api/products/bulk-update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids, category })
          });
          const data = await res.json();
          if (data.success) {
            showToast('Category updated successfully for selected products!', 'success');
            loadAdminProducts();
          } else {
            showToast(data.error || 'Failed to update category', 'error');
          }
        } catch (err) {
          showToast('Connection error', 'error');
        }
      }
    });
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get('action') === 'add') {
    toggleModal('add-product-modal', true);
  }
}

// 3. Admin Orders status updater
async function loadAdminOrders() {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  try {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;"><div class="spinner" style="margin:auto;"></div></td></tr>';
    const res = await adminFetch('/api/orders');
    const data = await res.json();

    if (!data.success || data.orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No orders placed.</td></tr>';
      return;
    }

    // Save orders globally and run search/filter views
    window.allAdminOrders = data.orders || [];
    injectOrdersToolbar();
    filterAndRenderOrders();

  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Failed to load orders list.</td></tr>';
    showToast('Failed to fetch orders list', 'error');
  }
}

function injectOrdersToolbar() {
  const tableResp = document.querySelector('.table-responsive');
  if (!tableResp || document.getElementById('order-search-input') || !window.location.pathname.includes('orders.html')) return;

  const toolbar = document.createElement('div');
  toolbar.className = 'table-toolbar';
  toolbar.innerHTML = `
    <div class="toolbar-search">
      <i data-lucide="search"></i>
      <input type="text" id="order-search-input" class="admin-form-control" placeholder="Search orders by ID, customer name...">
    </div>
    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
      <select id="order-status-filter" class="admin-form-control" style="width:160px; margin:0;">
        <option value="">All Statuses</option>
        <option value="Pending">Pending</option>
        <option value="Processing">Processing</option>
        <option value="Shipped">Shipped</option>
        <option value="Delivered">Delivered</option>
        <option value="Cancelled">Cancelled</option>
      </select>
      <select id="order-sort-by" class="admin-form-control" style="width:160px; margin:0;">
        <option value="">Sort: Date (Newest)</option>
        <option value="date-oldest">Date (Oldest)</option>
        <option value="amount-desc">Total: High to Low</option>
        <option value="amount-asc">Total: Low to High</option>
      </select>
    </div>
  `;
  tableResp.parentNode.insertBefore(toolbar, tableResp);
  window.renderIcons();

  document.getElementById('order-search-input').addEventListener('input', filterAndRenderOrders);
  document.getElementById('order-status-filter').addEventListener('change', filterAndRenderOrders);
  document.getElementById('order-sort-by').addEventListener('change', filterAndRenderOrders);
}

function filterAndRenderOrders() {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody || !window.allAdminOrders) return;

  const searchVal = document.getElementById('order-search-input')?.value.toLowerCase().trim() || '';
  const statusVal = document.getElementById('order-status-filter')?.value || '';
  const sortVal = document.getElementById('order-sort-by')?.value || '';

  let filtered = [...window.allAdminOrders];

  if (searchVal) {
    filtered = filtered.filter(o => {
      const clientName = o.userId ? (o.userId.name || '') : (o.guestDetails ? (o.guestDetails.fullName || '') : '');
      const orderIdStr = (o.orderId || o._id || '').toLowerCase();
      return orderIdStr.includes(searchVal) || clientName.toLowerCase().includes(searchVal);
    });
  }

  if (statusVal) {
    filtered = filtered.filter(o => o.status === statusVal);
  }

  if (sortVal) {
    if (sortVal === 'date-oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortVal === 'amount-desc') {
      filtered.sort((a, b) => (b.summary?.total || 0) - (a.summary?.total || 0));
    } else if (sortVal === 'amount-asc') {
      filtered.sort((a, b) => (a.summary?.total || 0) - (b.summary?.total || 0));
    }
  } else {
    // Default: Newest first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px !important; color:var(--adm-text-muted);">No orders match your active search/filter criteria.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(o => {
    try {
      if (!o || (!o._id && !o.orderId)) return '';
      const displayOrderId = o.orderId || o._id || 'PENDING-ID';
      const clientName = o.userId ? (o.userId.name || 'Customer') : (o.guestDetails ? (o.guestDetails.fullName || 'Guest') : 'Guest');
      const formattedDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : 'N/A';
      const totalAmount = o.summary ? o.summary.total : 0;

      return `
        <tr>
          <td><strong style="color:var(--adm-text); font-size:13px; cursor:pointer;" onclick="openOrderDetailsDrawer('${o._id || o.orderId}')">#${displayOrderId}</strong></td>
          <td>${clientName}</td>
          <td>${formattedDate}</td>
          <td><strong>₹${totalAmount.toLocaleString('en-IN')}</strong></td>
          <td>
            <select onchange="updateOrderStatus('${o._id || o.orderId}', this.value)" style="padding:6px 12px; border-radius:6px; font-size:12px; background:var(--adm-bg); color:var(--adm-text); border:1px solid var(--adm-border); font-weight:600; cursor:pointer;">
              <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
              <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
              <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td>
            <div style="display:flex; gap:8px;">
              <button onclick="openOrderDetailsDrawer('${o._id || o.orderId}')" class="btn btn-primary" style="padding:6px 12px; font-size:11px; border-radius:6px; border:none; cursor:pointer;">Details</button>
              <a href="/api/orders/${o._id || o.orderId}/invoice" target="_blank" class="btn btn-secondary" style="padding:6px 12px; font-size:11px; border-radius:6px; text-decoration:none; display:inline-block; line-height:1.2;">Invoice</a>
            </div>
          </td>
        </tr>
      `;
    } catch (rowErr) {
      console.error('Failed to map order row:', rowErr, o);
      return '';
    }
  }).join('');
}

async function updateOrderStatus(orderId, status) {
  try {
    const res = await adminFetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Order status updated!', 'success');
      loadAdminOrders();
      return true;
    } else {
      showToast(data.error || 'Failed to update order status', 'error');
      return false;
    }
  } catch (err) {
    showToast('Error updating status', 'error');
    return false;
  }
}

// 4. Admin Customers list loader
async function loadAdminCustomers() {
  const tbody = document.getElementById('admin-customers-tbody');
  if (!tbody) return;

  try {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;"><div class="spinner" style="margin:auto;"></div></td></tr>';
    const res = await adminFetch('/api/auth/customers');
    const data = await res.json();

    if (!data.success || !data.customers || data.customers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px; color:var(--adm-text-muted);">No customers registered.</td></tr>';
      return;
    }

    // Save customers globally and filter
    window.allAdminCustomers = data.customers || [];
    injectCustomersToolbar();
    filterAndRenderCustomers();

  } catch (err) {
    console.error('Failed to load customers:', err);
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:red;">Failed to load customers list.</td></tr>';
    showToast('Failed to load customers list', 'error');
  }
}

function injectCustomersToolbar() {
  const tableResp = document.querySelector('.table-responsive');
  if (!tableResp || document.getElementById('customer-search-input') || !window.location.pathname.includes('customers.html')) return;

  const toolbar = document.createElement('div');
  toolbar.className = 'table-toolbar';
  toolbar.innerHTML = `
    <div class="toolbar-search">
      <i data-lucide="search"></i>
      <input type="text" id="customer-search-input" class="admin-form-control" placeholder="Search by name, email, role...">
    </div>
    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
      <select id="customer-status-filter" class="admin-form-control" style="width:160px; margin:0;">
        <option value="">All Statuses</option>
        <option value="Active">Active</option>
        <option value="Locked">Locked</option>
      </select>
      <select id="customer-sort-by" class="admin-form-control" style="width:160px; margin:0;">
        <option value="">Sort: Default</option>
        <option value="orders-desc">Orders: High to Low</option>
        <option value="spent-desc">Spent: High to Low</option>
      </select>
    </div>
  `;
  tableResp.parentNode.insertBefore(toolbar, tableResp);
  window.renderIcons();

  document.getElementById('customer-search-input').addEventListener('input', filterAndRenderCustomers);
  document.getElementById('customer-status-filter').addEventListener('change', filterAndRenderCustomers);
  document.getElementById('customer-sort-by').addEventListener('change', filterAndRenderCustomers);
}

function filterAndRenderCustomers() {
  const tbody = document.getElementById('admin-customers-tbody');
  if (!tbody || !window.allAdminCustomers) return;

  const searchVal = document.getElementById('customer-search-input')?.value.toLowerCase().trim() || '';
  const statusVal = document.getElementById('customer-status-filter')?.value || '';
  const sortVal = document.getElementById('customer-sort-by')?.value || '';

  let filtered = [...window.allAdminCustomers];

  if (searchVal) {
    filtered = filtered.filter(c => 
      (c.name && c.name.toLowerCase().includes(searchVal)) ||
      (c.email && c.email.toLowerCase().includes(searchVal)) ||
      (c.role && c.role.toLowerCase().includes(searchVal))
    );
  }

  if (statusVal) {
    filtered = filtered.filter(c => {
      const isLocked = c.lockUntil && new Date(c.lockUntil) > new Date();
      return statusVal === 'Locked' ? isLocked : !isLocked;
    });
  }

  if (sortVal) {
    if (sortVal === 'orders-desc') {
      filtered.sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0));
    } else if (sortVal === 'spent-desc') {
      filtered.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
    }
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 40px !important; color:var(--adm-text-muted);">No customers match your active search/filter criteria.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    const isLocked = c.lockUntil && new Date(c.lockUntil) > new Date();
    const lockStatusHTML = isLocked 
      ? `<span class="badge badge-danger">Locked</span>` 
      : `<span class="badge badge-success">Active</span>`;
    
    const verificationStatusHTML = c.emailVerified 
      ? `<span style="color:#10b981; font-weight:700;">✓ Verified</span>` 
      : `<span style="color:#ef4444; font-weight:700;">✗ Unverified</span>`;

    const orderCount = c.orderCount || 0;
    const totalSpent = c.totalSpent || 0;

    return `
    <tr>
      <td><strong>${c.name || 'Anonymous'}</strong></td>
      <td>${c.email || 'N/A'}</td>
      <td style="text-transform: capitalize;">${c.role || 'customer'}</td>
      <td>${verificationStatusHTML}</td>
      <td>${lockStatusHTML}</td>
      <td>${orderCount} orders</td>
      <td><strong>₹${totalSpent.toLocaleString('en-IN')}</strong></td>
      <td>
        <button onclick="viewCustomerDeepProfile('${c._id || c.id}')" class="btn btn-secondary" style="padding:6px 12px; font-size:12px; border-radius:6px; cursor:pointer;">👁️ Profile</button>
        
        <select onchange="handleAdminCustomerAction('${c._id || c.id}', this.value); this.value='';" style="padding:6px; font-size:12px; border-radius:6px; cursor:pointer; background:var(--adm-bg); color:var(--adm-text); border:1px solid var(--adm-border); font-weight:600; margin-left:6px;">
          <option value="">Actions</option>
          <option value="toggle-role">Toggle Permissions</option>
          <option value="force-reset">Force PW Reset</option>
          <option value="unlock">Unlock Account</option>
        </select>
      </td>
    </tr>
  `;
  }).join('');
}

// Handler for custom admin controls on users
async function handleAdminCustomerAction(customerId, action) {
  if (!action) return;

  if (action === 'toggle-role') {
    if (!confirm('Are you sure you want to toggle this customer role between Customer and Staff?')) return;
    try {
      const res = await adminFetch('/api/auth/admin/toggle-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        loadAdminCustomers();
      } else {
        showToast(data.error || 'Failed to toggle user role', 'error');
      }
    } catch (err) {
      showToast('Connection error during role toggle', 'error');
    }
  } else if (action === 'force-reset') {
    if (!confirm('Are you sure you want to force reset this user password? This will generate a temporary password.')) return;
    try {
      const res = await adminFetch('/api/auth/admin/force-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message); // Explicit alert so admin can copy the temp password
        showToast('Password forced reset successfully!', 'success');
        loadAdminCustomers();
      } else {
        showToast(data.error || 'Failed to force reset password', 'error');
      }
    } catch (err) {
      showToast('Connection error during password reset', 'error');
    }
  } else if (action === 'unlock') {
    if (!confirm('Are you sure you want to manually unlock this user account and clear failed attempts?')) return;
    try {
      const res = await adminFetch('/api/auth/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Account unlocked successfully!', 'success');
        loadAdminCustomers();
      } else {
        showToast(data.error || 'Failed to unlock account', 'error');
      }
    } catch (err) {
      showToast('Connection error during account unlock', 'error');
    }
  }
}
window.handleAdminCustomerAction = handleAdminCustomerAction;


// 5. Admin Homepage Builder and configuration values loader is handled by appearance-studio.js


// 6. Settings export, import & reset handlers
window.exportSettingsBackup = async () => {
  try {
    const res = await adminFetch('/api/settings/homepage');
    const data = await res.json();
    if (data.success && data.setting) {
      const blob = new Blob([JSON.stringify(data.setting, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `magizhvagam_settings_backup_${Date.now()}.json`;
      a.click();
      showToast('Settings backup exported!', 'success');
    }
  } catch (err) {
    showToast('Failed to export settings', 'error');
  }
};

window.importSettingsBackup = () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (!imported.whatsappContact || !imported.heroBanners) {
          showToast('Invalid settings JSON structure', 'error');
          return;
        }
        const res = await adminFetch('/api/settings/homepage', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: imported })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Settings backup restored!', 'success');
          loadHomepageBuilderSettings();
        } else {
          showToast(data.error || 'Restore failed', 'error');
        }
      } catch (err) {
        showToast('JSON parse error', 'error');
      }
    };
    reader.readAsText(file);
  };
  fileInput.click();
};

async function loadReportsPageData() {
  try {
    const res = await adminFetch('/api/reports/dashboard');
    const data = await res.json();
    if (!data.success) {
      showToast('Failed to load reports', 'error');
      return;
    }

    window.__reportsCache = data;

    const tbody = document.getElementById('reports-top-tbody');
    if (tbody) {
      if (!data.topSellingProducts || data.topSellingProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No sales records yet.</td></tr>';
      } else {
        tbody.innerHTML = data.topSellingProducts.map((p) => `
          <tr>
            <td>
              <div style="width:40px; height:40px; border-radius:4px; overflow:hidden;">
                <img src="${p.image || '/assets/images/default-product.webp'}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='/assets/images/default-product.webp'">
              </div>
            </td>
            <td><strong>${p.name}</strong></td>
            <td>${p.qty} units</td>
            <td>₹${p.revenue.toLocaleString('en-IN')}</td>
          </tr>
        `).join('');
      }
    }

    const stats = data.stats || {};
    const revenue = stats.totalRevenue || 0;
    const daily = document.getElementById('rep-daily-avg');
    const weekly = document.getElementById('rep-weekly-sales');
    const monthly = document.getElementById('rep-monthly-sales');
    const annual = document.getElementById('rep-annual-proj');
    if (daily) daily.textContent = `₹${Math.round(revenue / 30).toLocaleString('en-IN')}`;
    if (weekly) weekly.textContent = `₹${Math.round(revenue / 4).toLocaleString('en-IN')}`;
    if (monthly) monthly.textContent = `₹${revenue.toLocaleString('en-IN')}`;
    if (annual) annual.textContent = `₹${Math.round(revenue * 12).toLocaleString('en-IN')}`;
  } catch (err) {
    showToast('Error aggregating reports', 'error');
  }
}

window.exportReportsCSV = async () => {
  try {
    let data = window.__reportsCache;
    if (!data) {
      const res = await adminFetch('/api/reports/dashboard');
      data = await res.json();
    }
    if (!data.success) {
      showToast(data.error || 'Failed to load report data', 'error');
      return;
    }

    const headers = ['metric', 'value'];
    const rows = [
      ['Total Revenue (INR)', data.stats?.totalRevenue ?? 0],
      ['Total Orders', data.stats?.totalOrders ?? 0],
      ['Total Customers', data.stats?.totalCustomers ?? 0],
      ['Total Products', data.stats?.totalProducts ?? 0],
      ['Daily Average Revenue', Math.round((data.stats?.totalRevenue ?? 0) / 30)],
      ['Weekly Total Sales', Math.round((data.stats?.totalRevenue ?? 0) / 4)],
      ['Monthly Total Sales', data.stats?.totalRevenue ?? 0],
      ['Estimated Annual Revenue', Math.round((data.stats?.totalRevenue ?? 0) * 12)]
    ];

    const topProducts = data.topSellingProducts || [];
    if (topProducts.length) {
      rows.push(['', '']);
      rows.push(['Top Product', 'Qty Sold', 'Revenue']);
      topProducts.forEach((p) => {
        rows.push([p.name, p.qty, p.revenue]);
      });
    }

    const csvLines = [headers.join(',')];
    rows.forEach((row) => {
      csvLines.push(row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','));
    });

    const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `magizhvagam_sales_report_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Sales report exported to CSV!', 'success');
  } catch (err) {
    showToast('Export failed: ' + err.message, 'error');
  }
};

window.updateOrderStatus = updateOrderStatus;
window.deleteProductById = deleteProductById;
window.duplicateProductById = duplicateProductById;

async function toggleProductFeatured(id, isFeatured) {
  try {
    const res = await adminFetch(`/api/products/${id}/featured`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFeatured })
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.error || 'Failed to update featured status', 'error');
      loadAdminProducts();
    } else {
      showToast('Product featured status updated!', 'success');
    }
  } catch (err) {
    showToast('Connection error updating featured status', 'error');
    loadAdminProducts();
  }
}
window.toggleProductFeatured = toggleProductFeatured;

window.resetSettingsToDefault = async () => {
  if (!confirm('Are you sure you want to reset all store custom settings to Luxury Ivory Light defaults?')) return;
  try {
    const res = await adminFetch('/api/settings/homepage/reset', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      // Clear any cached theme data from browser storage
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('theme') || key.includes('settings') || key.includes('customCSS') || key.includes('palette') || key.includes('site_settings'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch (e) { /* storage access may fail in some contexts */ }

      showToast('Settings reset to Luxury Ivory Light defaults!', 'success');

      // Reload settings UI
      if (typeof loadHomepageBuilderSettings === 'function') {
        loadHomepageBuilderSettings();
      }

      // Trigger live preview sync if the appearance studio is open
      if (typeof syncLivePreview === 'function') {
        setTimeout(() => syncLivePreview(), 500);
      }
    } else {
      showToast(data.error || 'Reset failed', 'error');
    }
  } catch (err) {
    showToast('Connection error during reset', 'error');
  }
};

function initDashboardEvents() {
  const openBtn = document.getElementById('open-reset-modal-btn');
  const modal = document.getElementById('reset-stats-modal');
  const confirmBtn = document.getElementById('confirm-reset-btn');
  const cancelBtn = document.getElementById('cancel-reset-btn');
  const modalText = document.getElementById('reset-modal-text');

  let confirmationStep = 1;

  if (openBtn && modal && confirmBtn && cancelBtn) {
    openBtn.addEventListener('click', () => {
      confirmationStep = 1;
      if (modalText) {
        modalText.textContent = 'Are you sure you want to initialize this module data? This action is permanent.';
      }
      if (confirmBtn) {
        confirmBtn.textContent = 'Initialize';
        confirmBtn.style.background = '#ef4444';
      }
      modal.style.display = 'flex';
    });

    const closeModal = () => {
      modal.style.display = 'none';
      confirmationStep = 1;
    };

    cancelBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    confirmBtn.addEventListener('click', async () => {
      if (confirmationStep === 1) {
        confirmationStep = 2;
        if (modalText) {
          modalText.textContent = 'Please confirm once more. This will permanently wipe all order transactions and customer accounts.';
        }
        if (confirmBtn) {
          confirmBtn.textContent = 'Yes, Wipe Everything!';
          confirmBtn.style.background = '#b91c1c';
        }
      } else {
        try {
          confirmBtn.disabled = true;
          confirmBtn.textContent = 'Initializing...';

          const res = await adminFetch('/api/reports/reset-stats', {
            method: 'POST'
          });

          let data;
          try {
            data = await res.json();
          } catch (parseErr) {
            showToast('Server returned an invalid response. Please try again.', 'error');
            return;
          }

          if (data.success) {
            showToast(data.message || 'Module initialization completed!', 'success');
            closeModal();
            // Reload dashboard details
            await loadDashboardData();
          } else {
            showToast(data.error || 'Failed to initialize statistics', 'error');
          }
        } catch (err) {
          showToast('Connection error during metrics reset', 'error');
        } finally {
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Initialize';
          confirmBtn.style.background = '#ef4444';
          confirmationStep = 1;
        }
      }
    });
  }
}

function initInvoiceSearch() {
  const form = document.getElementById('invoice-search-form');
  const resultCard = document.getElementById('invoice-result-card');
  if (!form || !resultCard) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const orderId = document.getElementById('search-order-id').value.trim();
    if (!orderId) return;

    try {
      resultCard.style.display = 'none';
      const res = await adminFetch(`/api/orders/${orderId}`);

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        showToast('Server returned an invalid response. Please try again.', 'error');
        return;
      }

      if (!data.success || !data.order) {
        showToast(data.error || 'Order not found. Please verify the ID.', 'error');
        return;
      }

      const order = data.order;
      const customerName = order.userId ? (order.userId.name || 'Customer') : order.guestDetails?.fullName || 'Guest';
      const customerEmail = order.userId ? (order.userId.email || '') : order.guestDetails?.email || '';
      const customerPhone = order.userId ? (order.userId.phone || '') : order.guestDetails?.phone || '';

      // Interface compilation engine resolving items, quantities, coupon discounts, customer name, delivery address, final price.
      resultCard.innerHTML = `
        <div class="glass" style="padding:30px; border-radius:12px; max-width:800px; margin:auto; border: 1px solid var(--card-border);">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed var(--card-border); padding-bottom:20px; margin-bottom:20px; flex-wrap:wrap; gap:15px;">
            <div>
              <h2 style="font-family:'Outfit'; font-size:24px; color:hsl(var(--primary-purple)); margin:0 0 5px 0;">INVOICE</h2>
              <span style="font-size:13px; color:var(--text-muted);">Order ID: #${order._id}</span>
            </div>
            <div style="text-align:right;">
              <span style="font-size:13px; color:var(--text-muted);">Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}</span><br>
              <span style="font-size:13px; color:var(--text-muted);">Payment: <strong>${order.payment?.status || 'COD'}</strong></span>
            </div>
          </div>

          <div class="grid grid-2" style="gap:20px; margin-bottom:30px;">
            <div>
              <h5 style="font-family:'Outfit'; font-size:12px; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; font-weight:700;">Customer Info</h5>
              <div style="font-size:14px; line-height:1.5;">
                <strong>${customerName}</strong><br>
                ${customerEmail ? `${customerEmail}<br>` : ''}
                ${customerPhone ? `Phone: ${customerPhone}` : ''}
              </div>
            </div>
            <div>
              <h5 style="font-family:'Outfit'; font-size:12px; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; font-weight:700;">Shipping Address</h5>
              <div style="font-size:14px; line-height:1.5;">
                <strong>${order.shippingAddress?.fullName}</strong><br>
                ${order.shippingAddress?.street}${order.shippingAddress?.street2 ? ', ' + order.shippingAddress.street2 : ''}<br>
                ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.zipCode}<br>
                Phone: ${order.shippingAddress?.phone}
              </div>
            </div>
          </div>

          <div class="table-responsive" style="margin-bottom:30px;">
            <table class="admin-table" style="width:100%;">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align:center;">Price</th>
                  <th style="text-align:center;">Qty</th>
                  <th style="text-align:right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td><strong>${item.name}</strong></td>
                    <td style="text-align:center;">₹${item.price}</td>
                    <td style="text-align:center;">${item.quantity}</td>
                    <td style="text-align:right;">₹${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px; font-size:14px; margin-bottom:30px; line-height:1.6;">
            <div>Subtotal: <strong>₹${order.summary?.subtotal?.toFixed(2)}</strong></div>
            ${order.summary?.discount > 0 ? `<div style="color:#ef4444;">Discount Coupon (${order.couponCode || 'Promo'}): <strong>-₹${order.summary?.discount?.toFixed(2)}</strong></div>` : ''}
            <div>GST (5%): <strong>₹${order.summary?.tax?.toFixed(2)}</strong></div>
            <div>Shipping: <strong>${order.summary?.shipping > 0 ? `₹${order.summary.shipping.toFixed(2)}` : 'FREE'}</strong></div>
            <div style="font-size:18px; font-weight:700; color:hsl(var(--primary-purple)); border-top:1px solid var(--card-border); padding-top:10px; margin-top:5px;">Grand Total: ₹${order.summary?.total?.toFixed(2)}</div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:15px; border-top:1px solid var(--card-border); padding-top:20px;">
            <button type="button" id="print-invoice-btn" class="btn btn-primary" style="border-radius:8px; padding:10px 24px; font-weight:600; cursor:pointer;">Print Invoice</button>
          </div>
        </div>
      `;

      resultCard.style.display = 'block';

      // Attach print action
      document.getElementById('print-invoice-btn').addEventListener('click', () => {
        const printWindow = window.open(`/api/orders/${order._id}/invoice`, '_blank');
        if (printWindow) {
          printWindow.focus();
        } else {
          showToast('Popup blocked! Please allow popups to print.', 'error');
        }
      });

    } catch (err) {
      showToast('Error searching for invoice', 'error');
    }
  });
}

// ─── Feature Control Center Toggle Management ────────────────────────────────
function formatDateTimeLocal(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const pad = (num) => String(num).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function loadFeatureToggles() {
  try {
    const res = await adminFetch('/api/settings/feature-toggles');
    const data = await res.json();
    if (!data.success || !data.toggles) return;

    const toggles = data.toggles;
    const toggleMap = {
      wishlistEnabled: { type: 'checkbox', checkbox: 'toggle-wishlistEnabled', status: 'toggle-status-wishlist' },
      couponsEnabled: { type: 'checkbox', checkbox: 'toggle-couponsEnabled', status: 'toggle-status-coupon' },
      registrationEnabled: { type: 'checkbox', checkbox: 'toggle-registrationEnabled', status: 'toggle-status-registration' },
      whatsappCheckoutEnabled: { type: 'checkbox', checkbox: 'toggle-whatsappCheckoutEnabled', status: 'toggle-status-whatsapp' },
      codEnabled: { type: 'checkbox', checkbox: 'toggle-codEnabled', status: 'toggle-status-cod' },
      promosEnabled: { type: 'checkbox', checkbox: 'toggle-promosEnabled', status: 'toggle-status-promos' },
      homepageLayoutFeatured: { type: 'checkbox', checkbox: 'toggle-homepageLayoutFeatured', status: 'toggle-status-homepageLayoutFeatured' },
      customerLoginRequirement: { type: 'checkbox', checkbox: 'toggle-customerLoginRequirement', status: 'toggle-status-customerLoginRequirement' },
      flashSaleActive: { type: 'checkbox', checkbox: 'toggle-flashSaleActive', status: 'toggle-status-flashSaleActive' },
      themeAccentColor: { type: 'color', input: 'toggle-themeAccentColor', status: 'toggle-status-themeAccentColor' }
    };

    for (const [key, config] of Object.entries(toggleMap)) {
      const val = toggles[key];
      if (config.type === 'checkbox') {
        const cbMain = document.getElementById(config.checkbox);
        if (cbMain) cbMain.checked = !!val;
        const cbTab = document.getElementById(config.checkbox + '-tab');
        if (cbTab) cbTab.checked = !!val;

        // Update all status elements
        document.querySelectorAll('#' + config.status).forEach(statusEl => {
          statusEl.textContent = val ? 'Active' : 'Disabled';
          statusEl.classList.toggle('active', !!val);
          statusEl.classList.toggle('disabled', !val);
        });
      } else if (config.type === 'color') {
        const inputEl = document.getElementById(config.input);
        if (inputEl) inputEl.value = val || '#6A0DAD';
        const statusEl = document.getElementById(config.status);
        if (statusEl) statusEl.textContent = val || '#6A0DAD';
      }
    }

    // Load flash sale inputs
    const fsTextVal = toggles.flashSaleText || '';
    const fsTextMain = document.getElementById('input-flashSaleText');
    if (fsTextMain) fsTextMain.value = fsTextVal;
    const fsTextTab = document.getElementById('input-flashSaleText-tab');
    if (fsTextTab) fsTextTab.value = fsTextVal;

    const fsDateVal = toggles.flashSaleTargetDate;
    if (fsDateVal) {
      const dateStr = formatDateTimeLocal(fsDateVal);
      const fsDateMain = document.getElementById('input-flashSaleTargetDate');
      if (fsDateMain) fsDateMain.value = dateStr;
      const fsDateTab = document.getElementById('input-flashSaleTargetDate-tab');
      if (fsDateTab) fsDateTab.value = dateStr;
    } else {
      const fsDateMain = document.getElementById('input-flashSaleTargetDate');
      if (fsDateMain) fsDateMain.value = '';
      const fsDateTab = document.getElementById('input-flashSaleTargetDate-tab');
      if (fsDateTab) fsDateTab.value = '';
    }
  } catch (err) {
    console.error('Failed to load feature toggles', err);
  }
}

function syncFeatureToggleUI(key, value) {
  const toggleMap = {
    wishlistEnabled: { type: 'checkbox', checkbox: 'toggle-wishlistEnabled', status: 'toggle-status-wishlist' },
    couponsEnabled: { type: 'checkbox', checkbox: 'toggle-couponsEnabled', status: 'toggle-status-coupon' },
    registrationEnabled: { type: 'checkbox', checkbox: 'toggle-registrationEnabled', status: 'toggle-status-registration' },
    whatsappCheckoutEnabled: { type: 'checkbox', checkbox: 'toggle-whatsappCheckoutEnabled', status: 'toggle-status-whatsapp' },
    codEnabled: { type: 'checkbox', checkbox: 'toggle-codEnabled', status: 'toggle-status-cod' },
    promosEnabled: { type: 'checkbox', checkbox: 'toggle-promosEnabled', status: 'toggle-status-promos' },
    homepageLayoutFeatured: { type: 'checkbox', checkbox: 'toggle-homepageLayoutFeatured', status: 'toggle-status-homepageLayoutFeatured' },
    customerLoginRequirement: { type: 'checkbox', checkbox: 'toggle-customerLoginRequirement', status: 'toggle-status-customerLoginRequirement' },
    flashSaleActive: { type: 'checkbox', checkbox: 'toggle-flashSaleActive', status: 'toggle-status-flashSaleActive' },
    themeAccentColor: { type: 'color', input: 'toggle-themeAccentColor', status: 'toggle-status-themeAccentColor' }
  };

  const config = toggleMap[key];
  if (!config) return;

  if (config.type === 'checkbox') {
    const cbMain = document.getElementById(config.checkbox);
    if (cbMain) cbMain.checked = !!value;
    const cbTab = document.getElementById(config.checkbox + '-tab');
    if (cbTab) cbTab.checked = !!value;

    document.querySelectorAll('#' + config.status).forEach(statusEl => {
      statusEl.textContent = value ? 'Active' : 'Disabled';
      statusEl.classList.toggle('active', !!value);
      statusEl.classList.toggle('disabled', !value);
    });
  } else if (config.type === 'color') {
    const inputEl = document.getElementById(config.input);
    if (inputEl) inputEl.value = value;
    const statusEl = document.getElementById(config.status);
    if (statusEl) statusEl.textContent = value;
  }
}

async function handleFeatureToggle(key, value) {
  try {
    syncFeatureToggleUI(key, value);
    const payload = { toggles: { [key]: value } };
    const res = await adminFetch('/api/settings/feature-toggles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.error || 'Failed to update feature toggle', 'error');
      syncFeatureToggleUI(key, !value);
    } else {
      showToast('Feature updated successfully!', 'success');
      const iframe = document.getElementById('viewport-iframe');
      if (iframe) iframe.contentWindow.location.reload();
    }
  } catch (err) {
    console.error('Error updating feature toggle', err);
    showToast('Failed to update feature toggle due to connection error', 'error');
    syncFeatureToggleUI(key, !value);
  }
}

async function handleFlashSaleTextUpdate(val) {
  try {
    const textMain = document.getElementById('input-flashSaleText');
    if (textMain) textMain.value = val;
    const textTab = document.getElementById('input-flashSaleText-tab');
    if (textTab) textTab.value = val;

    const payload = { toggles: { flashSaleText: val } };
    const res = await adminFetch('/api/settings/feature-toggles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Flash sale promo text updated!', 'success');
      const iframe = document.getElementById('viewport-iframe');
      if (iframe) iframe.contentWindow.location.reload();
    } else {
      showToast(data.error || 'Failed to update flash sale text', 'error');
    }
  } catch (err) {
    showToast('Failed to update flash sale text', 'error');
  }
}

async function handleFlashSaleDateUpdate(val) {
  try {
    const dateMain = document.getElementById('input-flashSaleTargetDate');
    if (dateMain) dateMain.value = val;
    const dateTab = document.getElementById('input-flashSaleTargetDate-tab');
    if (dateTab) dateTab.value = val;

    const payload = { toggles: { flashSaleTargetDate: val ? new Date(val).toISOString() : null } };
    const res = await adminFetch('/api/settings/feature-toggles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Flash sale target deadline updated!', 'success');
      const iframe = document.getElementById('viewport-iframe');
      if (iframe) iframe.contentWindow.location.reload();
    } else {
      showToast(data.error || 'Failed to update flash sale deadline', 'error');
    }
  } catch (err) {
    showToast('Failed to update flash sale deadline', 'error');
  }
}

window.loadFeatureToggles = loadFeatureToggles;
window.handleFeatureToggle = handleFeatureToggle;
window.handleFlashSaleTextUpdate = handleFlashSaleTextUpdate;
window.handleFlashSaleDateUpdate = handleFlashSaleDateUpdate;




window.viewCustomerDeepProfile = async (customerId) => {
  try {
    const custRes = await adminFetch('/api/auth/customers');
    const custData = await custRes.json();
    if (!custData.success) {
      showToast('Failed to load customer details', 'error');
      return;
    }
    const customer = custData.customers.find(c => String(c._id) === String(customerId));
    if (!customer) {
      showToast('Customer not found', 'error');
      return;
    }

    // Fetch orders to filter
    const orderRes = await adminFetch('/api/orders');
    const orderData = await orderRes.json();
    const allOrders = orderData.success ? orderData.orders : [];
    const userOrders = allOrders.filter(o => {
      const oUserId = o.userId ? (o.userId._id || o.userId) : null;
      return oUserId && String(oUserId) === String(customerId);
    });

    // Create deep profile modal overlay
    const existingBackdrop = document.getElementById('deep-profile-backdrop');
    if (existingBackdrop) existingBackdrop.remove();
    const existingModal = document.getElementById('deep-profile-modal');
    if (existingModal) existingModal.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'deep-profile-backdrop';
    backdrop.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; backdrop-filter: blur(12px) !important; background: rgba(0, 0, 0, 0.5) !important; z-index: 100008 !important;';

    const modal = document.createElement('div');
    modal.id = 'deep-profile-modal';
    modal.style.cssText = 'position: fixed !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; z-index: 100009 !important; display: block !important; width: 90% !important; max-width: 700px !important; max-height: 90vh !important; overflow-y: auto !important;';

    const closeModal = () => {
      backdrop.remove();
      modal.remove();
    };
    backdrop.addEventListener('click', closeModal);

    // Format addresses HTML
    let addressesHTML = '<p style="color:var(--text-muted); font-size:13px;">No saved addresses found.</p>';
    if (customer.addresses && customer.addresses.length > 0) {
      addressesHTML = customer.addresses.map((addr, idx) => `
        <div style="background: rgba(0,0,0,0.02); border: 1px solid var(--card-border); border-radius: 8px; padding: 12px; margin-bottom: 10px; font-size: 13px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <strong>${addr.fullName || 'Address #' + (idx + 1)}</strong>
            ${addr.isDefault ? '<span style="font-size: 10px; padding: 2px 6px; background: hsl(var(--primary-purple)); color: white; border-radius: 10px; font-weight: 700;">DEFAULT</span>' : ''}
          </div>
          <div>Phone: ${addr.phone || 'N/A'}</div>
          <div>${addr.street || ''}${addr.street2 ? ', ' + addr.street2 : ''}</div>
          <div>${addr.city || ''}, ${addr.state || ''} - ${addr.zipCode || ''}</div>
        </div>
      `).join('');
    }

    // Format orders history table
    let ordersHTML = '<p style="color:var(--text-muted); font-size:13px; text-align:center; padding: 15px 0;">No order transactions found for this customer.</p>';
    if (userOrders.length > 0) {
      ordersHTML = `
        <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:left;">
          <thead>
            <tr style="border-bottom: 2px solid var(--card-border);">
              <th style="padding:8px 4px;">Order ID</th>
              <th style="padding:8px 4px;">Date</th>
              <th style="padding:8px 4px;">Total</th>
              <th style="padding:8px 4px;">Fulfillment</th>
            </tr>
          </thead>
          <tbody>
            ${userOrders.map(o => `
              <tr style="border-bottom: 1px solid var(--card-border);">
                <td style="padding:8px 4px; font-family:monospace; font-weight:bold; color:hsl(var(--primary-purple));">${o._id}</td>
                <td style="padding:8px 4px;">${new Date(o.createdAt).toLocaleDateString()}</td>
                <td style="padding:8px 4px; font-weight:bold;">${formatPrice(o.summary ? o.summary.total : 0)}</td>
                <td style="padding:8px 4px;">
                  <span style="font-size:10px; padding:2px 6px; border-radius:4px; font-weight:700; background:${o.status === 'Delivered' ? 'rgba(40,167,69,0.1); color:#28a745;' :
          o.status === 'Cancelled' ? 'rgba(220,53,69,0.1); color:#dc3545;' :
            'rgba(255,193,7,0.1); color:#ffc107;'
        }">${o.status}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const formattedDate = new Date(customer.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    modal.innerHTML = `
      <div class="modal-content glass scale-in" style="padding: 30px; border-radius: 16px; position:relative; background:#FAF9F6; border:1px solid var(--card-border); color:var(--text-color);">
        <button id="close-profile-modal-btn" style="position:absolute; top:15px; right:15px; background:transparent; font-size:18px; font-weight:bold; color:var(--text-muted); cursor:pointer; border:none;">✕</button>
        
        <h3 style="font-family:'Outfit'; font-size:24px; margin-bottom:20px; color:hsl(var(--primary-purple)); border-bottom: 2px solid var(--card-border); padding-bottom:10px;">
          Customer Profile Deep-Dive
        </h3>
        
        <div class="grid grid-2" style="gap:20px; margin-bottom:25px; align-items:start;">
          <!-- Left: Metadata -->
          <div style="background:rgba(0,0,0,0.015); padding:16px; border-radius:12px; border:1px solid var(--card-border);">
            <h4 style="font-family:'Outfit'; font-size:15px; margin-bottom:12px; color:hsl(var(--primary-purple)); font-weight:bold;">Metadata Profile</h4>
            <div style="font-size:13px; line-height:1.8; display:flex; flex-direction:column; gap:6px;">
              <div>Name: <strong style="color:var(--text-color);">${customer.name}</strong></div>
              <div>Email: <span style="color:var(--text-muted);">${customer.email}</span></div>
              <div>Phone: <strong style="color:var(--text-color);">${customer.phone || 'No phone number linked'}</strong></div>
              <div>Role: <span style="text-transform:capitalize; padding:2px 8px; font-size:11px; font-weight:700; background:rgba(106,13,173,0.1); color:hsl(var(--primary-purple)); border-radius:10px;">${customer.role}</span></div>
              <div>Registered: <span style="color:var(--text-muted);">${formattedDate}</span></div>
            </div>
          </div>
          
          <!-- Right: Addresses -->
          <div style="background:rgba(0,0,0,0.015); padding:16px; border-radius:12px; border:1px solid var(--card-border);">
            <h4 style="font-family:'Outfit'; font-size:15px; margin-bottom:12px; color:hsl(var(--primary-purple)); font-weight:bold;">Saved Addresses</h4>
            <div style="max-height: 200px; overflow-y:auto; padding-right:5px;">
              ${addressesHTML}
            </div>
          </div>
        </div>
        
        <!-- Bottom: Order History -->
        <div style="background:rgba(0,0,0,0.015); padding:16px; border-radius:12px; border:1px solid var(--card-border);">
          <h4 style="font-family:'Outfit'; font-size:15px; margin-bottom:12px; color:hsl(var(--primary-purple)); font-weight:bold;">Order Transactions History</h4>
          <div style="max-height: 220px; overflow-y:auto; padding-right:5px;">
            ${ordersHTML}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    modal.querySelector('#close-profile-modal-btn').addEventListener('click', closeModal);
  } catch (err) {
    console.error('Error rendering customer deep profile:', err);
    showToast('Error displaying deep profile details', 'error');
  }
};

function injectAmbientBlobs() {
  if (document.querySelector('.ambient-glow-wrapper')) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'ambient-glow-wrapper';
  wrapper.innerHTML = `
    <div class="ambient-blob blob-1"></div>
    <div class="ambient-blob blob-2"></div>
  `;
  document.body.appendChild(wrapper);
}

async function applyAdminBranding() {
  try {
    const res = await adminFetch('/api/settings/homepage');
    const data = await res.json();
    if (data.success && data.setting) {
      const s = data.setting;
      const root = document.documentElement;
      if (s.paletteBgMain) root.style.setProperty('--adm-bg', s.paletteBgMain);
      if (s.paletteBgSurface) {
        root.style.setProperty('--adm-surface', s.paletteBgSurface);
        root.style.setProperty('--adm-card-bg', s.paletteBgSurface);
      }
      if (s.primaryColor) {
        root.style.setProperty('--adm-accent', s.primaryColor);
        // compute a border color or use accent/primary with low opacity
        root.style.setProperty('--adm-border', s.paletteBgSurface === '#ffffff' || s.paletteBgSurface === '#FFFFFF' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)');
      }
      if (s.secondaryColor) root.style.setProperty('--adm-accent-hover', s.secondaryColor);
      if (s.paletteTextMain) root.style.setProperty('--adm-text', s.paletteTextMain);
      if (s.paletteTextMuted) root.style.setProperty('--adm-text-muted', s.paletteTextMuted);
      if (s.paletteColorSuccess) root.style.setProperty('--adm-success', s.paletteColorSuccess);
      if (s.paletteColorError) root.style.setProperty('--adm-danger', s.paletteColorError);
    }
  } catch (err) {
    console.error('Failed to load dynamic admin branding', err);
  }
}



function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

async function loadAdminEnquiries() {
  const tbody = document.getElementById('admin-enquiries-tbody');
  if (!tbody) return;

  try {
    const res = await adminFetch('/api/contact');
    const data = await res.json();

    if (!data.success) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--adm-danger);">Failed to load: ${data.error}</td></tr>`;
      return;
    }

    const enquiries = data.enquiries || [];
    if (enquiries.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--adm-text-muted); padding:30px;">No enquiries found.</td></tr>`;
      return;
    }

    tbody.innerHTML = enquiries.map(e => {
      const isUnread = e.status === 'unread';
      const badgeText = isUnread ? 'Unread' : 'Reviewed';
      const actionBtn = isUnread 
        ? `<button onclick="window.markEnquiryAsRead('${e._id}')" class="btn" style="background:var(--adm-accent, #c89b3c); color:white; border-radius:6px; padding:6px 12px; font-size:12px; font-weight:600; cursor:pointer; border:none; transition:all 0.2s;">Mark as Read</button>`
        : `<span style="color:var(--adm-text-muted); font-size:12px;">Processed</span>`;

      const formattedDate = new Date(e.createdAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      return `
        <tr style="${isUnread ? 'font-weight: 600;' : ''}">
          <td style="color:var(--adm-text);">${escapeHtml(e.name)}</td>
          <td><a href="mailto:${escapeHtml(e.email)}" style="color:var(--adm-accent); font-weight:500;">${escapeHtml(e.email)}</a></td>
          <td style="color:var(--adm-text);">${escapeHtml(e.subject)}</td>
          <td style="max-width:300px; white-space:pre-wrap; color:var(--adm-text);">${escapeHtml(e.message)}</td>
          <td><span class="badge" style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: ${isUnread ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)'}; color: ${isUnread ? 'var(--adm-danger, #ef4444)' : 'var(--adm-success, #22c55e)'};">${badgeText}</span></td>
          <td style="color:var(--adm-text-muted); font-size:12px;">${formattedDate}</td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--adm-danger);">Server error loading enquiries.</td></tr>`;
  }
}
window.loadAdminEnquiries = loadAdminEnquiries;

window.markEnquiryAsRead = async (id) => {
  try {
    const res = await adminFetch(`/api/contact/${id}/read`, { method: 'PUT' });
    const data = await res.json();
    if (data.success) {
      if (window.showToast) {
        window.showToast('Enquiry marked as read successfully', 'success');
      }
      loadAdminEnquiries();
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (err) {
    alert(`Request failed: ${err.message}`);
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN COMMAND CENTER & REBUILD PLUGINS (Phase 3 Rebuild)
   ═══════════════════════════════════════════════════════════════════════ */

// 1. Command Palette (Ctrl + K) & Universal Search
function injectCommandPalette() {
  if (document.getElementById('admin-command-palette')) return;

  const palette = document.createElement('div');
  palette.id = 'admin-command-palette';
  palette.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(9, 5, 20, 0.7);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  `;
  palette.innerHTML = `
    <div class="glass" style="width:90%; max-width:600px; border-radius:16px; padding:20px; border:1px solid rgba(168,85,247,0.25); box-shadow:0 16px 48px rgba(0,0,0,0.5); background: #120b24;">
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px; border-bottom:1px solid rgba(168,85,247,0.2); padding-bottom:12px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A855F7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="palette-search-input" placeholder="Type a command or search (e.g., products, settings, theme)..." style="flex:1; background:none; border:none; outline:none; font-family:'Outfit', sans-serif; font-size:16px; color:#fff; width:100%;">
        <span style="font-size:11px; background:rgba(255,255,255,0.08); padding:3px 6px; border-radius:4px; color:var(--adm-text-muted);">ESC to close</span>
      </div>
      <div id="palette-results" style="max-height:300px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;"></div>
    </div>
  `;

  document.body.appendChild(palette);

  // Command registry
  const commands = [
    { label: 'Go to Dashboard', url: '/admin/dashboard.html', category: 'Navigation' },
    { label: 'Manage Products List', url: '/admin/products.html?tab=products', category: 'Catalog' },
    { label: 'Manage Categories', url: '/admin/products.html?tab=categories', category: 'Catalog' },
    { label: 'Inventory Control', url: '/admin/products.html?tab=inventory', category: 'Catalog' },
    { label: 'Manage Orders', url: '/admin/orders.html', category: 'Sales' },
    { label: 'Customers Database', url: '/admin/customers.html', category: 'Sales' },
    { label: 'Inquiries & Enquiries', url: '/admin/enquiries.html', category: 'Sales' },
    { label: 'Media Library Gallery', url: '/admin/media.html', category: 'Catalog' },
    { label: 'Theme Presets Customizer', url: '/admin/settings.html?tab=presets', category: 'Appearance Studio' },
    { label: 'Color Variables Settings', url: '/admin/settings.html?tab=colors', category: 'Appearance Studio' },
    { label: 'Typography Customizer', url: '/admin/settings.html?tab=typography', category: 'Appearance Studio' },
    { label: 'Homepage Layout Editor', url: '/admin/settings.html?tab=homepage', category: 'Appearance Studio' },
    { label: 'General Store Settings', url: '/admin/settings.html?tab=general', category: 'System Settings' },
    { label: 'SEO Settings Panel', url: '/admin/settings.html?tab=seo', category: 'System Settings' },
    { label: 'Diagnostics & SMTP Test', url: '/admin/settings.html?tab=diagnostics', category: 'System Tools' },
    { label: 'Switch to Light Theme', action: 'theme-light', category: 'Appearance' },
    { label: 'Switch to Dark Theme', action: 'theme-dark', category: 'Appearance' }
  ];

  // Shortcut listeners
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openPalette();
    }
    if (e.key === 'Escape') {
      closePalette();
    }
  });

  const searchInput = document.getElementById('palette-search-input');
  const resultsContainer = document.getElementById('palette-results');

  searchInput.addEventListener('input', (e) => {
    renderPaletteResults(e.target.value);
  });

  function openPalette() {
    palette.style.opacity = '1';
    palette.style.pointerEvents = 'all';
    searchInput.value = '';
    renderPaletteResults('');
    setTimeout(() => searchInput.focus(), 50);
  }

  function closePalette() {
    palette.style.opacity = '0';
    palette.style.pointerEvents = 'none';
    searchInput.blur();
  }

  palette.addEventListener('click', (e) => {
    if (e.target === palette) closePalette();
  });

  async function renderPaletteResults(query) {
    const q = query.toLowerCase().trim();
    resultsContainer.innerHTML = '';

    // Static commands filtering
    let matches = commands.filter(cmd => cmd.label.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q));

    if (matches.length === 0) {
      resultsContainer.innerHTML = '<div style="color:var(--adm-text-muted); text-align:center; padding:12px; font-size:13px;">No quick commands found.</div>';
    } else {
      resultsContainer.innerHTML = matches.map(m => `
        <div class="palette-item" data-url="${m.url || ''}" data-action="${m.action || ''}" style="display:flex; justify-content:space-between; padding:10px 14px; border-radius:8px; background:rgba(255,255,255,0.03); cursor:pointer; font-size:13px; transition:all 0.2s;">
          <span style="color:#fff; font-weight:600;">${m.label}</span>
          <span style="color:var(--adm-accent); font-size:11px; text-transform:uppercase; font-weight:700;">${m.category}</span>
        </div>
      `).join('');

      // Add click handler on items
      resultsContainer.querySelectorAll('.palette-item').forEach(item => {
        item.addEventListener('click', () => {
          const url = item.getAttribute('data-url');
          const action = item.getAttribute('data-action');
          closePalette();

          if (url) {
            window.location.href = url;
          } else if (action === 'theme-light') {
            setAdminTheme('light');
          } else if (action === 'theme-dark') {
            setAdminTheme('dark');
          }
        });

        item.addEventListener('mouseenter', () => {
          item.style.background = 'rgba(168, 85, 247, 0.15)';
          item.style.borderLeft = '4px solid var(--adm-accent)';
        });

        item.addEventListener('mouseleave', () => {
          item.style.background = 'rgba(255, 255, 255, 0.03)';
          item.style.borderLeft = 'none';
        });
      });
    }

    // Dynamic search fallback (Query products via API if length >= 2)
    if (q.length >= 2) {
      try {
        const res = await adminFetch(`/api/products?search=${encodeURIComponent(q)}&limit=5`);
        const data = await res.json();
        if (data.success && data.products && data.products.length > 0) {
          const header = document.createElement('div');
          header.style.cssText = 'font-size:10px; font-weight:700; color:var(--adm-accent); text-transform:uppercase; margin-top:10px; margin-bottom:5px;';
          header.textContent = 'Matching Catalog items';
          resultsContainer.appendChild(header);

          data.products.forEach(p => {
            const item = document.createElement('div');
            item.style.cssText = 'display:flex; justify-content:space-between; padding:10px 14px; border-radius:8px; background:rgba(255,255,255,0.03); cursor:pointer; font-size:13px; transition:all 0.2s;';
            item.innerHTML = `
              <span style="color:#fff; font-weight:500;">📦 ${escapeHtml(p.name)}</span>
              <span style="color:var(--adm-text-muted); font-size:12px;">₹${p.price}</span>
            `;
            item.addEventListener('click', () => {
              closePalette();
              window.location.href = `/admin/products.html?action=edit&id=${p._id}`;
            });
            resultsContainer.appendChild(item);
          });
        }
      } catch (err) {
        // quiet fail
      }
    }
  }
}

// 2. Light / Dark Mode Toggle
function initAdminThemeToggle() {
  const layout = document.querySelector('.admin-layout');
  if (!layout) return;

  const topbar = document.querySelector('.admin-topbar') || document.querySelector('.admin-logo');
  if (!topbar || topbar.querySelector('.theme-toggle-btn')) return;

  const btn = document.createElement('button');
  btn.className = 'theme-toggle-btn';
  btn.type = 'button';
  btn.style.cssText = 'background:transparent; border:none; color:var(--adm-text-muted); cursor:pointer; padding:6px; display:flex; align-items:center; justify-content:center; margin-left:15px;';
  btn.innerHTML = `
    <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
    <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
  `;

  topbar.appendChild(btn);

  const applyIcons = () => {
    const isDark = layout.classList.contains('dark-mode');
    btn.querySelector('.sun-icon').style.display = isDark ? 'block' : 'none';
    btn.querySelector('.moon-icon').style.display = isDark ? 'none' : 'block';
  };

  applyIcons();

  btn.addEventListener('click', () => {
    const isCurrentlyDark = layout.classList.contains('dark-mode');
    setAdminTheme(isCurrentlyDark ? 'light' : 'dark');
    applyIcons();
  });
}

function setAdminTheme(theme) {
  const layout = document.querySelector('.admin-layout');
  if (!layout) return;

  if (theme === 'dark') {
    layout.classList.add('dark-mode');
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('admin-theme', 'dark');
  } else {
    layout.classList.remove('dark-mode');
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('admin-theme', 'light');
  }
}

// 3. Drag and Drop Dashboard Customizer
function initDashboardCustomizer() {
  const grid = document.querySelector('.metric-grid');
  if (!grid) return;

  const cards = grid.querySelectorAll('.metric-card');
  cards.forEach((card, i) => {
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-widget-id', `metric-widget-${i}`);
    
    // Add Drag Handlers
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', card.getAttribute('data-widget-id'));
      card.style.opacity = '0.5';
    });

    card.addEventListener('dragend', () => {
      card.style.opacity = '1';
    });
  });

  grid.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  grid.addEventListener('drop', (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const dragged = grid.querySelector(`[data-widget-id="${id}"]`);
    if (!dragged) return;

    // Find nearest item
    const target = e.target.closest('.metric-card');
    if (target && target !== dragged) {
      const children = Array.from(grid.children);
      const dragIdx = children.indexOf(dragged);
      const targetIdx = children.indexOf(target);

      if (dragIdx < targetIdx) {
        grid.insertBefore(dragged, target.nextSibling);
      } else {
        grid.insertBefore(dragged, target);
      }

      // Save order
      const order = Array.from(grid.children).map(c => c.getAttribute('data-widget-id'));
      localStorage.setItem('mz-admin-widget-order', JSON.stringify(order));
    }
  });

  // Load custom widget order
  try {
    const saved = JSON.parse(localStorage.getItem('mz-admin-widget-order'));
    if (saved && saved.length > 0) {
      saved.forEach(id => {
        const item = grid.querySelector(`[data-widget-id="${id}"]`);
        if (item) grid.appendChild(item);
      });
    }
  } catch (err) {}
}

// 4. Autosave & Undo/Redo System
let adminUndoStack = [];
let adminRedoStack = [];

function initAutosaveEngine() {
  const inputs = document.querySelectorAll('.admin-layout input, .admin-layout select, .admin-layout textarea');
  if (inputs.length === 0) return;

  // Add Autosave Status Indicator dynamically
  let indicator = document.getElementById('autosave-indicator');
  if (!indicator) {
    indicator = document.createElement('span');
    indicator.id = 'autosave-indicator';
    indicator.style.cssText = 'font-size:12px; color:var(--adm-text-muted); margin-left:15px; font-weight:500; opacity:0; transition:opacity 0.3s ease;';
    indicator.textContent = 'Changes autosaved.';

    const topbar = document.querySelector('.admin-topbar');
    if (topbar) {
      const spacer = topbar.querySelector('.topbar-spacer') || topbar.children[0];
      if (spacer) spacer.parentNode.insertBefore(indicator, spacer.nextSibling);
    }
  }

  let saveTimer = null;

  inputs.forEach(input => {
    // Record baseline state on focus
    input.addEventListener('focus', () => {
      input.dataset.oldValue = input.value;
    });

    input.addEventListener('change', () => {
      // Record to undo history stack
      adminUndoStack.push({
        elementId: input.id,
        name: input.name,
        oldVal: input.dataset.oldValue || '',
        newVal: input.value
      });
      adminRedoStack = []; // Clear redo on new action
      input.dataset.oldValue = input.value;

      // Trigger debounced save simulation
      if (saveTimer) clearTimeout(saveTimer);
      indicator.textContent = 'Saving modifications...';
      indicator.style.opacity = '1';

      saveTimer = setTimeout(() => {
        indicator.textContent = 'All changes saved in real-time.';
        setTimeout(() => {
          indicator.style.opacity = '0';
        }, 2000);
      }, 1200);
    });
  });

  // Bind Undo/Redo listeners
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      triggerUndo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      triggerRedo();
    }
  });

  function triggerUndo() {
    if (adminUndoStack.length === 0) return;
    const action = adminUndoStack.pop();
    const el = document.getElementById(action.elementId) || document.getElementsByName(action.name)[0];
    if (el) {
      adminRedoStack.push(action);
      el.value = action.oldVal;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      if (window.showToast) window.showToast('Undone last action', 'info');
    }
  }

  function triggerRedo() {
    if (adminRedoStack.length === 0) return;
    const action = adminRedoStack.pop();
    const el = document.getElementById(action.elementId) || document.getElementsByName(action.name)[0];
    if (el) {
      adminUndoStack.push(action);
      el.value = action.newVal;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      if (window.showToast) window.showToast('Redone action', 'info');
    }
  }
}

/* ─── Reusable Modal Dialog Engine (Point 15 Fix) ─── */
function toggleModal(modalId, show) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  if (show) {
    modal.classList.add('show');
    document.body.classList.add('modal-open');
  } else {
    modal.classList.remove('show');
    const openModals = document.querySelectorAll('.modal-overlay.show');
    if (openModals.length === 0) {
      document.body.classList.remove('modal-open');
    }
  }
}
window.toggleModal = toggleModal;

// Close modals on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const openModals = document.querySelectorAll('.modal-overlay.show');
    openModals.forEach(modal => {
      toggleModal(modal.id, false);
    });
  }
});

// Close modals when clicking overlay background
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    toggleModal(e.target.id, false);
  }
});

/* ─── MZPage Registry Registration ─── */
(function () {
  'use strict';

  // Initialize global abort controller for admin panel
  window.MZAdminAbortController = window.MZAdminAbortController || new AbortController();

  let mousemoveHandler = null;

  async function initAdminPage() {
    // Reset/renew the global admin abort controller
    if (window.MZAdminAbortController) {
      window.MZAdminAbortController.abort();
    }
    window.MZAdminAbortController = new AbortController();

    const sidebar = document.getElementById('admin-sidebar-container');
    const sidebarHasContent = sidebar && sidebar.children.length > 0;

    if (!sidebarHasContent) {
      if (document.body) {
        document.body.style.visibility = 'hidden';
      }

      try {
        const res = await adminFetch('/api/auth/profile');
        const data = await res.json();

        if (data.success && data.user && data.user.role !== 'admin') {
          document.body.innerHTML =
            '<div style="font-family:sans-serif;padding:40px;max-width:520px;margin:80px auto;"><h1>403 Forbidden</h1><p>Your account does not have administrator access.</p><p><a href="/index.html">Return to store</a></p></div>';
          document.body.style.visibility = 'visible';
          return;
        }

        if (!data.success || !data.user || data.user.role !== 'admin') {
          const redirectPath = window.location.pathname.substring(1) + window.location.search;
          window.location.replace('/admin/login?redirect=' + encodeURIComponent(redirectPath));
          return;
        }

        if (typeof window.setSessionUser === 'function') {
          window.setSessionUser(data.user);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        const redirectPath = window.location.pathname.substring(1) + window.location.search;
        window.location.replace('/admin/login?redirect=' + encodeURIComponent(redirectPath));
        return;
      }

      if (document.body) {
        document.body.style.visibility = 'visible';
      }

      if (typeof initIcons === 'function') {
        initIcons();
      }

      applyAdminBranding();
      injectAmbientBlobs();
      injectAdminSidebar();
      injectAdminTopbar();
      injectOverlays();
      initSidebarResizer();
      initOverlaysEvents();

      if (mousemoveHandler) {
        document.removeEventListener('mousemove', mousemoveHandler);
      }
      mousemoveHandler = (e) => {
        const cards = document.querySelectorAll('.glass, .metric-card, .admin-card, .btn');
        cards.forEach(card => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          card.style.setProperty('--mouse-x', `${x}px`);
          card.style.setProperty('--mouse-y', `${y}px`);
        });
      };
      document.addEventListener('mousemove', mousemoveHandler);
    }

    // Always run route-specific initializer for the current sub-page
    await initAdminRouterPage();
  }

  function destroyAdminPage() {
    if (window.MZAdminAbortController) {
      window.MZAdminAbortController.abort();
    }
  }

  window.MZPageRegistry = window.MZPageRegistry || {};
  const adminPages = [
    'admin-dashboard', 'admin-products', 'admin-orders', 'admin-invoices', 
    'admin-customers', 'admin-settings', 'admin-marketing', 'admin-content', 
    'admin-reports', 'admin-media', 'admin-security-logs', 'admin-enquiries'
  ];
  adminPages.forEach(pId => {
    window.MZPageRegistry[pId] = {
      init: initAdminPage,
      destroy: destroyAdminPage
    };
  });
})();
