/**
 * MAGIZHVAGAM - Admin Panel JS Controller
 * Manages dashboard metrics, products CRUD, order statuses, and homepage setting updates
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (document.body) {
    document.body.style.visibility = 'hidden';
  }

  try {
    const res = await adminFetch('/api/auth/profile');
    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      throw new Error('Invalid profile response');
    }

    if (data.success && data.user && data.user.role !== 'admin') {
      document.body.innerHTML =
        '<div style="font-family:sans-serif;padding:40px;max-width:520px;margin:80px auto;"><h1>403 Forbidden</h1><p>Your account does not have administrator access.</p><p><a href="/index.html">Return to store</a></p></div>';
      document.body.style.visibility = 'visible';
      return;
    }

    if (!data.success || !data.user || data.user.role !== 'admin') {
      const redirectPath = window.location.pathname.substring(1) + window.location.search;
      window.location.replace('/admin/login?redirect=' + encodeURIComponent(redirectPath));
      return;
    }

    if (typeof window.setSessionUser === 'function') {
      window.setSessionUser(data.user);
    }
  } catch (err) {
    const redirectPath = window.location.pathname.substring(1) + window.location.search;
    window.location.replace('/admin/login?redirect=' + encodeURIComponent(redirectPath));
    return;
  }

  if (document.body) {
    document.body.style.visibility = 'visible';
  }

  applyAdminBranding();
  injectAdminSidebar();


  // Route to page-specific loads
  const path = window.location.pathname;
  if (path.includes('dashboard.html')) {
    loadDashboardData();
    loadFeatureToggles();
    initDashboardEvents();
  } else if (path.includes('products.html')) {
    loadAdminProducts();
    initProductsPageEvents();
  } else if (path.includes('orders.html')) {
    loadAdminOrders();
  } else if (path.includes('invoices.html')) {
    initInvoiceSearch();
  } else if (path.includes('customers.html')) {
    loadAdminCustomers();
  } else if (path.includes('settings.html')) {
    loadHomepageBuilderSettings();
  } else if (path.includes('reports.html')) {
    loadReportsPageData();
  }
});

// Sidebar injection (reusable dry components)
function injectAdminSidebar() {
  const sidebar = document.getElementById('admin-sidebar-container');
  if (!sidebar) return;

  const path = window.location.pathname;
  const urlParams = new URLSearchParams(window.location.search);
  const currentTab = urlParams.get('tab') || 'presets';

  const activeCls = (file) => path.includes(file) ? 'active' : '';
  const activeTabCls = (tab) => (path.includes('settings.html') && currentTab === tab) ? 'active' : '';

  sidebar.className = 'admin-sidebar';
  sidebar.innerHTML = `
    <div class="admin-logo">MAGIZHVAGAM</div>
    <ul class="admin-menu" style="overflow-y: auto; height: calc(100vh - 100px); padding-bottom: 40px; margin: 0; list-style: none;">
      <li class="${activeCls('dashboard.html')}"><a href="/admin/dashboard.html"><i data-lucide="layout-dashboard"></i> Dashboard</a></li>
      <li class="${activeCls('products.html')}"><a href="/admin/products.html"><i data-lucide="gift"></i> Products</a></li>
      <li class="${activeCls('orders.html')}"><a href="/admin/orders.html"><i data-lucide="shopping-bag"></i> Orders</a></li>
      <li class="${activeCls('invoices.html')}"><a href="/admin/invoices.html"><i data-lucide="file-text"></i> Invoices</a></li>
      <li class="${activeCls('customers.html')}"><a href="/admin/customers.html"><i data-lucide="users"></i> Customers</a></li>
      <li class="${activeCls('reports.html')}"><a href="/admin/reports.html"><i data-lucide="bar-chart-2"></i> Reports</a></li>
      <li class="${activeCls('media.html')}"><a href="/admin/media.html"><i data-lucide="image"></i> Media Library</a></li>
      
      <!-- Reorganized Appearance Entries -->
      <li style="padding: 14px 16px 6px; font-size: 11px; font-weight: 700; color: var(--adm-text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid var(--adm-border); margin-top: 10px;">Appearance</li>
      
      <li class="${activeTabCls('presets')}"><a href="/admin/settings.html?tab=presets"><i data-lucide="layout"></i> Theme Presets</a></li>
      <li class="${activeTabCls('colors')}"><a href="/admin/settings.html?tab=colors"><i data-lucide="droplet"></i> Colors</a></li>
      <li class="${activeTabCls('typography')}"><a href="/admin/settings.html?tab=typography"><i data-lucide="type"></i> Typography</a></li>
      <li class="${activeTabCls('header')}"><a href="/admin/settings.html?tab=header"><i data-lucide="panel-top"></i> Header Settings</a></li>
      <li class="${activeTabCls('footer')}"><a href="/admin/settings.html?tab=footer"><i data-lucide="panel-bottom"></i> Footer Settings</a></li>
      <li class="${activeTabCls('homepage')}"><a href="/admin/settings.html?tab=homepage"><i data-lucide="home"></i> Homepage Elements</a></li>
      <li class="${activeTabCls('about-page')}"><a href="/admin/settings.html?tab=about-page"><i data-lucide="info"></i> About Page</a></li>
      <li class="${activeTabCls('buttons')}"><a href="/admin/settings.html?tab=buttons"><i data-lucide="mouse-pointer"></i> Buttons</a></li>
      <li class="${activeTabCls('cards')}"><a href="/admin/settings.html?tab=cards"><i data-lucide="credit-card"></i> Cards</a></li>
      <li class="${activeTabCls('product-pages')}"><a href="/admin/settings.html?tab=product-pages"><i data-lucide="package"></i> Product Pages</a></li>
      <li class="${activeTabCls('category-pages')}"><a href="/admin/settings.html?tab=category-pages"><i data-lucide="layers"></i> Category Pages</a></li>
      <li class="${activeTabCls('animations')}"><a href="/admin/settings.html?tab=animations"><i data-lucide="sparkles"></i> Animations</a></li>
      <li class="${activeTabCls('custom-css')}"><a href="/admin/settings.html?tab=custom-css"><i data-lucide="code"></i> Custom CSS</a></li>
      <li class="${activeTabCls('mobile-settings')}"><a href="/admin/settings.html?tab=mobile-settings"><i data-lucide="smartphone"></i> Mobile Settings</a></li>
      <li class="${activeTabCls('advanced-settings')}"><a href="/admin/settings.html?tab=advanced-settings"><i data-lucide="settings"></i> Advanced Settings</a></li>

      <li style="margin-top:20px; border-top:1px solid var(--adm-border); padding-top:15px;">
        <a href="#" onclick="window.handleLogout(); return false;" style="color:#ef4444 !important;"><i data-lucide="log-out"></i> Sign Out</a>
      </li>
    </ul>
  `;
  window.renderIcons();
}

// 1. Dashboard metrics loader
async function loadDashboardData() {
  try {
    const res = await adminFetch('/api/reports/dashboard');
    const data = await res.json();
    if (!data.success) {
      showToast('Failed to load reports', 'error');
      return;
    }

    const stats = data.stats || {};
    const totalRevenue = Number(stats.totalRevenue) || 0;
    const totalOrders = Number(stats.totalOrders) || 0;
    const totalCustomers = Number(stats.totalCustomers) || 0;
    const totalProducts = Number(stats.totalProducts) || 0;

    // Set metrics
    const revEl = document.getElementById('metric-revenue');
    if (revEl) revEl.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
    const ordersEl = document.getElementById('metric-orders');
    if (ordersEl) ordersEl.textContent = totalOrders;
    const customersEl = document.getElementById('metric-customers');
    if (customersEl) customersEl.textContent = totalCustomers;
    const productsEl = document.getElementById('metric-products');
    if (productsEl) productsEl.textContent = totalProducts;

    // Render Recent orders list
    const tbody = document.getElementById('recent-orders-tbody');
    if (tbody) {
      if (data.recentOrders && data.recentOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No orders yet.</td></tr>';
      } else {
        tbody.innerHTML = data.recentOrders.map(o => {
          const customerName = o.userId ? (o.userId.name || 'Customer') : (o.guestDetails ? (o.guestDetails.fullName || 'Guest') : 'Guest');
          const orderTotal = (o.summary && o.summary.total != null) ? o.summary.total : 0;
          const orderStatus = o.status || 'Pending';
          return `
          <tr>
            <td><strong>#${(o._id || '').substr(-6)}</strong></td>
            <td>${customerName}</td>
            <td>${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
            <td>₹${orderTotal}</td>
            <td><span class="badge ${orderStatus === 'Delivered' ? 'badge-success' : orderStatus === 'Cancelled' ? 'badge-danger' : 'badge-warning'}">${orderStatus}</span></td>
          </tr>
        `;
        }).join('');
      }
    }

    // Render Sales trend chart (Placeholder for simplicity using SVG rendering)
    renderSvgTrendChart(data.chartData || []);

  } catch (err) {
    showToast('Error fetching dashboard analytics', 'error');
  }
}

function renderSvgTrendChart(chartData) {
  const container = document.getElementById('dashboard-chart-box');
  if (!container || !chartData || chartData.length === 0) return;

  const maxVal = Math.max(...chartData.map(d => d.revenue), 100);
  const width = 500;
  const height = 180;
  const points = chartData.map((d, i) => {
    const x = (i * (width / (chartData.length - 1))) + 30;
    const y = height - (d.revenue / maxVal * (height - 40)) - 20;
    return `${x},${y}`;
  }).join(' ');

  container.innerHTML = `
    <h4 style="font-family:'Outfit'; font-size:16px; margin-bottom:16px;">Sales Revenue Trend (₹)</h4>
    <svg viewBox="0 0 ${width + 50} ${height + 20}" style="width:100%; height:${height}px;">
      <!-- Grid lines -->
      <line x1="30" y1="20" x2="${width}" y2="20" stroke="var(--card-border)" stroke-dasharray="4"/>
      <line x1="30" y1="80" x2="${width}" y2="80" stroke="var(--card-border)" stroke-dasharray="4"/>
      <line x1="30" y1="140" x2="${width}" y2="140" stroke="var(--card-border)" stroke-dasharray="4"/>
      
      <!-- Trend Line -->
      <polyline fill="none" stroke="hsl(var(--primary-purple))" stroke-width="3" points="${points}"/>
      
      <!-- Node Dots -->
      ${chartData.map((d, i) => {
    const x = (i * (width / (chartData.length - 1))) + 30;
    const y = height - (d.revenue / maxVal * (height - 40)) - 20;
    return `
          <circle cx="${x}" cy="${y}" r="5" fill="var(--primary-gold)" stroke="hsl(var(--primary-purple))" stroke-width="2"/>
          <text x="${x}" y="${y - 10}" font-size="10" font-weight="700" text-anchor="middle" fill="var(--text-color)">₹${Math.round(d.revenue)}</text>
          <text x="${x}" y="${height}" font-size="9" text-anchor="middle" fill="var(--text-muted)">${d.label}</text>
        `;
  }).join('')}
    </svg>
  `;
}

// 2. Admin Products CRUD Loader
async function loadAdminProducts() {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  try {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;"><div class="spinner" style="margin:auto;"></div></td></tr>';
    const res = await adminFetch('/api/products?limit=100');
    const data = await res.json();

    const selectAll = document.getElementById('select-all-products');
    if (selectAll) selectAll.checked = false;
    updateBulkSelectionState();

    if (!data.success || data.products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No products found. Click "Add Product" to create one.</td></tr>';
      return;
    }

    tbody.innerHTML = data.products.map(p => `
      <tr>
        <td>
          <input type="checkbox" class="product-select-checkbox" data-id="${p._id}" style="cursor:pointer;" onchange="updateBulkSelectionState()">
        </td>
        <td>
          <div style="width:40px; height:40px; border-radius:4px; overflow:hidden;">
            <img src="${p.images[0] ? p.images[0].url : '/assets/images/default-product.webp'}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='/assets/images/default-product.webp'">
          </div>
        </td>
        <td><strong>${p.name}</strong></td>
        <td>${p.category ? p.category.name : 'Uncategorized'}</td>
        <td>₹${p.price}</td>
        <td>${p.stock} pcs</td>
        <td>
          <input type="checkbox" style="cursor:pointer;" ${p.isFeatured ? 'checked' : ''} onchange="window.toggleProductFeatured('${p._id}', this.checked)">
        </td>
        <td>
          <button onclick="openProductEditModal('${p._id}')" class="btn btn-secondary" style="padding:4px 10px; font-size:11px; border-radius:4px; border-width:1px; margin-right:6px;">Edit</button>
          <button onclick="duplicateProductById('${p._id}')" class="btn btn-secondary" style="padding:4px 10px; font-size:11px; border-radius:4px; border-width:1px; margin-right:6px;">Clone</button>
          <button onclick="deleteProductById('${p._id}', '${p.name.replace(/'/g, "\\'")}')" class="btn" style="padding:4px 10px; font-size:11px; border-radius:4px; background:#ef4444; color:white;">Delete</button>
        </td>
      </tr>
    `).join('');

    // Pre-populate category dropdowns in Add/Edit forms
    loadCategoriesDropdown();

  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Failed to load products list.</td></tr>';
    showToast('Failed to fetch products', 'error');
  }
}

async function loadCategoriesDropdown() {
  const selects = [document.getElementById('prod-category'), document.getElementById('edit-prod-category')];
  try {
    const res = await adminFetch('/api/products/categories');
    const data = await res.json();
    if (data.success) {
      selects.forEach(sel => {
        if (sel) {
          sel.innerHTML = '<option value="">Select Category</option>' + data.categories.map(c => `
            <option value="${c._id}">${c.name}</option>
          `).join('');
        }
      });
    }
  } catch (err) {
    console.error('Failed to load product form categories:', err);
  }
}

async function deleteProductById(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}" from system?`)) return;
  try {
    const res = await adminFetch(`/api/products/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Product deleted!', 'success');
      loadAdminProducts();
    } else {
      showToast(data.error || 'Failed to delete product', 'error');
    }
  } catch (err) {
    showToast('Connection error during deletion', 'error');
  }
}

// 2.1 Duplicate / Clone Product
async function duplicateProductById(id) {
  try {
    const res = await adminFetch(`/api/products/duplicate/${id}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Product duplicated successfully!', 'success');
      loadAdminProducts();
    } else {
      showToast(data.error || 'Failed to duplicate product', 'error');
    }
  } catch (err) {
    showToast('Connection error during duplication', 'error');
  }
}

// 2.2 Bulk selection state updater
window.updateBulkSelectionState = () => {
  const checkboxes = document.querySelectorAll('.product-select-checkbox');
  const checked = Array.from(checkboxes).filter(cb => cb.checked);
  const count = checked.length;

  const bulkPanel = document.getElementById('bulk-actions-panel');
  const countSpan = document.getElementById('bulk-selected-count');

  if (bulkPanel && countSpan) {
    if (count > 0) {
      bulkPanel.style.display = 'flex';
      countSpan.textContent = `${count} product${count > 1 ? 's' : ''} selected`;
    } else {
      bulkPanel.style.display = 'none';
    }
  }

  const selectAll = document.getElementById('select-all-products');
  if (selectAll) {
    selectAll.checked = checkboxes.length > 0 && count === checkboxes.length;
  }
};

// 2.3 Load categories list specifically for the bulk action category select
async function loadBulkCategoryDropdown() {
  const sel = document.getElementById('bulk-category-select');
  if (!sel) return;
  try {
    const res = await adminFetch('/api/products/categories');
    const data = await res.json();
    if (data.success) {
      sel.innerHTML = '<option value="">Select Category</option>' + data.categories.map(c => `
        <option value="${c._id}">${c.name}</option>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load bulk category dropdown:', err);
  }
}

// 2.4 CSV Export & CSV Import functions
window.exportProductsCSV = async () => {
  try {
    const res = await adminFetch('/api/products?limit=1000');
    const data = await res.json();
    if (!data.success || data.products.length === 0) {
      showToast('No products to export', 'warning');
      return;
    }

    const headers = ['name', 'description', 'price', 'discountPrice', 'stock', 'categoryName', 'material', 'dimensions', 'weight', 'color', 'tags', 'images'];
    const rows = [headers.join(',')];

    data.products.forEach(p => {
      const row = [
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.description || '').replace(/"/g, '""')}"`,
        p.price,
        p.discountPrice || '',
        p.stock || 0,
        `"${(p.category ? p.category.name : '').replace(/"/g, '""')}"`,
        `"${(p.specifications?.material || '').replace(/"/g, '""')}"`,
        `"${(p.specifications?.dimensions || '').replace(/"/g, '""')}"`,
        `"${(p.specifications?.weight || '').replace(/"/g, '""')}"`,
        `"${(p.specifications?.color || '').replace(/"/g, '""')}"`,
        `"${(p.tags || []).join(', ').replace(/"/g, '""')}"`,
        `"${(p.images || []).map(img => img.url).join(', ').replace(/"/g, '""')}"`
      ];
      rows.push(row.join(','));
    });

    const csvContent = '\uFEFF' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `magizhvagam_products_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Products exported to CSV!', 'success');
  } catch (err) {
    showToast('Export failed: ' + err.message, 'error');
  }
};

window.importProductsCSV = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length <= 1) {
        showToast('CSV is empty or lacks headers', 'warning');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const products = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        let currentVal = '';
        let insideQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
            currentVal = '';
          } else {
            currentVal += char;
          }
        }
        values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

        if (values.length < headers.length) continue;

        const prod = {};
        headers.forEach((header, idx) => {
          prod[header] = values[idx];
        });

        products.push(prod);
      }

      if (products.length === 0) {
        showToast('No valid rows found in CSV', 'warning');
        return;
      }

      const confirmImport = confirm(`Parsed ${products.length} products. Do you want to import them now?`);
      if (!confirmImport) return;

      const res = await adminFetch('/api/products/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message || `Successfully imported ${data.count} products!`, 'success');
        loadAdminProducts();
      } else {
        showToast(data.error || 'Import failed', 'error');
      }
    } catch (err) {
      showToast('CSV parsing/import error: ' + err.message, 'error');
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
};

let productsEventsInitialized = false;
function initProductsPageEvents() {
  if (productsEventsInitialized) return;
  productsEventsInitialized = true;

  // Register select-all behavior
  const selectAll = document.getElementById('select-all-products');
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      const checkboxes = document.querySelectorAll('.product-select-checkbox');
      checkboxes.forEach(cb => cb.checked = e.target.checked);
      updateBulkSelectionState();
    });
  }

  // Bulk action select change handler
  const actionSelect = document.getElementById('bulk-action-select');
  if (actionSelect) {
    actionSelect.addEventListener('change', (e) => {
      const stockContainer = document.getElementById('bulk-stock-input-container');
      const categoryContainer = document.getElementById('bulk-category-input-container');

      if (stockContainer) stockContainer.style.display = 'none';
      if (categoryContainer) categoryContainer.style.display = 'none';

      if (e.target.value === 'update-stock') {
        if (stockContainer) stockContainer.style.display = 'flex';
      } else if (e.target.value === 'change-category') {
        if (categoryContainer) {
          categoryContainer.style.display = 'block';
          loadBulkCategoryDropdown();
        }
      }
    });
  }

  // Bulk action apply click handler
  const applyBtn = document.getElementById('bulk-action-apply');
  if (applyBtn) {
    applyBtn.addEventListener('click', async () => {
      const action = document.getElementById('bulk-action-select').value;
      if (!action) {
        showToast('Please select a bulk action', 'warning');
        return;
      }

      const checkboxes = document.querySelectorAll('.product-select-checkbox:checked');
      const ids = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));
      if (ids.length === 0) {
        showToast('No products selected', 'warning');
        return;
      }

      if (action === 'delete') {
        if (!confirm(`Are you sure you want to delete ${ids.length} products?`)) return;
        try {
          const res = await adminFetch('/api/products/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
          });
          const data = await res.json();
          if (data.success) {
            showToast(`Successfully deleted ${ids.length} products!`, 'success');
            loadAdminProducts();
          } else {
            showToast(data.error || 'Failed to bulk delete', 'error');
          }
        } catch (err) {
          showToast('Connection error during bulk deletion', 'error');
        }
      } else if (action === 'update-stock') {
        const stockAction = document.getElementById('bulk-stock-action').value;
        const stockValue = document.getElementById('bulk-stock-val').value;
        if (stockValue === '') {
          showToast('Please provide a stock quantity', 'warning');
          return;
        }
        try {
          const res = await adminFetch('/api/products/bulk-update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids, stockAction, stockValue })
          });
          const data = await res.json();
          if (data.success) {
            showToast('Stock updated successfully for selected products!', 'success');
            loadAdminProducts();
          } else {
            showToast(data.error || 'Failed to update stock', 'error');
          }
        } catch (err) {
          showToast('Connection error', 'error');
        }
      } else if (action === 'change-category') {
        const category = document.getElementById('bulk-category-select').value;
        if (!category) {
          showToast('Please select a category', 'warning');
          return;
        }
        try {
          const res = await adminFetch('/api/products/bulk-update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids, category })
          });
          const data = await res.json();
          if (data.success) {
            showToast('Category updated successfully for selected products!', 'success');
            loadAdminProducts();
          } else {
            showToast(data.error || 'Failed to update category', 'error');
          }
        } catch (err) {
          showToast('Connection error', 'error');
        }
      }
    });
  }
}

// 3. Admin Orders status updater
async function loadAdminOrders() {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  try {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;"><div class="spinner" style="margin:auto;"></div></td></tr>';
    const res = await adminFetch('/api/orders');
    const data = await res.json();

    if (!data.success || data.orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No orders placed.</td></tr>';
      return;
    }

    const rows = [];
    for (const o of data.orders) {
      try {
        if (!o || (!o._id && !o.orderId)) continue;
        const displayOrderId = o.orderId || o._id || 'PENDING-ID';
        const clientName = o.userId ? (o.userId.name || 'Customer') : (o.guestDetails ? (o.guestDetails.fullName || 'Guest') : 'Guest');
        const formattedDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : 'N/A';
        const totalAmount = o.summary ? o.summary.total : 0;

        rows.push(`
          <tr>
            <td><strong style="color:var(--text-color); font-size:13px;">#${displayOrderId}</strong></td>
            <td>${clientName}</td>
            <td>${formattedDate}</td>
            <td>${formatPrice(totalAmount)}</td>
            <td>
              <select onchange="updateOrderStatus('${o._id || o.orderId}', this.value)" style="padding:6px; border-radius:4px; font-size:12px; background:var(--card-bg); color:var(--text-color); border:1px solid var(--card-border); font-weight:600; cursor:pointer;">
                <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
                <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </td>
            <td>
              <a href="/api/orders/${o._id || o.orderId}/invoice" target="_blank" class="btn btn-secondary" style="padding:4px 10px; font-size:11px; border-radius:4px; border-width:1px;">Invoice</a>
            </td>
          </tr>
        `);
      } catch (rowErr) {
        console.error('Failed to map order row:', rowErr, o);
      }
    }
    tbody.innerHTML = rows.join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Failed to load orders list.</td></tr>';
    showToast('Failed to fetch orders list', 'error');
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    const res = await adminFetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Order status updated!', 'success');
      loadAdminOrders();
    } else {
      showToast(data.error || 'Failed to update order status', 'error');
    }
  } catch (err) {
    showToast('Error updating status', 'error');
  }
}

// 4. Admin Customers list loader
async function loadAdminCustomers() {
  const tbody = document.getElementById('admin-customers-tbody');
  if (!tbody) return;

  try {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;"><div class="spinner" style="margin:auto;"></div></td></tr>';
    const res = await adminFetch('/api/auth/customers');
    const data = await res.json();

    if (!data.success || data.customers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No customers registered.</td></tr>';
      return;
    }

    tbody.innerHTML = data.customers.map(c => {
      const isLocked = c.lockUntil && new Date(c.lockUntil) > new Date();
      const lockStatusHTML = isLocked 
        ? `<span class="badge badge-danger" style="padding:4px 8px; font-weight:700;">Locked</span>` 
        : `<span class="badge badge-success" style="padding:4px 8px; font-weight:700;">Active</span>`;
      
      const verificationStatusHTML = c.emailVerified 
        ? `<span style="color:#28a745; font-weight:700;">✓ Verified</span>` 
        : `<span style="color:#dc3545; font-weight:700;">✗ Unverified</span>`;

      return `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.email}</td>
        <td style="text-transform: capitalize;">${c.role}</td>
        <td>${verificationStatusHTML}</td>
        <td>${lockStatusHTML}</td>
        <td>${c.orderCount} orders</td>
        <td><strong>₹${c.totalSpent.toLocaleString('en-IN')}</strong></td>
        <td>
          <button onclick="viewCustomerDeepProfile('${c._id}')" class="btn btn-secondary" style="padding:6px 12px; font-size:12px; border-radius:6px; cursor:pointer;">👁️ Profile</button>
          
          <select onchange="handleAdminCustomerAction('${c._id}', this.value); this.value='';" style="padding:6px; font-size:12px; border-radius:6px; cursor:pointer; background:var(--card-bg); color:var(--text-color); border:1px solid var(--card-border); font-weight:600; margin-left:6px;">
            <option value="">Actions</option>
            <option value="toggle-role">Toggle Permissions (Customer ↔ Staff)</option>
            <option value="force-reset">Force Account Password Reset</option>
            <option value="unlock">Unlock Account / Clear Login Attempts</option>
          </select>
        </td>
      </tr>
    `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:red;">Failed to load customers list.</td></tr>';
    showToast('Failed to load customers list', 'error');
  }
}

// Handler for custom admin controls on users
async function handleAdminCustomerAction(customerId, action) {
  if (!action) return;

  if (action === 'toggle-role') {
    if (!confirm('Are you sure you want to toggle this customer role between Customer and Staff?')) return;
    try {
      const res = await adminFetch('/api/auth/admin/toggle-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        loadAdminCustomers();
      } else {
        showToast(data.error || 'Failed to toggle user role', 'error');
      }
    } catch (err) {
      showToast('Connection error during role toggle', 'error');
    }
  } else if (action === 'force-reset') {
    if (!confirm('Are you sure you want to force reset this user password? This will generate a temporary password.')) return;
    try {
      const res = await adminFetch('/api/auth/admin/force-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message); // Explicit alert so admin can copy the temp password
        showToast('Password forced reset successfully!', 'success');
        loadAdminCustomers();
      } else {
        showToast(data.error || 'Failed to force reset password', 'error');
      }
    } catch (err) {
      showToast('Connection error during password reset', 'error');
    }
  } else if (action === 'unlock') {
    if (!confirm('Are you sure you want to manually unlock this user account and clear failed attempts?')) return;
    try {
      const res = await adminFetch('/api/auth/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Account unlocked successfully!', 'success');
        loadAdminCustomers();
      } else {
        showToast(data.error || 'Failed to unlock account', 'error');
      }
    } catch (err) {
      showToast('Connection error during account unlock', 'error');
    }
  }
}
window.handleAdminCustomerAction = handleAdminCustomerAction;


// 5. Admin Homepage Builder and configuration values loader is handled by appearance-studio.js


// 6. Settings export, import & reset handlers
window.exportSettingsBackup = async () => {
  try {
    const res = await adminFetch('/api/settings/homepage');
    const data = await res.json();
    if (data.success && data.setting) {
      const blob = new Blob([JSON.stringify(data.setting, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `magizhvagam_settings_backup_${Date.now()}.json`;
      a.click();
      showToast('Settings backup exported!', 'success');
    }
  } catch (err) {
    showToast('Failed to export settings', 'error');
  }
};

window.importSettingsBackup = () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (!imported.whatsappContact || !imported.heroBanners) {
          showToast('Invalid settings JSON structure', 'error');
          return;
        }
        const res = await adminFetch('/api/settings/homepage', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: imported })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Settings backup restored!', 'success');
          loadHomepageBuilderSettings();
        } else {
          showToast(data.error || 'Restore failed', 'error');
        }
      } catch (err) {
        showToast('JSON parse error', 'error');
      }
    };
    reader.readAsText(file);
  };
  fileInput.click();
};

async function loadReportsPageData() {
  try {
    const res = await adminFetch('/api/reports/dashboard');
    const data = await res.json();
    if (!data.success) {
      showToast('Failed to load reports', 'error');
      return;
    }

    window.__reportsCache = data;

    const tbody = document.getElementById('reports-top-tbody');
    if (tbody) {
      if (!data.topSellingProducts || data.topSellingProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No sales records yet.</td></tr>';
      } else {
        tbody.innerHTML = data.topSellingProducts.map((p) => `
          <tr>
            <td>
              <div style="width:40px; height:40px; border-radius:4px; overflow:hidden;">
                <img src="${p.image || '/assets/images/default-product.webp'}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='/assets/images/default-product.webp'">
              </div>
            </td>
            <td><strong>${p.name}</strong></td>
            <td>${p.qty} units</td>
            <td>₹${p.revenue.toLocaleString('en-IN')}</td>
          </tr>
        `).join('');
      }
    }

    const stats = data.stats || {};
    const revenue = stats.totalRevenue || 0;
    const daily = document.getElementById('rep-daily-avg');
    const weekly = document.getElementById('rep-weekly-sales');
    const monthly = document.getElementById('rep-monthly-sales');
    const annual = document.getElementById('rep-annual-proj');
    if (daily) daily.textContent = `₹${Math.round(revenue / 30).toLocaleString('en-IN')}`;
    if (weekly) weekly.textContent = `₹${Math.round(revenue / 4).toLocaleString('en-IN')}`;
    if (monthly) monthly.textContent = `₹${revenue.toLocaleString('en-IN')}`;
    if (annual) annual.textContent = `₹${Math.round(revenue * 12).toLocaleString('en-IN')}`;
  } catch (err) {
    showToast('Error aggregating reports', 'error');
  }
}

window.exportReportsCSV = async () => {
  try {
    let data = window.__reportsCache;
    if (!data) {
      const res = await adminFetch('/api/reports/dashboard');
      data = await res.json();
    }
    if (!data.success) {
      showToast(data.error || 'Failed to load report data', 'error');
      return;
    }

    const headers = ['metric', 'value'];
    const rows = [
      ['Total Revenue (INR)', data.stats?.totalRevenue ?? 0],
      ['Total Orders', data.stats?.totalOrders ?? 0],
      ['Total Customers', data.stats?.totalCustomers ?? 0],
      ['Total Products', data.stats?.totalProducts ?? 0],
      ['Daily Average Revenue', Math.round((data.stats?.totalRevenue ?? 0) / 30)],
      ['Weekly Total Sales', Math.round((data.stats?.totalRevenue ?? 0) / 4)],
      ['Monthly Total Sales', data.stats?.totalRevenue ?? 0],
      ['Estimated Annual Revenue', Math.round((data.stats?.totalRevenue ?? 0) * 12)]
    ];

    const topProducts = data.topSellingProducts || [];
    if (topProducts.length) {
      rows.push(['', '']);
      rows.push(['Top Product', 'Qty Sold', 'Revenue']);
      topProducts.forEach((p) => {
        rows.push([p.name, p.qty, p.revenue]);
      });
    }

    const csvLines = [headers.join(',')];
    rows.forEach((row) => {
      csvLines.push(row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','));
    });

    const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `magizhvagam_sales_report_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Sales report exported to CSV!', 'success');
  } catch (err) {
    showToast('Export failed: ' + err.message, 'error');
  }
};

window.updateOrderStatus = updateOrderStatus;
window.deleteProductById = deleteProductById;
window.duplicateProductById = duplicateProductById;

async function toggleProductFeatured(id, isFeatured) {
  try {
    const res = await adminFetch(`/api/products/${id}/featured`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFeatured })
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.error || 'Failed to update featured status', 'error');
      loadAdminProducts();
    } else {
      showToast('Product featured status updated!', 'success');
    }
  } catch (err) {
    showToast('Connection error updating featured status', 'error');
    loadAdminProducts();
  }
}
window.toggleProductFeatured = toggleProductFeatured;

window.resetSettingsToDefault = async () => {
  if (!confirm('Are you sure you want to reset all store custom settings to Luxury Ivory Light defaults?')) return;
  try {
    const res = await adminFetch('/api/settings/homepage/reset', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      // Clear any cached theme data from browser storage
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('theme') || key.includes('settings') || key.includes('customCSS') || key.includes('palette') || key.includes('site_settings'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch (e) { /* storage access may fail in some contexts */ }

      showToast('Settings reset to Luxury Ivory Light defaults!', 'success');

      // Reload settings UI
      if (typeof loadHomepageBuilderSettings === 'function') {
        loadHomepageBuilderSettings();
      }

      // Trigger live preview sync if the appearance studio is open
      if (typeof syncLivePreview === 'function') {
        setTimeout(() => syncLivePreview(), 500);
      }
    } else {
      showToast(data.error || 'Reset failed', 'error');
    }
  } catch (err) {
    showToast('Connection error during reset', 'error');
  }
};

function initDashboardEvents() {
  const openBtn = document.getElementById('open-reset-modal-btn');
  const modal = document.getElementById('reset-stats-modal');
  const confirmBtn = document.getElementById('confirm-reset-btn');
  const cancelBtn = document.getElementById('cancel-reset-btn');
  const modalText = document.getElementById('reset-modal-text');

  let confirmationStep = 1;

  if (openBtn && modal && confirmBtn && cancelBtn) {
    openBtn.addEventListener('click', () => {
      confirmationStep = 1;
      if (modalText) {
        modalText.textContent = 'Are you sure you want to initialize this module data? This action is permanent.';
      }
      if (confirmBtn) {
        confirmBtn.textContent = 'Initialize';
        confirmBtn.style.background = '#ef4444';
      }
      modal.style.display = 'flex';
    });

    const closeModal = () => {
      modal.style.display = 'none';
      confirmationStep = 1;
    };

    cancelBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    confirmBtn.addEventListener('click', async () => {
      if (confirmationStep === 1) {
        confirmationStep = 2;
        if (modalText) {
          modalText.textContent = 'Please confirm once more. This will permanently wipe all order transactions and customer accounts.';
        }
        if (confirmBtn) {
          confirmBtn.textContent = 'Yes, Wipe Everything!';
          confirmBtn.style.background = '#b91c1c';
        }
      } else {
        try {
          confirmBtn.disabled = true;
          confirmBtn.textContent = 'Initializing...';

          const res = await adminFetch('/api/reports/reset-stats', {
            method: 'POST'
          });

          let data;
          try {
            data = await res.json();
          } catch (parseErr) {
            showToast('Server returned an invalid response. Please try again.', 'error');
            return;
          }

          if (data.success) {
            showToast(data.message || 'Module initialization completed!', 'success');
            closeModal();
            // Reload dashboard details
            await loadDashboardData();
          } else {
            showToast(data.error || 'Failed to initialize statistics', 'error');
          }
        } catch (err) {
          showToast('Connection error during metrics reset', 'error');
        } finally {
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Initialize';
          confirmBtn.style.background = '#ef4444';
          confirmationStep = 1;
        }
      }
    });
  }
}

function initInvoiceSearch() {
  const form = document.getElementById('invoice-search-form');
  const resultCard = document.getElementById('invoice-result-card');
  if (!form || !resultCard) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const orderId = document.getElementById('search-order-id').value.trim();
    if (!orderId) return;

    try {
      resultCard.style.display = 'none';
      const res = await adminFetch(`/api/orders/${orderId}`);

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        showToast('Server returned an invalid response. Please try again.', 'error');
        return;
      }

      if (!data.success || !data.order) {
        showToast(data.error || 'Order not found. Please verify the ID.', 'error');
        return;
      }

      const order = data.order;
      const customerName = order.userId ? (order.userId.name || 'Customer') : order.guestDetails?.fullName || 'Guest';
      const customerEmail = order.userId ? (order.userId.email || '') : order.guestDetails?.email || '';
      const customerPhone = order.userId ? (order.userId.phone || '') : order.guestDetails?.phone || '';

      // Interface compilation engine resolving items, quantities, coupon discounts, customer name, delivery address, final price.
      resultCard.innerHTML = `
        <div class="glass" style="padding:30px; border-radius:12px; max-width:800px; margin:auto; border: 1px solid var(--card-border);">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed var(--card-border); padding-bottom:20px; margin-bottom:20px; flex-wrap:wrap; gap:15px;">
            <div>
              <h2 style="font-family:'Outfit'; font-size:24px; color:hsl(var(--primary-purple)); margin:0 0 5px 0;">INVOICE</h2>
              <span style="font-size:13px; color:var(--text-muted);">Order ID: #${order._id}</span>
            </div>
            <div style="text-align:right;">
              <span style="font-size:13px; color:var(--text-muted);">Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}</span><br>
              <span style="font-size:13px; color:var(--text-muted);">Payment: <strong>${order.payment?.status || 'COD'}</strong></span>
            </div>
          </div>

          <div class="grid grid-2" style="gap:20px; margin-bottom:30px;">
            <div>
              <h5 style="font-family:'Outfit'; font-size:12px; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; font-weight:700;">Customer Info</h5>
              <div style="font-size:14px; line-height:1.5;">
                <strong>${customerName}</strong><br>
                ${customerEmail ? `${customerEmail}<br>` : ''}
                ${customerPhone ? `Phone: ${customerPhone}` : ''}
              </div>
            </div>
            <div>
              <h5 style="font-family:'Outfit'; font-size:12px; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; font-weight:700;">Shipping Address</h5>
              <div style="font-size:14px; line-height:1.5;">
                <strong>${order.shippingAddress?.fullName}</strong><br>
                ${order.shippingAddress?.street}${order.shippingAddress?.street2 ? ', ' + order.shippingAddress.street2 : ''}<br>
                ${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.zipCode}<br>
                Phone: ${order.shippingAddress?.phone}
              </div>
            </div>
          </div>

          <div class="table-responsive" style="margin-bottom:30px;">
            <table class="admin-table" style="width:100%;">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align:center;">Price</th>
                  <th style="text-align:center;">Qty</th>
                  <th style="text-align:right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td><strong>${item.name}</strong></td>
                    <td style="text-align:center;">₹${item.price}</td>
                    <td style="text-align:center;">${item.quantity}</td>
                    <td style="text-align:right;">₹${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px; font-size:14px; margin-bottom:30px; line-height:1.6;">
            <div>Subtotal: <strong>₹${order.summary?.subtotal?.toFixed(2)}</strong></div>
            ${order.summary?.discount > 0 ? `<div style="color:#ef4444;">Discount Coupon (${order.couponCode || 'Promo'}): <strong>-₹${order.summary?.discount?.toFixed(2)}</strong></div>` : ''}
            <div>GST (5%): <strong>₹${order.summary?.tax?.toFixed(2)}</strong></div>
            <div>Shipping: <strong>${order.summary?.shipping > 0 ? `₹${order.summary.shipping.toFixed(2)}` : 'FREE'}</strong></div>
            <div style="font-size:18px; font-weight:700; color:hsl(var(--primary-purple)); border-top:1px solid var(--card-border); padding-top:10px; margin-top:5px;">Grand Total: ₹${order.summary?.total?.toFixed(2)}</div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:15px; border-top:1px solid var(--card-border); padding-top:20px;">
            <button type="button" id="print-invoice-btn" class="btn btn-primary" style="border-radius:8px; padding:10px 24px; font-weight:600; cursor:pointer;">Print Invoice</button>
          </div>
        </div>
      `;

      resultCard.style.display = 'block';

      // Attach print action
      document.getElementById('print-invoice-btn').addEventListener('click', () => {
        const printWindow = window.open(`/api/orders/${order._id}/invoice`, '_blank');
        if (printWindow) {
          printWindow.focus();
        } else {
          showToast('Popup blocked! Please allow popups to print.', 'error');
        }
      });

    } catch (err) {
      showToast('Error searching for invoice', 'error');
    }
  });
}

// ─── Feature Control Center Toggle Management ────────────────────────────────
async function loadFeatureToggles() {
  try {
    const res = await adminFetch('/api/settings/feature-toggles');
    const data = await res.json();
    if (!data.success || !data.toggles) return;

    const toggles = data.toggles;
    const toggleMap = {
      wishlistEnabled: { type: 'checkbox', checkbox: 'toggle-wishlistEnabled', status: 'toggle-status-wishlist' },
      couponsEnabled: { type: 'checkbox', checkbox: 'toggle-couponsEnabled', status: 'toggle-status-coupon' },
      registrationEnabled: { type: 'checkbox', checkbox: 'toggle-registrationEnabled', status: 'toggle-status-registration' },
      whatsappCheckoutEnabled: { type: 'checkbox', checkbox: 'toggle-whatsappCheckoutEnabled', status: 'toggle-status-whatsapp' },
      codEnabled: { type: 'checkbox', checkbox: 'toggle-codEnabled', status: 'toggle-status-cod' },
      reviewsEnabled: { type: 'checkbox', checkbox: 'toggle-reviewsEnabled', status: 'toggle-status-reviews' },
      recommendationsEnabled: { type: 'checkbox', checkbox: 'toggle-recommendationsEnabled', status: 'toggle-status-recommendations' },
      promosEnabled: { type: 'checkbox', checkbox: 'toggle-promosEnabled', status: 'toggle-status-promos' },
      announcementBannerEnabled: { type: 'checkbox', checkbox: 'toggle-announcementBannerEnabled', status: 'toggle-status-announcement-banner' },
      homepageLayoutFeatured: { type: 'checkbox', checkbox: 'toggle-homepageLayoutFeatured', status: 'toggle-status-homepageLayoutFeatured' },
      flashSaleActive: { type: 'checkbox', checkbox: 'toggle-flashSaleActive', status: 'toggle-status-flashSaleActive' },
      themeAccentColor: { type: 'color', input: 'toggle-themeAccentColor', status: 'toggle-status-themeAccentColor' }
    };

    for (const [key, prop] of Object.entries(toggleMap)) {
      if (prop.type === 'checkbox') {
        const checkbox = document.getElementById(prop.checkbox);
        const statusBadge = document.getElementById(prop.status);
        const isEnabled = toggles[key] !== false;

        if (checkbox) checkbox.checked = isEnabled;
        if (statusBadge) {
          statusBadge.textContent = isEnabled ? 'Active' : 'Disabled';
          statusBadge.className = `feature-toggle-status ${isEnabled ? 'active' : 'inactive'}`;
        }
      } else if (prop.type === 'color') {
        const input = document.getElementById(prop.input);
        const statusBadge = document.getElementById(prop.status);
        const colorVal = toggles[key] || '#6A0DAD';

        if (input) input.value = colorVal;
        if (statusBadge) {
          statusBadge.textContent = colorVal;
        }
      }
    }

    // Load flash sale inputs
    const fsTextInput = document.getElementById('input-flashSaleText');
    const fsDateInput = document.getElementById('input-flashSaleTargetDate');
    if (fsTextInput) fsTextInput.value = toggles.flashSaleText || '';
    if (fsDateInput) {
      if (toggles.flashSaleTargetDate) {
        const d = new Date(toggles.flashSaleTargetDate);
        const formattedDate = d.getFullYear() + '-' +
          String(d.getMonth() + 1).padStart(2, '0') + '-' +
          String(d.getDate()).padStart(2, '0') + 'T' +
          String(d.getHours()).padStart(2, '0') + ':' +
          String(d.getMinutes()).padStart(2, '0');
        fsDateInput.value = formattedDate;
      } else {
        fsDateInput.value = '';
      }
    }
  } catch (err) {
    console.error('Failed to load feature toggles:', err);
  }
}

async function handleFeatureToggle(key, enabled) {
  try {
    const toggles = {};
    toggles[key] = enabled;

    const res = await adminFetch('/api/settings/feature-toggles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggles })
    });
    const data = await res.json();

    if (data.success) {
      const statusMap = {
        wishlistEnabled: 'toggle-status-wishlist',
        couponsEnabled: 'toggle-status-coupon',
        registrationEnabled: 'toggle-status-registration',
        whatsappCheckoutEnabled: 'toggle-status-whatsapp',
        codEnabled: 'toggle-status-cod',
        reviewsEnabled: 'toggle-status-reviews',
        recommendationsEnabled: 'toggle-status-recommendations',
        promosEnabled: 'toggle-status-promos',
        announcementBannerEnabled: 'toggle-status-announcement-banner',
        homepageLayoutFeatured: 'toggle-status-homepageLayoutFeatured',
        flashSaleActive: 'toggle-status-flashSaleActive',
        themeAccentColor: 'toggle-status-themeAccentColor'
      };
      const labelMap = {
        wishlistEnabled: 'Wishlist System',
        couponsEnabled: 'Coupon Engine',
        registrationEnabled: 'Registration Portal',
        whatsappCheckoutEnabled: 'WhatsApp Checkout',
        codEnabled: 'Cash on Delivery',
        reviewsEnabled: 'Reviews & Ratings',
        recommendationsEnabled: 'Recommendation Engine',
        promosEnabled: 'Flash Sales & Banners',
        announcementBannerEnabled: 'Announcement Banner',
        homepageLayoutFeatured: 'Homepage Featured Curation',
        flashSaleActive: 'Flash Sale Countdown Banner',
        themeAccentColor: 'Theme Accent Color'
      };

      const statusBadge = document.getElementById(statusMap[key]);
      if (statusBadge) {
        if (key === 'themeAccentColor') {
          statusBadge.textContent = enabled;
        } else {
          statusBadge.textContent = enabled ? 'Active' : 'Disabled';
          statusBadge.className = `feature-toggle-status ${enabled ? 'active' : 'inactive'}`;
        }
      }
      showToast(`${labelMap[key] || key} updated successfully!`, 'success');
    } else {
      showToast(data.error || 'Failed to update toggle', 'error');
      revertFeatureToggleUI(key, enabled);
    }
  } catch (err) {
    showToast('Connection error updating toggle', 'error');
    revertFeatureToggleUI(key, enabled);
  }
}

function revertFeatureToggleUI(key, val) {
  if (key === 'themeAccentColor') {
    const input = document.getElementById('toggle-themeAccentColor');
    if (input) input.value = '#6A0DAD';
  } else {
    const checkbox = document.getElementById(`toggle-${key}`);
    if (checkbox) checkbox.checked = !val;
  }
}

window.handleFeatureToggle = handleFeatureToggle;
window.loadFeatureToggles = loadFeatureToggles;

window.handleFlashSaleTextUpdate = async (val) => {
  try {
    const res = await adminFetch('/api/settings/feature-toggles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggles: { flashSaleText: val } })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Flash sale text updated!', 'success');
    } else {
      showToast(data.error || 'Failed to update flash sale text', 'error');
    }
  } catch (err) {
    showToast('Connection error', 'error');
  }
};

window.handleFlashSaleDateUpdate = async (val) => {
  try {
    const res = await adminFetch('/api/settings/feature-toggles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggles: { flashSaleTargetDate: val ? new Date(val) : null } })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Flash sale target date updated!', 'success');
    } else {
      showToast(data.error || 'Failed to update target date', 'error');
    }
  } catch (err) {
    showToast('Connection error', 'error');
  }
};

window.viewCustomerDeepProfile = async (customerId) => {
  try {
    const custRes = await adminFetch('/api/auth/customers');
    const custData = await custRes.json();
    if (!custData.success) {
      showToast('Failed to load customer details', 'error');
      return;
    }
    const customer = custData.customers.find(c => String(c._id) === String(customerId));
    if (!customer) {
      showToast('Customer not found', 'error');
      return;
    }

    // Fetch orders to filter
    const orderRes = await adminFetch('/api/orders');
    const orderData = await orderRes.json();
    const allOrders = orderData.success ? orderData.orders : [];
    const userOrders = allOrders.filter(o => {
      const oUserId = o.userId ? (o.userId._id || o.userId) : null;
      return oUserId && String(oUserId) === String(customerId);
    });

    // Create deep profile modal overlay
    const existingBackdrop = document.getElementById('deep-profile-backdrop');
    if (existingBackdrop) existingBackdrop.remove();
    const existingModal = document.getElementById('deep-profile-modal');
    if (existingModal) existingModal.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'deep-profile-backdrop';
    backdrop.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; backdrop-filter: blur(12px) !important; background: rgba(0, 0, 0, 0.5) !important; z-index: 100008 !important;';

    const modal = document.createElement('div');
    modal.id = 'deep-profile-modal';
    modal.style.cssText = 'position: fixed !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important; z-index: 100009 !important; display: block !important; width: 90% !important; max-width: 700px !important; max-height: 90vh !important; overflow-y: auto !important;';

    const closeModal = () => {
      backdrop.remove();
      modal.remove();
    };
    backdrop.addEventListener('click', closeModal);

    // Format addresses HTML
    let addressesHTML = '<p style="color:var(--text-muted); font-size:13px;">No saved addresses found.</p>';
    if (customer.addresses && customer.addresses.length > 0) {
      addressesHTML = customer.addresses.map((addr, idx) => `
        <div style="background: rgba(0,0,0,0.02); border: 1px solid var(--card-border); border-radius: 8px; padding: 12px; margin-bottom: 10px; font-size: 13px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <strong>${addr.fullName || 'Address #' + (idx + 1)}</strong>
            ${addr.isDefault ? '<span style="font-size: 10px; padding: 2px 6px; background: hsl(var(--primary-purple)); color: white; border-radius: 10px; font-weight: 700;">DEFAULT</span>' : ''}
          </div>
          <div>Phone: ${addr.phone || 'N/A'}</div>
          <div>${addr.street || ''}${addr.street2 ? ', ' + addr.street2 : ''}</div>
          <div>${addr.city || ''}, ${addr.state || ''} - ${addr.zipCode || ''}</div>
        </div>
      `).join('');
    }

    // Format orders history table
    let ordersHTML = '<p style="color:var(--text-muted); font-size:13px; text-align:center; padding: 15px 0;">No order transactions found for this customer.</p>';
    if (userOrders.length > 0) {
      ordersHTML = `
        <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:left;">
          <thead>
            <tr style="border-bottom: 2px solid var(--card-border);">
              <th style="padding:8px 4px;">Order ID</th>
              <th style="padding:8px 4px;">Date</th>
              <th style="padding:8px 4px;">Total</th>
              <th style="padding:8px 4px;">Fulfillment</th>
            </tr>
          </thead>
          <tbody>
            ${userOrders.map(o => `
              <tr style="border-bottom: 1px solid var(--card-border);">
                <td style="padding:8px 4px; font-family:monospace; font-weight:bold; color:hsl(var(--primary-purple));">${o._id}</td>
                <td style="padding:8px 4px;">${new Date(o.createdAt).toLocaleDateString()}</td>
                <td style="padding:8px 4px; font-weight:bold;">${formatPrice(o.summary ? o.summary.total : 0)}</td>
                <td style="padding:8px 4px;">
                  <span style="font-size:10px; padding:2px 6px; border-radius:4px; font-weight:700; background:${o.status === 'Delivered' ? 'rgba(40,167,69,0.1); color:#28a745;' :
          o.status === 'Cancelled' ? 'rgba(220,53,69,0.1); color:#dc3545;' :
            'rgba(255,193,7,0.1); color:#ffc107;'
        }">${o.status}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const formattedDate = new Date(customer.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    modal.innerHTML = `
      <div class="modal-content glass scale-in" style="padding: 30px; border-radius: 16px; position:relative; background:#FAF9F6; border:1px solid var(--card-border); color:var(--text-color);">
        <button id="close-profile-modal-btn" style="position:absolute; top:15px; right:15px; background:transparent; font-size:18px; font-weight:bold; color:var(--text-muted); cursor:pointer; border:none;">✕</button>
        
        <h3 style="font-family:'Outfit'; font-size:24px; margin-bottom:20px; color:hsl(var(--primary-purple)); border-bottom: 2px solid var(--card-border); padding-bottom:10px;">
          Customer Profile Deep-Dive
        </h3>
        
        <div class="grid grid-2" style="gap:20px; margin-bottom:25px; align-items:start;">
          <!-- Left: Metadata -->
          <div style="background:rgba(0,0,0,0.015); padding:16px; border-radius:12px; border:1px solid var(--card-border);">
            <h4 style="font-family:'Outfit'; font-size:15px; margin-bottom:12px; color:hsl(var(--primary-purple)); font-weight:bold;">Metadata Profile</h4>
            <div style="font-size:13px; line-height:1.8; display:flex; flex-direction:column; gap:6px;">
              <div>Name: <strong style="color:var(--text-color);">${customer.name}</strong></div>
              <div>Email: <span style="color:var(--text-muted);">${customer.email}</span></div>
              <div>Phone: <strong style="color:var(--text-color);">${customer.phone || 'No phone number linked'}</strong></div>
              <div>Role: <span style="text-transform:capitalize; padding:2px 8px; font-size:11px; font-weight:700; background:rgba(106,13,173,0.1); color:hsl(var(--primary-purple)); border-radius:10px;">${customer.role}</span></div>
              <div>Registered: <span style="color:var(--text-muted);">${formattedDate}</span></div>
            </div>
          </div>
          
          <!-- Right: Addresses -->
          <div style="background:rgba(0,0,0,0.015); padding:16px; border-radius:12px; border:1px solid var(--card-border);">
            <h4 style="font-family:'Outfit'; font-size:15px; margin-bottom:12px; color:hsl(var(--primary-purple)); font-weight:bold;">Saved Addresses</h4>
            <div style="max-height: 200px; overflow-y:auto; padding-right:5px;">
              ${addressesHTML}
            </div>
          </div>
        </div>
        
        <!-- Bottom: Order History -->
        <div style="background:rgba(0,0,0,0.015); padding:16px; border-radius:12px; border:1px solid var(--card-border);">
          <h4 style="font-family:'Outfit'; font-size:15px; margin-bottom:12px; color:hsl(var(--primary-purple)); font-weight:bold;">Order Transactions History</h4>
          <div style="max-height: 220px; overflow-y:auto; padding-right:5px;">
            ${ordersHTML}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    modal.querySelector('#close-profile-modal-btn').addEventListener('click', closeModal);
  } catch (err) {
    console.error('Error rendering customer deep profile:', err);
    showToast('Error displaying deep profile details', 'error');
  }
};

async function applyAdminBranding() {
  try {
    const res = await adminFetch('/api/settings/homepage');
    const data = await res.json();
    if (data.success && data.setting) {
      const s = data.setting;
      const root = document.documentElement;
      if (s.paletteBgMain) root.style.setProperty('--adm-bg', s.paletteBgMain);
      if (s.paletteBgSurface) {
        root.style.setProperty('--adm-surface', s.paletteBgSurface);
        root.style.setProperty('--adm-card-bg', s.paletteBgSurface);
      }
      if (s.primaryColor) {
        root.style.setProperty('--adm-accent', s.primaryColor);
        // compute a border color or use accent/primary with low opacity
        root.style.setProperty('--adm-border', s.paletteBgSurface === '#ffffff' || s.paletteBgSurface === '#FFFFFF' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)');
      }
      if (s.secondaryColor) root.style.setProperty('--adm-accent-hover', s.secondaryColor);
      if (s.paletteTextMain) root.style.setProperty('--adm-text', s.paletteTextMain);
      if (s.paletteTextMuted) root.style.setProperty('--adm-text-muted', s.paletteTextMuted);
      if (s.paletteColorSuccess) root.style.setProperty('--adm-success', s.paletteColorSuccess);
      if (s.paletteColorError) root.style.setProperty('--adm-danger', s.paletteColorError);
    }
  } catch (err) {
    console.error('Failed to load dynamic admin branding', err);
  }
}

