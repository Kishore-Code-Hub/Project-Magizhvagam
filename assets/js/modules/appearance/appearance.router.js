/**
 * Appearance Router — Workspace Registry & Lifecycle Manager
 */
(function() {
  'use strict';

  const REGISTRY = {
    'presets':    PresetsController,
    'colors':     ColorsController,
    'typography': TypographyController,
    'header':     HeaderController,
    'footer':     FooterController,
    'buttons':    ButtonsController,
    'cards':      CardsController,
    'products':   ProductsController,
    'mobile':     MobileController,
    'animations': AnimationsController,
    'glass':      GlassController,
    'css':        CssController
  };

  const TAB_LABELS = {
    'presets':    'Theme Presets',
    'colors':     'Colors Customize',
    'typography': 'Typography Font',
    'header':     'Header Setting',
    'footer':     'Footer Setting',
    'buttons':    'Buttons Style',
    'cards':      'Cards Styling',
    'products':   'Products Card',
    'mobile':     'Mobile Layout',
    'animations': 'Animations Settings',
    'glass':      'Glass Specular',
    'css':        'Custom CSS'
  };

  let router = null;
  let isDirty = false;

  // Global unsaved dirty indicators
  window.MZAppearanceStudio = {
    markDirty: function() {
      isDirty = true;
      const indicator = document.getElementById('studio-unsaved-indicator');
      if (indicator) indicator.style.display = 'inline';
    },
    markClean: function() {
      isDirty = false;
      const indicator = document.getElementById('studio-unsaved-indicator');
      if (indicator) indicator.style.display = 'none';
    }
  };

  // Centralized preview updater mapping structured theme V4 payload to iframe postMessage flat representation
  window.syncLivePreview = function(themePayload) {
    const iframe = document.getElementById('viewport-iframe');
    if (!iframe || !iframe.contentWindow || !themePayload) return;

    const theme = themePayload.theme || {};
    const t = {
      primaryColor: theme.hdr?.logo_text || '#D4A03A',
      secondaryColor: theme.hdr?.nav_link_hover || '#E0A84A',
      accentColor: theme.hero?.badge_text || '#D4A03A',
      fontFamily: themePayload.typography?.body?.family || 'Outfit',
      fontScale: parseFloat(themePayload.typography?.scaleMultiplier) || 1.0,
      btnRadius: themePayload.layout?.btnRadius === 0 ? '0' : (themePayload.layout?.btnRadius >= 30 ? '30px' : '8px'),
      btnShadow: theme.btn?.primary_shadow ? '0 8px 24px rgba(0,0,0,0.15)' : 'none',
      btnWeight: theme.btn?.font_weight || '600',
      cardRadius: (themePayload.layout?.cardRadius || 14) + 'px',
      cardShadow: parseFloat(themePayload.layout?.shadowStrength) || 1.0,
      cardHoverY: '-' + (theme.pc?.hover_translate_y || 6) + 'px',
      cardImageBg: theme.pc?.image_bg || '#0D0A14',
      annBg: theme.hdr?.announcement_bg || '#C9913D',
      annColor: theme.hdr?.announcement_text || '#0D0A14',
      bgMain: theme.hdr?.bg || '#0B0618',
      bgSurface: theme.nav?.dropdown_bg || '#171027',
      textMain: theme.hdr?.nav_link_color || '#FFFFFF',
      textMuted: theme.hero?.subheadline_color || '#D8D8D8',
      colorSuccess: theme.pc?.stock_in_color || '#2ECC71',
      colorError: theme.pc?.stock_out_color || '#E74C3C',
      customCss: themePayload.customCss || '',
      glassEnabled: theme.glass?.enabled !== false,
      glassBlur: (theme.glass?.blur || '12') + 'px',
      glassOpacity: theme.glass?.bg_opacity || '0.12',
      glassBorderOpacity: theme.glass?.border_opacity || '0.15',
      glassShadow: theme.glass?.shadow_intensity || '1.0',
      glassRadius: (theme.glass?.border_radius || '16') + 'px',
      glassBrightness: theme.glass?.brightness || '1.0',
      glassContrast: theme.glass?.contrast || '1.0'
    };

    iframe.contentWindow.postMessage({ type: 'mz:sync-preview-theme', theme: themePayload, flatTheme: t }, '*');

    // Run contrast score updates if loaded
    if (window.ContrastEngine && typeof window.ContrastEngine.updateScore === 'function') {
      window.ContrastEngine.updateScore();
    }
  };

  // Orientation toggles
  function setViewportDevice(device) {
    const iframe = document.getElementById('viewport-iframe');
    if (!iframe) return;
    document.querySelectorAll('.viewport-device-toggles .device-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-device-${device}`)?.classList.add('active');
    iframe.className = `viewport-iframe ${device}`;
  }

  // Previews path selection
  function changeViewportRoute(route) {
    const iframe = document.getElementById('viewport-iframe');
    if (iframe) iframe.src = route;
  }

  function initAppearanceRouter() {
    router = new WorkspaceRouter({
      containerId: 'workspace-container',
      pageFile: 'appearance.html',
      sectionName: 'Appearance',
      registry: REGISTRY,
      defaultTab: 'presets',
      tabLabels: TAB_LABELS
    });

    document.querySelectorAll('.studio-tab-btn[data-workspace-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.getAttribute('data-workspace-tab');
        if (tab) router.navigate(tab);
      });
    });

    // Wire device orientation triggers
    document.querySelectorAll('.viewport-device-toggles .device-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dev = btn.id.replace('btn-device-', '');
        setViewportDevice(dev);
      });
    });

    // Route selectors
    const routeSelect = document.querySelector('.viewport-route-select');
    if (routeSelect) {
      routeSelect.addEventListener('change', (e) => {
        changeViewportRoute(e.target.value);
      });
    }

    // Action bar buttons
    const form = document.getElementById('homepage-builder-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('save-settings-submit-btn');
        const oldText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
        
        try {
          const success = await window.MZThemeStore.save();
          if (success) {
            showToast('Theme settings saved successfully!', 'success');
            
            const iframe = document.getElementById('viewport-iframe');
            if (iframe) iframe.contentWindow.location.reload();
          } else {
            showToast('Failed to save settings', 'error');
          }
        } catch (err) {
          showToast('Save failed: ' + err.message, 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = oldText;
        }
      });
    }

    const restoreBtn = document.querySelector('.studio-btn-secondary');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!confirm('Revert all unsaved visual customizer settings?')) return;
        await window.MZThemeStore.reload();
        window.MZAppearanceStudio.markClean();
        showToast('Theme configurations restored!', 'success');
      });
    }

    const resetBtn = document.querySelector('.studio-btn-danger');
    if (resetBtn) {
      resetBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!confirm('Warning: This will reset the entire storefront visual customization settings to defaults. Are you sure?')) return;
        const success = await window.MZThemeStore.reset();
        if (success) {
          showToast('Theme values restored to defaults!', 'success');
        } else {
          showToast('Reset failed', 'error');
        }
      });
    }

    router.init();
  }

  function destroyAppearanceRouter() {
    if (router) {
      router.destroy();
      router = null;
    }
  }

  window.initAppearancePage = initAppearanceRouter;
  window.destroyAppearanceRouter = destroyAppearanceRouter;
})();
