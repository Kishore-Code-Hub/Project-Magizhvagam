/**
 * MAGIZHVAGAM - Appearance Studio Module
 * Handles storefront design customizer, presets, colors, fonts, layouts, live preview syncing, and theme saving.
 */

(function() {
  let themeV4 = null;
  let isDirty = false;

  function markDirty() {
    isDirty = true;
    const indicator = document.getElementById('studio-unsaved-indicator');
    if (indicator) indicator.style.display = 'inline';
  }

  function markClean() {
    isDirty = false;
    const indicator = document.getElementById('studio-unsaved-indicator');
    if (indicator) indicator.style.display = 'none';
  }

  function showToast(msg, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type);
    } else {
      alert(msg);
    }
  }

  function showSaveStatus(success, text) {
    const statusBox = document.getElementById('studio-save-status');
    if (!statusBox) return;
    statusBox.style.display = 'block';
    statusBox.className = 'studio-save-status ' + (success ? 'success' : 'error');
    statusBox.textContent = text;
    setTimeout(() => { statusBox.style.display = 'none'; }, 4000);
  }

  // Escape HTML helper
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // Load and apply V4 Theme settings
  async function loadV4ThemeSettings() {
    const form = document.getElementById('homepage-builder-form');
    if (!form) return;

    try {
      const res = await adminFetch('/api/site-settings/theme');
      const data = await res.json();
      if (data.success && data.data) {
        themeV4 = data.data;

        const t = themeV4.theme || {};
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

        // Presets active state check
        const activePreset = themeV4.meta?.activePresetId || 'velvet';
        document.querySelectorAll('.preset-option-card').forEach(c => c.classList.remove('active'));
        document.getElementById(`preset-${activePreset}`)?.classList.add('active');

        // Color pickers values sync
        setVal('primary-color-field', t.hdr?.logo_text || '#D4A03A');
        setVal('secondary-color-field', t.hdr?.nav_link_hover || '#E0A84A');
        setVal('accent-color-field', t.hero?.badge_text || '#D4A03A');

        setVal('palette-bg-main', t.hdr?.bg || '#0B0618');
        setVal('palette-bg-surface', t.nav?.dropdown_bg || '#171027');
        setVal('palette-text-main', t.hdr?.nav_link_color || '#FFFFFF');
        setVal('palette-text-muted', t.hero?.subheadline_color || '#D8D8D8');

        setVal('palette-color-primary', t.btn?.primary_bg || '#D4A03A');
        setVal('palette-color-secondary', t.btn?.primary_hover_bg || '#211638');
        setVal('palette-color-success', t.pc?.stock_in_color || '#2ECC71');
        setVal('palette-color-error', t.pc?.stock_out_color || '#E74C3C');

        // Fonts
        setVal('font-family-field', themeV4.typography?.body?.family || 'Outfit');
        const scaleVal = themeV4.typography?.scaleMultiplier || 1.0;
        setVal('font-scale-field', scaleVal);
        const fontScaleLabel = document.getElementById('font-scale-val');
        if (fontScaleLabel) fontScaleLabel.textContent = scaleVal;

        // Header
        setVal('brand-name-field', themeV4.meta?.storeName || 'MAGIZHVAGAM');
        setVal('logo-field', themeV4.logo || '');
        updateLogoPreviewBox(themeV4.logo || '');
        setVal('whatsapp-contact-field', themeV4.meta?.socialLinks?.whatsapp || '919876543210');
        
        const stickyToggle = document.getElementById('hdr-sticky-toggle');
        if (stickyToggle) stickyToggle.checked = t.hdr?.sticky !== false;

        const annToggle = document.getElementById('hdr-announcement-toggle');
        if (annToggle) annToggle.checked = t.hdr?.announcement_active !== false;

        setVal('hdr-announcement-bg', t.hdr?.announcement_bg || '#C9913D');
        setVal('hdr-announcement-text', t.hdr?.announcement_text || '#0D0A14');

        // Buttons
        const btnRadius = themeV4.layout?.btnRadius || 10;
        let btnStyle = 'rounded';
        if (btnRadius === 0) btnStyle = 'sharp';
        else if (btnRadius >= 30) btnStyle = 'pill';
        setVal('button-style-field', btnStyle);
        setVal('button-shadow-field', t.btn?.primary_shadow ? 'pronounced' : 'soft');
        setVal('button-weight-field', t.btn?.font_weight || '600');

        // Cards
        const cardRadius = themeV4.layout?.cardRadius || 14;
        setVal('card-radius-field', cardRadius);
        const cardRadiusLabel = document.getElementById('card-radius-val');
        if (cardRadiusLabel) cardRadiusLabel.textContent = cardRadius;

        const cardShadow = themeV4.layout?.shadowStrength || 1;
        setVal('card-shadow-field', cardShadow);
        const cardShadowLabel = document.getElementById('card-shadow-val');
        if (cardShadowLabel) cardShadowLabel.textContent = cardShadow;

        const hoverY = t.pc?.hover_translate_y || 6;
        setVal('card-hover-y-field', hoverY);
        const hoverYLabel = document.getElementById('card-hover-y-val');
        if (hoverYLabel) hoverYLabel.textContent = hoverY;

        setVal('card-image-bg-field', t.pc?.image_bg || '#0D0A14');

        // Product details page accents
        setVal('pdp-gallery-border-field', t.pdp?.gallery_active_border || '#C9913D');
        setVal('pdp-spec-heading-field', t.pdp?.specs_heading_color || '#F5F0E8');
        setVal('pdp-tab-active-field', t.pdp?.tab_active_color || '#C9913D');

        // Mobile scaling
        const mFontScale = themeV4.layout?.mobileFontScale || 0.9;
        setVal('mobile-font-scale-field', mFontScale);
        const mFontScaleVal = document.getElementById('mobile-font-scale-val');
        if (mFontScaleVal) mFontScaleVal.textContent = mFontScale;
        setVal('mobile-header-height-field', t.hdr?.mobile_height || 64);
        setVal('mobile-nav-bg-field', t.nav?.mobile_bg || '#0D0A14');

        // Global animations
        const animEnableToggle = document.getElementById('anim-enable-toggle');
        if (animEnableToggle) animEnableToggle.checked = themeV4.layout?.animationsEnabled !== false;
        
        const animSpeed = themeV4.layout?.animationSpeed || 0.3;
        setVal('anim-speed-field', animSpeed);
        const animSpeedVal = document.getElementById('anim-speed-val');
        if (animSpeedVal) animSpeedVal.textContent = animSpeed;
        setVal('anim-hover-style-field', t.pc?.hover_style || 'lift');

        // Glassmorphism studio dials
        const gl = t.glass || {};
        const glGlobal = gl.enabled !== false;
        const glGlobalT = document.getElementById('glass-global-toggle');
        if (glGlobalT) glGlobalT.checked = glGlobal;

        setVal('glass-blur-field', gl.blur || '12');
        document.getElementById('glass-blur-val').textContent = gl.blur || '12';
        
        setVal('glass-bg-opacity-field', gl.bg_opacity || '0.12');
        document.getElementById('glass-bg-opacity-val').textContent = gl.bg_opacity || '0.12';
        
        setVal('glass-border-opacity-field', gl.border_opacity || '0.15');
        document.getElementById('glass-border-opacity-val').textContent = gl.border_opacity || '0.15';
        
        setVal('glass-shadow-intensity-field', gl.shadow_intensity || '1.0');
        document.getElementById('glass-shadow-intensity-val').textContent = gl.shadow_intensity || '1.0';
        
        setVal('glass-border-radius-field', gl.border_radius || '16');
        document.getElementById('glass-border-radius-val').textContent = gl.border_radius || '16';
        
        setVal('glass-brightness-field', gl.brightness || '1.0');
        document.getElementById('glass-brightness-val').textContent = gl.brightness || '1.0';
        
        setVal('glass-contrast-field', gl.contrast || '1.0');
        document.getElementById('glass-contrast-val').textContent = gl.contrast || '1.0';
        
        setVal('glass-hover-intensity-field', gl.hover_intensity || '1.1');
        document.getElementById('glass-hover-intensity-val').textContent = gl.hover_intensity || '1.1';

        // Specific glass checks
        const glCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val !== false; };
        glCheck('glass-header-toggle', gl.header_enabled);
        glCheck('glass-product-toggle', gl.product_card_enabled);
        glCheck('glass-modal-toggle', gl.modal_enabled);
        glCheck('glass-sidebar-toggle', gl.sidebar_enabled);
        glCheck('glass-footer-toggle', gl.footer_enabled);
        glCheck('glass-form-toggle', gl.form_enabled);
        glCheck('glass-hero-toggle', gl.hero_enabled);

        // Load custom CSS raw values
        setVal('custom-css-field', themeV4.customCss || '');

        // Sync colors checks inside compliance engine
        if (window.ContrastEngine && typeof window.ContrastEngine.updateScore === 'function') {
          window.ContrastEngine.updateScore();
        }

        // Boot live iframe storefront view update
        syncLivePreview();
      }
    } catch (err) {
      console.warn('Failed loading V4 visual customizer theme config', err);
    }
  }

  // Update image preview box of logo
  function updateLogoPreviewBox(url) {
    const box = document.getElementById('logo-preview-box');
    if (!box) return;
    if (url) {
      box.innerHTML = `<img src="${url}" style="max-height:80px; max-width:100%; object-fit:contain;">`;
    } else {
      box.innerHTML = `<span style="color:var(--studio-text-muted); font-size:12px;">No Logo Selected</span>`;
    }
  }

  // Core save routine
  async function saveV4ThemeSubmit() {
    const saveBtn = document.getElementById('save-settings-submit-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      const activePreset = document.querySelector('.preset-option-card.active')?.id?.replace('preset-', '') || 'velvet';
      const themePayload = {
        logo: document.getElementById('logo-field').value,
        customCss: document.getElementById('custom-css-field').value,
        meta: {
          activePresetId: activePreset,
          storeName: document.getElementById('brand-name-field').value.trim(),
          socialLinks: {
            whatsapp: document.getElementById('whatsapp-contact-field').value.trim()
          }
        },
        typography: {
          body: { family: document.getElementById('font-family-field').value },
          heading: { family: document.getElementById('font-family-field').value },
          scaleMultiplier: parseFloat(document.getElementById('font-scale-field').value) || 1.0
        },
        layout: {
          btnRadius: document.getElementById('button-style-field').value === 'sharp' ? 0 : (document.getElementById('button-style-field').value === 'pill' ? 30 : 10),
          cardRadius: parseInt(document.getElementById('card-radius-field').value, 10) || 14,
          shadowStrength: parseFloat(document.getElementById('card-shadow-field').value) || 1.0,
          mobileFontScale: parseFloat(document.getElementById('mobile-font-scale-field').value) || 0.9,
          animationsEnabled: document.getElementById('anim-enable-toggle').checked,
          animationSpeed: parseFloat(document.getElementById('anim-speed-field').value) || 0.3
        },
        theme: {
          hdr: {
            bg: document.getElementById('palette-bg-main').value,
            border: document.getElementById('primary-color-field').value,
            logo_text: document.getElementById('primary-color-field').value,
            nav_link_color: document.getElementById('palette-text-main').value,
            nav_link_hover: document.getElementById('secondary-color-field').value,
            nav_link_active: document.getElementById('secondary-color-field').value,
            icon_color: document.getElementById('palette-text-main').value,
            icon_hover: document.getElementById('secondary-color-field').value,
            sticky_bg: document.getElementById('palette-bg-main').value,
            sticky: document.getElementById('hdr-sticky-toggle').checked,
            announcement_active: document.getElementById('hdr-announcement-toggle').checked,
            announcement_bg: document.getElementById('hdr-announcement-bg').value,
            announcement_text: document.getElementById('hdr-announcement-text').value,
            mobile_height: parseInt(document.getElementById('mobile-header-height-field').value, 10) || 64
          },
          nav: {
            dropdown_bg: document.getElementById('palette-bg-surface').value,
            dropdown_border: document.getElementById('primary-color-field').value,
            dropdown_item_color: document.getElementById('palette-text-main').value,
            dropdown_item_hover_bg: 'rgba(255,255,255,0.05)',
            dropdown_item_hover_color: document.getElementById('primary-color-field').value,
            mobile_bg: document.getElementById('mobile-nav-bg-field').value,
            mobile_item: document.getElementById('palette-text-main').value
          },
          hero: {
            headline_color: document.getElementById('palette-text-main').value,
            subheadline_color: document.getElementById('palette-text-muted').value,
            cta_primary_bg: document.getElementById('palette-color-primary').value,
            cta_primary_text: document.getElementById('palette-bg-main').value,
            cta_primary_hover_bg: document.getElementById('palette-color-secondary').value,
            badge_text: document.getElementById('accent-color-field').value
          },
          pc: {
            bg: document.getElementById('palette-bg-surface').value,
            border: document.getElementById('primary-color-field').value,
            image_bg: document.getElementById('card-image-bg-field').value,
            name_color: document.getElementById('palette-text-main').value,
            category_color: document.getElementById('palette-text-muted').value,
            current_price_color: document.getElementById('palette-color-primary').value,
            original_price_color: document.getElementById('palette-text-muted').value,
            rating_color: document.getElementById('primary-color-field').value,
            btn_bg: document.getElementById('palette-color-primary').value,
            btn_text: document.getElementById('palette-bg-main').value,
            btn_hover_bg: document.getElementById('palette-color-secondary').value,
            stock_in_color: document.getElementById('palette-color-success').value,
            stock_out_color: document.getElementById('palette-color-error').value,
            hover_translate_y: parseInt(document.getElementById('card-hover-y-field').value, 10) || 6,
            hover_style: document.getElementById('anim-hover-style-field').value
          },
          pdp: {
            gallery_active_border: document.getElementById('pdp-gallery-border-field').value,
            specs_heading_color: document.getElementById('pdp-spec-heading-field').value,
            tab_active_color: document.getElementById('pdp-tab-active-field').value
          },
          btn: {
            primary_bg: document.getElementById('palette-color-primary').value,
            primary_hover_bg: document.getElementById('palette-color-secondary').value,
            font_weight: document.getElementById('button-weight-field').value,
            primary_shadow: document.getElementById('button-shadow-field').value === 'pronounced'
          },
          glass: {
            enabled: document.getElementById('glass-global-toggle').checked,
            blur: document.getElementById('glass-blur-field').value,
            bg_opacity: document.getElementById('glass-bg-opacity-field').value,
            border_opacity: document.getElementById('glass-border-opacity-field').value,
            shadow_intensity: document.getElementById('glass-shadow-intensity-field').value,
            border_radius: document.getElementById('glass-border-radius-field').value,
            brightness: document.getElementById('glass-brightness-field').value,
            contrast: document.getElementById('glass-contrast-field').value,
            hover_intensity: document.getElementById('glass-hover-intensity-field').value,
            header_enabled: document.getElementById('glass-header-toggle').checked,
            product_card_enabled: document.getElementById('glass-product-toggle').checked,
            modal_enabled: document.getElementById('glass-modal-toggle').checked,
            sidebar_enabled: document.getElementById('glass-sidebar-toggle').checked,
            footer_enabled: document.getElementById('glass-footer-toggle').checked,
            form_enabled: document.getElementById('glass-form-toggle').checked,
            hero_enabled: document.getElementById('glass-hero-toggle').checked
          }
        }
      };

      const res = await adminFetch('/api/site-settings/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(themePayload)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Appearance Studio settings saved successfully!', 'success');
        markClean();
        showSaveStatus(true, `Theme settings updated successfully.`);
        
        window.dispatchEvent(new CustomEvent('mz:theme-updated'));
        
        // Reload storefront preview iframe
        const iframe = document.getElementById('viewport-iframe');
        if (iframe) iframe.contentWindow.location.reload();
      } else {
        showSaveStatus(false, data.error || 'Failed to save styling configuration');
      }
    } catch (err) {
      showSaveStatus(false, err.message);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Theme Settings';
      }
    }
  }

  // Pre-built color preset options mapper
  window.applyThemePreset = function(presetId) {
    const presets = {
      velvet: {
        primary: '#D4A03A', secondary: '#E0A84A', accent: '#D4A03A',
        bg: '#0B0618', surface: '#171027', text: '#FFFFFF', muted: '#D8D8D8',
        btnBg: '#D4A03A', btnHover: '#211638'
      },
      royal: {
        primary: '#D4A03A', secondary: '#E0A84A', accent: '#D4A03A',
        bg: '#121212', surface: '#1E1E1E', text: '#F5F5F5', muted: '#AAAAAA',
        btnBg: '#D4A03A', btnHover: '#2A2A2A'
      },
      ivory: {
        primary: '#C9972E', secondary: '#B8860B', accent: '#C9972E',
        bg: '#F7F4EE', surface: '#FFFFFF', text: '#1A1A1A', muted: '#555555',
        btnBg: '#C9972E', btnHover: '#333333'
      },
      emerald: {
        primary: '#2ECC71', secondary: '#27AE60', accent: '#2ECC71',
        bg: '#081C15', surface: '#102820', text: '#E8F5E9', muted: '#90A4AE',
        btnBg: '#2ECC71', btnHover: '#0B1510'
      },
      corporate: {
        primary: '#38BDF8', secondary: '#0284C7', accent: '#38BDF8',
        bg: '#0F172A', surface: '#1E293B', text: '#F8FAFC', muted: '#94A3B8',
        btnBg: '#38BDF8', btnHover: '#0F172A'
      }
    };

    const p = presets[presetId];
    if (!p) return;

    // Apply color values and update pickers
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    set('primary-color-field', p.primary);
    set('secondary-color-field', p.secondary);
    set('accent-color-field', p.accent);
    set('palette-bg-main', p.bg);
    set('palette-bg-surface', p.surface);
    set('palette-text-main', p.text);
    set('palette-text-muted', p.muted);
    set('palette-color-primary', p.btnBg);
    set('palette-color-secondary', p.btnHover);

    document.querySelectorAll('.preset-option-card').forEach(c => c.classList.remove('active'));
    document.getElementById(`preset-${presetId}`)?.classList.add('active');

    markDirty();
    syncLivePreview();
    showToast(`Preset: ${presetId} layout applied! Click Save to publish.`, 'success');
  };

  // Live viewport frame syncing
  window.syncLivePreview = function() {
    const iframe = document.getElementById('viewport-iframe');
    if (!iframe || !iframe.contentWindow) return;

    // Generate style rules object representing local adjustments
    const t = {
      primaryColor: document.getElementById('primary-color-field').value,
      secondaryColor: document.getElementById('secondary-color-field').value,
      accentColor: document.getElementById('accent-color-field').value,
      fontFamily: document.getElementById('font-family-field').value,
      fontScale: parseFloat(document.getElementById('font-scale-field').value) || 1.0,
      btnRadius: document.getElementById('button-style-field').value === 'sharp' ? '0' : (document.getElementById('button-style-field').value === 'pill' ? '30px' : '8px'),
      btnShadow: document.getElementById('button-shadow-field').value === 'pronounced' ? '0 8px 24px rgba(0,0,0,0.15)' : 'none',
      btnWeight: document.getElementById('button-weight-field').value,
      cardRadius: (document.getElementById('card-radius-field').value) + 'px',
      cardShadow: document.getElementById('card-shadow-field').value,
      cardHoverY: '-' + (document.getElementById('card-hover-y-field').value) + 'px',
      cardImageBg: document.getElementById('card-image-bg-field').value,
      annBg: document.getElementById('hdr-announcement-bg').value,
      annColor: document.getElementById('hdr-announcement-text').value,
      bgMain: document.getElementById('palette-bg-main').value,
      bgSurface: document.getElementById('palette-bg-surface').value,
      textMain: document.getElementById('palette-text-main').value,
      textMuted: document.getElementById('palette-text-muted').value,
      colorSuccess: document.getElementById('palette-color-success').value,
      colorError: document.getElementById('palette-color-error').value,
      customCss: document.getElementById('custom-css-field').value,
      glassEnabled: document.getElementById('glass-global-toggle').checked,
      glassBlur: (document.getElementById('glass-blur-field').value) + 'px',
      glassOpacity: document.getElementById('glass-bg-opacity-field').value,
      glassBorderOpacity: document.getElementById('glass-border-opacity-field').value,
      glassShadow: document.getElementById('glass-shadow-intensity-field').value,
      glassRadius: (document.getElementById('glass-border-radius-field').value) + 'px',
      glassBrightness: document.getElementById('glass-brightness-field').value,
      glassContrast: document.getElementById('glass-contrast-field').value
    };

    // Inject temporary override rules style block into preview window iframe
    iframe.contentWindow.postMessage({ type: 'mz:sync-preview-theme', theme: t }, '*');
  };

  // Device orientation toggler
  window.setViewportDevice = function(device) {
    const iframe = document.getElementById('viewport-iframe');
    if (!iframe) return;

    document.querySelectorAll('.viewport-device-toggles .device-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-device-${device}`)?.classList.add('active');

    iframe.className = `viewport-iframe ${device}`;
  };

  // Preview path selector
  window.changeViewportRoute = function(route) {
    const iframe = document.getElementById('viewport-iframe');
    if (iframe) iframe.src = route;
  };

  window.handleBgMainChange = function() {
    markDirty();
    syncLivePreview();
    if (window.ContrastEngine && typeof window.ContrastEngine.updateScore === 'function') {
      window.ContrastEngine.updateScore();
    }
  };

  window.validateCustomCSS = function(cssText) {
    const status = document.getElementById('css-validation-status');
    if (!status) return;
    
    // Simplistic CSS syntax pattern validation
    const opened = (cssText.match(/\{/g) || []).length;
    const closed = (cssText.match(/\}/g) || []).length;
    
    if (opened !== closed) {
      status.textContent = '⚠ Unmatched Braces ({})';
      status.style.color = 'var(--studio-error)';
    } else {
      status.textContent = '✓ Syntax Valid';
      status.style.color = 'var(--studio-success)';
    }
    syncLivePreview();
  };

  // Initial bindings
  function initAppearanceModule() {
    const form = document.getElementById('homepage-builder-form');
    if (!form) return;

    loadV4ThemeSettings();

    // Media library hooks
    const selectLogo = document.getElementById('logo-select-btn');
    const clearLogo = document.getElementById('logo-remove-btn');
    if (selectLogo) {
      selectLogo.addEventListener('click', () => {
        if (window.MZMediaLibrary) {
          window.MZMediaLibrary.openPicker((asset) => {
            document.getElementById('logo-field').value = asset.url || '';
            updateLogoPreviewBox(asset.url);
            markDirty();
            syncLivePreview();
          });
        }
      });
    }
    if (clearLogo) {
      clearLogo.addEventListener('click', () => {
        document.getElementById('logo-field').value = '';
        updateLogoPreviewBox('');
        markDirty();
        syncLivePreview();
      });
    }

    // Attach submit listeners
    const saveBtn = document.getElementById('save-settings-submit-btn');
    if (saveBtn) {
      saveBtn.type = 'button';
      saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        saveV4ThemeSubmit();
      });
    }

    // Attach dirty checks to inputs
    form.querySelectorAll('input, select, textarea').forEach(el => {
      el.addEventListener('change', () => {
        markDirty();
        syncLivePreview();
      });
      el.addEventListener('input', () => {
        markDirty();
        syncLivePreview();
      });
    });

    // Switch to active query parameter tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab') || 'presets';
    const tabId = tabParam === 'custom-css' ? 'tab-css' : 'tab-' + tabParam;
    const btn = Array.from(document.querySelectorAll('.studio-tabs .studio-tab-btn')).find(b => b.getAttribute('onclick')?.includes(tabId));
    if (btn) {
      window.switchStudioTab({ currentTarget: btn }, tabId);
    } else {
      window.switchStudioTab(null, tabId);
    }
  }

  // Switch tabs inside panel
  window.switchStudioTab = function(e, tabId) {
    document.querySelectorAll('#homepage-builder-form .studio-tab-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    document.querySelectorAll('.studio-tabs .studio-tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const panel = document.getElementById(tabId);
    if (panel) panel.classList.add('active');
    
    if (e && e.currentTarget) {
      e.currentTarget.classList.add('active');
    } else {
      const btns = document.querySelectorAll('.studio-tabs .studio-tab-btn');
      btns.forEach(btn => {
        if (btn.getAttribute('onclick')?.includes(tabId)) {
          btn.classList.add('active');
        }
      });
    }

    const tabName = tabId.replace('tab-', '');
    const tabParam = tabName === 'css' ? 'custom-css' : tabName;
    
    // Update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabParam);
    window.history.replaceState({}, '', url.toString());

    // Update breadcrumbs and sidebar highlights dynamically
    if (typeof window.updateAdminBreadcrumbs === 'function') {
      const tabNames = {
        presets: 'Theme Presets',
        colors: 'Colors',
        typography: 'Typography',
        footer: 'Footer Settings',
        buttons: 'Buttons Layout',
        cards: 'Cards Layout',
        animations: 'Animations',
        glass: 'Glassmorphism',
        'custom-css': 'Custom CSS',
        header: 'Header Settings',
        products: 'Product Pages',
        mobile: 'Mobile Settings'
      };
      window.updateAdminBreadcrumbs('Appearance', tabNames[tabParam] || 'Theme Presets');
    }
    if (typeof window.syncSPASidebarActive === 'function') {
      window.syncSPASidebarActive();
    }
  };

  window.MZAppearanceStudio = {
    init: initAppearanceModule,
    syncLivePreview,
    markDirty,
    markClean
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppearanceModule);
  } else {
    initAppearanceModule();
  }
})();
