/**
 * MAGIZHVAGAM — Workspace Engine
 * Enterprise-grade workspace isolation framework.
 * 
 * Provides:
 * - BaseController: Lifecycle-managed controller base class
 * - WorkspaceRouter: Registry-based router with caching, history, and DOM isolation
 * - WorkspaceCache: TTL-based data cache with invalidation
 */

// ─── Workspace Cache ────────────────────────────────────────────────────────────
class WorkspaceCache {
  constructor(ttlMs = 5 * 60 * 1000) {
    this._store = new Map();
    this._ttl = ttlMs;
  }

  get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this._ttl) {
      this._store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key, data) {
    this._store.set(key, { data, timestamp: Date.now() });
  }

  invalidate(key) {
    if (key) {
      this._store.delete(key);
    } else {
      this._store.clear();
    }
  }

  has(key) {
    return this.get(key) !== null;
  }
}

// ─── Base Controller ────────────────────────────────────────────────────────────
class BaseController {
  constructor(name) {
    this.name = name;
    this.container = null;
    this._listeners = [];
    this._intervals = [];
    this._timeouts = [];
    this._abortController = null;
    this.state = {
      dirty: false,
      loading: false,
      error: null,
      data: null
    };
  }

  /** Fetch and inject the workspace template HTML into container, loading dynamic CSS if provided */
  async mount(container) {
    this.container = container;
    this._abortController = new AbortController();
    
    // Dynamically inject stylesheet if getCssUrl returns a path
    const cssUrl = this.getCssUrl();
    if (cssUrl) {
      const linkId = `mz-style-workspace-${this.name}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = cssUrl;
        document.head.appendChild(link);
      }
    }

    // Show loading skeleton
    container.innerHTML = this._getLoadingSkeleton();
    
    // Load template from file
    const templateUrl = this.getTemplateUrl();
    if (templateUrl) {
      try {
        const res = await fetch(templateUrl, { signal: this._abortController.signal });
        if (!res.ok) throw new Error(`Template ${templateUrl} returned ${res.status}`);
        const html = await res.text();
        container.innerHTML = html;
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error(`[${this.name}] Template load failed:`, err);
        container.innerHTML = `<div style="padding:40px;text-align:center;color:#ef4444;">
          <h3>Failed to load workspace</h3>
          <p>${err.message}</p>
        </div>`;
        return;
      }
    }
  }

  /** Clean up the workspace panel and dynamic styles, calling destroy internally */
  unmount() {
    // Unload the dynamic CSS link element
    const cssUrl = this.getCssUrl();
    if (cssUrl) {
      const linkId = `mz-style-workspace-${this.name}`;
      const link = document.getElementById(linkId);
      if (link) {
        link.remove();
      }
    }
    this.destroy();
  }

  /** Bind event listeners and initialize workspace interactions */
  init() {
    // Override in subclass
  }

  /** Fetch data from APIs */
  async load() {
    // Override in subclass
  }

  /** Persist data to APIs */
  async save() {
    // Override in subclass
  }

  /** Validate form parameters or payload before saving */
  validate() {
    return true;
  }

  /** Reset configuration values to defaults */
  async reset() {
    // Override in subclass
  }

  /** Refresh data without full re-mount */
  async refresh() {
    await this.load();
  }

  /** Clean up everything: listeners, timers, DOM, state */
  destroy() {
    // Abort pending fetches
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }

    // Remove registered event listeners
    for (const { target, event, handler, options } of this._listeners) {
      target.removeEventListener(event, handler, options);
    }
    this._listeners = [];

    // Clear intervals
    for (const id of this._intervals) {
      clearInterval(id);
    }
    this._intervals = [];

    // Clear timeouts
    for (const id of this._timeouts) {
      clearTimeout(id);
    }
    this._timeouts = [];

    // Reset state
    this.state = { dirty: false, loading: false, error: null, data: null };

    // Clear container DOM
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }

    // Double-guard to clear dynamic CSS sheet link element if destroy is called directly
    const cssUrl = this.getCssUrl();
    if (cssUrl) {
      const linkId = `mz-style-workspace-${this.name}`;
      const link = document.getElementById(linkId);
      if (link) {
        link.remove();
      }
    }
  }

  /** Return path to the HTML template for this workspace */
  getTemplateUrl() {
    // Override in subclass: e.g. '/admin/workspaces/marketing/coupon.html'
    return null;
  }

  /** Return path to the CSS file for this workspace */
  getCssUrl() {
    // Override in subclass: e.g. '/assets/css/modules/marketing/coupon.css'
    return null;
  }

  // ─── Helpers for managed event listener registration ────────────────────────
  
  /** Register an event listener that will be auto-cleaned on destroy */
  on(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    this._listeners.push({ target, event, handler, options });
  }

  /** Register an interval that will be auto-cleaned on destroy */
  setManagedInterval(fn, ms) {
    const id = setInterval(fn, ms);
    this._intervals.push(id);
    return id;
  }

  /** Register a timeout that will be auto-cleaned on destroy */
  setManagedTimeout(fn, ms) {
    const id = setTimeout(fn, ms);
    this._timeouts.push(id);
    return id;
  }

  /** Shortcut: querySelector scoped to this controller's container */
  $(selector) {
    return this.container ? this.container.querySelector(selector) : null;
  }

  /** Shortcut: querySelectorAll scoped to this controller's container */
  $$(selector) {
    return this.container ? this.container.querySelectorAll(selector) : [];
  }

  /** Default loading skeleton shown while template loads */
  _getLoadingSkeleton() {
    return `<div class="workspace-loading" style="padding:40px; display:flex; flex-direction:column; gap:16px; align-items:center; justify-content:center; min-height:300px;">
      <div class="spinner" style="width:36px; height:36px; border:3px solid var(--card-border); border-top-color:var(--primary-color, #D4A03A); border-radius:50%; animation:spin 0.8s linear infinite;"></div>
      <p style="color:var(--text-muted); font-size:13px;">Loading workspace…</p>
    </div>`;
  }
}

// ─── Workspace Router ───────────────────────────────────────────────────────────
class WorkspaceRouter {
  /**
   * @param {Object} config
   * @param {string} config.containerId - DOM id of the workspace container
   * @param {string} config.pageFile - e.g. 'marketing.html'
   * @param {string} config.sectionName - e.g. 'Marketing' (for breadcrumbs)
   * @param {Object} config.registry - { tabName: ControllerClass, ... }
   * @param {string} config.defaultTab - fallback tab name
   * @param {Object} config.tabLabels - { tabName: 'Human Label', ... }
   */
  constructor(config) {
    this.containerId = config.containerId;
    this.pageFile = config.pageFile;
    this.sectionName = config.sectionName;
    this.registry = config.registry;
    this.defaultTab = config.defaultTab;
    this.tabLabels = config.tabLabels || {};
    this.cache = new WorkspaceCache();

    this._activeTab = null;
    this._activeController = null;
    this._popstateHandler = null;
  }

  /** Get the workspace container element */
  getContainer() {
    return document.getElementById(this.containerId);
  }

  /** Initialize the router: read URL, mount initial workspace, bind history */
  async init() {
    // Bind popstate for browser back/forward
    this._popstateHandler = () => this._onPopState();
    window.addEventListener('popstate', this._popstateHandler);

    // Read current tab from URL
    const tab = this._getTabFromUrl();
    await this.navigate(tab, { pushState: false });
  }

  /** Navigate to a tab: destroy previous, mount new */
  async navigate(tabName, options = {}) {
    const { pushState = true } = options;

    // Resolve controller class
    const ControllerClass = this.registry[tabName];
    if (!ControllerClass) {
      console.warn(`[WorkspaceRouter] No controller registered for tab: ${tabName}`);
      tabName = this.defaultTab;
    }
    const ResolvedClass = this.registry[tabName];
    if (!ResolvedClass) return;

    // Skip if already on this tab
    if (this._activeTab === tabName && this._activeController) return;

    // Unmount previous controller (unloads specific styles and dispatches destroy)
    if (this._activeController) {
      if (typeof this._activeController.unmount === 'function') {
        this._activeController.unmount();
      } else {
        this._activeController.destroy();
      }
      this._activeController = null;
    }

    // Clear container
    const container = this.getContainer();
    if (!container) {
      console.error(`[WorkspaceRouter] Container #${this.containerId} not found`);
      return;
    }
    container.innerHTML = '';

    // Update active tab
    this._activeTab = tabName;

    // Update tab buttons UI
    this._updateTabButtons(tabName);

    // Update URL
    if (pushState) {
      const url = `/admin/${this.pageFile}?tab=${tabName}`;
      window.history.pushState({ tab: tabName, page: this.pageFile }, '', url);
    }

    // Update breadcrumbs
    if (typeof window.updateAdminBreadcrumbs === 'function') {
      window.updateAdminBreadcrumbs(this.sectionName, this.tabLabels[tabName] || tabName);
    }

    // Update sidebar highlights
    if (typeof window.syncSPASidebarActive === 'function') {
      window.syncSPASidebarActive();
    }

    // Instantiate and mount new controller
    const controller = new ResolvedClass();
    this._activeController = controller;

    // Inject cache reference for data reuse
    controller._routerCache = this.cache;

    await controller.mount(container);
    controller.init();
    await controller.load();
  }

  /** Destroy the router and its active controller */
  destroy() {
    if (this._activeController) {
      if (typeof this._activeController.unmount === 'function') {
        this._activeController.unmount();
      } else {
        this._activeController.destroy();
      }
      this._activeController = null;
    }
    if (this._popstateHandler) {
      window.removeEventListener('popstate', this._popstateHandler);
      this._popstateHandler = null;
    }
    this._activeTab = null;
  }

  /** Handle browser back/forward */
  _onPopState() {
    const tab = this._getTabFromUrl();
    this.navigate(tab, { pushState: false });
  }

  /** Read ?tab= from current URL */
  _getTabFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    return (tab && this.registry[tab]) ? tab : this.defaultTab;
  }

  /** Update visual state of tab buttons */
  _updateTabButtons(activeTab) {
    const buttons = document.querySelectorAll('.studio-tab-btn[data-workspace-tab]');
    buttons.forEach(btn => {
      const isActive = btn.getAttribute('data-workspace-tab') === activeTab;
      btn.classList.toggle('active', isActive);
    });
  }
}

// ─── Export to global scope (non-module environment) ─────────────────────────────
window.BaseController = BaseController;
window.WorkspaceRouter = WorkspaceRouter;
window.WorkspaceCache = WorkspaceCache;
