/**
 * Content Router — Workspace Registry & Lifecycle Manager
 */
(function() {
  'use strict';

  const REGISTRY = {
    'homepage':     HomepageContentController,
    'about':        AboutController,
    'contact':      ContactController,
    'policies':     PoliciesController,
    'navigation':   NavigationController
  };

  const TAB_LABELS = {
    'homepage':     'Homepage Sections',
    'about':        'Brand Story',
    'contact':      'Contact Details',
    'policies':     'Store Policies',
    'navigation':   'Navigation Menus'
  };

  let router = null;

  function initContentRouter() {
    router = new WorkspaceRouter({
      containerId: 'workspace-container',
      pageFile: 'content.html',
      sectionName: 'Content',
      registry: REGISTRY,
      defaultTab: 'homepage',
      tabLabels: TAB_LABELS
    });

    document.querySelectorAll('.studio-tab-btn[data-workspace-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.getAttribute('data-workspace-tab');
        if (tab) router.navigate(tab);
      });
    });

    router.init();
  }

  function destroyContentRouter() {
    if (router) {
      router.destroy();
      router = null;
    }
  }

  window.initContentPage = initContentRouter;
  window.destroyContentRouter = destroyContentRouter;
})();
