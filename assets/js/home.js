/**
 * MAGIZHVAGAM - Homepage Script
 * Dynamically binds banners, collections, best sellers, and testimonials from the setting endpoint
 */

document.addEventListener('DOMContentLoaded', () => {
  loadHomepageData();
  initProductTicker();
});

async function initProductTicker() {
  const track = document.getElementById('infinite-ticker-track');
  const g1 = document.getElementById('ticker-group-1');
  const g2 = document.getElementById('ticker-group-2');
  if (!track || !g1 || !g2) return;
  
  try {
    const res = await fetch('/api/products?limit=30');
    const data = await res.json();
    if (data.success && data.products && data.products.length > 0) {
      const list = data.products;
      
      // Calculate how many items needed to fill viewport width with buffer
      const viewportWidth = window.innerWidth;
      const itemWidth = viewportWidth <= 768 ? 216 : 256; // min-width + gap
      const itemsNeededForScreen = Math.ceil(viewportWidth / itemWidth) + 2;
      const minItems = Math.max(itemsNeededForScreen * 3, 30);
      
      // Duplicate products until we have enough for seamless infinite scroll
      let tickerList = [...list];
      while (tickerList.length < minItems) {
        tickerList = [...tickerList, ...list];
      }
      
      const buildItemHTML = (p) => `
        <a href="/product/${p._id}" class="ticker-item" aria-label="${p.name}">
          <img src="${p.images && p.images[0] ? p.images[0].url : '/assets/images/default-product.webp'}" 
               alt="${p.name}" width="44" height="44" 
               style="width:44px;height:44px;border-radius:8px;object-fit:cover;flex-shrink:0;" 
               loading="lazy"
               onerror="this.src='/assets/images/default-product.webp'">
          <div style="display:flex;flex-direction:column;text-align:left;overflow:hidden;">
            <span style="font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;color:var(--text-color,#F5F0E8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;">${p.name}</span>
            <span style="font-size:11px;color:var(--color-brand-primary,#C9913D);font-weight:700;">${window.formatPrice ? window.formatPrice(p.price) : '₹' + p.price}</span>
          </div>
        </a>`;
      
      const html = tickerList.map(buildItemHTML).join('');
      
      g1.innerHTML = html;
      g2.innerHTML = html;
      
      // Dynamically set animation duration based on content width for smooth speed
      requestAnimationFrame(() => {
        const groupWidth = g1.scrollWidth;
        if (groupWidth > 0) {
          // Speed: ~50px per second for smooth scrolling
          const duration = Math.max(groupWidth / 50, 20);
          track.style.animationDuration = duration + 's';
          track.style.animation = `ticker-scroll-infinite ${duration}s linear infinite`;
        }
      });
      
      // Touch support for mobile swipe
      let touchStartX = 0;
      let touchDelta = 0;
      const section = track.closest('.infinite-product-ticker-section');
      
      if (section) {
        section.addEventListener('touchstart', (e) => {
          touchStartX = e.touches[0].clientX;
          track.style.animationPlayState = 'paused';
        }, { passive: true });
        
        section.addEventListener('touchmove', (e) => {
          touchDelta = e.touches[0].clientX - touchStartX;
        }, { passive: true });
        
        section.addEventListener('touchend', () => {
          // Resume animation after touch
          setTimeout(() => {
            track.style.animationPlayState = 'running';
          }, 1500);
          touchDelta = 0;
        }, { passive: true });
      }
      
    } else {
      const section = track.closest('.infinite-product-ticker-section');
      if (section) section.style.display = 'none';
    }
  } catch (err) {
    console.error('Error initializing product ticker:', err);
    const section = track.closest('.infinite-product-ticker-section');
    if (section) section.style.display = 'none';
  }
}

// Configurable hero slide interval (ms)
const HERO_SLIDE_INTERVAL = 5000;

async function loadHomepageV4Sections() {
  try {
    const res = await fetch('/api/site-settings/homepage');
    if (res.status !== 200) {
      console.log('[HERO] API failed, fallback retained');
      return false;
    }
    const json = await res.json();
    if (!json.success || !json.data?.sections) {
      console.log('[HERO] API failed, fallback retained');
      return false;
    }

    console.log('[HERO] API loaded successfully');

    const sections = [...json.data.sections].sort((a, b) => a.order - b.order);

    sections.forEach(sec => {
      const el = document.querySelector(`[data-mz-section="${sec.id}"]`);
      if (el) {
        // Under no circumstances do we hide the hero content card
        if (sec.id !== 'hero') {
          el.style.display = sec.enabled ? '' : 'none';
          el.hidden = !sec.enabled;
        }
      }
    });

    const heroSec = sections.find(s => s.id === 'hero');
    if (heroSec?.enabled && heroSec.config) {
      applyHeroSectionConfig(heroSec.config);
    }
    return true;
  } catch (err) {
    console.warn('[home.js] V4 homepage sections unavailable');
    console.log('[HERO] API failed, fallback retained');
    return false;
  }
}

function applyHeroSectionConfig(config) {
  const heroSection = document.querySelector('[data-mz-section="hero"]');
  if (!heroSection) return;

  const card = heroSection.querySelector('.hero-content-card');
  if (card) {
    card.style.display = '';
    card.hidden = false;
  }

  const badge = heroSection.querySelector('.hero-badge') || heroSection.querySelector('.hero-badge-tag');
  const headline = heroSection.querySelector('.hero-headline');
  const subtext = heroSection.querySelector('.hero-subtext');
  const ctas = heroSection.querySelectorAll('.hero-cta-action-row .btn');
  const bg = heroSection.querySelector('.bg-canvas');

  // 1. Update badge text
  if (config.badge && badge) {
    badge.textContent = config.badge;
  }

  // 2. Update CTA buttons
  if (ctas[0] && config.cta1Label) {
    ctas[0].textContent = config.cta1Label;
    if (config.cta1Link) ctas[0].href = config.cta1Link;
  }
  if (ctas[1] && config.cta2Label) {
    ctas[1].textContent = config.cta2Label;
    if (config.cta2Link) ctas[1].href = config.cta2Link;
  }

  // 3. Update top-level background image
  if (bg && config.backgroundImage) {
    bg.style.backgroundImage = `url('${config.backgroundImage}')`;
    bg.style.backgroundSize = 'cover';
    bg.style.backgroundPosition = 'center';
  }

  // 4. Update texts if top-level fields are provided
  if (config.headline && headline) {
    headline.textContent = config.headline;
  }
  if (config.subtext && subtext) {
    subtext.textContent = config.subtext;
  }

  // 5. Handle banners array (single or multiple slides)
  if (config.banners && Array.isArray(config.banners) && config.banners.length > 0) {
    const slides = config.banners.filter(s => s.image);
    if (slides.length > 0) {
      let currentIdx = 0;

      const updateSlide = (idx) => {
        const s = slides[idx];
        if (!s) return;

        if (bg && s.image) {
          bg.style.backgroundImage = `url('${s.image}')`;
          bg.style.backgroundSize = 'cover';
          bg.style.backgroundPosition = 'center';
        }

        // Slide title/subtitle priority, falling back to top-level, then fallback DOM text
        if (headline) {
          headline.textContent = s.title || config.headline || headline.textContent;
        }
        if (subtext) {
          subtext.textContent = s.subtitle || config.subtext || subtext.textContent;
        }

        const btnText = s.btnText || s.ctaLabel;
        if (btnText && ctas[0]) {
          ctas[0].textContent = btnText;
          if (s.link || s.ctaLink) ctas[0].href = s.link || s.ctaLink;
        }
      };

      // Apply initial slide immediately
      updateSlide(0);

      // Rotate if there are multiple slides
      if (slides.length > 1) {
        if (window.mzHeroSliderTimer) {
          clearInterval(window.mzHeroSliderTimer);
        }
        window.mzHeroSliderTimer = setInterval(() => {
          currentIdx = (currentIdx + 1) % slides.length;
          updateSlide(currentIdx);
        }, HERO_SLIDE_INTERVAL);
      }
    }
  }
}




async function loadHomepageData() {
  try {
    console.log('[HERO] Using fallback content');
    const usedV4 = await loadHomepageV4Sections();
    // Do NOT hide static hero card. Keep fallback content visible at all times.

    const config = await window.fetchSettings();

    if (!config) {
      console.error('Failed to load homepage settings');
      if (usedV4) return;
      return;
    }

    const toggles = window.featureToggles || await window.fetchFeatureToggles();

    // Defensive: ensure legacy cached homepage settings do not override V4 rendering
    try { localStorage.removeItem('mz-homepage-settings'); } catch (e) { /* ignore */ }

    // 2. Load Highlights Categories
    renderCategoryHighlights(config.categoryHighlights);

    // 3. Load Dynamic Product Sections using IntersectionObserver for lazy-loading (Performance)
    const lazySections = [
      { ids: config.featuredProductIds, elementId: 'featured-products-mount' },
      { ids: config.bestSellerProductIds, elementId: 'bestseller-products-grid' },
      { ids: config.newArrivalProductIds, elementId: 'newarrival-products-grid' }
    ];

    if ('IntersectionObserver' in window) {
      lazySections.forEach(sec => {
        const grid = document.getElementById(sec.elementId);
        if (!grid) return;
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              loadProductSection(sec.ids, sec.elementId);
              observer.unobserve(grid);
            }
          });
        }, { rootMargin: '200px 0px' });
        observer.observe(grid);
      });
    } else {
      await loadProductSection(config.featuredProductIds, 'featured-products-mount');
      await loadProductSection(config.bestSellerProductIds, 'bestseller-products-grid');
      await loadProductSection(config.newArrivalProductIds, 'newarrival-products-grid');
    }


    // 4. Load Promotional Banners & Countdown Timer
    const promosEnabled = (toggles && toggles.promosEnabled !== false);
    if (promosEnabled) {
      renderPromotionalBanners(config.promotionalBanners);
    } else {
      const promoContainer = document.getElementById('promotional-banners-container');
      if (promoContainer) promoContainer.style.cssText = 'display: none !important;';
    }

    const flashSaleActive = (toggles && toggles.flashSaleActive === true);
    let flashEl = document.getElementById('flash-sale-timer-section');

    if (flashSaleActive && toggles.flashSaleTargetDate) {
      const targetDate = new Date(toggles.flashSaleTargetDate);
      const flashSaleText = toggles.flashSaleText || "Flash Sale Ending Soon!";

      if (!flashEl) {
        flashEl = document.createElement('div');
        flashEl.id = 'flash-sale-timer-section';
        flashEl.className = 'container flash-sale-timer-section glass animated scale-in';

        const categoriesSec = document.getElementById('categories');
        if (categoriesSec) {
          categoriesSec.parentNode.insertBefore(flashEl, categoriesSec);
        }
      }

      flashEl.style.display = 'flex'; // Ensure visible

      const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = targetDate.getTime() - now;
        if (distance < 0) {
          flashEl.style.display = 'none';
          return;
        }
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        flashEl.innerHTML = `
          <div class="countdown-info-block">
            <span class="countdown-icon">⚡</span>
            <div class="countdown-text">
              <h4 class="countdown-heading">${flashSaleText}</h4>
              <p class="countdown-subtext">Get flat 15% off on all eco-friendly return gifts.</p>
            </div>
          </div>
          <div class="countdown-digits-container">
            <div class="cd-digit-block">${String(hours).padStart(2, '0')}h</div>
            <div class="cd-digit-block">${String(minutes).padStart(2, '0')}m</div>
            <div class="cd-digit-block">${String(seconds).padStart(2, '0')}s</div>
          </div>
        `;
      };

      updateCountdown();
      if (window.mzHomepageCountdownInterval) {
        clearInterval(window.mzHomepageCountdownInterval);
      }
      window.mzHomepageCountdownInterval = setInterval(() => {
        const now = new Date().getTime();
        if (targetDate.getTime() - now < 0) {
          flashEl.style.display = 'none';
          clearInterval(window.mzHomepageCountdownInterval);
          window.mzHomepageCountdownInterval = null;
        } else {
          updateCountdown();
        }
      }, 1000);
    } else {
      if (window.mzHomepageCountdownInterval) {
        clearInterval(window.mzHomepageCountdownInterval);
        window.mzHomepageCountdownInterval = null;
      }
      if (flashEl) {
        flashEl.style.display = 'none';
      }
    }

    // 5. Load Customer Testimonials
    renderTestimonials(config.testimonials);

  } catch (error) {
    console.error('Error loading homepage:', error);
    if (typeof showToast === 'function') {
      showToast('Failed to load some homepage sections. Please try refreshing.', 'error');
    }
  }
}

// renderHeroBanners removed in favor of single source of truth applyHeroSectionConfig


// 2. Category Highlights Renderer
async function renderCategoryHighlights(catIds) {
  const container = document.getElementById('category-highlights-mount');
  if (!container) return;

  try {
    const res = await fetch('/api/products/categories');
    const data = await res.json();
    if (data.success) {
      let filtered = data.categories;
      if (catIds && catIds.length > 0) {
        const ids = catIds.map(id => id.toString());
        const catMap = new Map(data.categories.map(c => [c._id.toString(), c]));
        filtered = ids.map(id => catMap.get(id)).filter(c => !!c);
      }

      if (filtered.length === 0) {
        filtered = data.categories.slice(0, 4);
      }

      container.innerHTML = filtered.map(cat => `
        <a href="/products.html?category=${cat.slug}" class="glass-panel category-card hover-lift shine-sweep-container animated fadeInUp" style="border-radius:16px; overflow:hidden; display:block; padding:20px; transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
          <div class="category-img-wrapper" style="border-radius:12px; overflow:hidden; margin-bottom:12px; aspect-ratio:1/1;">
            <img src="${cat.image || '/assets/images/default-category.webp'}" alt="${cat.name}" loading="lazy" style="width:100%; height:100%; object-fit:cover; transition:transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);" onerror="this.src='/assets/images/default-category.webp'">
          </div>
          <h4 style="font-family:'Outfit'; font-size:16px; margin:0; text-align:center; color:var(--text-color);">${cat.name}</h4>
        </a>
      `).join('');
    }
  } catch (err) {
    console.error('Error rendering category highlights:', err);
    if (typeof showToast === 'function' && !hasShownHomeErrorToast) {
      showToast('Failed to load categories. Please check your connection.', 'error');
      hasShownHomeErrorToast = true;
    }
    container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-muted);">No categories available.</p>';
  }
}

// 3. Dynamic Products Grid Loader
let wideCatalogPromise = null;
let hasShownHomeErrorToast = false;

function fetchWideCatalog() {
  if (!wideCatalogPromise) {
    wideCatalogPromise = fetch('/api/products?limit=50')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch wide catalog');
        return res.json();
      })
      .catch(err => {
        wideCatalogPromise = null; // Clear from cache so retry is possible
        throw err;
      });
  }
  return wideCatalogPromise;
}

async function loadProductSection(productIds, elementId) {
  const grid = document.getElementById(elementId);
  if (!grid) return;

  try {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:30px;"><div class="spinner" style="margin:auto;"></div></div>';

    let products = [];

    // Feature D: If loading featured products, check the live database attribute first
    const toggles = window.featureToggles || await window.fetchFeatureToggles();
    const isFeaturedLayoutEnabled = !(toggles && toggles.homepageLayoutFeatured === false);
    if (elementId === 'featured-products-mount' && isFeaturedLayoutEnabled) {
      try {
        const res = await fetch('/api/products?isFeatured=true&limit=4');
        const data = await res.json();
        if (data.success && data.products && data.products.length > 0) {
          products = data.products;
        }
      } catch (err) {
        console.error('Failed to fetch featured products by live attribute:', err);
      }
    }

    // Fallback/standard flow if not featured or if live query returned no products
    if (products.length === 0 && productIds && productIds.length > 0) {
      const url = `/api/products?ids=${productIds.map(id => id.toString()).join(',')}&limit=${productIds.length}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        products = data.products || [];

        // If we queried specific IDs, let's keep the order defined in productIds
        if (products.length > 0) {
          const idMap = new Map(products.map(p => [p._id.toString(), p]));
          products = productIds
            .map(id => idMap.get(id.toString()))
            .filter(p => !!p);
        }
      }
    }

    const HOME_FALLBACK_PRODUCTS = [
      {
        _id: 'fb-1',
        name: 'Thanjavur Brass Art Plate',
        description: 'Authentic handcrafted brass metal art plate featuring detailed traditional relief work.',
        price: 1850,
        discountPrice: null,
        images: [{ url: '/assets/images/luxury_return_gifts.png' }, { url: '/assets/images/default-product.webp' }],
        stock: 25,
        averageRating: 4.9,
        totalReviews: 42,
        tags: ['featured', 'bestseller']
      },
      {
        _id: 'fb-2',
        name: 'Kancheepuram Silk Gifting Hamper',
        description: 'Luxury velvet box adorned with traditional silk borders, sweet pack, and organic honey.',
        price: 750,
        discountPrice: 650,
        images: [{ url: '/assets/images/celebration_hampers.png' }, { url: '/assets/images/default-product.webp' }],
        stock: 120,
        averageRating: 4.8,
        totalReviews: 28,
        tags: ['new', 'bestseller']
      },
      {
        _id: 'fb-3',
        name: 'Premium Brass Vilakku (Pair)',
        description: 'Elegant set of two traditional brass pillar diyas topped with peacock motifs.',
        price: 1400,
        discountPrice: 1250,
        images: [{ url: '/assets/images/premium_return_gifts.png' }, { url: '/assets/images/default-product.webp' }],
        stock: 50,
        averageRating: 4.7,
        totalReviews: 31,
        tags: ['featured']
      },
      {
        _id: 'fb-4',
        name: 'Eco-Friendly Jute Bag Set',
        description: 'Sustainable hand-stitched jute bags with elegant tree-of-life golden prints.',
        price: 180,
        discountPrice: null,
        images: [{ url: '/assets/images/corporate_gifts.png' }, { url: '/assets/images/default-product.webp' }],
        stock: 350,
        averageRating: 4.6,
        totalReviews: 19,
        tags: ['eco-friendly']
      },
      {
        _id: 'fb-6',
        name: 'Hand-Carved Rosewood Elephant',
        description: 'Premium miniature elephant figurine meticulously carved from dark rosewood.',
        price: 1650,
        discountPrice: 1500,
        images: [{ url: '/assets/images/luxury_return_gifts.png' }, { url: '/assets/images/default-product.webp' }],
        stock: 15,
        averageRating: 4.9,
        totalReviews: 54,
        tags: ['featured', 'bestseller']
      },
      {
        _id: 'fb-8',
        name: 'Silver Plated Kumkum Box',
        description: 'Chased silver-plated traditional box, perfect for housewarming return gifts.',
        price: 400,
        discountPrice: 350,
        images: [{ url: '/assets/images/corporate_gifts.png' }, { url: '/assets/images/default-product.webp' }],
        stock: 80,
        averageRating: 4.7,
        totalReviews: 23,
        tags: ['featured']
      },
      {
        _id: 'fb-9',
        name: 'Sandalwood Engraved Keyring Set',
        description: 'Aromatic pure sandalwood plaques engraved with customized guest names.',
        price: 150,
        discountPrice: 120,
        images: [{ url: '/assets/images/luxury_return_gifts.png' }, { url: '/assets/images/default-product.webp' }],
        stock: 1000,
        averageRating: 4.9,
        totalReviews: 112,
        tags: ['bestseller']
      },
      {
        _id: 'fb-12',
        name: 'Vibrant Corporate Gift Basket',
        description: 'Custom assortment box filled with nuts, brass utility box, and greeting cards.',
        price: 950,
        discountPrice: null,
        images: [{ url: '/assets/images/corporate_gifts.png' }, { url: '/assets/images/default-product.webp' }],
        stock: 75,
        averageRating: 4.8,
        totalReviews: 16,
        tags: ['new']
      }
    ];

    // Fallback: If no products were returned from the specified IDs (or if no IDs were provided), run unified cached query
    if (products.length === 0) {
      try {
        const fallbackData = await fetchWideCatalog();
        if (fallbackData.success && fallbackData.products && fallbackData.products.length > 0) {
          const catalog = fallbackData.products || [];
          if (elementId.includes('featured')) {
            products = catalog.slice(0, 4);
          } else if (elementId.includes('bestseller')) {
            products = catalog.filter(p => p.tags && (p.tags.includes('bestseller') || p.tags.includes('best-seller'))).slice(0, 4);
            if (products.length === 0) products = catalog.slice(4, 8);
          } else if (elementId.includes('newarrival')) {
            products = catalog.slice(0, 4);
          }
        }
      } catch (err) {
        console.warn('Could not load wide catalog from backend, using inline fallback.');
      }
    }

    if (products.length === 0) {
      // Use local fallback products sliced by section
      if (elementId.includes('featured')) {
        products = HOME_FALLBACK_PRODUCTS.slice(0, 4);
      } else if (elementId.includes('bestseller')) {
        products = HOME_FALLBACK_PRODUCTS.filter(p => p.tags.includes('bestseller')).slice(0, 4);
      } else {
        products = HOME_FALLBACK_PRODUCTS.slice(4, 8);
      }
    }

    grid.innerHTML = products.map(p => createProductCardHTML(p)).join('');
  } catch (err) {
    console.error(`Error loading section ${elementId}:`, err);
    // Use fallback products on error
    const fallbackList = HOME_FALLBACK_PRODUCTS.slice(0, 4);
    grid.innerHTML = fallbackList.map(p => createProductCardHTML(p)).join('');
  }
}

// 4. Promo Banners Renderer
function renderPromotionalBanners(promos) {
  const container = document.getElementById('promotional-banners-container');
  if (!container) return;

  if (!promos || promos.length === 0) {
    container.innerHTML = '';
    return;
  }

  // Only render promotional banners that have an explicit image provided by admin
  const validPromos = (promos || []).filter(p => p && p.image);
  container.innerHTML = validPromos.map(promo => `
    <div class="glass hover-lift promo-banner animated fadeInUp" style="border-radius:16px; overflow:hidden; position:relative; height:200px; background:linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url('${promo.image}') no-repeat center center/cover; display:flex; align-items:flex-end; padding:24px; color:white;">
      <div>
        <h3 style="font-size:20px; font-family:'Outfit'; margin-bottom:12px; line-height:1.3;">${promo.title || ''}</h3>
        ${promo.link ? `<a href="${promo.link}" class="btn btn-gold" style="padding:6px 16px; font-size:12px; border-radius:4px;">Shop Now</a>` : ''}
      </div>
    </div>
  `).join('');
}

// 5. Testimonials Renderer
function renderTestimonials(testimonials) {
  const container = document.getElementById('testimonials-container');
  if (!container || !testimonials || testimonials.length === 0) return;

  container.innerHTML = testimonials.map(t => `
    <div class="glass testimonial-card animated fadeInUp" style="padding:30px; border-radius:16px; transition: transform 0.4s ease, box-shadow 0.4s ease;">
      <div style="color:#D4AF37; margin-bottom:12px; font-size:16px;">${'★'.repeat(t.rating)}</div>
      <p style="font-style:italic; color:var(--text-muted); margin-bottom:20px; font-size:14px; line-height:1.6;">"${t.comment}"</p>
      <h5 style="font-family:'Outfit'; font-weight:600; font-size:14px; color:var(--text-color);">${t.author}</h5>
      <span style="font-size:11px; color:#D4AF37; font-weight:700; text-transform:uppercase;">Verified Purchase</span>
    </div>
  `).join('');

  // Apply hover effects on testimonial cards
  document.querySelectorAll('.testimonial-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-6px) scale(1.01)';
      card.style.boxShadow = '0 12px 24px rgba(106, 13, 173, 0.08)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) scale(1)';
      card.style.boxShadow = 'none';
    });
  });
}

// 6. Premium Homepage Motion Effects

function animateHeroText() {
  const heroSection = document.querySelector('[data-mz-section="hero"]');
  if (!heroSection) return;

  const headline = heroSection.querySelector('.hero-headline');
  const subtext = heroSection.querySelector('.hero-subtext');
  const badge = heroSection.querySelector('.hero-badge') || heroSection.querySelector('.hero-badge-tag');
  const ctas = heroSection.querySelectorAll('.hero-cta-action-row .btn');

  if (!headline) return;

  // Manual split text into words wrapped in overflow hidden containers
  const words = headline.textContent.trim().split(/\s+/);
  headline.innerHTML = words.map(w => `
    <span class="hero-word-wrapper" style="display:inline-block; overflow:hidden; vertical-align:bottom;">
      <span class="hero-word" style="display:inline-block; transform:translateY(100%); opacity:0;">${w}</span>
    </span>
  `).join(' ');

  // Add .btn-interactive for magnetic cursor hover actions
  ctas.forEach(btn => {
    btn.classList.add('btn-interactive');
    // Micro click bounce interaction
    btn.addEventListener('mousedown', () => {
      gsap.to(btn, { scale: 0.95, duration: 0.1 });
    });
    btn.addEventListener('mouseup', () => {
      gsap.to(btn, { scale: 1, duration: 0.2, ease: 'power2.out' });
    });
  });

  // Re-run magnetic listener binding if MZMotionSystem is ready
  if (window.MZMotionSystem?.initMotionSystem) {
    // Re-bind magnetic hooks to dynamically modified CTAs
    setTimeout(() => {
      const magneticElements = document.querySelectorAll('.btn-interactive');
      magneticElements.forEach(el => {
        if (el.getAttribute('data-magnetic-bound')) return;
        el.setAttribute('data-magnetic-bound', 'true');
        el.addEventListener('mousemove', (e) => {
          const rect = el.getBoundingClientRect();
          const elX = rect.left + rect.width / 2;
          const elY = rect.top + rect.height / 2;
          const disX = e.clientX - elX;
          const disY = e.clientY - elY;
          gsap.to(el, { x: disX * 0.35, y: disY * 0.35, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
        });
        el.addEventListener('mouseleave', () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
        });
      });
    }, 50);
  }

  // Animation timeline
  const tl = gsap.timeline();
  if (badge) {
    tl.fromTo(badge, { opacity: 0, scale: 0.8, y: -20 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.7)' });
  }
  tl.to(headline.querySelectorAll('.hero-word'), {
    y: '0%',
    opacity: 1,
    duration: 0.8,
    stagger: 0.08,
    ease: 'power3.out'
  }, '-=0.3');

  if (subtext) {
    tl.fromTo(subtext, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4');
  }

  if (ctas.length > 0) {
    tl.fromTo(ctas, { opacity: 0, scale: 0.9, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'back.out(1.2)' }, '-=0.3');
  }
}

function initHeroParallax() {
  const heroSection = document.querySelector('.hero-parallax-viewport');
  const bg = heroSection?.querySelector('.bg-canvas');
  if (!heroSection || !bg) return;

  heroSection.addEventListener('mousemove', (e) => {
    const { width, height } = heroSection.getBoundingClientRect();
    const xVal = (e.clientX - width / 2) / (width / 2);
    const yVal = (e.clientY - height / 2) / (height / 2);

    gsap.to(bg, {
      x: xVal * 25,
      y: yVal * 25,
      rotation: xVal * 1,
      duration: 1.2,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  }, { passive: true });

  heroSection.addEventListener('mouseleave', () => {
    gsap.to(bg, {
      x: 0,
      y: 0,
      rotation: 0,
      duration: 1.6,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  });
}

function injectHeroDecorations() {
  const heroSection = document.querySelector('.hero-parallax-viewport');
  if (!heroSection) return;

  const decoration1 = document.createElement('div');
  decoration1.className = 'float-decorative float-delay-1';
  decoration1.style.cssText = 'position:absolute; top:20%; left:6%; width:44px; height:44px; border-radius:50%; background:radial-gradient(circle, rgba(201,145,61,0.18) 0%, rgba(201,145,61,0) 70%); border:1.5px solid rgba(201,145,61,0.25); pointer-events:none; z-index:2;';

  const decoration2 = document.createElement('div');
  decoration2.className = 'float-decorative float-delay-2';
  decoration2.style.cssText = 'position:absolute; bottom:25%; right:8%; width:64px; height:64px; border-radius:50%; background:radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0) 70%); border:1.5px solid rgba(139,92,246,0.25); pointer-events:none; z-index:2;';

  heroSection.appendChild(decoration1);
  heroSection.appendChild(decoration2);
}

function initStatsCounters() {
  const statsSection = document.querySelector('.home-stats-wrapper');
  if (!statsSection) return;

  const numbers = statsSection.querySelectorAll('.stat-number');
  if (!numbers.length) return;

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.from(numbers, {
      scrollTrigger: {
        trigger: statsSection,
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      duration: 1.8,
      ease: 'power2.out',
      onStart: () => {
        numbers.forEach(el => {
          const target = parseInt(el.getAttribute('data-target') || '0', 10);
          let current = 0;
          const suffix = target >= 1000 ? '+' : '%';
          const interval = setInterval(() => {
            current += Math.ceil(target / 40);
            if (current >= target) {
              current = target;
              clearInterval(interval);
            }
            // Format 15000 as 15k+ or similar, or full format
            el.textContent = current.toLocaleString() + suffix;
          }, 35);
        });
      }
    });
  }
}

function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');
    const icon = item.querySelector('.faq-icon');

    if (!trigger || !content) return;

    trigger.addEventListener('click', () => {
      const isOpen = content.style.display === 'block';

      // Close all other faq sections
      document.querySelectorAll('.faq-content').forEach(c => {
        c.style.display = 'none';
        const itemIcon = c.closest('.faq-item')?.querySelector('.faq-icon');
        if (itemIcon) itemIcon.style.transform = 'rotate(0deg)';
      });

      if (!isOpen) {
        content.style.display = 'block';
        if (icon) icon.style.transform = 'rotate(45deg)';
        gsap.fromTo(content, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
      } else {
        content.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(0deg)';
      }
    });
  });
}

function initTimelineReveal() {
  const timeline = document.querySelector('.brand-story-timeline');
  if (!timeline) return;

  const items = timeline.querySelectorAll('.timeline-item');
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.fromTo(items, 
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: timeline,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    );
  }
}

// Call premium features on load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    animateHeroText();
    initHeroParallax();
    injectHeroDecorations();
    initStatsCounters();
    initFaqAccordion();
    initTimelineReveal();
  }, 100);
});

