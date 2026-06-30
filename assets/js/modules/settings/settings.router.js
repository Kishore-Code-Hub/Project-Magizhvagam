/**
 * Settings Router — Workspace Registry & Lifecycle Manager
 */
(function() {
  'use strict';

  const REGISTRY = {
    'general':          GeneralSettingsController,
    'seo':              SeoSettingsController,
    'analytics':        AnalyticsSettingsController,
    'integrations':     IntegrationsSettingsController,
    'mobile-settings':  MobileSettingsController,
    'diagnostics':      DiagnosticsController
  };

  const TAB_LABELS = {
    'general':          'General Settings',
    'seo':              'SEO Tags',
    'analytics':        'Analytics',
    'integrations':     'Integrations',
    'mobile-settings':  'Mobile Offset',
    'diagnostics':      'Diagnostics'
  };

  let router = null;

  function initSettingsRouter() {
    router = new WorkspaceRouter({
      containerId: 'workspace-container',
      pageFile: 'settings.html',
      sectionName: 'System',
      registry: REGISTRY,
      defaultTab: 'general',
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

  function destroySettingsRouter() {
    if (router) {
      router.destroy();
      router = null;
    }
  }

  window.initSettingsPage = initSettingsRouter;
  window.destroySettingsRouter = destroySettingsRouter;
})();
