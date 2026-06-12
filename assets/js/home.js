/**
 * MAGIZHVAGAM - Homepage Script
 * Dynamically binds banners, collections, best sellers, and testimonials from the setting endpoint
 */

document.addEventListener('DOMContentLoaded', () => {
  loadHomepageData();
});



async function loadHomepageData() {
  try {
    const config = await window.fetchSettings();

    if (!config) {
      console.error('Failed to load homepage settings');
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
        flashEl.className = 'container glass animated scale-in';
        flashEl.style.cssText = 'padding: 20px 30px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, rgba(106, 13, 173, 0.1), rgba(255, 79, 129, 0.1)); border: 1px solid var(--card-border); border-radius: 16px; flex-wrap: wrap; gap: 15px;';

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
          flashEl.style.cssText = 'display: none !important;';
          return;
        }
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        flashEl.innerHTML = `
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-size:24px;">⚡</span>
            <div>
              <h4 style="font-family:'Outfit'; font-size:16px; font-weight:700; color:var(--text-color); margin:0;">${flashSaleText}</h4>
              <p style="font-size:12px; color:var(--text-muted); margin:0;">Get flat 15% off on all eco-friendly return gifts.</p>
            </div>
          </div>
          <div style="display:flex; gap:10px; font-family:'Outfit'; font-weight:800; font-size:18px;">
            <div style="background:var(--card-bg); padding:6px 12px; border-radius:8px; border:1px solid var(--card-border); min-width:45px; text-align:center;">${String(hours).padStart(2, '0')}h</div>
            <div style="background:var(--card-bg); padding:6px 12px; border-radius:8px; border:1px solid var(--card-border); min-width:45px; text-align:center;">${String(minutes).padStart(2, '0')}m</div>
            <div style="background:var(--card-bg); padding:6px 12px; border-radius:8px; border:1px solid var(--card-border); min-width:45px; text-align:center;">${String(seconds).padStart(2, '0')}s</div>
          </div>
        `;
      };

      updateCountdown();
      const intervalId = setInterval(() => {
        const now = new Date().getTime();
        if (targetDate.getTime() - now < 0) {
          flashEl.style.cssText = 'display: none !important;';
          clearInterval(intervalId);
        } else {
          updateCountdown();
        }
      }, 1000);
    } else {
      if (flashEl) {
        flashEl.style.cssText = 'display: none !important;';
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

  // 4 premium hardcoded slides (override from backend if available)
  const defaultSlides = [
    {
      image: '/assets/images/luxury_return_gifts.png',
      title: 'Luxury Made Memorable',
      subtitle: 'Bespoke return gifts tailored for your most cherished celebrations',
      btnText: 'Explore Collections',
      link: '/products.html'
    },
    {
      image: '/assets/images/premium_return_gifts.png',
      title: 'Premium Return Gifts',
      subtitle: 'Handcrafted elegance to express your heartfelt gratitude',
      btnText: 'Shop Best Sellers',
      link: '/products.html?sort=bestSelling'
    },
    {
      image: '/assets/images/corporate_gifts.png',
      title: 'Corporate Gifting Solutions',
      subtitle: 'Refined, custom-branded gifts designed for executive impressions',
      btnText: 'View Corporate Gifts',
      link: '/products.html?category=corporate-gifts'
    },
    {
      image: '/assets/images/celebration_hampers.png',
      title: 'Customized Celebration Hampers',
      subtitle: 'Curate your own luxury collection with custom engravings and cards',
      btnText: 'Design Your Gift',
      link: '/contact.html'
    }
  ];

  // Use backend slides if configured, otherwise use defaults
  const pickImage = (candidate, fallback) => {
    if (candidate && typeof candidate === 'string' && candidate.trim() && !candidate.includes('undefined')) {
      return candidate.trim();
    }
    return fallback;
  };

  const slides = (banners && banners.length > 0)
    ? banners.map((b, i) => ({
      image: pickImage(b.image, defaultSlides[i % defaultSlides.length].image),
      title: b.title || defaultSlides[i % defaultSlides.length].title,
      subtitle: b.subtitle || defaultSlides[i % defaultSlides.length].subtitle,
      btnText: b.btnText || defaultSlides[i % defaultSlides.length].btnText || 'Explore Collections',
      link: b.link || '/products.html'
    }))
    : defaultSlides;

  container.innerHTML = slides.map((slide, index) => `
    <div class="hero-slide ${index === 0 ? 'active' : ''}"
         style="background-image: url('${slide.image}'); background-size:cover; background-position:center; display:flex; align-items:center;">
      <div class="container hero-content">
        <h1 style="font-size:52px; font-family:'Outfit'; font-weight:800; line-height:1.15; margin-bottom:20px; text-shadow:0 2px 12px rgba(0,0,0,0.4);">${slide.title}</h1>
        <p style="font-size:18px; color:rgba(255,255,255,0.92); margin-bottom:36px; max-width:560px; line-height:1.6; text-shadow:0 1px 6px rgba(0,0,0,0.35);">${slide.subtitle}</p>
        <a href="${slide.link}" class="btn btn-gold" style="font-size:15px; padding:14px 36px; border-radius:30px;">${slide.btnText}</a>
      </div>
    </div>
  `).join('');

  // Auto Slider Interval â€” uses CSS class transitions (900ms image, 600ms text)
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

  container.innerHTML = promos.map(promo => `
    <div class="glass hover-lift promo-banner animated fadeInUp" style="border-radius:16px; overflow:hidden; position:relative; height:200px; background:linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url('${promo.image || '/assets/images/hero_slide_1.jpg'}') no-repeat center center/cover; display:flex; align-items:flex-end; padding:24px; color:white;">
      <div>
        <h3 style="font-size:20px; font-family:'Outfit'; margin-bottom:12px; line-height:1.3;">${promo.title}</h3>
        <a href="${promo.link || '/products.html'}" class="btn btn-gold" style="padding:6px 16px; font-size:12px; border-radius:4px;">Shop Now</a>
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
