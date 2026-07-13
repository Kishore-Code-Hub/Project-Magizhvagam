/**
 * MAGIZHVAGAM — Centralized Application Lifecycle Manager (Production Ready)
 * 
 * Central source of truth for Boot, Session validation, Dynamic components injection,
 * Stylesheet pre-loading, off-screen Page Module rendering, layout stabilization, and memory cleanups.
 */

(function () {
  'use strict';

  // Config Constants
  const TRANSITION_DURATION = 150; // ms (matches CSS)
  const CACHE_MAX_SIZE = 10;
  const CACHE_TTL = 5 * 60 * 1000; // 5 mins in ms
  const DEFAULT_TIMEOUT = 1500; // ms (safety limit for async requests)
  
  // Page module registry to store page lifecycle hooks
  window.MZPageRegistry = window.MZPageRegistry || {};

  // Cache and history queues
  const pageCache = new Map(); // url -> { html, title, bodyClass, stylesheets, timestamp }
  const prefetchedUrls = new Set();

  // Custom Observables tracking
  const activeMutationObservers = [];
  const activeResizeObservers = [];
  const activeTimeouts = new Set();
  const activeIntervals = new Set();

  // 1. Timer Interceptors to prevent memory leaks on navigate
  const nativeSetTimeout = window.setTimeout;
  const nativeClearTimeout = window.clearTimeout;
  const nativeSetInterval = window.setInterval;
  const nativeClearInterval = window.clearInterval;
  const origDocAdd = document.addEventListener;
  const origWinAdd = window.addEventListener;

  window.setTimeout = function (callback, delay, ...args) {
    const id = nativeSetTimeout(() => {
      activeTimeouts.delete(id);
      callback(...args);
    }, delay);
    activeTimeouts.add(id);
    return id;
  };

  window.clearTimeout = function (id) {
    activeTimeouts.delete(id);
    nativeClearTimeout(id);
  };

  window.setInterval = function (callback, delay, ...args) {
    const id = nativeSetInterval(callback, delay, ...args);
    activeIntervals.add(id);
    return id;
  };

  window.clearInterval = function (id) {
    activeIntervals.delete(id);
    nativeClearInterval(id);
  };

  // Fetch API Interceptor for console instrumentation
  const nativeFetch = window.fetch;
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || 'unknown';
    if (url.includes('/api/products') && !url.includes('/categories')) {
      window.MZ_ApiProducts_Count = (window.MZ_ApiProducts_Count || 0) + 1;
      console.log(`[Forensic Instrument] /api/products request count: ${window.MZ_ApiProducts_Count}`);
    }
    if (url.includes('/api/products/categories')) {
      window.MZ_ApiCategories_Count = (window.MZ_ApiCategories_Count || 0) + 1;
      console.log(`[Forensic Instrument] /api/products/categories request count: ${window.MZ_ApiCategories_Count}`);
    }
    return nativeFetch(input, init);
  };

  // Custom wrapper trackers for observers
  const NativeMutationObserver = window.MutationObserver;
  window.MutationObserver = function (callback) {
    const observer = new NativeMutationObserver(callback);
    const origObserve = observer.observe;
    observer.observe = function (target, options) {
      activeMutationObservers.push(observer);
      origObserve.call(observer, target, options);
    };
    return observer;
  };

  const NativeResizeObserver = window.ResizeObserver;
  window.ResizeObserver = function (callback) {
    const observer = new NativeResizeObserver(callback);
    const origObserve = observer.observe;
    observer.observe = function (target, options) {
      activeResizeObservers.push(observer);
      origObserve.call(observer, target, options);
    };
    return observer;
  };

  function clearAllTrackedTimeoutsAndObservers() {
    // Clear intervals and timeouts
    activeTimeouts.forEach(id => nativeClearTimeout(id));
    activeTimeouts.clear();
    activeIntervals.forEach(id => nativeClearInterval(id));
    activeIntervals.clear();

    // Disconnect observers
    activeMutationObservers.forEach(o => {
      try { o.disconnect(); } catch (e) {}
    });
    activeMutationObservers.length = 0;

    activeResizeObservers.forEach(o => {
      try { o.disconnect(); } catch (e) {}
    });
    activeResizeObservers.length = 0;
  }

  // ─── 1. CORE LIFECYCLE MANAGER ─────────────────────────────────────────────
  window.MZLifecycle = {
    phase: 'BOOT', // BOOT -> LOAD_THEME -> LOAD_SESSION -> ... -> REVEAL_PAGE

    getActivePageId() {
      const wrapper = document.getElementById('mz-storefront-content') || document.getElementById('mz-admin-content');
      if (wrapper && wrapper.hasAttribute('data-mz-page-id')) {
        return wrapper.getAttribute('data-mz-page-id');
      }

      // Fallback path mapping
      const path = window.location.pathname;
      if (path.includes('admin/')) {
        const filename = path.split('/').pop().replace('.html', '');
        return `admin-${filename || 'dashboard'}`;
      }
      
      if (path === '/' || path.includes('index.html')) return 'home';
      
      const filename = path.split('/').pop().replace('.html', '');
      return filename || 'home';
    },

    async boot() {
      this.phase = 'BOOT';
      const wrapper = MZLayout.preparePageContainer();
      if (!wrapper) {
        document.documentElement.classList.remove('mz-loading');
        return;
      }

      // Start offscreen loading
      wrapper.classList.add('mz-rendering');
      document.documentElement.classList.remove('mz-loading');

      const isAdmin = !!document.querySelector('.admin-layout');

      try {
        // Load Global Presets & Themes
        this.phase = 'LOAD_THEME';
        await MZLayout.initTheme();

        // Load Global Configuration & Sessions
        this.phase = 'LOAD_SESSION';
        await MZApp.loadGlobalState();

        // Inject persistent header, footer, and navigation
        this.phase = 'INJECT_HEADER';
        await MZLayout.injectGlobalComponents();

        // Execute static content initialization scripts
        this.phase = 'EXECUTE_PAGE_MODULE';
        await this.runPageLifecycle();

        // Reveal the fully constructed page
        await this.revealPage();
      } catch (err) {
        console.error('[MZLifecycle] Boot lifecycle execution failed:', err);
        wrapper.classList.remove('mz-rendering');
      }
    },

    async runPageLifecycle() {
      const pageId = this.getActivePageId();
      console.log(`[MZLifecycle] Running page lifecycle for page ID: ${pageId}`);
      
      const page = window.MZPageRegistry && window.MZPageRegistry[pageId];
      if (page) {
        const runHook = async (name) => {
          if (typeof page[name] === 'function') {
            try {
              await page[name]();
            } catch (e) {
              console.error(`[MZLifecycle] Page Module hook '${name}' failed for page ID '${pageId}':`, e);
            }
          }
        };

        await runHook('init');
        await runHook('loadData');
        await runHook('render');
        await runHook('afterRender');
      } else {
        console.warn(`[MZLifecycle] No registered page module found in MZPageRegistry for page ID: ${pageId}`);
      }
    },

    async revealPage() {
      this.phase = 'WAIT_CRITICAL_IMAGES';
      const isAdmin = !!document.querySelector('.admin-layout');
      const wrapperId = isAdmin ? 'mz-admin-content' : 'mz-storefront-content';
      const container = document.getElementById(wrapperId);

      await Promise.all([
        MZAsset.waitForCriticalImages(container),
        MZAsset.waitForFonts()
      ]);

      this.phase = 'STABILIZE_LAYOUT';
      await this.stabilizeLayout();

      this.phase = 'RUN_MOTION_SYSTEM';
      await MZMotion.init();

      this.phase = 'REVEAL_PAGE';
      await MZTransition.reveal();

      // Trigger all statically captured load listeners
      const loadListeners = window.MZ_Load_Listeners || [];
      window.MZ_Load_Listeners = [];
      loadListeners.forEach(listener => {
        try { listener(); } catch (e) {}
      });

      this.phase = 'ENABLE_USER_INTERACTION';
    },

    async stabilizeLayout() {
      // Flush rendering frames & let fonts recalculate layouts
      await MZAsset.waitForFonts();
      await new Promise(resolve => nativeSetTimeout(resolve, 0));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    },

    createFallbackPageAdapter() {
      return {
        async init() {
          // Fallback to captured DOMContentLoaded listeners instead of manual execution.
        },
        async destroy() {
          // Default adapter has no custom page cleanup
        }
      };
    }
  };

  // ─── 2. APP MANAGER ────────────────────────────────────────────────────────
  window.MZApp = {
    user: null,
    settings: null,
    featureFlags: null,

    async loadGlobalState() {
      if (this.settings && this.user) return; // Skip if loaded
      
      try {
        const [userData, settingsData, togglesData] = await Promise.all([
          typeof window.validateUserSession === 'function' ? window.validateUserSession() : Promise.resolve(null),
          typeof window.fetchSettings === 'function' ? window.fetchSettings() : Promise.resolve(null),
          typeof window.fetchFeatureToggles === 'function' ? window.fetchFeatureToggles() : Promise.resolve(null)
        ]);

        this.user = userData;
        this.settings = settingsData;
        this.featureFlags = togglesData;
      } catch (err) {
        console.error('[MZApp] Error loading global application state:', err);
      }
    }
  };

  // ─── 3. LAYOUT MANAGER ──────────────────────────────────────────────────────
  window.MZLayout = {
    async initTheme() {
      const settings = MZApp.settings || {};
      if (typeof window.applyAppearanceSettings === 'function') {
        window.applyAppearanceSettings(settings);
      }
    },

    async injectGlobalComponents() {
      const isAdmin = !!document.querySelector('.admin-layout');
      if (isAdmin) {
        // Admin layouts already start hidden via body style
        if (document.body && document.body.style.visibility === 'hidden') {
          document.body.style.visibility = 'visible';
        }
        return;
      }

      const headerEl = document.getElementById('main-header');
      const footerEl = document.getElementById('main-footer');

      if (headerEl && typeof window.injectComponents === 'function') {
        window.injectComponents(MZApp.settings || {}, MZApp.user);
        if (window.__mzNav && typeof window.__mzNav.render === 'function') {
          await window.__mzNav.render(headerEl);
        }
      }

      if (footerEl && window.__mzFooter && typeof window.__mzFooter.render === 'function') {
        await window.__mzFooter.render(footerEl);
      }

      if (typeof window.injectMiniCartDrawerElement === 'function') {
        window.injectMiniCartDrawerElement();
      }
      if (typeof window.initPremiumSearchExperience === 'function') {
        window.initPremiumSearchExperience();
      }
      if (typeof window.syncCartCounters === 'function') {
        window.syncCartCounters();
      }
    },

    preparePageContainer() {
      return wrapContent(document);
    }
  };

  // ─── 4. TRANSITION MANAGER ──────────────────────────────────────────────────
  window.MZTransition = {
    isTransitioning: false,

    async navigate(url, isPushState = true) {
      if (this.isTransitioning) return;
      this.isTransitioning = true;

      // 1. Run Cleanup lifecycle hooks
      const activePageId = MZLifecycle.getActivePageId();
      const page = window.MZPageRegistry && window.MZPageRegistry[activePageId];
      if (page && typeof page.destroy === 'function') {
        try {
          await page.destroy();
        } catch (e) {
          console.error('[MZTransition] Page destroy hook error:', e);
        }
      }
      
      // Reset global script page registration
      window.MZPage = null;

      // Disconnect mutations, clear timeouts/intervals
      clearAllTrackedTimeoutsAndObservers();

      // Dispatch leaving event
      window.dispatchEvent(new CustomEvent('mz:page-before-leave', { detail: { url } }));

      // 2. Start exit animation
      const isAdmin = !!document.querySelector('.admin-layout');
      const wrapperId = isAdmin ? 'mz-admin-content' : 'mz-storefront-content';
      const currentContent = document.getElementById(wrapperId);

      if (currentContent) {
        currentContent.classList.add('mz-exit');
      }

      showProgressBar();
      const fetchPromise = fetchPage(url);

      try {
        const pageData = await fetchPromise;
        await preloadStylesheets(pageData.stylesheets);
        hideProgressBar();

        if (currentContent) {
          // Lock height to prevent vertical layout shifts (CLS)
          currentContent.style.minHeight = currentContent.offsetHeight + 'px';
          currentContent.classList.add('mz-rendering');
          currentContent.classList.remove('mz-exit');

          // Destroy active page module before parsing new page content
          const oldPageId = MZLifecycle.getActivePageId();
          const oldPage = window.MZPageRegistry && window.MZPageRegistry[oldPageId];
          if (oldPage && typeof oldPage.destroy === 'function') {
            try {
              console.log(`[MZLifecycle] Destroying page module for page ID: ${oldPageId}`);
              await oldPage.destroy();
            } catch (e) {
              console.error(`[MZLifecycle] Failed to destroy page module '${oldPageId}':`, e);
            }
          }

          // Parse and swap inner workspace layouts
          const parser = new DOMParser();
          const newDoc = parser.parseFromString(pageData.html, 'text/html');
          const newContentWrapper = wrapContent(newDoc);

          if (!newContentWrapper) {
            window.location.href = url;
            return;
          }

          // Verify and inject every inline <style> tag from newDoc head to document.head
          const inlineStyles = Array.from(newDoc.querySelectorAll('head style:not(#mz-theme-vars)'));
          document.querySelectorAll('style[data-mz-inline-style]').forEach(el => el.remove());
          inlineStyles.forEach(style => {
            const cloned = document.createElement('style');
            cloned.setAttribute('data-mz-inline-style', 'true');
            cloned.textContent = style.textContent;
            document.head.appendChild(cloned);
          });
          console.log(`[MZTransition] Injected ${inlineStyles.length} inline styles from fetched document head.`);

          currentContent.innerHTML = newContentWrapper.innerHTML;
          document.title = pageData.title;
          document.body.className = pageData.bodyClass;

          if (isPushState) {
            window.history.pushState(null, '', url);
          }

          window.scrollTo(0, 0);

          // Evaluate dynamically loaded scripts and await their complete onload event
          await evaluateNewScripts(newDoc);

          // Run initialization lifecycle
          await MZLifecycle.runPageLifecycle();
          await MZLifecycle.revealPage();
        }
      } catch (err) {
        console.error('[MZTransition] Transition crashed, executing hard load:', err);
        hideProgressBar();
        window.location.href = url;
      } finally {
        this.isTransitioning = false;
      }
    },

    async reveal() {
      const isAdmin = !!document.querySelector('.admin-layout');
      const wrapperId = isAdmin ? 'mz-admin-content' : 'mz-storefront-content';
      const container = document.getElementById(wrapperId);

      if (container) {
        container.classList.remove('mz-rendering');
        container.className = `${wrapperId} mz-transition-content mz-enter-start`;
        container.offsetHeight; // visual repaint force

        container.classList.remove('mz-enter-start');
        container.classList.add('mz-enter-active');

        await new Promise(resolve => nativeSetTimeout(resolve, TRANSITION_DURATION));
        container.classList.remove('mz-enter-active');
        container.style.minHeight = ''; // reset height freeze lock
      }
    }
  };

  // ─── 5. COMPONENT MANAGER ──────────────────────────────────────────────────
  window.MZComponent = {
    // Unifies general inputs/components initializations
  };

  // ─── 6. MOTION MANAGER ──────────────────────────────────────────────────────
  window.MZMotion = {
    lenis: null,

    async init() {
      cleanupGlobalLibraries();

      if (window.MZMotionSystem && typeof window.MZMotionSystem.initMotionSystem === 'function') {
        try {
          window.MZMotionSystem.initMotionSystem();
          this.lenis = window.lenis;
        } catch (e) {
          console.warn('[MZMotion] System initialization fail:', e);
        }
      }

      if (window.MZStoreEnhancements && typeof window.MZStoreEnhancements.init === 'function') {
        try {
          window.MZStoreEnhancements.init();
        } catch (e) {}
      }

      if (window.__mzAnimLoader && typeof window.__mzAnimLoader.reload === 'function') {
        try {
          window.__mzAnimLoader.reload();
        } catch (e) {}
      }
    }
  };

  // ─── 7. ASSET MANAGER ───────────────────────────────────────────────────────
  window.MZAsset = {
    async waitForCriticalImages(container) {
      if (!container) return;

      const images = Array.from(container.querySelectorAll('img:not([loading="lazy"])'));
      const promises = images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
          nativeSetTimeout(resolve, 800); // Guard timeout
        });
      });
      await Promise.all(promises);
    },

    async waitForFonts() {
      if (document.fonts && typeof document.fonts.ready !== 'undefined') {
        try {
          await document.fonts.ready;
        } catch (e) {}
      }
    }
  };

  let progressTimer = null;
  function showProgressBar() {
    clearTimeout(progressTimer);
    let container = document.getElementById('mz-progress-bar-container');
    let bar = document.getElementById('mz-progress-bar');
    
    if (!container || !bar) {
      container = document.createElement('div');
      container.id = 'mz-progress-bar-container';
      bar = document.createElement('div');
      bar.id = 'mz-progress-bar';
      container.appendChild(bar);
      document.body.appendChild(container);
    }

    container.classList.add('active');
    bar.style.width = '0%';

    let progress = 0;
    progressTimer = setInterval(() => {
      if (progress < 90) {
        progress += Math.random() * 15;
        bar.style.width = Math.min(progress, 90) + '%';
      }
    }, 80);
  }

  function hideProgressBar() {
    clearTimeout(progressTimer);
    const container = document.getElementById('mz-progress-bar-container');
    const bar = document.getElementById('mz-progress-bar');
    if (!container || !bar) return;

    bar.style.width = '100%';
    setTimeout(() => {
      container.classList.remove('active');
      setTimeout(() => {
        bar.style.width = '0%';
      }, 100);
    }, 150);
  }

  function shouldIntercept(anchor) {
    if (!anchor || !anchor.href) return false;

    try {
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return false;

      const path = url.pathname.toLowerCase();
      if (path.startsWith('/api/') || path.startsWith('/uploads/') || path.includes('/assets/')) return false;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return false;

      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
        return false;
      }

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return false;
      }

      const skipPaths = ['/api/auth/logout', '/logout', '/admin/logout'];
      if (skipPaths.some(skip => path.includes(skip))) return false;

      if (anchor.hasAttribute('data-mz-no-transition') || anchor.getAttribute('rel') === 'external') {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  function wrapContent(targetDoc = document) {
    if (targetDoc.querySelector('.admin-layout')) {
      const main = targetDoc.querySelector('.admin-main');
      if (main) {
        let wrapper = targetDoc.getElementById('mz-admin-content');
        if (!wrapper) {
          const topbar = targetDoc.getElementById('admin-topbar-container');
          wrapper = targetDoc.createElement('div');
          wrapper.id = 'mz-admin-content';
          wrapper.className = 'mz-transition-content';

          const children = Array.from(main.childNodes);
          children.forEach(child => {
            if (child !== topbar) {
              wrapper.appendChild(child);
            }
          });
          main.appendChild(wrapper);
        }
        return wrapper;
      }
    }

    let wrapper = targetDoc.getElementById('mz-storefront-content');
    if (wrapper) return wrapper;

    wrapper = targetDoc.createElement('div');
    wrapper.id = 'mz-storefront-content';
    wrapper.className = 'mz-transition-content';

    const body = targetDoc.body;
    const elementsToWrap = [];

    Array.from(body.childNodes).forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        const id = node.id;
        const className = node.getAttribute('class') || '';

        if (tagName === 'script' || tagName === 'header' || tagName === 'footer') return;
        if (id === 'main-header' || id === 'main-footer') return;
        if (className.includes('mobile-bottom-navbar') || className.includes('toast-container') || id === 'mini-cart-drawer' || className.includes('modal-overlay') || className.includes('transition-curtain-overlay')) return;
        if (node.style && (node.style.position === 'fixed' || parseInt(node.style.zIndex) > 1000)) return;

        elementsToWrap.push(node);
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
        elementsToWrap.push(node);
      }
    });

    if (elementsToWrap.length > 0) {
      const firstEl = elementsToWrap[0];
      firstEl.parentNode.insertBefore(wrapper, firstEl);
      elementsToWrap.forEach(el => {
        wrapper.appendChild(el);
      });
    }

    return wrapper;
  }

  function fetchPage(url) {
    const absoluteUrl = new URL(url, window.location.href).href;
    let cached = pageCache.get(absoluteUrl);
    if (cached) {
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return Promise.resolve(cached);
      } else {
        pageCache.delete(absoluteUrl);
      }
    }

    return fetch(absoluteUrl)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .catch(err => {
        console.error('[MZTransition] fetchPage error:', err.message || err, 'URL:', absoluteUrl);
        throw err;
      })
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const stylesheets = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
          .map(l => l.getAttribute('href'))
          .filter(Boolean);

        const data = {
          html,
          title: doc.title,
          bodyClass: doc.body.className,
          stylesheets,
          timestamp: Date.now()
        };
        pageCache.set(absoluteUrl, data);
        return data;
      });
  }

  function preloadStylesheets(stylesheets) {
    if (!stylesheets || stylesheets.length === 0) return Promise.resolve();

    const existingHrefs = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(l => l.getAttribute('href') || '');

    const promises = [];
    stylesheets.forEach(href => {
      if (existingHrefs.some(ex => ex.includes(href) || href.includes(ex))) return;

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;

      const promise = new Promise(resolve => {
        link.onload = resolve;
        link.onerror = resolve;
        nativeSetTimeout(resolve, 600); // 600ms guard
      });

      promises.push(promise);
      document.head.appendChild(link);
    });

    return Promise.all(promises);
  }

  async function prefetchUrl(url) {
    if (prefetchedUrls.has(url) || pageCache.has(url)) return;
    prefetchedUrls.add(url);

    try {
      await fetchPage(url);
    } catch (e) {}
  }

  function handleLinkInteraction(e) {
    const anchor = (e.target && typeof e.target.closest === 'function') ? e.target.closest('a') : null;
    if (!anchor || !shouldIntercept(anchor)) return;
    prefetchUrl(anchor.href);
  }

  function cleanupGlobalLibraries() {
    if (typeof ScrollTrigger !== 'undefined' && typeof ScrollTrigger.getAll === 'function') {
      ScrollTrigger.getAll().forEach(trigger => {
        try { trigger.kill(); } catch (e) {}
      });
    }

    if (window.lenis && typeof window.lenis.destroy === 'function') {
      try {
        window.lenis.destroy();
        window.lenis = null;
      } catch (e) {}
    }
  }

  function evaluateNewScripts(newDoc) {
    const scripts = Array.from(newDoc.querySelectorAll('script'));
    const blacklist = [
      'admin-guard.js', 'admin-api.js', 'auth.js', 'app.js', 
      'nav.js', 'footer.js', 'theme-loader.js', 'gsap.min.js', 
      'ScrollTrigger.min.js', 'lenis.min.js', 'lucide.min.js',
      'storefront-init.js', 'store-enhancements.js', 'motion-system.js'
    ];

    const promises = [];

    scripts.forEach(script => {
      const src = script.getAttribute('src');

      if (src) {
        if (blacklist.some(b => src.includes(b))) return;

        // Force script re-evaluation on page change to capture DOMContentLoaded hooks
        const cleanSrc = src.split('?')[0];
        const existing = document.querySelector(`script[src*="${cleanSrc}"]`);
        if (existing) existing.remove();

        const newScript = document.createElement('script');
        newScript.src = cleanSrc + '?mz_t=' + Date.now();
        newScript.async = false;

        const p = new Promise(resolve => {
          newScript.onload = () => resolve();
          newScript.onerror = () => resolve();
        });
        promises.push(p);

        document.body.appendChild(newScript);
      } else {
        const origDocAdd = document.addEventListener;
        const origWinAdd = window.addEventListener;
        const localListeners = [];

        document.addEventListener = window.addEventListener = function (type, listener, options) {
          if (type === 'DOMContentLoaded' || type === 'load') {
            localListeners.push(listener);
          } else {
            const target = this === window ? origWinAdd : origDocAdd;
            target.call(this, type, listener, options);
          }
        };

        const newInlineScript = document.createElement('script');
        newInlineScript.textContent = script.textContent;
        document.body.appendChild(newInlineScript);
        newInlineScript.remove();

        document.addEventListener = origDocAdd;
        window.addEventListener = origWinAdd;

        localListeners.forEach(listener => {
          try {
            const res = listener();
            if (res instanceof Promise) {
              // Register page listeners as hooks if returned during inline eval
              window.MZ_DOMContentLoaded_Listeners.push(() => res);
            }
          } catch (e) {}
        });
      }
    });
    return Promise.all(promises);
  }

  // ─── BOOTSTRAPPING TRIGGER ─────────────────────────────────────────────────

  // Route API
  window.MZNavigate = function (url) {
    MZTransition.navigate(url, true);
  };

  // Static event hooks
  document.addEventListener('click', function (e) {
    const anchor = (e.target && typeof e.target.closest === 'function') ? e.target.closest('a') : null;
    if (!anchor || !shouldIntercept(anchor)) return;

    e.preventDefault();
    window.MZNavigate(anchor.href);
  });

  window.addEventListener('popstate', function () {
    MZTransition.navigate(window.location.href, false);
  });

  document.addEventListener('mouseenter', handleLinkInteraction, true);
  document.addEventListener('focusin', handleLinkInteraction, true);

  // Core boot trigger
  if (document.readyState === 'loading') {
    origDocAdd.call(document, 'DOMContentLoaded', () => MZLifecycle.boot());
  } else {
    MZLifecycle.boot();
  }

})();
