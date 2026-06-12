/**
 * MAGIZHVAGAM - Homepage Script
 * Dynamically binds banners, collections, best sellers, and testimonials from the setting endpoint
 */

document.addEventListener('DOMContentLoaded', () => {
  loadHomepageData();
});

async function loadHomepageV4Sections() {
  try {
    const res = await fetch('/api/site-settings/homepage');
    const json = await res.json();
    if (!json.success || !json.data?.sections) return false;

    const sections = [...json.data.sections].sort((a, b) => a.order - b.order);

    sections.forEach(sec => {
      const el = document.querySelector(`[data-mz-section="${sec.id}"]`);
      if (el) {
        el.style.display = sec.enabled ? '' : 'none';
        el.hidden = !sec.enabled;
      }
    });

    const heroSec = sections.find(s => s.id === 'hero');
    if (heroSec?.enabled && heroSec.config) {
      applyHeroSectionConfig(heroSec.config);
    }


    const testSec = sections.find(s => s.id === 'testimonials');
    if (testSec?.enabled && testSec.config?.items?.length) {
      renderTestimonialsV4(testSec.config.items);
    }

    const newsletterSec = sections.find(s => s.id === 'newsletter');
    if (newsletterSec?.enabled && newsletterSec.config) {
      renderNewsletterSection(newsletterSec.config);
    }

    return true;
  } catch (err) {
    console.warn('[home.js] V4 homepage sections unavailable, using legacy API');
    return false;
  }
}

function applyHeroSectionConfig(config) {
  const heroSection = document.querySelector('[data-mz-section="hero"]');
  if (!heroSection) return;

  const badge = heroSection.querySelector('.hero-badge');
  const headline = heroSection.querySelector('.hero-headline');
  const subtext = heroSection.querySelector('.hero-subtext');
  const ctas = heroSection.querySelectorAll('.hero-cta-action-row .btn');

  // Hide by default; show only when admin provides content
  if (badge) badge.style.display = 'none';
  if (headline) headline.style.display = 'none';
  if (subtext) subtext.style.display = 'none';
  const ctaRowDefault = heroSection.querySelector('.hero-cta-action-row');
  if (ctaRowDefault) ctaRowDefault.style.display = 'none';

  if (config.headline && headline) {
    headline.innerHTML = config.headline.replace(/\n/g, '<br>');
    headline.style.display = '';
  }
  if (config.subtext && subtext) {
    subtext.textContent = config.subtext;
    subtext.style.display = '';
  }
  if (config.badge && badge) {
    badge.textContent = config.badge;
    badge.style.display = '';
  }

  if (ctas[0] && config.cta1Label) {
    ctas[0].textContent = config.cta1Label;
    if (config.cta1Link) ctas[0].href = config.cta1Link;
  }
  if (ctas[1] && config.cta2Label) {
    ctas[1].textContent = config.cta2Label;
    if (config.cta2Link) ctas[1].href = config.cta2Link;
  }
  // Show CTA row only if at least one CTA has label
  if (ctas && ctas.length) {
    const anyLabel = Array.from(ctas).some(el => el && el.textContent && el.textContent.trim());
    const ctaRow = heroSection.querySelector('.hero-cta-action-row');
    if (ctaRow) ctaRow.style.display = anyLabel ? '' : 'none';
  }
  // Apply banner background to the bg-canvas if provided. If no banner image, keep floating cards visible.
  const banner = (config.banners && config.banners[0]) ? config.banners[0] : null;
  const bg = heroSection.querySelector('.bg-canvas');
  if (bg) {
    if (banner && banner.image) {
      bg.style.backgroundImage = `url('${banner.image}')`;
      bg.style.backgroundSize = 'cover';
      bg.style.backgroundPosition = 'center';
    } else {
      bg.style.backgroundImage = '';
    }
  }

  // If banner contains title/subtitle, prefer banner text over headline/subtext
  if (banner) {
    if (banner.title && headline) headline.innerHTML = banner.title.replace(/\n/g, '<br>');
    if (banner.subtitle && subtext) subtext.textContent = banner.subtitle;
  }
}

function renderNewsletterSection(config) {
  const section = document.querySelector('[data-mz-section="newsletter"]');
  if (!section) return;
  section.innerHTML = `
    <div class="newsletter-inner glass-panel" data-reveal>
      <h2>${config.heading || 'Stay in the Loop'}</h2>
      <p>${config.incentive || 'Subscribe for exclusive offers and gift inspiration.'}</p>
      <form class="newsletter-form" onsubmit="event.preventDefault(); if(window.showToast) showToast('Thank you for subscribing!', 'success');">
        <input type="email" required placeholder="${config.placeholder || 'Enter your email'}" aria-label="Email address">
        <button type="submit" class="btn btn-primary">${config.ctaLabel || 'Subscribe'}</button>
      </form>
    </div>
  `;
  section.style.display = '';
}

function renderTestimonialsV4(items) {
  const container = document.getElementById('testimonials-mount');
  if (!container || !items?.length) return;

  container.innerHTML = items.map(t => `
    <article class="testimonial-card glass-panel scroll-reveal" data-reveal>
      <div class="testimonial-stars">${'★'.repeat(Math.min(5, t.rating || 5))}</div>
      <blockquote>"${t.text || t.comment || ''}"</blockquote>
      <footer>
        <strong>${t.name || t.author || 'Customer'}</strong>
        ${t.location || t.occasion ? `<span>${t.location || t.occasion}</span>` : ''}
      </footer>
    </article>
  `).join('');
}



async function loadHomepageData() {
  try {
    const usedV4 = await loadHomepageV4Sections();
    const config = await window.fetchSettings();

    if (!config) {
      console.error('Failed to load homepage settings');
      if (usedV4) return;
      return;
    }

    const toggles = window.featureToggles || await window.fetchFeatureToggles();

    // 1. Load Hero Banners Slider
    renderHeroBanners(config.heroBanners);

    // 2. Load Highlights Categories
    renderCategoryHighlights(config.categoryHighlights);

    // 3. Load Dynamic Product Sections
    await loadProductSection(config.featuredProductIds, 'featured-products-mount');
    await loadProductSection(config.bestSellerProductIds, 'bestseller-products-grid');
    await loadProductSection(config.newArrivalProductIds, 'newarrival-products-grid');

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
      const intervalId = setInterval(() => {
        const now = new Date().getTime();
        if (targetDate.getTime() - now < 0) {
          flashEl.style.display = 'none';
          clearInterval(intervalId);
        } else {
          updateCountdown();
        }
      }, 1000);
    } else {
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

// 1. Hero Banners Renderer & Slider Logic
function renderHeroBanners(banners) {
  const container = document.getElementById('hero-slider-container');
  if (!container) return;

  // Do not render any default or demo slides. Only render when explicit banners are provided by admin.
  if (!banners || !Array.isArray(banners) || banners.length === 0) {
    container.innerHTML = '';
    return;
  }

  // Render slides strictly from provided banners without falling back to demo images
  const slides = banners.map((b, i) => ({
    image: (b.image || '').trim(),
    title: b.title || '',
    subtitle: b.subtitle || '',
    btnText: b.btnText || '',
    link: b.link || '#'
  })).filter(s => s.image);

  container.innerHTML = slides.map((slide, index) => `
    <div class="hero-slide ${index === 0 ? 'active' : ''}"
         style="background-image: url('${slide.image}'); background-size:cover; background-position:center; display:flex; align-items:center;">
      <div class="container hero-content">
        <h1>${slide.title}</h1>
        <p>${slide.subtitle}</p>
        ${slide.btnText ? `<a href="${slide.link}" class="btn btn-gold">${slide.btnText}</a>` : ''}
      </div>
    </div>
  `).join('');

  // Simple slider progression if multiple slides present
  let currentSlide = 0;
  const slideEls = container.querySelectorAll('.hero-slide');
  if (slideEls.length > 1) {
    setInterval(() => {
      slideEls[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slideEls.length;
      slideEls[currentSlide].classList.add('active');
    }, 5000);
  }
}


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
        <a href="/products.html?category=${cat.slug}" class="glass hover-lift category-card animated fadeInUp" style="border-radius:16px; overflow:hidden; display:block; padding:12px; text-align:center;">
          <div style="height:150px; border-radius:12px; overflow:hidden; margin-bottom:12px;">
            <img src="${cat.image || '/assets/images/default-category.webp'}" alt="${cat.name}" style="width:100%; height:100%; object-fit:cover;" loading="lazy" onerror="this.src='/assets/images/default-category.webp'">
          </div>
          <h4 style="font-family:'Outfit'; font-size:15px; font-weight:600; color:var(--text-color);">${cat.name}</h4>
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
    <div class="glass testimonial-card animated fadeInUp" style="padding:30px; border-radius:16px;">
      <div style="color:#D4AF37; margin-bottom:12px; font-size:16px;">${'★'.repeat(t.rating)}</div>
      <p style="font-style:italic; color:var(--text-muted); margin-bottom:20px; font-size:14px; line-height:1.6;">"${t.comment}"</p>
      <h5 style="font-family:'Outfit'; font-weight:600; font-size:14px; color:var(--text-color);">${t.author}</h5>
      <span style="font-size:11px; color:#D4AF37; font-weight:700; text-transform:uppercase;">Verified Purchase</span>
    </div>
  `).join('');
}
