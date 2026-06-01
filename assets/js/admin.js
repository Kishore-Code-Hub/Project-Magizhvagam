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

  injectAdminSidebar();
  
  // Route to page-specific loads
  const path = window.location.pathname;
  if (path.includes('dashboard.html')) {
    loadDashboardData();
  } else if (path.includes('products.html')) {
    loadAdminProducts();
    initProductsPageEvents();
  } else if (path.includes('orders.html')) {
    loadAdminOrders();
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
  const activeCls = (file) => path.includes(file) ? 'active' : '';

  sidebar.className = 'admin-sidebar';
  sidebar.innerHTML = `
    <div class="admin-logo">MAGIZHVAGAM</div>
    <ul class="admin-menu">
      <li class="${activeCls('dashboard.html')}"><a href="/admin/dashboard.html"><i data-lucide="layout-dashboard"></i> Dashboard</a></li>
      <li class="${activeCls('products.html')}"><a href="/admin/products.html"><i data-lucide="gift"></i> Products</a></li>
      <li class="${activeCls('orders.html')}"><a href="/admin/orders.html"><i data-lucide="shopping-bag"></i> Orders</a></li>
      <li class="${activeCls('customers.html')}"><a href="/admin/customers.html"><i data-lucide="users"></i> Customers</a></li>
      <li class="${activeCls('reports.html')}"><a href="/admin/reports.html"><i data-lucide="bar-chart-2"></i> Reports</a></li>
      <li class="${activeCls('settings.html')}"><a href="/admin/settings.html"><i data-lucide="settings"></i> Site Settings</a></li>
      <li style="margin-top:40px; border-top:1px solid rgba(255,255,255,0.08); padding-top:20px;">
        <a href="/index.html" style="color:#FAF9F6;"><i data-lucide="globe"></i> Public Site</a>
      </li>
      <li><a href="#" onclick="window.handleLogout(); return false;" style="color:#ef4444;"><i data-lucide="log-out"></i> Sign Out</a></li>
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

    // Set metrics
    document.getElementById('metric-revenue').textContent = `₹${data.stats.totalRevenue.toLocaleString('en-IN')}`;
    document.getElementById('metric-orders').textContent = data.stats.totalOrders;
    document.getElementById('metric-customers').textContent = data.stats.totalCustomers;
    document.getElementById('metric-products').textContent = data.stats.totalProducts;

    // Render Recent orders list
    const tbody = document.getElementById('recent-orders-tbody');
    if (tbody) {
      if (data.recentOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No orders yet.</td></tr>';
      } else {
        tbody.innerHTML = data.recentOrders.map(o => `
          <tr>
            <td><strong>#${o._id.substr(-6)}</strong></td>
            <td>${o.userId ? o.userId.name : o.guestDetails.fullName}</td>
            <td>${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
            <td>₹${o.summary.total}</td>
            <td><span class="badge ${o.status === 'Delivered' ? 'badge-featured' : 'badge-new'}">${o.status}</span></td>
          </tr>
        `).join('');
      }
    }

    // Render Sales trend chart (Placeholder for simplicity using SVG rendering)
    renderSvgTrendChart(data.chartData);

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
          <button onclick="openProductEditModal('${p._id}')" class="btn btn-secondary" style="padding:4px 10px; font-size:11px; border-radius:4px; border-width:1px; margin-right:6px;">Edit</button>
          <button onclick="duplicateProductById('${p._id}')" class="btn btn-secondary" style="padding:4px 10px; font-size:11px; border-radius:4px; border-width:1px; margin-right:6px;">Clone</button>
          <button onclick="deleteProductById('${p._id}', '${p.name.replace(/'/g, "\\'")}')" class="btn" style="padding:4px 10px; font-size:11px; border-radius:4px; background:#ef4444; color:white;">Delete</button>
        </td>
      </tr>
    `).join('');

    // Pre-populate category dropdowns in Add/Edit forms
    loadCategoriesDropdown();

  } catch (err) {
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

    tbody.innerHTML = data.orders.map(o => `
      <tr>
        <td><strong>#${o._id.substr(-6)}</strong></td>
        <td>${o.userId ? o.userId.name : o.guestDetails.fullName}</td>
        <td>${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
        <td>₹${o.summary.total}</td>
        <td>
          <select onchange="updateOrderStatus('${o._id}', this.value)" style="padding:6px; border-radius:4px; font-size:12px; background:var(--card-bg); color:var(--text-color); border:1px solid var(--card-border); font-weight:600;">
            <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
            <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <a href="/api/orders/${o._id}/invoice" target="_blank" class="btn btn-secondary" style="padding:4px 10px; font-size:11px; border-radius:4px; border-width:1px;">Invoice</a>
        </td>
      </tr>
    `).join('');
  } catch (err) {
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
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;"><div class="spinner" style="margin:auto;"></div></td></tr>';
    const res = await adminFetch('/api/auth/customers');
    const data = await res.json();

    if (!data.success || data.customers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No customers registered.</td></tr>';
      return;
    }

    tbody.innerHTML = data.customers.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.email}</td>
        <td>${c.role}</td>
        <td>${c.orderCount} orders</td>
        <td><strong>₹${c.totalSpent.toLocaleString('en-IN')}</strong></td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('Failed to load customers list', 'error');
  }
}

// 5. Admin Homepage Builder and configuration values loader
async function loadHomepageBuilderSettings() {
  const form = document.getElementById('homepage-builder-form');
  if (!form) return;

  try {
    const res = await adminFetch('/api/settings/homepage');
    const data = await res.json();
    if (data.success && data.setting) {
      const setting = data.setting;
      
      // Load WhatsApp Contact field
      document.getElementById('whatsapp-contact-field').value = setting.whatsappContact || '';
      
      // Load Branding & Appearance fields
      document.getElementById('brand-name-field').value = setting.brandName || '';
      document.getElementById('logo-field').value = setting.logo || '';
      document.getElementById('primary-color-field').value = setting.primaryColor || '#6A0DAD';
      document.getElementById('secondary-color-field').value = setting.secondaryColor || '#FF4F81';
      document.getElementById('accent-color-field').value = setting.accentColor || '#FFD700';
      document.getElementById('font-family-field').value = setting.fontFamily || 'Outfit';
      document.getElementById('button-style-field').value = setting.buttonStyle || 'rounded';
      document.getElementById('footer-content-field').value = setting.footerContent || '';
      document.getElementById('contact-details-field').value = setting.contactDetails || '';
      
      // Load hero slide arrays textareas
      document.getElementById('hero-banners-json').value = JSON.stringify(setting.heroBanners, null, 2);
      document.getElementById('promo-banners-json').value = JSON.stringify(setting.promotionalBanners, null, 2);
      
      // Load curated product list selectors
      document.getElementById('featured-product-ids').value = setting.featuredProductIds.join(', ');
      document.getElementById('bestseller-product-ids').value = setting.bestSellerProductIds.join(', ');
      document.getElementById('newarrival-product-ids').value = setting.newArrivalProductIds.join(', ');

      // Load Testimonials JSON
      document.getElementById('testimonials-json').value = JSON.stringify(setting.testimonials, null, 2);
    }
  } catch (err) {
    showToast('Failed to load homepage builder config', 'error');
  }

  // Register settings save form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = form.querySelector('button[type="submit"]');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving Settings...';

    try {
      const updatedValue = {
        whatsappContact: document.getElementById('whatsapp-contact-field').value.trim(),
        brandName: document.getElementById('brand-name-field').value.trim(),
        logo: document.getElementById('logo-field').value.trim(),
        primaryColor: document.getElementById('primary-color-field').value,
        secondaryColor: document.getElementById('secondary-color-field').value,
        accentColor: document.getElementById('accent-color-field').value,
        fontFamily: document.getElementById('font-family-field').value,
        buttonStyle: document.getElementById('button-style-field').value,
        footerContent: document.getElementById('footer-content-field').value.trim(),
        contactDetails: document.getElementById('contact-details-field').value.trim(),
        heroBanners: JSON.parse(document.getElementById('hero-banners-json').value),
        promotionalBanners: JSON.parse(document.getElementById('promo-banners-json').value),
        featuredProductIds: document.getElementById('featured-product-ids').value.split(',').map(s => s.trim()).filter(Boolean),
        bestSellerProductIds: document.getElementById('bestseller-product-ids').value.split(',').map(s => s.trim()).filter(Boolean),
        newArrivalProductIds: document.getElementById('newarrival-product-ids').value.split(',').map(s => s.trim()).filter(Boolean),
        trendingProductIds: document.getElementById('featured-product-ids').value.split(',').map(s => s.trim()).filter(Boolean),
        recommendedProductIds: document.getElementById('newarrival-product-ids').value.split(',').map(s => s.trim()).filter(Boolean),
        categoryHighlights: [], // Retained or computed
        testimonials: JSON.parse(document.getElementById('testimonials-json').value)
      };

      // Query categories for category highlights backfill
      const catRes = await adminFetch('/api/products/categories');
      const catData = await catRes.json();
      if (catData.success && catData.categories.length > 0) {
        updatedValue.categoryHighlights = catData.categories.slice(0, 4).map(c => c._id);
      }

      const saveRes = await adminFetch('/api/settings/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: updatedValue })
      });
      const saveData = await saveRes.json();
      if (saveData.success) {
        showToast('Homepage settings saved and updated!', 'success');
      } else {
        showToast(saveData.error || 'Failed to save', 'error');
      }
    } catch (error) {
      showToast('Validation failed: check JSON structure formatting', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save All Settings';
    }
  });
}

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

    const revenue = data.stats.totalRevenue || 0;
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

window.resetSettingsToDefault = async () => {
  if (!confirm('Are you sure you want to reset all store custom settings to default?')) return;
  try {
    const res = await adminFetch('/api/settings/homepage/reset', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Settings reset completed!', 'success');
      loadHomepageBuilderSettings();
    } else {
      showToast(data.error || 'Reset failed', 'error');
    }
  } catch (err) {
    showToast('Connection error during reset', 'error');
  }
};
