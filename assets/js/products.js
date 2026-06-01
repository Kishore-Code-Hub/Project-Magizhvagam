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

  if (searchParam) document.getElementById('filter-search').value = searchParam;
  if (catParam) document.getElementById('filter-category').value = catParam;
  if (sortParam) document.getElementById('filter-sort').value = sortParam;

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
    const data = await res.json();
    if (data.success) {
      data.categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.slug;
        opt.textContent = c.name;
        select.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Error fetching sidebar categories:', err);
  }
}

async function loadCatalogProducts() {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;

  grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px;"><div class="spinner" style="margin:auto;"></div></div>';

  // Gather values
  const search = document.getElementById('filter-search').value.trim();
  const category = document.getElementById('filter-category').value;
  const minPrice = document.getElementById('filter-min-price').value;
  const maxPrice = document.getElementById('filter-max-price').value;
  const material = document.getElementById('filter-material').value;
  const color = document.getElementById('filter-color').value;
  const occasion = document.getElementById('filter-occasion').value;
  const sort = document.getElementById('filter-sort').value;

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

  try {
    const res = await fetch(url);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error('Catalog API returned non-JSON:', text.slice(0, 200));
      throw parseErr;
    }

    if (!data.success || !data.products || data.products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:60px 20px;">
          <h3 style="font-family:'Outfit'; font-size:20px; margin-bottom:8px;">No Gifts Match Your Search</h3>
          <p style="color:var(--text-muted); font-size:14px;">Try clearing filters or adjusting your price limits.</p>
        </div>
      `;
      renderPagination(1, 1);
      return;
    }


    grid.innerHTML = data.products.map(p => createProductCardHTML(p)).join('');

    renderPagination(data.page, data.pages);

  } catch (error) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:red; padding:30px;">Connection failed. Please reload catalog page.</p>';
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
  document.getElementById('filter-sort').value = 'newest';
  
  currentPage = 1;
  loadCatalogProducts();
  showToast('Filters cleared!', 'success');
};
