/**
 * MAGIZHVAGAM - Admin SPA Route Engine
 * Intercepts page-level shifts, fetches targets, injects content wrappers, and triggers controller scripts.
 * Employs sequential script loaders to prevent out-of-order execution race conditions.
 */

(function() {
  'use strict';

  const ALLOWED_SPA_PAGES = [
    'dashboard.html',
    'products.html',
    'orders.html',
    'customers.html',
    'enquiries.html',
    'marketing.html',
    'content.html',
    'reports.html',
    'settings.html',
    'security-logs.html',
    'media.html'
  ];

  const SHELL_SCRIPTS = [
    'admin-guard.js',
    'app.js',
    'auth.js',
    'admin-api.js',
    'admin.js',
    'contrast-engine.js',
    'workspace-engine.js',
    'gsap.min.js',
    'ScrollTrigger.min.js',
    'lenis.min.js'
  ];

  // Intercept click events on administrative layout links
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link || !link.href) return;

    // Verify target matches internal administrative domain
    if (link.href.startsWith(window.location.origin + '/admin/')) {
      const url = new URL(link.href);
      const filename = url.pathname.split('/').pop();

      // Check if target is a whitelisted SPA page
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

  // Clean up any active module router running on the page
  function cleanupActiveRouter() {
    const cleanupFns = [
      'destroySettingsRouter',
      'destroyMarketingRouter',
      'destroyContentRouter',
      'destroyMediaRouter',
      'destroySecurityLogsRouter',
      'destroyEnquiriesRouter'
    ];

    cleanupFns.forEach(fn => {
      if (typeof window[fn] === 'function') {
        try {
          window[fn]();
        } catch (e) {
          console.warn(`[SPA Router] Error executing cleanup fn ${fn}:`, e);
        }
      }
    });
  }

  // Load and inject workspace fragment
  async function loadWorkspace(urlStr, triggerTransition = true) {
    const mainContent = document.querySelector('.admin-main');
    if (!mainContent) return;

    // Clean up current active controller and its event listeners
    cleanupActiveRouter();

    // Show loading state spinner
    mainContent.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; height:60vh;">
        <div class="spinner" style="width:36px; height:36px; border:3px solid var(--adm-border); border-top-color:var(--adm-accent); border-radius:50%; animation:spin 0.8s linear infinite;"></div>
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
        // Fallback hard reload if layout is corrupted
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

      // Sync active highlights in flat sidebar
      syncSidebarActiveState();

      // Execute scripts in sequential order to prevent race conditions
      await executeScriptsSequentially(doc);

      // Re-trigger global routing initializers
      if (window.initAdminRouterPage && typeof window.initAdminRouterPage === 'function') {
        await window.initAdminRouterPage();
      }

      // Trigger custom workspace loaded event for other controllers
      window.dispatchEvent(new CustomEvent('spa:workspace-loaded', { detail: { url: urlStr } }));

    } catch (err) {
      console.error('SPA Loading Failure:', err);
      mainContent.innerHTML = `
        <div class="glass" style="padding:40px; text-align:center; max-width:500px; margin:40px auto; border:1px solid rgba(239,68,68,0.2) !important;">
          <h3 style="color:var(--adm-danger); font-family:'Outfit'; font-size:22px; margin-bottom:12px; margin-top:0;">Workspace Loading Failed</h3>
          <p style="color:var(--adm-text-muted); font-size:14px; margin-bottom:20px;">Connection failed while shifting views.</p>
          <button onclick="window.location.reload()" class="btn btn-secondary" style="padding:10px 20px;">Reload Dashboard</button>
        </div>
      `;
    }
  }

  // Force sequential script tags execution to prevent async out-of-order locks
  async function executeScriptsSequentially(doc) {
    const scripts = Array.from(doc.querySelectorAll('script'));
    
    for (const oldScript of scripts) {
      // 1. Skip core shell and library scripts
      if (oldScript.src) {
        const srcFilename = oldScript.src.split('/').pop().split('?')[0];
        if (SHELL_SCRIPTS.includes(srcFilename)) {
          continue;
        }
      }

      // 2. Wait for loading script before starting next in queue
      await new Promise((resolve) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        
        if (oldScript.src) {
          newScript.src = oldScript.src;
          newScript.onload = () => resolve();
          newScript.onerror = () => {
            console.warn(`[SPA Router] Failed to load external script: ${oldScript.src}`);
            resolve();
          };
          document.body.appendChild(newScript);
        } else {
          newScript.textContent = oldScript.textContent;
          document.body.appendChild(newScript);
          newScript.remove(); // tidy up
          resolve();
        }
      });
    }
  }

  // Sync active class highlights on flat workspace elements
  function syncSidebarActiveState() {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const currentTab = urlParams.get('tab') || '';

    // Remove active class from all items
    document.querySelectorAll('.admin-menu-item').forEach(el => {
      el.classList.remove('active');
    });

    let matched = false;

    // Exact matches by pathname and query parameter
    document.querySelectorAll('.admin-menu-item > a').forEach(a => {
      const url = new URL(a.href, window.location.origin);
      const tabParam = url.searchParams.get('tab') || '';
      
      if (url.pathname === path && tabParam === currentTab) {
        a.closest('.admin-menu-item').classList.add('active');
        matched = true;
      }
    });

    // Fallback: match by pathname only if no exact match was resolved
    if (!matched) {
      document.querySelectorAll('.admin-menu-item > a').forEach(a => {
        const url = new URL(a.href, window.location.origin);
        if (url.pathname === path && !url.searchParams.get('tab')) {
          a.closest('.admin-menu-item').classList.add('active');
        }
      });
    }
  }

  // Expose triggers
  window.navigateToWorkspace = navigateTo;
  window.syncSPASidebarActive = syncSidebarActiveState;
})();
