/**
 * MAGIZHVAGAM - Checkout JS Client
 * Handles forms steps, checkout totals calculation, mock payment triggers, and API order post
 */

document.addEventListener('DOMContentLoaded', () => {
  initCheckout();
});

function initCheckout() {
  const cart = getCart();
  if (cart.length === 0) {
    showToast('Your cart is empty', 'error');
    window.location.replace('/cart.html');
    return;
  }

  // 1. Populate Order Summary list
  renderSummaryItems();

  // 2. Pre-fill user data if logged in
  let user = null;
  try {
    const stored = localStorage.getItem('magizhvagam_user');
    if (stored && stored !== 'undefined' && stored !== 'null') {
      user = JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to parse stored user for checkout:', err);
  }
  const guestSection = document.getElementById('guest-details-section');
  const memberSection = document.getElementById('member-details-section');
  
  if (user) {
    guestSection.style.display = 'none';
    memberSection.style.display = 'block';
    document.getElementById('member-name').textContent = user.name;
    document.getElementById('member-email').textContent = user.email;
    
    // Auto-fill address if available
    loadStoredUserAddress();
  } else {
    guestSection.style.display = 'block';
    memberSection.style.display = 'none';
  }

  // Calculate pricing aggregates
  calculatePrices();

  // 3. Register submit event
  document.getElementById('checkout-form').addEventListener('submit', handleCheckoutSubmit);
}

function renderSummaryItems() {
  const container = document.getElementById('checkout-items-list');
  if (!container) return;

  const cart = getCart();
  container.innerHTML = cart.map(item => `
    <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; margin-bottom:12px; border-bottom:1px dashed var(--card-border); padding-bottom:8px;">
      <span style="max-width:200px; color:var(--text-color); font-weight:600;">
        ${item.name} <span style="color:var(--text-muted);">x ${item.quantity}</span>
      </span>
      <strong>${formatPrice(item.price * item.quantity)}</strong>
    </div>
  `).join('');
}

function calculatePrices() {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  let discount = 0;
  const coupon = JSON.parse(localStorage.getItem('magizhvagam_applied_coupon'));
  const discRow = document.getElementById('checkout-discount-row');
  const discValEl = document.getElementById('checkout-discount-val');
  
  if (coupon && subtotal >= coupon.minOrderValue) {
    if (coupon.discountType === 'Percentage') {
      discount = subtotal * (coupon.discountValue / 100);
    } else {
      discount = coupon.discountValue;
    }
    discount = Math.min(discount, subtotal);
    discRow.style.display = 'flex';
    discValEl.textContent = `-${formatPrice(discount)}`;
  } else {
    discRow.style.display = 'none';
  }

  const taxable = subtotal - discount;
  const tax = Math.round(taxable * 0.05 * 100) / 100;
  const shipping = taxable >= 1500 ? 0 : 100;
  const total = taxable + tax + shipping;

  document.getElementById('checkout-subtotal').textContent = formatPrice(subtotal);
  document.getElementById('checkout-tax').textContent = formatPrice(tax);
  document.getElementById('checkout-shipping').textContent = shipping === 0 ? 'FREE' : formatPrice(shipping);
  document.getElementById('checkout-total').textContent = formatPrice(total);
}

async function loadStoredUserAddress() {
  try {
    const res = await fetch('/api/auth/profile');
    const data = await res.json();
    if (data.success && data.user.addresses && data.user.addresses.length > 0) {
      const addr = data.user.addresses.find(a => a.isDefault) || data.user.addresses[0];
      document.getElementById('shipping-name').value = addr.fullName || '';
      document.getElementById('shipping-phone').value = addr.phone || '';
      document.getElementById('shipping-street').value = addr.street + (addr.street2 ? ', ' + addr.street2 : '');
      document.getElementById('shipping-city').value = addr.city || '';
      document.getElementById('shipping-state').value = addr.state || '';
      document.getElementById('shipping-zip').value = addr.zipCode || '';
    }
  } catch (err) {
    console.error('Failed to load stored address for checkout:', err);
  }
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('place-order-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Processing Transaction...';

  // Gather details
  const shippingAddress = {
    fullName: document.getElementById('shipping-name').value.trim(),
    phone: document.getElementById('shipping-phone').value.trim(),
    street: document.getElementById('shipping-street').value.trim(),
    city: document.getElementById('shipping-city').value.trim(),
    state: document.getElementById('shipping-state').value.trim(),
    zipCode: document.getElementById('shipping-zip').value.trim()
  };

  const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
  const coupon = JSON.parse(localStorage.getItem('magizhvagam_applied_coupon'));
  const couponCode = coupon ? coupon.code : null;

  const payload = {
    items: getCart().map(item => ({
      productId: item.productId,
      quantity: item.quantity
    })),
    shippingAddress,
    paymentMethod,
    couponCode
  };

  // Add guest details if not logged in
  let user = null;
  try {
    const stored = localStorage.getItem('magizhvagam_user');
    if (stored && stored !== 'undefined' && stored !== 'null') {
      user = JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to parse user for checkout submit:', err);
  }
  if (!user) {
    payload.guestDetails = {
      fullName: document.getElementById('guest-name').value.trim(),
      email: document.getElementById('guest-email').value.trim(),
      phone: document.getElementById('guest-phone').value.trim()
    };
  }

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.success) {
      showToast(data.error || 'Failed to submit order', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Place Order';
      return;
    }

    localStorage.removeItem('magizhvagam_applied_coupon');
    if (typeof window.clearServerCart === 'function') {
      await window.clearServerCart();
    } else {
      localStorage.removeItem('magizhvagam_cart');
      if (typeof syncCartCounters === 'function') syncCartCounters();
    }

    showToast('Order Placed Successfully!', 'success');

    // Render successful invoice summary block
    document.getElementById('checkout-form-wrapper').innerHTML = `
      <div class="glass animated scale-in" style="padding:40px; border-radius:16px; text-align:center;">
        <div style="font-size:48px; margin-bottom:20px;">🎉</div>
        <h2 style="font-family:'Outfit'; font-size:28px; margin-bottom:12px; color:hsl(var(--primary-purple));">Thank You For Your Order!</h2>
        <p style="color:var(--text-muted); font-size:15px; margin-bottom:30px; line-height:1.6;">
          Your order has been recorded. Reference ID: <strong style="color:var(--text-color);">${data.orderId}</strong>.<br>
          A confirmation email was sent to shipping coordinator.
        </p>
        
        <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap;">
          <a href="/products.html" class="btn btn-secondary" style="border-radius:8px;">Continue Shopping</a>
          <a href="/api/orders/${data.orderId}/invoice" target="_blank" class="btn btn-primary" style="border-radius:8px;">Print Invoice</a>
        </div>
      </div>
    `;

    // Reset layout height/scroll
    window.scrollTo({ top: 100, behavior: 'smooth' });

  } catch (err) {
    showToast('Connection error placing order', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Place Order';
  }
}
