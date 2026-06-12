/**
 * MAGIZHVAGAM — Appearance Studio
 * Visual editors for homepage content, theme presets, and V4 settings sync.
 */
(function () {
  'use strict';

  let homepageV4 = null;
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
    if (!container) return;

    function render() {
      container.innerHTML = (items || []).map((item, index) => `
        <div class="visual-editor-card" data-index="${index}">
          <div class="visual-editor-card-header">
            <strong>Slide ${index + 1}</strong>
            <div class="visual-editor-card-actions">
              ${index > 0 ? `<button type="button" class="studio-btn studio-btn-secondary ve-move-up" data-i="${index}">↑</button>` : ''}
              ${index < items.length - 1 ? `<button type="button" class="studio-btn studio-btn-secondary ve-move-down" data-i="${index}">↓</button>` : ''}
              <button type="button" class="studio-btn studio-btn-danger ve-remove" data-i="${index}">Remove</button>
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
    if (!container) return;

    function render() {
      container.innerHTML = (items || []).map((item, index) => `
        <div class="visual-editor-card" data-index="${index}">
          <div class="visual-editor-card-header">
            <strong>Review ${index + 1}</strong>
            <button type="button" class="studio-btn studio-btn-danger ve-remove" data-i="${index}">Remove</button>
          </div>
          <div class="control-group"><label>Name</label><input type="text" class="studio-input ve-field" data-i="${index}" data-field="name" value="${escapeHtml(item.name || '')}"></div>
          <div class="control-group"><label>Review Text</label><textarea class="studio-input ve-field" data-i="${index}" data-field="text" rows="3">${escapeHtml(item.text || '')}</textarea></div>
          <div class="control-row">
            <div class="control-group"><label>Rating (1-5)</label><input type="number" min="1" max="5" class="studio-input ve-field" data-i="${index}" data-field="rating" value="${item.rating || 5}"></div>
            <div class="control-group"><label>Location / Occasion</label><input type="text" class="studio-input ve-field" data-i="${index}" data-field="location" value="${escapeHtml(item.location || item.occasion || '')}"></div>
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
    return { getItems: () => items };
  }

  /* ─── Homepage sections manager ─── */
  function renderSectionManager(sections) {
    const container = document.getElementById('homepage-sections-manager');
    if (!container || !sections) return;

    const sorted = [...sections].sort((a, b) => a.order - b.order);
    container.innerHTML = sorted.map((sec, idx) => `
      <div class="section-manager-row" data-id="${sec.id}">
        <label class="section-toggle">
          <input type="checkbox" class="section-enabled" data-id="${sec.id}" ${sec.enabled ? 'checked' : ''}>
          <span>${SECTION_LABELS[sec.id] || sec.id}</span>
        </label>
        <div class="section-order-btns">
          <button type="button" class="studio-btn studio-btn-secondary sec-up" data-i="${idx}" ${idx === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="studio-btn studio-btn-secondary sec-down" data-i="${idx}" ${idx === sorted.length - 1 ? 'disabled' : ''}>↓</button>
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
      console.warn('[appearance-studio] V4 homepage load failed:', err.message);
    }
  }

  // Load About page admin settings
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
        verified: t.verified !== false
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
      const v4Result = await saveV4Homepage();
      if (!v4Result.success) {
        showSaveStatus(false, v4Result.error || 'Failed to save homepage sections');
        return false;
      }

      // Save About page settings if present
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

      form.requestSubmit();
      markClean();
      showSaveStatus(true, `Saved successfully at ${new Date().toLocaleTimeString()}`);
      window.dispatchEvent(new CustomEvent('mz:theme-updated'));
      return true;
    } catch (err) {
      showSaveStatus(false, err.message);
      return false;
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

    loadV4Homepage();
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
