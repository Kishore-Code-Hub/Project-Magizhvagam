/**
 * MAGIZHVAGAM V4 — Appearance Studio JS Controller
 * Handles visual customizer panels, WCAG contrast safety, 14 tabs bindings,
 * live preview iframe variables injection, and double-writes to legacy and V4 settings.
 */
(function () {
  'use strict';

  let homepageV4 = null;
  let themeV4 = null;
  let unsavedChanges = false;

  const SECTION_LABELS = {
    announcement_bar: 'Announcement Bar',
    hero: 'Hero',
    flash_sale: 'Flash Sale',
    featured_categories: 'Featured Categories',
    collections_spotlight: 'Collections Spotlight',
    featured_products: 'Featured Products',
    customization_preview: 'Customization Preview',
    testimonials: 'Testimonials',
    bulk_orders_cta: 'Bulk Orders CTA',
    how_it_works: 'How It Works',
    brand_story: 'Brand Story',
    faq: 'FAQ',
    newsletter: 'Newsletter',
    instagram: 'Instagram',
    blog_preview: 'Blog Preview'
  };

  function markDirty() {
    unsavedChanges = true;
    const indicator = document.getElementById('studio-unsaved-indicator');
    if (indicator) indicator.style.display = 'inline';
  }

  function markClean() {
    unsavedChanges = false;
    const indicator = document.getElementById('studio-unsaved-indicator');
    if (indicator) indicator.style.display = 'none';
  }

  window.addEventListener('beforeunload', (e) => {
    if (unsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function pickImage(callback) {
    if (window.MZMediaLibrary && window.MZMediaLibrary.openPicker) {
      window.MZMediaLibrary.openPicker(callback);
    } else {
      alert('Media Library is currently loading, please wait.');
    }
  }

  /* ─── Visual List Editor (hero banners, promo cards) ─── */
  function createListEditor(containerId, fields, items, onChange) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    function render() {
      container.innerHTML = (items || []).map((item, index) => `
        <div class="visual-editor-card" data-index="${index}">
          <div class="visual-editor-card-header">
            <strong>Slide ${index + 1}</strong>
            <div class="visual-editor-card-actions">
              ${index > 0 ? `<button type="button" class="studio-btn studio-btn-secondary ve-move-up" data-i="${index}" style="padding:4px 8px; font-size:10px;">↑</button>` : ''}
              ${index < items.length - 1 ? `<button type="button" class="studio-btn studio-btn-secondary ve-move-down" data-i="${index}" style="padding:4px 8px; font-size:10px;">↓</button>` : ''}
              <button type="button" class="studio-btn studio-btn-danger ve-remove" data-i="${index}" style="padding:4px 8px; font-size:10px;">Remove</button>
            </div>
          </div>
          <div class="visual-editor-preview">
            ${item.image ? `
              <div class="image-preview-wrapper" style="position:relative; margin-bottom:8px;">
                <img src="${item.image}" alt="Preview" style="width:100%; max-height:120px; object-fit:cover; border-radius:8px;">
                <div style="display:flex; gap:6px; margin-top:6px;">
                  <button type="button" class="studio-btn studio-btn-primary ve-pick-image" data-i="${index}" style="flex:1; padding:6px 10px; font-size:11px;">Replace Image</button>
                  <button type="button" class="studio-btn studio-btn-danger ve-remove-image" data-i="${index}" style="padding:6px 10px; font-size:11px;">Remove Image</button>
                </div>
              </div>
            ` : `
              <div class="visual-editor-no-image" style="background:var(--studio-input-bg); border:1px dashed var(--studio-border); border-radius:8px; padding:24px; color:var(--studio-text-muted); font-size:12px; margin-bottom:8px;">
                No image selected
              </div>
              <button type="button" class="studio-btn studio-btn-primary ve-pick-image" data-i="${index}" style="width:100%; padding:6px 10px; font-size:11px;">Upload / Select Image</button>
            `}
          </div>
          ${fields.map(f => `
            <div class="control-group">
              <label>${f.label}</label>
              <input type="${f.type || 'text'}" class="studio-input ve-field" data-i="${index}" data-field="${f.key}" value="${escapeHtml(item[f.key] || '')}" placeholder="${f.placeholder || ''}">
            </div>
          `).join('')}
        </div>
      `).join('') + `
        <button type="button" class="studio-btn studio-btn-secondary ve-add" style="width:100%; margin-top:8px;">+ Add Slide</button>
      `;

      container.querySelector('.ve-add')?.addEventListener('click', () => {
        items.push(fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), { image: '' }));
        markDirty();
        render();
        onChange(items);
      });

      container.querySelectorAll('.ve-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          items.splice(parseInt(btn.dataset.i, 10), 1);
          markDirty();
          render();
          onChange(items);
        });
      });

      container.querySelectorAll('.ve-move-up').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.i, 10);
          [items[i - 1], items[i]] = [items[i], items[i - 1]];
          markDirty();
          render();
          onChange(items);
        });
      });

      container.querySelectorAll('.ve-move-down').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.i, 10);
          [items[i], items[i + 1]] = [items[i + 1], items[i]];
          markDirty();
          render();
          onChange(items);
        });
      });

      container.querySelectorAll('.ve-pick-image').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.i, 10);
          pickImage((asset) => {
            items[i].image = asset.url;
            markDirty();
            render();
            onChange(items);
            if (typeof syncLivePreview === 'function') syncLivePreview();
          });
        });
      });

      container.querySelectorAll('.ve-remove-image').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.i, 10);
          items[i].image = '';
          markDirty();
          render();
          onChange(items);
          if (typeof syncLivePreview === 'function') syncLivePreview();
        });
      });

      container.querySelectorAll('.ve-field').forEach(input => {
        input.addEventListener('input', () => {
          const i = parseInt(input.dataset.i, 10);
          items[i][input.dataset.field] = input.value;
          markDirty();
          onChange(items);
          if (typeof syncLivePreview === 'function') syncLivePreview();
        });
      });
    }

    render();
    return { getItems: () => items, setItems: (next) => { items = next; render(); } };
  }

  /* ─── Testimonials visual editor ─── */
  function createTestimonialsEditor(containerId, items, onChange) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    function render() {
      container.innerHTML = (items || []).map((item, index) => `
        <div class="visual-editor-card" data-index="${index}">
          <div class="visual-editor-card-header">
            <strong>Review ${index + 1}</strong>
            <button type="button" class="studio-btn studio-btn-danger ve-remove" data-i="${index}" style="padding:4px 8px; font-size:10px;">Remove</button>
          </div>
          <div class="control-group"><label>Name</label><input type="text" class="studio-input ve-field" data-i="${index}" data-field="name" value="${escapeHtml(item.name || '')}"></div>
          <div class="control-group"><label>Review Text</label><textarea class="studio-input ve-field" data-i="${index}" data-field="text" rows="3">${escapeHtml(item.text || '')}</textarea></div>
          <div class="control-row" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <div class="control-group"><label>Rating (1-5)</label><input type="number" min="1" max="5" class="studio-input ve-field" data-i="${index}" data-field="rating" value="${item.rating || 5}"></div>
            <div class="control-group"><label>Location</label><input type="text" class="studio-input ve-field" data-i="${index}" data-field="location" value="${escapeHtml(item.location || item.occasion || '')}"></div>
          </div>
        </div>
      `).join('') + `<button type="button" class="studio-btn studio-btn-secondary ve-add" style="width:100%;">+ Add Testimonial</button>`;

      container.querySelector('.ve-add')?.addEventListener('click', () => {
        items.push({ name: '', text: '', rating: 5, verified: true });
        markDirty();
        render();
        onChange(items);
      });

      container.querySelectorAll('.ve-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          items.splice(parseInt(btn.dataset.i, 10), 1);
          markDirty();
          render();
          onChange(items);
        });
      });

      container.querySelectorAll('.ve-field').forEach(input => {
        input.addEventListener('input', () => {
          const i = parseInt(input.dataset.i, 10);
          items[i][input.dataset.field] = input.dataset.field === 'rating' ? parseInt(input.value, 10) : input.value;
          markDirty();
          onChange(items);
        });
      });
    }

    render();
    return { getItems: () => items, setItems: (next) => { items = next; render(); } };
  }

  /* ─── Homepage sections manager ─── */
  function renderSectionManager(sections) {
    const container = document.getElementById('homepage-sections-manager');
    if (!container || !sections) return;

    const sorted = [...sections].sort((a, b) => a.order - b.order);
    container.innerHTML = sorted.map((sec, idx) => `
      <div class="section-manager-row" data-id="${sec.id}">
        <label class="section-toggle" style="display:flex; align-items:center; gap:8px; cursor:pointer;">
          <input type="checkbox" class="section-enabled" data-id="${sec.id}" ${sec.enabled ? 'checked' : ''}>
          <span>${SECTION_LABELS[sec.id] || sec.id}</span>
        </label>
        <div class="section-order-btns">
          <button type="button" class="studio-btn studio-btn-secondary sec-up" data-i="${idx}" ${idx === 0 ? 'disabled' : ''} style="padding:4px 8px; font-size:10px;">↑</button>
          <button type="button" class="studio-btn studio-btn-secondary sec-down" data-i="${idx}" ${idx === sorted.length - 1 ? 'disabled' : ''} style="padding:4px 8px; font-size:10px;">↓</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.section-enabled').forEach(cb => {
      cb.addEventListener('change', () => {
        const sec = homepageV4.sections.find(s => s.id === cb.dataset.id);
        if (sec) sec.enabled = cb.checked;
        markDirty();
      });
    });

    container.querySelectorAll('.sec-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.i, 10);
        const a = sorted[i - 1];
        const b = sorted[i];
        const tmp = a.order;
        a.order = b.order;
        b.order = tmp;
        markDirty();
        renderSectionManager(homepageV4.sections);
      });
    });

    container.querySelectorAll('.sec-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.i, 10);
        const a = sorted[i];
        const b = sorted[i + 1];
        const tmp = a.order;
        a.order = b.order;
        b.order = tmp;
        markDirty();
        renderSectionManager(homepageV4.sections);
      });
    });
  }

  let heroEditor, promoEditor, testimonialsEditor;
  let heroItems = [];
  let promoItems = [];
  let testimonialItems = [];

  // Replaces the legacy admin.js loader to coordinate the 14 tabs bindings
  async function loadHomepageBuilderSettings() {
    const form = document.getElementById('homepage-builder-form');
    if (!form) return;

    try {
      // 1. Fetch site-settings (V4 Theme)
      const themeRes = await adminFetch('/api/site-settings/theme');
      const themeData = await themeRes.json();
      if (themeData.success && themeData.data) {
        themeV4 = themeData.data;

        // Colors values
        const t = themeV4.theme || {};
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

        // Presets check
        const activePreset = themeV4.meta?.activePresetId || 'velvet';
        document.querySelectorAll('.preset-option-card').forEach(c => c.classList.remove('active'));
        document.getElementById(`preset-${activePreset}`)?.classList.add('active');

        // Color pickers sync
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
        if (typeof window.updateLogoPreview === 'function') {
          window.updateLogoPreview(themeV4.logo || '');
        }
        setVal('whatsapp-contact-field', themeV4.meta?.socialLinks?.whatsapp || '919876543210');
        
        const stickyToggle = document.getElementById('hdr-sticky-toggle');
        if (stickyToggle) stickyToggle.checked = t.hdr?.sticky === true || t.hdr?.sticky === undefined;

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

        // Product details gallery
        setVal('pdp-gallery-border-field', t.pdp?.gallery_active_border || '#C9913D');
        setVal('pdp-spec-heading-field', t.pdp?.specs_heading_color || '#F5F0E8');
        setVal('pdp-tab-active-field', t.pdp?.tab_active_color || '#C9913D');

        // Category pages
        setVal('category-grid-gap-field', themeV4.layout?.gridGap || 24);
        setVal('category-grid-density-field', themeV4.layout?.gridDensity || '3');

        // Mobile settings
        const mFontScale = themeV4.layout?.mobileFontScale || 0.9;
        setVal('mobile-font-scale-field', mFontScale);
        const mFontScaleVal = document.getElementById('mobile-font-scale-val');
        if (mFontScaleVal) mFontScaleVal.textContent = mFontScale;
        setVal('mobile-header-height-field', t.hdr?.mobile_height || 64);
        setVal('mobile-nav-bg-field', t.nav?.mobile_bg || '#0D0A14');

        // Animations settings
        const animEnableToggle = document.getElementById('anim-enable-toggle');
        if (animEnableToggle) animEnableToggle.checked = themeV4.layout?.animationsEnabled !== false;
        
        const animSpeed = themeV4.layout?.animationSpeed || 0.3;
        setVal('anim-speed-field', animSpeed);
        const animSpeedVal = document.getElementById('anim-speed-val');
        if (animSpeedVal) animSpeedVal.textContent = animSpeed;
        setVal('anim-hover-style-field', t.pc?.hover_style || 'lift');

        // Custom CSS
        setVal('custom-css-field', themeV4.customCss || '');
        if (typeof window.validateCustomCSS === 'function') {
          window.validateCustomCSS(themeV4.customCss || '');
        }

        // Sync inputs adjacent to color pickers
        document.querySelectorAll('.color-picker-wrapper').forEach(wrapper => {
          const picker = wrapper.querySelector('input[type="color"]');
          const textInput = wrapper.querySelector('input[type="text"]');
          if (picker && textInput) textInput.value = picker.value.toUpperCase();
        });
      }

      // 2. Fetch homepage settings (Legacy values and slider images)
      const homeRes = await adminFetch('/api/settings/homepage');
      const homeData = await homeRes.json();
      if (homeData.success && homeData.setting) {
        const setting = homeData.setting;

        // Footer & Social
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        setVal('footer-content-field', setting.footerContent || '');
        setVal('footer-copyright-field', setting.footerCopyright || '© 2026 MAGIZHVAGAM. All rights reserved.');
        setVal('footer-instagram-field', setting.footerInstagram || '');
        setVal('footer-facebook-field', setting.footerFacebook || '');
        setVal('footer-twitter-field', setting.footerTwitter || '');
        setVal('footer-whatsapp-field', setting.footerWhatsapp || '');

        // Curated Products
        setVal('featured-product-ids', (setting.featuredProductIds || []).join(', '));
        setVal('bestseller-product-ids', (setting.bestSellerProductIds || []).join(', '));
        setVal('newarrival-product-ids', (setting.newArrivalProductIds || []).join(', '));
      }

      // 3. Load sections, sliders, and testimonials
      await loadV4Homepage();

      // Trigger contrast compliance check
      if (typeof window.updateContrastLock === 'function') {
        window.updateContrastLock();
      }
      if (typeof window.syncLivePreview === 'function') {
        window.syncLivePreview();
      }

    } catch (err) {
      console.error('Failed loading Appearance Studio values:', err);
      showToast('Error loading appearance configuration', 'error');
    }
  }

  async function loadV4Homepage() {
    try {
      const res = await adminFetch('/api/site-settings/homepage');
      const data = await res.json();
      if (data.success && data.data) {
        homepageV4 = data.data;
        renderSectionManager(homepageV4.sections);

        const heroSec = homepageV4.sections.find(s => s.id === 'hero');
        heroItems = (heroSec && heroSec.config && heroSec.config.banners) ? [...heroSec.config.banners] : [];

        const promoSec = homepageV4.sections.find(s => s.id === 'collections_spotlight');
        promoItems = (promoSec && promoSec.config && promoSec.config.promoCards) ? [...promoSec.config.promoCards] : [];

        const testSec = homepageV4.sections.find(s => s.id === 'testimonials');
        testimonialItems = (testSec && testSec.config && testSec.config.items) ? [...testSec.config.items] : [];

        heroEditor = createListEditor('hero-banners-visual', [
          { key: 'title', label: 'Headline' },
          { key: 'subtitle', label: 'Subheadline' },
          { key: 'link', label: 'Link URL', placeholder: '/products.html' }
        ], heroItems, (items) => { heroItems = items; });

        promoEditor = createListEditor('promo-banners-visual', [
          { key: 'title', label: 'Title' },
          { key: 'subtitle', label: 'Subtitle' },
          { key: 'link', label: 'Link URL' }
        ], promoItems, (items) => { promoItems = items; });

        testimonialsEditor = createTestimonialsEditor('testimonials-visual', testimonialItems, (items) => {
          testimonialItems = items;
        });
      }
    } catch (err) {
      console.warn('V4 homepage modules failed to load:', err.message);
    }
  }

  // Load About page settings
  async function loadAboutSettings() {
    try {
      const res = await adminFetch('/api/about-page');
      const json = await res.json();
      if (!json.success || !json.data) return;
      const d = json.data;
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
      set('about-story-heading-field', d.storyHeading);
      set('about-story-intro-field', d.storyIntro);
      set('about-left-heading-field', d.leftHeading);
      set('about-left-p1-field', d.leftParagraph1);
      set('about-left-p2-field', d.leftParagraph2);
      set('about-image-field', d.image);
      const preview = document.getElementById('about-image-preview');
      if (preview) {
        if (d.image) preview.innerHTML = `<img src="${d.image}" style="width:100%; height:100%; object-fit:cover;">`;
        else preview.innerHTML = `<span style="color:var(--studio-text-muted);">No image selected</span>`;
      }
    } catch (err) {
      console.warn('Failed to load about settings', err);
    }
  }

  async function saveV4Homepage() {
    if (!homepageV4) return { success: true };

    const heroSec = homepageV4.sections.find(s => s.id === 'hero');
    if (heroSec) {
      heroSec.config = heroSec.config || {};
      heroSec.config.banners = heroItems;
    }

    let promoSec = homepageV4.sections.find(s => s.id === 'collections_spotlight');
    if (!promoSec) {
      promoSec = { id: 'collections_spotlight', enabled: true, order: 4, config: {} };
      homepageV4.sections.push(promoSec);
    }
    promoSec.config.promoCards = promoItems;

    const testSec = homepageV4.sections.find(s => s.id === 'testimonials');
    if (testSec) {
      testSec.config = testSec.config || {};
      testSec.config.items = testimonialItems;
    }

    const res = await adminFetch('/api/site-settings/homepage', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(homepageV4)
    });
    return res.json();
  }

  function syncLegacyFromVisual() {
    const heroField = document.getElementById('hero-banners-json');
    const promoField = document.getElementById('promo-banners-json');
    const testField = document.getElementById('testimonials-json');

    if (heroField) {
      heroField.value = JSON.stringify(heroItems.map(b => ({
        image: b.image,
        title: b.title,
        subtitle: b.subtitle,
        link: b.link || '/products.html'
      })), null, 2);
    }
    if (promoField) {
      promoField.value = JSON.stringify(promoItems.map(p => ({
        image: p.image,
        title: p.title,
        subtitle: p.subtitle,
        link: p.link || '/products.html'
      })), null, 2);
    }
    if (testField) {
      testField.value = JSON.stringify(testimonialItems.map(t => ({
        name: t.name,
        text: t.text,
        rating: t.rating || 5,
        verified: t.verified !== false,
        location: t.location || '',
        occasion: t.occasion || ''
      })), null, 2);
    }
  }

  function showSaveStatus(success, message) {
    const el = document.getElementById('studio-save-status');
    if (!el) return;
    el.textContent = message;
    el.className = 'studio-save-status ' + (success ? 'success' : 'error');
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
  }

  async function saveAllSettingsEnhanced(form) {
    syncLegacyFromVisual();

    if (typeof window.getContrastRatio === 'function') {
      const bgHex = document.getElementById('palette-bg-main')?.value;
      const textHex = document.getElementById('palette-text-main')?.value;
      if (bgHex && textHex) {
        const ratio = window.getContrastRatio(bgHex, textHex);
        if (ratio < 4.5) {
          if (typeof showToast === 'function') {
            showToast(`Warning: low contrast ratio (${ratio.toFixed(1)}:1). Saving anyway.`, 'warning');
          }
        }
      }
    }

    const saveBtn = document.getElementById('save-settings-submit-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      // 1. Save V4 homepage sections
      const v4Result = await saveV4Homepage();
      if (!v4Result.success) {
        showSaveStatus(false, v4Result.error || 'Failed to save homepage sections');
        return false;
      }

      // 2. Save About page settings
      try {
        const aboutPayload = {
          storyHeading: document.getElementById('about-story-heading-field')?.value || '',
          storyIntro: document.getElementById('about-story-intro-field')?.value || '',
          leftHeading: document.getElementById('about-left-heading-field')?.value || '',
          leftParagraph1: document.getElementById('about-left-p1-field')?.value || '',
          leftParagraph2: document.getElementById('about-left-p2-field')?.value || '',
          image: document.getElementById('about-image-field')?.value || ''
        };
        await adminFetch('/api/about-page', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(aboutPayload)
        });
      } catch (err) {
        console.warn('Failed to save about page', err);
      }

      // 3. Save V4 Theme styling
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
          gridGap: parseInt(document.getElementById('category-grid-gap-field').value, 10) || 24,
          gridDensity: document.getElementById('category-grid-density-field').value,
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
          }
        }
      };

      await adminFetch('/api/site-settings/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(themePayload)
      });

      // 4. Save legacy settings
      const legacyPayload = {
        whatsappContact: document.getElementById('whatsapp-contact-field').value.trim(),
        brandName: document.getElementById('brand-name-field').value.trim(),
        logo: document.getElementById('logo-field').value.trim(),
        primaryColor: document.getElementById('primary-color-field').value,
        secondaryColor: document.getElementById('secondary-color-field').value,
        accentColor: document.getElementById('accent-color-field').value,
        fontFamily: document.getElementById('font-family-field').value,
        buttonStyle: document.getElementById('button-style-field').value,
        footerContent: document.getElementById('footer-content-field').value.trim(),
        footerCopyright: document.getElementById('footer-copyright-field').value.trim(),
        footerInstagram: document.getElementById('footer-instagram-field').value.trim(),
        footerFacebook: document.getElementById('footer-facebook-field').value.trim(),
        footerTwitter: document.getElementById('footer-twitter-field').value.trim(),
        footerWhatsapp: document.getElementById('footer-whatsapp-field').value.trim(),

        paletteBgMain: document.getElementById('palette-bg-main').value,
        paletteBgSurface: document.getElementById('palette-bg-surface').value,
        paletteTextMain: document.getElementById('palette-text-main').value,
        paletteTextMuted: document.getElementById('palette-text-muted').value,
        paletteColorPrimary: document.getElementById('palette-color-primary').value,
        paletteColorSecondary: document.getElementById('palette-color-secondary').value,
        paletteColorSuccess: document.getElementById('palette-color-success').value,
        paletteColorError: document.getElementById('palette-color-error').value,

        heroBanners: heroItems,
        promotionalBanners: promoItems,
        featuredProductIds: document.getElementById('featured-product-ids').value.split(',').map(s => s.trim()).filter(Boolean),
        bestSellerProductIds: document.getElementById('bestseller-product-ids').value.split(',').map(s => s.trim()).filter(Boolean),
        newArrivalProductIds: document.getElementById('newarrival-product-ids').value.split(',').map(s => s.trim()).filter(Boolean),
        testimonials: testimonialItems
      };

      const saveRes = await adminFetch('/api/settings/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: legacyPayload })
      });
      const saveData = await saveRes.json();
      if (saveData.success) {
        showToast('All Appearance Studio settings saved successfully!', 'success');
        markClean();
        showSaveStatus(true, `Saved successfully at ${new Date().toLocaleTimeString()}`);
        
        // Broadcast theme update event to trigger reload in local storage cache
        window.dispatchEvent(new CustomEvent('mz:theme-updated'));
        
        // Reload preview frame to display new styles
        const iframe = document.getElementById('viewport-iframe');
        if (iframe) iframe.contentWindow.location.reload();
      } else {
        showSaveStatus(false, saveData.error || 'Failed to save settings');
      }

    } catch (err) {
      showSaveStatus(false, err.message);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save All Settings';
      }
    }
  }

  function initAppearanceStudio() {
    const form = document.getElementById('homepage-builder-form');
    if (!form) return;

    loadHomepageBuilderSettings();
    loadAboutSettings();

    const saveBtn = document.getElementById('save-settings-submit-btn');
    if (saveBtn) {
      saveBtn.type = 'button';
      saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        saveAllSettingsEnhanced(form);
      });
    }

    form.querySelectorAll('input, select, textarea').forEach(el => {
      el.addEventListener('change', markDirty);
      el.addEventListener('input', markDirty);
    });

    // About page image picker integration
    const aboutPick = document.getElementById('about-pick-image');
    const aboutClear = document.getElementById('about-clear-image');
    if (aboutPick) aboutPick.addEventListener('click', () => {
      pickImage((asset) => {
        document.getElementById('about-image-field').value = asset.url || '';
        const preview = document.getElementById('about-image-preview');
        if (preview) preview.innerHTML = `<img src="${asset.url}" style="width:100%; height:100%; object-fit:cover;">`;
        markDirty();
      });
    });
    if (aboutClear) aboutClear.addEventListener('click', () => {
      document.getElementById('about-image-field').value = '';
      const preview = document.getElementById('about-image-preview');
      if (preview) preview.innerHTML = `<span style="color:var(--studio-text-muted);">No image selected</span>`;
      markDirty();
    });
  }

  window.loadHomepageBuilderSettings = loadHomepageBuilderSettings;

  window.MZAppearanceStudio = {
    init: initAppearanceStudio,
    loadV4Homepage,
    saveV4Homepage,
    syncLegacyFromVisual,
    markDirty,
    markClean
  };

  document.addEventListener('DOMContentLoaded', initAppearanceStudio);
})();
