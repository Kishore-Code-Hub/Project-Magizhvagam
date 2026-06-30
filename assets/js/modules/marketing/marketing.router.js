/**
 * Marketing Router — Workspace Registry & Lifecycle Manager
 * 
 * Owns: URL, History, Controller, Breadcrumb, Sidebar, Title, Workspace
 * Controllers NEVER manipulate routing.
 */
(function() {
  'use strict';

  const REGISTRY = {
    'coupons':     CouponController,
    'flash-sales': FlashSaleController,
    'newsletter':  NewsletterController,
    'popup':       PopupController
  };

  const TAB_LABELS = {
    'coupons':     'Coupons',
    'flash-sales': 'Flash Sales',
    'newsletter':  'Newsletter',
    'popup':       'Popup Builder'
  };

  let router = null;

  function initMarketingRouter() {
    router = new WorkspaceRouter({
      containerId: 'workspace-container',
      pageFile: 'marketing.html',
      sectionName: 'Marketing',
      registry: REGISTRY,
      defaultTab: 'coupons',
      tabLabels: TAB_LABELS
    });

    // Bind tab button clicks
    document.querySelectorAll('.studio-tab-btn[data-workspace-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.getAttribute('data-workspace-tab');
        if (tab) router.navigate(tab);
      });
    });

    router.init();
  }

  function destroyMarketingRouter() {
    if (router) {
      router.destroy();
      router = null;
    }
  }

  // Expose for admin.js initAdminRouterPage
  window.initMarketingPage = initMarketingRouter;
  window.destroyMarketingRouter = destroyMarketingRouter;
})();
