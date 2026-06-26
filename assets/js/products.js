/**
 * MAGIZHVAGAM - Catalog Script
 * Manages search, filters sidebar, sorting, pagination, and grids bindings
 */

let currentPage = 1;
const limit = 9;

document.addEventListener('DOMContentLoaded', () => {
  initCatalog();
});



async function initCatalog() {
  // 1. Populate Category dropdowns/sidebar list
  await loadSidebarCategories();

  // 2. Pre-fill filters from URL parameters
  const searchParam = getQueryParam('search');
  const catParam = getQueryParam('category');
  const sortParam = getQueryParam('sort');
  const ratingParam = getQueryParam('rating');
  const availParam = getQueryParam('availability');
  const discParam = getQueryParam('discount');
  const featParam = getQueryParam('isFeatured');
  const newParam = getQueryParam('newArrivals');

  if (searchParam) document.getElementById('filter-search').value = searchParam;
  if (catParam) document.getElementById('filter-category').value = catParam;
  if (sortParam) document.getElementById('filter-sort').value = sortParam;
  if (ratingParam) document.getElementById('filter-rating').value = ratingParam;
  if (availParam) document.getElementById('filter-availability').value = availParam;
  if (discParam === 'true') document.getElementById('filter-discount').checked = true;
  if (featParam === 'true') document.getElementById('filter-featured').checked = true;
  if (newParam === 'true') document.getElementById('filter-new-arrivals').checked = true;

  // Initialize search autocomplete
  initSearchSuggestions();

  // 3. Load catalog products
  await loadCatalogProducts();

  // 4. Register filter change listeners
  document.getElementById('filter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    currentPage = 1;
    loadCatalogProducts();
  });

  document.getElementById('filter-sort').addEventListener('change', () => {
    currentPage = 1;
    loadCatalogProducts();
  });
}

async function loadSidebarCategories() {
  const select = document.getElementById('filter-category');
  if (!select) return;

  try {
    const res = await fetch('/api/products/categories');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (data.success && data.categories) {
      data.categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.slug;
        opt.textContent = c.name;
        select.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Error fetching sidebar categories:', err);
    if (typeof showToast === 'function') {
      showToast('Failed to load categories.', 'error');
    }
  }
}

const FALLBACK_PRODUCTS = [
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
    _id: 'fb-5',
    name: 'Palm Leaf Handwoven Keepsake Box',
    description: 'Biodegradable, traditional palmyra leaf woven gift containers with golden threads.',
    price: 220,
    discountPrice: null,
    images: [{ url: '/assets/images/celebration_hampers.png' }, { url: '/assets/images/default-product.webp' }],
    stock: 500,
    averageRating: 4.8,
    totalReviews: 15,
    tags: ['new', 'eco-friendly']
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
    _id: 'fb-7',
    name: 'Terracotta Hand-Painted Diya Set',
    description: 'Handcrafted clay oil lamps decorated with vibrant eco-friendly acrylic paint.',
    price: 240,
    discountPrice: 180,
    images: [{ url: '/assets/images/premium_return_gifts.png' }, { url: '/assets/images/default-product.webp' }],
    stock: 200,
    averageRating: 4.5,
    totalReviews: 12,
    tags: ['new']
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
    _id: 'fb-10',
    name: 'Traditional Coconut Bowl Set',
    description: 'Highly polished natural coconut shells repurposed as luxury serving bowls.',
    price: 350,
    discountPrice: 280,
    images: [{ url: '/assets/images/celebration_hampers.png' }, { url: '/assets/images/default-product.webp' }],
    stock: 150,
    averageRating: 4.6,
    totalReviews: 8,
    tags: ['eco-friendly']
  },
  {
    _id: 'fb-11',
    name: 'Bronze Floral Urli Bowl',
    description: 'Heavy traditional bronze bowl for floating flower petals and candles.',
    price: 2600,
    discountPrice: 2450,
    images: [{ url: '/assets/images/premium_return_gifts.png' }, { url: '/assets/images/default-product.webp' }],
    stock: 10,
    averageRating: 5.0,
    totalReviews: 7,
    tags: ['featured']
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

async function loadCatalogProducts() {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;
  grid.style.display = '';

  // Add skeleton loaders for premium performance visual look
  if (window.MZSkeleton && typeof window.MZSkeleton.productGrid === 'function') {
    window.MZSkeleton.productGrid('catalog-grid', limit);
  } else {
    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px;"><div class="spinner" style="margin:auto;"></div></div>';
  }

  // Gather values
  const search = document.getElementById('filter-search').value.trim();
  const category = document.getElementById('filter-category').value;
  const minPrice = document.getElementById('filter-min-price').value;
  const maxPrice = document.getElementById('filter-max-price').value;
  const material = document.getElementById('filter-material').value;
  const color = document.getElementById('filter-color').value;
  const occasion = document.getElementById('filter-occasion').value;
  const sort = document.getElementById('filter-sort').value;
  const rating = document.getElementById('filter-rating').value;
  const availability = document.getElementById('filter-availability').value;
  const discount = document.getElementById('filter-discount').checked ? 'true' : '';
  const featured = document.getElementById('filter-featured').checked ? 'true' : '';
  const newArrivals = document.getElementById('filter-new-arrivals').checked ? 'true' : '';

  // Build Query
  let url = `/api/products?page=${currentPage}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (category) url += `&category=${category}`;
  if (minPrice) url += `&minPrice=${minPrice}`;
  if (maxPrice) url += `&maxPrice=${maxPrice}`;
  if (material) url += `&material=${encodeURIComponent(material)}`;
  if (color) url += `&color=${encodeURIComponent(color)}`;
  if (occasion) url += `&occasion=${encodeURIComponent(occasion)}`;
  if (sort) url += `&sort=${sort}`;
  if (rating) url += `&rating=${rating}`;
  if (availability) url += `&availability=${availability}`;
  if (discount) url += `&discount=${discount}`;
  if (featured) url += `&isFeatured=${featured}`;
  if (newArrivals) url += `&newArrivals=${newArrivals}`;

  const isFilteredSearch = !!(search || category || minPrice || maxPrice || material || color || occasion || rating || availability || discount || featured || newArrivals);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error('Catalog API returned non-JSON:', text.slice(0, 200));
      data = { success: false, products: [], page: 1, pages: 1 };
    }

    if (!data.success || !data.products || data.products.length === 0) {
      if (isFilteredSearch) {
        if (window.MZError && typeof window.MZError.showEmptyState === 'function') {
          const categoryName = category ? document.getElementById('filter-category').options[document.getElementById('filter-category').selectedIndex]?.text : '';
          window.MZError.showEmptyState('catalog-grid', {
            type: category ? 'category' : 'search',
            title: category ? `No Gifts in "${categoryName}"` : 'No Gifts Match Your Search',
            message: category 
              ? `We don't have any gifts listed under the "${categoryName}" category matching your current filters.`
              : 'Try clearing some search terms or adjusting price range filters to find matching premium gifts.',
            ctaLabel: 'Reset Filters',
            ctaOnClick: 'clearAllFilters'
          });
          grid.style.display = 'block';
        } else {
          grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:60px 20px;">
              <h3 style="font-family:'Outfit'; font-size:20px; margin-bottom:8px;">No Gifts Match Your Search</h3>
              <p style="color:var(--text-muted); font-size:14px;">Try clearing filters or adjusting your price limits.</p>
            </div>
          `;
        }
        renderPagination(1, 1);
        return;
      } else {
        console.warn('API returned no products, using fallback products');
        data = { success: true, products: FALLBACK_PRODUCTS, page: 1, pages: 1 };
      }
    }

    grid.innerHTML = data.products.map(p => createProductCardHTML(p)).join('');
    renderPagination(data.page || 1, data.pages || 1);

  } catch (error) {
    console.warn('Catalog API failed, rendering fallback products:', error);
    grid.innerHTML = FALLBACK_PRODUCTS.map(p => createProductCardHTML(p)).join('');
    renderPagination(1, 1);
    if (typeof showToast === 'function') {
      showToast('Loaded local fallback catalog products.', 'warning');
    }
  }
}

function renderPagination(current, total) {
  const container = document.getElementById('catalog-pagination');
  if (!container) return;

  let html = '';
  
  // Previous button
  html += `
    <button onclick="changePage(${current - 1})" ${current === 1 ? 'disabled' : ''} style="padding:8px 16px; border-radius:8px; background:var(--card-bg); border:1px solid var(--card-border); cursor:pointer; color:var(--text-color); font-weight:600;">
      Prev
    </button>
  `;

  // Page Numbers
  for (let i = 1; i <= total; i++) {
    html += `
      <button onclick="changePage(${i})" style="width:36px; height:36px; border-radius:8px; margin:0 4px; cursor:pointer; font-weight:700; ${i === current ? 'background:hsl(var(--primary-purple)); color:white;' : 'background:var(--card-bg); border:1px solid var(--card-border); color:var(--text-color);'}">
        ${i}
      </button>
    `;
  }

  // Next button
  html += `
    <button onclick="changePage(${current + 1})" ${current === total ? 'disabled' : ''} style="padding:8px 16px; border-radius:8px; background:var(--card-bg); border:1px solid var(--card-border); cursor:pointer; color:var(--text-color); font-weight:600;">
      Next
    </button>
  `;

  container.innerHTML = html;
}

window.changePage = (page) => {
  currentPage = page;
  loadCatalogProducts();
  window.scrollTo({ top: 200, behavior: 'smooth' });
};

window.clearAllFilters = () => {
  document.getElementById('filter-search').value = '';
  document.getElementById('filter-category').value = '';
  document.getElementById('filter-min-price').value = '';
  document.getElementById('filter-max-price').value = '';
  document.getElementById('filter-material').value = '';
  document.getElementById('filter-color').value = '';
  document.getElementById('filter-occasion').value = '';
  document.getElementById('filter-rating').value = '';
  document.getElementById('filter-availability').value = '';
  document.getElementById('filter-discount').checked = false;
  document.getElementById('filter-featured').checked = false;
  document.getElementById('filter-new-arrivals').checked = false;
  document.getElementById('filter-sort').value = 'newest';
  
  currentPage = 1;
  loadCatalogProducts();
  if (typeof showToast === 'function') {
    showToast('Filters cleared!', 'success');
  }
};

// Search Autocomplete, Recent Searches and Popular Tags System
function initSearchSuggestions() {
  const input = document.getElementById('filter-search');
  const box = document.getElementById('search-suggestions-box');
  if (!input || !box) return;

  let debounceTimeout = null;
  let activeIndex = -1;

  const getRecentSearches = () => {
    try {
      return JSON.parse(localStorage.getItem('mz_recent_searches') || '[]');
    } catch (e) {
      return [];
    }
  };

  const addRecentSearch = (term) => {
    if (!term) return;
    try {
      let list = getRecentSearches();
      list = list.filter(item => item !== term);
      list.unshift(term);
      localStorage.setItem('mz_recent_searches', JSON.stringify(list.slice(0, 5)));
    } catch (e) {}
  };

  const POPULAR_SEARCHES = ['Vilakku', 'Jute Bag', 'Brass Plate', 'Gift Hamper', 'Terracotta'];

  const renderSuggestions = (suggestions = []) => {
    const recents = getRecentSearches();
    let html = '';
    const query = input.value.trim();

    if (suggestions.length > 0) {
      html += `
        <div style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px; border-bottom:1px solid var(--card-border); padding-bottom:4px;">Product Matches</div>
        <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:12px;">
          ${suggestions.map((s, idx) => `
            <div class="suggestion-item" data-val="${s.name.replace(/"/g, '&quot;')}" style="padding:6px 10px; border-radius:6px; font-size:13px; cursor:pointer; color:var(--text-color); transition:background 0.2s; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" onmouseenter="setSuggestionActive(${idx})">${s.name}</div>
          `).join('')}
        </div>
      `;
    } else if (query) {
      html += `
        <div style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px; border-bottom:1px solid var(--card-border); padding-bottom:4px;">Product Matches</div>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:12px; padding:6px 10px; font-style:italic;">No exact matches found for "${query}"</div>
      `;
    }

    if (recents.length > 0) {
      html += `
        <div style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px; border-bottom:1px solid var(--card-border); padding-bottom:4px;">Recent Searches</div>
        <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:12px;">
          ${recents.map((r, idx) => `
            <div class="suggestion-item" data-val="${r.replace(/"/g, '&quot;')}" style="padding:6px 10px; border-radius:6px; font-size:13px; cursor:pointer; color:var(--text-color); display:flex; justify-content:space-between; align-items:center; transition:background 0.2s; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              <span>🕒 ${r}</span>
              <button onclick="removeRecentSearchEvent(event, '${encodeURIComponent(r)}')" style="background:transparent; border:none; cursor:pointer; color:var(--text-muted); font-size:12px; padding:0 4px;">✕</button>
            </div>
          `).join('')}
        </div>
      `;
    }

    html += `
      <div style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px; border-bottom:1px solid var(--card-border); padding-bottom:4px;">Popular Searches</div>
      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:4px;">
        ${POPULAR_SEARCHES.map(p => `
          <button type="button" class="popular-tag" data-val="${p}" style="padding:4px 10px; border-radius:20px; font-size:12px; border:1px solid var(--card-border); background:rgba(0,0,0,0.02); color:var(--text-muted); cursor:pointer; transition:all 0.2s;">${p}</button>
        `).join('')}
      </div>
    `;

    box.innerHTML = html;
    box.style.display = 'block';

    // Hook clicks
    box.querySelectorAll('.suggestion-item, .popular-tag').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') return; // ignore delete click
        const val = el.getAttribute('data-val');
        if (val) {
          input.value = val;
          box.style.display = 'none';
          addRecentSearch(val);
          currentPage = 1;
          loadCatalogProducts();
        }
      });
    });
  };

  input.addEventListener('input', () => {
    const val = input.value.trim();
    activeIndex = -1;
    clearTimeout(debounceTimeout);

    if (!val) {
      renderSuggestions();
      return;
    }

    // Show suggestion search loader indicator
    box.innerHTML = `
      <div style="text-align:center; padding:12px; color:var(--text-muted); font-size:12px;">
        <span class="spinner" style="width:14px; height:14px; border-width:2px; display:inline-block; vertical-align:middle; margin-right:8px;"></span> Loading matching products...
      </div>
    `;
    box.style.display = 'block';

    debounceTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(val)}&limit=5`);
        const data = await res.json();
        if (data.success && data.products) {
          renderSuggestions(data.products);
        } else {
          renderSuggestions();
        }
      } catch (err) {
        renderSuggestions();
      }
    }, 300);
  });

  input.addEventListener('focus', () => {
    renderSuggestions();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#filter-search') && !e.target.closest('#search-suggestions-box')) {
      box.style.display = 'none';
    }
  });

  // Keyboard Navigation Support
  input.addEventListener('keydown', (e) => {
    const items = box.querySelectorAll('.suggestion-item');
    if (box.style.display === 'none') return;

    if (e.key === 'ArrowDown') {
      if (items.length === 0) return;
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      updateActiveItem(items);
    } else if (e.key === 'ArrowUp') {
      if (items.length === 0) return;
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateActiveItem(items);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && items[activeIndex]) {
        e.preventDefault();
        const val = items[activeIndex].getAttribute('data-val');
        input.value = val;
        box.style.display = 'none';
        addRecentSearch(val);
        currentPage = 1;
        loadCatalogProducts();
      }
    } else if (e.key === 'Escape') {
      box.style.display = 'none';
      input.blur();
    }
  });

  window.setSuggestionActive = (idx) => {
    activeIndex = idx;
    const items = box.querySelectorAll('.suggestion-item');
    updateActiveItem(items);
  };

  window.removeRecentSearchEvent = (e, encodedTerm) => {
    e.stopPropagation();
    const term = decodeURIComponent(encodedTerm);
    let list = getRecentSearches();
    list = list.filter(item => item !== term);
    localStorage.setItem('mz_recent_searches', JSON.stringify(list));
    renderSuggestions();
  };

  function updateActiveItem(items) {
    items.forEach((item, idx) => {
      if (idx === activeIndex) {
        item.style.background = 'rgba(0,0,0,0.06)';
        item.style.fontWeight = '700';
      } else {
        item.style.background = 'transparent';
        item.style.fontWeight = '400';
      }
    });
  }

  // Hook submit action to record successful queries
  document.getElementById('filter-form').addEventListener('submit', () => {
    const val = input.value.trim();
    if (val) addRecentSearch(val);
  });
}
