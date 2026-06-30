/**
 * MAGIZHVAGAM - Admin SPA Route Engine
 * Intercepts page-level shifts, fetches targets, injects content wrappers, and triggers controller scripts.
 */

(function() {
  const ALLOWED_SPA_PAGES = [
    'dashboard.html',
    'products.html',
    'orders.html',
    'customers.html',
    'marketing.html',
    'content.html',
    'appearance.html',
    'reports.html',
    'settings.html',
    'security-logs.html',
    'media.html'
  ];

  // Intercepts click events on layout link tags
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link || !link.href) return;

    // Verify target matches internal administrative domain
    if (link.href.startsWith(window.location.origin + '/admin/')) {
      const url = new URL(link.href);
      const filename = url.pathname.split('/').pop();

      // Check if target is a whitelisted SPA workspace page
      if (ALLOWED_SPA_PAGES.includes(filename)) {
        e.preventDefault();
        navigateTo(link.href);
      }
    }
  });

  // Handle browser back and forward actions
  window.addEventListener('popstate', () => {
    loadWorkspace(window.location.href, false);
  });

  // Navigate to target URL
  async function navigateTo(url, pushState = true) {
    if (pushState) {
      window.history.pushState(null, '', url);
    }
    await loadWorkspace(url);
  }

  // Load and inject workspace fragment
  async function loadWorkspace(urlStr, triggerTransition = true) {
    const mainContent = document.querySelector('.admin-main');
    if (!mainContent) return;

    // Show loading state spinner
    mainContent.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; height:60vh;">
        <div class="spinner"></div>
      </div>
    `;

    try {
      const res = await fetch(urlStr);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      
      const htmlText = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      
      const newMain = doc.querySelector('.admin-main');
      if (!newMain) {
        // Fallback reload if layout is corrupted
        window.location.reload();
        return;
      }

      // Inject main content
      mainContent.innerHTML = newMain.innerHTML;

      // Sync attributes of main container if style changes
      if (newMain.getAttribute('style')) {
        mainContent.setAttribute('style', newMain.getAttribute('style'));
      } else {
        mainContent.removeAttribute('style');
      }

      // Sync active state in sidebar navigation menu
      syncSidebarActiveState();

      // Parse and execute script tags from the entire fetched page
      executeScripts(doc);

      // Re-trigger global routing initializers
      if (window.initAdminRouterPage && typeof window.initAdminRouterPage === 'function') {
        await window.initAdminRouterPage();
      }

      // Trigger custom workspace loaded event for other controllers
      window.dispatchEvent(new CustomEvent('spa:workspace-loaded', { detail: { url: urlStr } }));

    } catch (err) {
      console.error('SPA Loading Failure:', err);
      mainContent.innerHTML = `
        <div class="glass-panel" style="padding:40px; border-radius:12px; text-align:center; max-width:500px; margin:40px auto; border:1px solid #ef444433;">
          <h3 style="color:#ef4444; font-family:'Outfit'; font-size:22px; margin-bottom:12px;">Workspace Loading Failed</h3>
          <p style="color:var(--text-muted); font-size:14px; margin-bottom:20px;">Connection failed while shifting views.</p>
          <button onclick="window.location.reload()" class="btn btn-primary">Reload Page</button>
        </div>
      `;
    }
  }

  // Force duplicate script tags execution except global shell scripts
  function executeScripts(doc) {
    const shellScripts = [
      'admin-guard.js',
      'app.js',
      'auth.js',
      'admin-api.js',
      'admin.js',
      'contrast-engine.js'
    ];

    const scripts = doc.querySelectorAll('script');
    scripts.forEach(oldScript => {
      if (oldScript.src) {
        const srcFilename = oldScript.src.split('/').pop().split('?')[0];
        if (shellScripts.includes(srcFilename)) {
          return; // skip shell script
        }
      }
      
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
      if (oldScript.src) {
        newScript.src = oldScript.src;
      } else {
        newScript.textContent = oldScript.textContent;
      }
      document.body.appendChild(newScript);
      
      if (!oldScript.src) {
        newScript.remove(); // Clean up dynamic inline scripts to keep DOM tidy
      }
    });
  }

  // Update classes for sidebar items
  function syncSidebarActiveState() {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    
    // Determine active tab correctly based on path
    const getActiveTab = (p, params) => {
      const tab = params.get('tab');
      if (tab) return tab;
      if (p.includes('products.html')) return 'products';
      if (p.includes('marketing.html')) return 'coupons';
      if (p.includes('content.html')) return 'homepage';
      if (p.includes('appearance.html')) return 'presets';
      if (p.includes('settings.html')) return 'general';
      return '';
    };

    const currentTab = getActiveTab(path, urlParams);

    // Remove active state classes
    document.querySelectorAll('.admin-menu-item, .admin-menu-submenu li').forEach(el => {
      el.classList.remove('active');
      el.classList.remove('expanded');
    });

    document.querySelectorAll('.admin-menu-submenu').forEach(el => {
      el.classList.remove('open');
    });

    // Match submenu links first to avoid double activation
    let matchedSubmenu = false;
    document.querySelectorAll('.admin-menu-submenu a').forEach(a => {
      const url = new URL(a.href, window.location.origin);
      const tabParam = url.searchParams.get('tab');
      if (url.pathname === path && tabParam === currentTab) {
        a.closest('li').classList.add('active');
        matchedSubmenu = true;
        
        // Expand the parent submenu
        const parentMenu = a.closest('.has-submenu');
        if (parentMenu) {
          parentMenu.classList.add('active');
          parentMenu.classList.add('expanded');
          const submenu = parentMenu.querySelector('.admin-menu-submenu');
          if (submenu) submenu.classList.add('open');
        }
      }
    });

    // Match top level items (only if no submenu item was matched)
    if (!matchedSubmenu) {
      document.querySelectorAll('.admin-menu-item > a').forEach(a => {
        const url = new URL(a.href, window.location.origin);
        if (url.pathname === path) {
          a.closest('.admin-menu-item').classList.add('active');
        }
      });
    }
  }

  // Bind active highlights
  window.navigateToWorkspace = navigateTo;
  window.syncSPASidebarActive = syncSidebarActiveState;
})();
