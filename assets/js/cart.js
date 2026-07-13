(function () {
  'use strict';

  let cartUpdateHandler = null;

  async function initCartPage() {
    initCart();
    
    // Register global cart updates listener
    if (cartUpdateHandler) {
      window.removeEventListener('cartUpdated', cartUpdateHandler);
    }
    cartUpdateHandler = () => {
      renderCart();
    };
    window.addEventListener('cartUpdated', cartUpdateHandler);
  }

  function destroyCartPage() {
    if (cartUpdateHandler) {
      window.removeEventListener('cartUpdated', cartUpdateHandler);
      cartUpdateHandler = null;
    }
  }

  window.MZPageRegistry = window.MZPageRegistry || {};
  window.MZPageRegistry['cart'] = {
    init: initCartPage,
    destroy: destroyCartPage
  };

function initCart() {
  renderCart();

  // Hide coupon form if feature is disabled
  const toggles = window.featureToggles || {};
  if (toggles.couponsEnabled === false) {
    const couponForm = document.getElementById('coupon-form');
    if (couponForm) couponForm.style.display = 'none';
    localStorage.removeItem('magizhvagam_applied_coupon');
  } else {
    // Register coupon apply form listener
    const couponForm = document.getElementById('coupon-form');
    if (couponForm) {
      couponForm.addEventListener('submit', handleCouponApply);
    }
  }

  // Event delegation for cart actions
  const container = document.getElementById('cart-items-container');
  if (container) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const productId = btn.getAttribute('data-id');
      if (!productId) return;

      if (btn.classList.contains('qty-minus')) {
        changeCartQty(productId, -1);
      } else if (btn.classList.contains('qty-plus')) {
        changeCartQty(productId, 1);
      } else if (btn.classList.contains('cart-remove-btn')) {
        removeFromCart(productId);
      }
    });
  }
}



function renderCart() {
  const container = document.getElementById('cart-items-container');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    if (window.MZError && typeof window.MZError.showEmptyState === 'function') {
      window.MZError.showEmptyState('cart-items-container', {
        type: 'cart',
        title: 'Your Shopping Cart is Empty',
        message: 'Add premium return gifts to begin your celebration planning.',
        ctaLabel: 'Browse Catalog',
        ctaHref: '/products'
      });
    } else {
      container.innerHTML = `
        <div style="text-align:center; padding:50px 20px;">
          <h3 style="font-family:'Outfit'; font-size:22px; margin-bottom:12px;">Your Shopping Cart is Empty</h3>
          <p style="color:var(--text-muted); font-size:14px; margin-bottom:24px;">Add premium return gifts to begin your celebration planning.</p>
          <a href="/products.html" class="btn btn-primary">Browse Catalog</a>
        </div>
      `;
    }
    updateSummary(0);
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="glass cart-item-row" data-product-id="${item.productId}" style="display:flex; justify-content:space-between; align-items:center; padding:16px; margin-bottom:16px; border-radius:12px; flex-wrap:wrap; gap:16px;">
      <div style="display:flex; align-items:center; gap:16px; min-width:260px;">
        <div style="width:70px; height:70px; border-radius:8px; overflow:hidden; border:1px solid var(--card-border);">
          <img src="${item.image || '/assets/images/default-product.webp'}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover;" loading="lazy" onerror="this.src='/assets/images/default-product.webp'">
        </div>
        <div>
          <h4 style="font-family:'Outfit'; font-size:15px; font-weight:600;"><a href="/product/${item.productId}">${item.name}</a></h4>
          <span style="font-size:13px; color:hsl(var(--primary-purple)); font-weight:700;">${formatPrice(item.price)} each</span>
        </div>
      </div>

      <!-- Quantity adjustments -->
      <div style="display:flex; align-items:center; border:1px solid var(--card-border); border-radius:6px; overflow:hidden;">
        <button class="qty-btn qty-minus" data-id="${item.productId}" style="width:30px; height:30px; background:#FAF9F6; cursor:pointer; font-weight:bold; border:none;">-</button>
        <span style="width:40px; text-align:center; font-size:14px; font-weight:700;">${item.quantity}</span>
        <button class="qty-btn qty-plus" data-id="${item.productId}" style="width:30px; height:30px; background:#FAF9F6; cursor:pointer; font-weight:bold; border:none;">+</button>
      </div>

      <!-- Subtotal and actions -->
      <div style="display:flex; align-items:center; gap:20px; min-width:180px; justify-content:flex-end;">
        <strong style="font-size:16px; color:var(--text-color);">${formatPrice(item.price * item.quantity)}</strong>
        <button class="cart-remove-btn" data-id="${item.productId}" style="background:transparent; cursor:pointer; display:flex; border:none;" title="Remove Item">
          <svg style="width:18px; height:18px; fill:#ef4444; pointer-events:none;" viewBox="0 0 24 24"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  // Staggered GSAP reveal for cart item rows
  const rows = container.querySelectorAll('.cart-item-row');
  if (rows.length > 0 && typeof gsap !== 'undefined') {
    gsap.fromTo(rows,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out' }
    );
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  updateSummary(subtotal);
}

window.changeCartQty = async (productId, val) => {
  const cart = getCart();
  const index = cart.findIndex(item => item.productId === productId);
  if (index === -1) return;

  const newQty = Number(cart[index].quantity) + val;
  const user = JSON.parse(localStorage.getItem('magizhvagam_user') || 'null');

  if (user && user.role === 'customer') {
    try {
      const res = await fetch(`/api/cart/items/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ quantity: newQty < 1 ? 1 : newQty })
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data && data.success) {
        if (typeof window.setCartCache === 'function') {
          window.setCartCache(data.cart || []);
        } else {
          localStorage.setItem('magizhvagam_cart', JSON.stringify(data.cart || []));
        }
        renderCart();
        syncCartCounters();
        window.dispatchEvent(new Event('cartUpdated'));
        return;
      }
    } catch (err) {
      console.error('Failed to update cart quantity:', err);
      if (typeof showToast === 'function') {
        showToast('Connection error updating cart quantity', 'error');
      }
    }
  }

  cart[index].quantity = newQty < 1 ? 1 : newQty;
  if (typeof window.setCartCache === 'function') {
    window.setCartCache(cart);
  } else {
    localStorage.setItem('magizhvagam_cart', JSON.stringify(cart));
  }
  renderCart();
  syncCartCounters();
  window.dispatchEvent(new Event('cartUpdated'));
};

window.removeFromCart = async (productId) => {
  const row = document.querySelector(`.cart-item-row[data-product-id="${productId}"]`);
  if (row && typeof gsap !== 'undefined') {
    gsap.to(row, {
      opacity: 0,
      x: -60,
      height: 0,
      padding: 0,
      margin: 0,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        executeRemove();
      }
    });
  } else {
    executeRemove();
  }

  async function executeRemove() {
    const user = JSON.parse(localStorage.getItem('magizhvagam_user') || 'null');

    if (user && user.role === 'customer') {
      try {
        const res = await fetch(`/api/cart/items/${productId}`, {
          method: 'DELETE',
          credentials: 'same-origin'
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (data && data.success) {
          if (typeof window.setCartCache === 'function') {
            window.setCartCache(data.cart || []);
          } else {
            localStorage.setItem('magizhvagam_cart', JSON.stringify(data.cart || []));
          }
          renderCart();
          syncCartCounters();
          window.dispatchEvent(new Event('cartUpdated'));
          showToast('Item removed from cart', 'success');
          return;
        }
      } catch (err) {
        console.error('Failed to remove cart item:', err);
        if (typeof showToast === 'function') {
          showToast('Connection error removing cart item', 'error');
        }
      }
    }

    let cart = getCart().filter(item => item.productId !== productId);
    if (typeof window.setCartCache === 'function') {
      window.setCartCache(cart);
    } else {
      localStorage.setItem('magizhvagam_cart', JSON.stringify(cart));
    }
    renderCart();
    syncCartCounters();
    window.dispatchEvent(new Event('cartUpdated'));
    showToast('Item removed from cart', 'success');
  }
};

function updateSummary(subtotal) {
  const subEl = document.getElementById('summary-subtotal');
  const taxEl = document.getElementById('summary-tax');
  const shipEl = document.getElementById('summary-shipping');
  const discEl = document.getElementById('summary-discount');
  const totEl = document.getElementById('summary-total');
  const discRow = document.getElementById('summary-discount-row');

  if (!subEl) return;

  if (subtotal === 0) {
    subEl.textContent = formatPrice(0);
    taxEl.textContent = formatPrice(0);
    shipEl.textContent = formatPrice(0);
    totEl.textContent = formatPrice(0);
    discRow.style.display = 'none';
    localStorage.removeItem('magizhvagam_applied_coupon');
    return;
  }

  // Load Coupon if any
  let discount = 0;
  const coupon = JSON.parse(localStorage.getItem('magizhvagam_applied_coupon'));
  if (coupon) {
    if (subtotal < coupon.minOrderValue) {
      // Coupon no longer valid because cart total decreased
      localStorage.removeItem('magizhvagam_applied_coupon');
      showToast(`Coupon removed. Min order value was ₹${coupon.minOrderValue}`, 'error');
      discRow.style.display = 'none';
    } else {
      if (coupon.discountType === 'Percentage') {
        discount = subtotal * (coupon.discountValue / 100);
      } else {
        discount = coupon.discountValue;
      }
      discount = Math.min(discount, subtotal);

      discRow.style.display = 'flex';
      discEl.textContent = `-${formatPrice(discount)}`;
    }
  } else {
    discRow.style.display = 'none';
  }

  const taxable = subtotal - discount;
  const tax = Math.round(taxable * 0.05 * 100) / 100; // 5% GST
  const shipping = taxable >= 1500 ? 0 : 100;
  const total = taxable + tax + shipping;

  subEl.textContent = formatPrice(subtotal);
  taxEl.textContent = formatPrice(tax);
  shipEl.textContent = shipping === 0 ? 'FREE' : formatPrice(shipping);
  totEl.textContent = formatPrice(total);
}

async function handleCouponApply(e) {
  e.preventDefault();
  const code = document.getElementById('coupon-code-input').value.toUpperCase().trim();
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const warningBanner = document.getElementById('coupon-warning-banner');

  if (cart.length === 0) {
    showToast('Add items to cart first!', 'error');
    return;
  }

  if (warningBanner) {
    warningBanner.style.display = 'none';
    warningBanner.textContent = '';
  }

  try {
    const res = await fetch('/api/orders/check-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal })
    });
    
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      const errMsg = data.message || data.error || 'Invalid Coupon';
      if (warningBanner) {
        warningBanner.textContent = errMsg;
        warningBanner.style.display = 'block';
      }
      showToast(errMsg, 'error');
      return;
    }

    // Save coupon in localStorage
    localStorage.setItem('magizhvagam_applied_coupon', JSON.stringify({
      code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderValue: data.minOrderValue || 0
    }));

    showToast('Coupon applied successfully!', 'success');
    renderCart();
    document.getElementById('coupon-code-input').value = '';
  } catch (err) {
    console.error(err);
    if (warningBanner) {
      warningBanner.textContent = 'Connection error applying coupon. Please try again.';
      warningBanner.style.display = 'block';
    }
    showToast('Connection error applying coupon', 'error');
  }
}

window.proceedToCheckout = async () => {
  const user = typeof getStoredUser === 'function' ? getStoredUser() : null;
  const toggles = window.featureToggles || {};
  const loginRequired = !(toggles.customerLoginRequirement === false);

  if (!user && loginRequired) {
    showToast('Please login or create a customer account to continue.', 'error');
    if (typeof window.showLoginRegisterModal === 'function') {
      window.showLoginRegisterModal('cart');
    }
    return;
  }
  const cart = getCart();
  if (cart.length === 0) {
    showToast('Your cart is empty', 'error');
    return;
  }

  if (toggles.whatsappCheckoutEnabled) {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const appliedCoupon = JSON.parse(localStorage.getItem('magizhvagam_applied_coupon'));
    let discount = 0;
    if (appliedCoupon && subtotal >= appliedCoupon.minOrderValue) {
      if (appliedCoupon.discountType === 'Percentage') {
        discount = subtotal * (appliedCoupon.discountValue / 100);
      } else {
        discount = appliedCoupon.discountValue;
      }
    }
    const taxable = subtotal - discount;
    const tax = Math.round(taxable * 0.05 * 100) / 100;
    const shipping = taxable >= 1500 ? 0 : 100;
    const total = taxable + tax + shipping;

    const itemsStr = cart.map((item, idx) => {
      const lineTotal = item.price * item.quantity;
      return `${idx + 1}.\nProduct ID/SKU: ${item.productId || item.sku || 'N/A'}\nProduct Name: ${item.name}\nQuantity: ${item.quantity}\nUnit Price: \u20B9${item.price}\nLine Total: \u20B9${lineTotal}`;
    }).join('\n\n');

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const triggerWhatsAppRedirect = async (customerName, customerPhone) => {
      let whatsappNumber = '919876543210';
      try {
        const settings = typeof fetchSettings === 'function' ? await fetchSettings() : null;
        if (settings && settings.whatsappContact) {
          whatsappNumber = settings.whatsappContact;
        }
      } catch (err) { }

      let fullAddrText = 'Not provided (Guest)';
      if (user) {
        const selectedAddressObj = (typeof currentSelectedAddress !== 'undefined' ? currentSelectedAddress : null) || (user.addresses && user.addresses.find(a => a.isDefault)) || (user.addresses && user.addresses[0]) || null;
        if (selectedAddressObj) {
          const street2Text = selectedAddressObj.street2 ? `, ${selectedAddressObj.street2}` : '';
          fullAddrText = `${selectedAddressObj.street || ''}${street2Text}, ${selectedAddressObj.city || ''}, ${selectedAddressObj.state || ''} - ${selectedAddressObj.zipCode || ''}`;
        } else if (user.address1) {
          fullAddrText = `${user.address1}, ${user.city || ''}, ${user.state || ''} - ${user.pincode || ''}`;
        } else {
          fullAddrText = 'No shipping address provided.';
        }
      }

      const message = `🛍️ *MAGIZHVAGAM ORDER REQUEST*\n\n━━━━━━━━━━━━━━\n\n📦 *PRODUCTS*\n\n${itemsStr}\n\n━━━━━━━━━━━━━━\n\n💰 *ORDER SUMMARY*\n\nSubtotal: \u20B9${subtotal}\nDiscount: -\u20B9${discount}\nTax (5%): \u20B9${tax}\nShipping: ${shipping === 0 ? 'FREE' : '\u20B9' + shipping}\n*Grand Total: \u20B9${total}*\n\n━━━━━━━━━━━━━━\n\n👤 *CUSTOMER DETAILS*\n\nName: ${customerName}\nPhone: ${customerPhone}\nEmail: ${user ? (user.email || 'N/A') : 'N/A'}\nAddress: ${fullAddrText}\n\n━━━━━━━━━━━━━━\n\n_Please confirm availability and order processing._`;

      // Clear cart cache locally and on server
      localStorage.removeItem('magizhvagam_applied_coupon');
      if (typeof window.clearServerCart === 'function') {
        await window.clearServerCart();
      } else {
        const userKey = `magizhvagam_cart_${user ? (user.id || user._id || '') : ''}`;
        localStorage.removeItem(userKey);
        localStorage.removeItem('magizhvagam_cart');
        localStorage.removeItem('magizhvagam_guest_cart');
        if (typeof syncCartCounters === 'function') syncCartCounters();
      }

      window.dispatchEvent(new Event('cartUpdated'));

      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    };

    if (typeof window.showWhatsAppConfirmationModal === 'function') {
      window.showWhatsAppConfirmationModal({ itemCount: totalCount, totalPrice: total }, triggerWhatsAppRedirect);
    } else {
      const customerName = user ? user.name : 'Guest Customer';
      const customerPhone = user ? (user.phone || user.phoneNumber || user.mobile || 'Not provided') : 'Not provided';
      triggerWhatsAppRedirect(customerName, customerPhone);
    }
    return;
  }

  window.location.href = '/checkout.html';
};

})();
