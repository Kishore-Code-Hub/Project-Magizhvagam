/**
 * MAGIZHVAGAM — Store Enhancement System
 * Phase 5: Product Experience | Phase 6: Auth & Profile
 * Phase 7: Admin Panel | Phase 8: Marketing | Phase 9: Performance
 * Phase 10: Final QA
 * 
 * This file extends existing functionality without duplicating features.
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 9 — SKELETON LOADING SYSTEM
  // ═══════════════════════════════════════════════════════════════════════

  window.MZSkeleton = {
    /** Generate skeleton placeholder cards for product grids */
    productGrid(containerId, count = 8) {
      const container = document.getElementById(containerId);
      if (!container) return;
      const cards = Array.from({ length: count }, () => `
        <div class="skeleton skeleton-card" style="border-radius:var(--layout-card-radius,14px);overflow:hidden;">
          <div class="skeleton skeleton-image" style="height:200px;border-radius:0;"></div>
          <div style="padding:16px;">
            <div class="skeleton skeleton-text" style="width:75%;height:14px;margin-bottom:8px;border-radius:4px;"></div>
            <div class="skeleton skeleton-text-sm" style="width:50%;height:12px;margin-bottom:12px;border-radius:4px;"></div>
            <div class="skeleton skeleton-text" style="width:35%;height:16px;border-radius:4px;"></div>
          </div>
        </div>
      `).join('');
      container.innerHTML = cards;
    },

    /** Generate skeleton for category grid */
    categoryGrid(containerId, count = 4) {
      const container = document.getElementById(containerId);
      if (!container) return;
      const cards = Array.from({ length: count }, () => `
        <div class="skeleton skeleton-card" style="height:220px;border-radius:16px;"></div>
      `).join('');
      container.innerHTML = cards;
    },

    /** Generate skeleton for testimonials */
    testimonials(containerId, count = 3) {
      const container = document.getElementById(containerId);
      if (!container) return;
      const cards = Array.from({ length: count }, () => `
        <div class="skeleton" style="height:250px;border-radius:var(--layout-card-radius,14px);"></div>
      `).join('');
      container.innerHTML = cards;
    },

    /** Remove skeleton from container */
    remove(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.querySelectorAll('.skeleton').forEach(el => el.remove());
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 9 — LAZY LOADING (IntersectionObserver)
  // ═══════════════════════════════════════════════════════════════════════

  window.MZLazyLoad = {
    /** Initialize lazy loading for images with data-src attribute */
    init() {
      if (!('IntersectionObserver' in window)) {
        // Fallback: load all images immediately
        document.querySelectorAll('img[data-src]').forEach(img => {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        });
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              img.classList.add('lazy-loaded');
            }
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '200px 0px' });

      document.querySelectorAll('img[data-src]').forEach(img => {
        img.classList.add('lazy');
        observer.observe(img);
      });
    },

    /** Observe a section and call callback when it enters viewport */
    observeSection(element, callback) {
      if (!element || !callback) return;
      if (!('IntersectionObserver' in window)) {
        callback();
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            callback();
            observer.unobserve(element);
          }
        });
      }, { rootMargin: '100px 0px' });

      observer.observe(element);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 9 — SIMPLE CACHE SYSTEM
  // ═══════════════════════════════════════════════════════════════════════

  window.MZCache = {
    _store: new Map(),
    _ttl: new Map(),

    set(key, value, ttlMs = 300000) { // 5 min default
      this._store.set(key, value);
      this._ttl.set(key, Date.now() + ttlMs);
    },

    get(key) {
      if (!this._store.has(key)) return null;
      if (Date.now() > this._ttl.get(key)) {
        this._store.delete(key);
        this._ttl.delete(key);
        return null;
      }
      return this._store.get(key);
    },

    has(key) {
      return this.get(key) !== null;
    },

    clear() {
      this._store.clear();
      this._ttl.clear();
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 9 — ERROR HANDLING SYSTEM
  // ═══════════════════════════════════════════════════════════════════════

  window.MZError = {
    /** Show an empty state for a container */
    showEmptyState(containerId, config = {}) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const {
        type = 'generic',
        title = 'Nothing here yet',
        message = 'Check back later for updates.',
        ctaLabel = '',
        ctaHref = '',
        ctaOnClick = ''
      } = config;

      // Select SVG based on type
      let svgContent = '';
      if (type === 'wishlist') {
        svgContent = `
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 10px rgba(201,145,61,0.25)); margin-bottom: 16px;">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        `;
      } else if (type === 'search') {
        svgContent = `
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 10px rgba(201,145,61,0.25)); margin-bottom: 16px;">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14" stroke-opacity="0.6"></line>
            <line x1="8" y1="11" x2="14" y2="11" stroke-opacity="0.6"></line>
          </svg>
        `;
      } else if (type === 'recently_viewed') {
        svgContent = `
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 10px rgba(201,145,61,0.25)); margin-bottom: 16px;">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
            <path d="M12 2a10 10 0 1 0 10 10" stroke-dasharray="3 3" stroke-opacity="0.5"></path>
          </svg>
        `;
      } else if (type === 'category') {
        svgContent = `
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 10px rgba(201,145,61,0.25)); margin-bottom: 16px;">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7" stroke-width="2" stroke-linecap="round"></line>
          </svg>
        `;
      } else {
        svgContent = `
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="url(#goldGradient)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 10px rgba(201,145,61,0.25)); margin-bottom: 16px;">
            <polyline points="21 8 21 21 3 21 3 8"></polyline>
            <rect x="1" y="3" width="22" height="5" rx="1"></rect>
            <line x1="12" y1="3" x2="12" y2="21"></line>
            <path d="M12 3a3 3 0 0 0-3-3 3 3 0 0 0 3 3z"></path>
            <path d="M12 3a3 3 0 0 1 3-3 3 3 0 0 1-3 3z"></path>
          </svg>
        `;
      }

      // Check if button onClick vs href is provided
      let ctaHtml = '';
      if (ctaLabel) {
        if (ctaOnClick) {
          const clickHandler = typeof ctaOnClick === 'function' ? `(${ctaOnClick.toString()})()` : ctaOnClick;
          ctaHtml = `<button onclick="${clickHandler}" class="btn btn-primary hover-lift" style="border-radius:10px; margin-top: 10px; padding: 10px 24px; font-weight: 700; font-family: 'Outfit'; font-size: 13px;">${ctaLabel}</button>`;
        } else if (ctaHref) {
          ctaHtml = `<a href="${ctaHref}" class="btn btn-primary hover-lift" style="border-radius:10px; display: inline-block; text-decoration: none; margin-top: 10px; padding: 10px 24px; font-weight: 700; font-family: 'Outfit'; font-size: 13px;">${ctaLabel}</a>`;
        }
      }

      container.innerHTML = `
        <div class="glass animated scale-in" style="text-align:center; padding:50px 30px; max-width:480px; margin:20px auto; border-radius:16px; border:1px solid var(--card-border); background: var(--card-bg); box-shadow: var(--shadow-md);">
          <div style="display:inline-block; position:relative;">
            <svg style="position:absolute; width:0; height:0;">
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#C9913D" />
                  <stop offset="100%" stop-color="#E0A84A" />
                </linearGradient>
              </defs>
            </svg>
            ${svgContent}
          </div>
          <h3 style="font-family:'Outfit',sans-serif; font-size:20px; font-weight:700; color:var(--text-color,#F5F0E8); margin-bottom:10px; margin-top: 10px;">${title}</h3>
          <p style="font-family:'DM Sans',sans-serif; font-size:14px; color:var(--text-muted,#7A6E8A); line-height:1.6; margin-bottom:20px; max-width: 380px; margin-left: auto; margin-right: auto;">${message}</p>
          ${ctaHtml}
        </div>
      `;
    },

    /** Show error state with retry */
    showErrorState(containerId, config = {}) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const {
        title = 'Something went wrong',
        message = 'We couldn\'t load this section. Please try again.',
        retryFn = null
      } = config;

      container.innerHTML = `
        <div style="text-align:center;padding:60px 20px;max-width:400px;margin:0 auto;">
          <div style="font-size:48px;margin-bottom:16px;color:var(--color-error,#C0392B);">⚠️</div>
          <h3 style="font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;color:var(--text-color,#F5F0E8);margin-bottom:8px;">${title}</h3>
          <p style="font-size:14px;color:var(--text-muted,#7A6E8A);line-height:1.5;margin-bottom:20px;">${message}</p>
          ${retryFn ? `<button onclick="(${retryFn.toString()})()" class="btn btn-secondary" style="border-radius:10px;">Try Again</button>` : ''}
        </div>
      `;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 5 — RECENTLY VIEWED PRODUCTS
  // ═══════════════════════════════════════════════════════════════════════

  window.MZRecentlyViewed = {
    KEY: 'mz_recently_viewed',
    MAX: 12,

    add(productId) {
      if (!productId) return;
      try {
        let items = JSON.parse(localStorage.getItem(this.KEY) || '[]');
        items = items.filter(id => id !== productId);
        items.unshift(productId);
        if (items.length > this.MAX) items = items.slice(0, this.MAX);
        localStorage.setItem(this.KEY, JSON.stringify(items));
      } catch(e) { /* ignore */ }
    },

    get() {
      try {
        return JSON.parse(localStorage.getItem(this.KEY) || '[]');
      } catch(e) { return []; }
    },

    clear() {
      localStorage.removeItem(this.KEY);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 5 — PRODUCT SHARING
  // ═══════════════════════════════════════════════════════════════════════

  window.MZShare = {
    async shareProduct(product) {
      const url = window.location.href;
      const title = product?.name || document.title;
      const text = product?.description || `Check out ${title} on Magizhvagam!`;

      if (navigator.share) {
        try {
          await navigator.share({ title, text, url });
          return;
        } catch(e) { /* user cancelled or not supported */ }
      }

      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        if (window.showToast) window.showToast('Link copied to clipboard!', 'success');
      } catch(e) {
        // Final fallback
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        if (window.showToast) window.showToast('Link copied!', 'success');
      }
    },

    shareToWhatsApp(productName, url) {
      const text = encodeURIComponent(`Check out ${productName} on Magizhvagam!\n${url || window.location.href}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    },

    shareToFacebook(url) {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url || window.location.href)}`, '_blank');
    },

    shareToTwitter(text, url) {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url || window.location.href)}`, '_blank');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 5 — PRODUCT COMPARISON (Save for Later)
  // ═══════════════════════════════════════════════════════════════════════

  window.MZSaveForLater = {
    KEY: 'mz_save_for_later',

    add(productId) {
      if (!productId) return;
      try {
        let items = JSON.parse(localStorage.getItem(this.KEY) || '[]');
        if (!items.includes(productId)) {
          items.push(productId);
          localStorage.setItem(this.KEY, JSON.stringify(items));
          if (window.showToast) window.showToast('Saved for later!', 'success');
        }
      } catch(e) { /* ignore */ }
    },

    remove(productId) {
      try {
        let items = JSON.parse(localStorage.getItem(this.KEY) || '[]');
        items = items.filter(id => id !== productId);
        localStorage.setItem(this.KEY, JSON.stringify(items));
      } catch(e) { /* ignore */ }
    },

    get() {
      try {
        return JSON.parse(localStorage.getItem(this.KEY) || '[]');
      } catch(e) { return []; }
    },

    has(productId) {
      return this.get().includes(productId);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 10 — SCROLL REVEAL ANIMATION SYSTEM
  // ═══════════════════════════════════════════════════════════════════════

  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('[data-reveal], .scroll-reveal').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  // Add revealed style
  const revealStyle = document.createElement('style');
  revealStyle.textContent = `
    .revealed {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(revealStyle);

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 10 — CONSOLE ERROR SUPPRESSION (Production)
  // ═══════════════════════════════════════════════════════════════════════

  // Already handled in app.js — this just catches any remaining warnings
  window.addEventListener('unhandledrejection', function(event) {
    // Silently catch unhandled promise rejections in production
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      event.preventDefault();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════

  function initEnhancements() {
    // Init lazy loading
    MZLazyLoad.init();

    // Init scroll reveal animations
    initScrollReveal();

    // Show skeleton loaders for homepage grids (will be replaced when data loads)
    const catMount = document.getElementById('category-highlights-mount');
    const featMount = document.getElementById('featured-products-mount');
    const testMount = document.getElementById('testimonials-mount');
    
    if (catMount && !catMount.children.length) MZSkeleton.categoryGrid('category-highlights-mount', 4);
    if (featMount && !featMount.children.length) MZSkeleton.productGrid('featured-products-mount', 8);
    if (testMount && !testMount.children.length) MZSkeleton.testimonials('testimonials-mount', 3);

    // Track recently viewed on product detail pages
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (productId && window.location.pathname.includes('product-details')) {
      MZRecentlyViewed.add(productId);
    }
  }

  // Wait for DOM then initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancements);
  } else {
    initEnhancements();
  }

  // Re-run lazy load after dynamic content loads
  window.addEventListener('load', () => {
    setTimeout(() => MZLazyLoad.init(), 500);
  });

})();
