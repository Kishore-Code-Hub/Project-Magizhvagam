(function () {
  'use strict';

  let abortController = null;

  async function initCheckoutPage() {
    if (abortController) abortController.abort();
    abortController = new AbortController();
    const signal = abortController.signal;

    const hideLoader = () => {
      const spinner = document.getElementById('loading-overlay') || document.querySelector('.spinner') || document.querySelector('.loading');
      if (spinner) spinner.style.display = 'none';
    };

    try {
      // Await session validation to avoid empty cart redirect race condition
      if (typeof window.validateUserSession === 'function') {
        await window.validateUserSession();
      }
    } catch (err) {
      console.error('Session validation failed during checkout start:', err);
    }

    try {
      initCheckout({ signal });
    } catch (error) {
      console.error('CRITICAL CHECKOUT INITIALIZATION FAILURE:', error);
      hideLoader();
      if (typeof showToast === 'function') {
        showToast('Checkout loading encountered an issue. Please check your profile details.', 'error');
      }
    }
  }

  function destroyCheckoutPage() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  }

  window.MZPageRegistry = window.MZPageRegistry || {};
  window.MZPageRegistry['checkout'] = {
    init: initCheckoutPage,
    destroy: destroyCheckoutPage
  };

function initCheckout(options = {}) {
  try {
    const cart = getCart() || [];
    if (!Array.isArray(cart) || cart.length === 0) {
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
      if (guestSection) guestSection.style.display = 'none';
      if (memberSection) memberSection.style.display = 'block';
      const mName = document.getElementById('member-name');
      if (mName) mName.textContent = user.name || '';
      const mEmail = document.getElementById('member-email');
      if (mEmail) mEmail.textContent = user.email || '';
      
      // Auto-fill address if available
      loadStoredUserAddress();
    } else {
      if (guestSection) guestSection.style.display = 'block';
      if (memberSection) memberSection.style.display = 'none';
    }

    // Calculate pricing aggregates
    calculatePrices();

    // Disable COD if feature is disabled
    const toggles = window.featureToggles || {};
    if (toggles.codEnabled === false) {
      const codOption = Array.from(document.querySelectorAll('.payment-option')).find(el => el.querySelector('input[value="COD"]'));
      if (codOption) {
        codOption.style.opacity = '0.5';
        codOption.style.pointerEvents = 'none';
        const input = codOption.querySelector('input');
        if (input) {
          input.disabled = true;
          input.checked = false;
        }
      }
    }

    // 3. Register submit event
    const form = document.getElementById('checkout-form');
    if (form) {
      form.addEventListener('submit', handleCheckoutSubmit);
    }
    initCheckoutStepsTracker();
  } catch (err) {
    console.error('Error initializing checkout:', err);
    // Gracefully hide any potential loader overlay
    const loader = document.getElementById('loading-overlay') || document.querySelector('.spinner') || document.querySelector('.loading');
    if (loader) loader.style.display = 'none';
  }
}

function renderSummaryItems() {
  const container = document.getElementById('checkout-items-list');
  if (!container) return;

  const cart = getCart() || [];
  container.innerHTML = cart.map(item => `
    <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; margin-bottom:12px; border-bottom:1px dashed var(--card-border); padding-bottom:8px;">
      <span style="max-width:200px; color:var(--text-color); font-weight:600;">
        ${item.name || ''} <span style="color:var(--text-muted);">x ${item.quantity || 1}</span>
      </span>
      <strong>${formatPrice((item.price || 0) * (item.quantity || 1))}</strong>
    </div>
  `).join('');
}

function calculatePrices() {
  try {
    const cart = getCart() || [];
    const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);

    let discount = 0;
    let coupon = null;
    try {
      const couponStored = localStorage.getItem('magizhvagam_applied_coupon');
      if (couponStored && couponStored !== 'undefined') {
        coupon = JSON.parse(couponStored);
      }
    } catch (e) {}
    
    const discRow = document.getElementById('checkout-discount-row');
    const discValEl = document.getElementById('checkout-discount-val');
    
    if (coupon && subtotal >= (coupon.minOrderValue || 0)) {
      if (coupon.discountType === 'Percentage') {
        discount = subtotal * ((coupon.discountValue || 0) / 100);
      } else {
        discount = coupon.discountValue || 0;
      }
      discount = Math.min(discount, subtotal);
      if (discRow) discRow.style.display = 'flex';
      if (discValEl) discValEl.textContent = `-${formatPrice(discount)}`;
    } else {
      if (discRow) discRow.style.display = 'none';
    }

    const taxable = subtotal - discount;
    const tax = Math.round(taxable * 0.05 * 100) / 100;
    const shipping = taxable >= 1500 ? 0 : 100;
    const total = taxable + tax + shipping;

    const subEl = document.getElementById('checkout-subtotal');
    if (subEl) subEl.textContent = formatPrice(subtotal);
    const taxEl = document.getElementById('checkout-tax');
    if (taxEl) taxEl.textContent = formatPrice(tax);
    const shipEl = document.getElementById('checkout-shipping');
    if (shipEl) shipEl.textContent = shipping === 0 ? 'FREE' : formatPrice(shipping);
    const totEl = document.getElementById('checkout-total');
    if (totEl) totEl.textContent = formatPrice(total);
  } catch (err) {
    console.error('Error calculating prices:', err);
  }
}

async function loadStoredUserAddress() {
  try {
    const res = await fetch('/api/auth/profile');
    const data = await res.json().catch(() => ({}));
    if (data.success && data.user && data.user.addresses && data.user.addresses.length > 0) {
      const addr = data.user.addresses.find(a => a.isDefault) || data.user.addresses[0] || {};
      
      const safeSet = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
      };
      
      safeSet('shipping-name', addr.fullName);
      safeSet('shipping-phone', addr.phone);
      
      let streetVal = '';
      if (addr.street) {
        streetVal = addr.street;
        if (addr.street2) {
          streetVal += ', ' + addr.street2;
        }
      }
      safeSet('shipping-street', streetVal);
      safeSet('shipping-city', addr.city);
      safeSet('shipping-state', addr.state);
      safeSet('shipping-zip', addr.zipCode);
    }
  } catch (err) {
    console.error('Failed to load stored address for checkout:', err);
  }
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('place-order-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing Transaction...';
  }

  try {
    // Gather details
    const shippingAddress = {
      fullName: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: ''
    };

    const nameEl = document.getElementById('shipping-name');
    const phoneEl = document.getElementById('shipping-phone');
    const streetEl = document.getElementById('shipping-street');
    const cityEl = document.getElementById('shipping-city');
    const stateEl = document.getElementById('shipping-state');
    const zipEl = document.getElementById('shipping-zip');

    shippingAddress.fullName = nameEl ? nameEl.value.trim() : '';
    shippingAddress.phone = phoneEl ? phoneEl.value.trim() : '';
    shippingAddress.street = streetEl ? streetEl.value.trim() : '';
    shippingAddress.city = cityEl ? cityEl.value.trim() : '';
    shippingAddress.state = stateEl ? stateEl.value.trim() : '';
    shippingAddress.zipCode = zipEl ? zipEl.value.trim() : '';

    let paymentMethod = 'UPI';
    const checkedPayment = document.querySelector('input[name="payment-method"]:checked');
    if (checkedPayment) {
      paymentMethod = checkedPayment.value;
    }
    
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
      const gNameEl = document.getElementById('guest-name');
      const gEmailEl = document.getElementById('guest-email');
      const gPhoneEl = document.getElementById('guest-phone');
      
      payload.guestDetails = {
        fullName: gNameEl ? gNameEl.value.trim() : '',
        email: gEmailEl ? gEmailEl.value.trim() : '',
        phone: gPhoneEl ? gPhoneEl.value.trim() : ''
      };
    }

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      ...options
    });

    const data = await res.json();
    if (!data.success) {
      showToast(data.error || 'Failed to submit order', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Place Order';
      }
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
    const formWrapperEl = document.getElementById('checkout-form-wrapper');
    if (formWrapperEl) {
      formWrapperEl.innerHTML = `
        <div class="glass animated scale-in" style="padding:40px; border-radius:16px; text-align:center;">
          <div style="font-size:48px; margin-bottom:20px;">🎉</div>
          <h2 style="font-family:'Outfit'; font-size:28px; margin-bottom:12px; color:hsl(var(--primary-purple));">Thank You For Your Order!</h2>
          <p style="color:var(--text-muted); font-size:15px; margin-bottom:30px; line-height:1.6;">
            Your order has been recorded. Reference ID: <strong style="color:var(--text-color);">${data.orderId}</strong>.<br>
            A confirmation email was sent to shipping coordinator.
          </p>
          
          <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap;">
            <a href="/products.html" class="btn btn-secondary" style="border-radius:8px;">Continue Shopping</a>
            <a href="/api/orders/${data.id || data.orderId}/invoice" target="_blank" class="btn btn-primary" style="border-radius:8px;">Print Invoice</a>
          </div>
        </div>
      `;
    }

    // Reset layout height/scroll
    window.scrollTo({ top: 100, behavior: 'smooth' });

  } catch (err) {
    console.error('Checkout submit error:', err);
    showToast('Connection error placing order', 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Place Order';
    }
  }
}

// Checkout Steps Progress Tracker Logic
function initCheckoutStepsTracker() {
  const inputs = ['shipping-name', 'shipping-phone', 'shipping-street', 'shipping-city', 'shipping-state', 'shipping-zip'];

  function updateProgress() {
    const stepFill = document.getElementById('step-progress-fill');
    const node1 = document.getElementById('step-node-1');
    const node2 = document.getElementById('step-node-2');
    const node3 = document.getElementById('step-node-3');

    // Check if account details are valid
    const guestEmail = document.getElementById('guest-email')?.value;
    const isLoggedIn = localStorage.getItem('magizhvagam_user') !== null;
    const step1Done = isLoggedIn || (guestEmail && guestEmail.includes('@'));

    // Check if shipping details are valid
    let step2Done = true;
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (!el || !el.value.trim()) step2Done = false;
    });

    // Check if payment option is selected
    const paymentSelected = document.querySelector('input[name="payment-method"]:checked') !== null;

    let progressPercent = 0;
    if (step1Done) {
      progressPercent = 50;
      if (node2) {
        node2.querySelector('.step-circle').style.background = 'hsl(var(--primary-purple))';
        node2.querySelector('.step-circle').style.color = 'white';
        const label2 = document.getElementById('step-label-2');
        if (label2) {
          label2.style.color = 'var(--text-color)';
          label2.style.fontWeight = '700';
        }
      }
    } else {
      if (node2) {
        node2.querySelector('.step-circle').style.background = 'rgba(255,255,255,0.1)';
        node2.querySelector('.step-circle').style.color = 'var(--text-muted)';
        const label2 = document.getElementById('step-label-2');
        if (label2) {
          label2.style.color = 'var(--text-muted)';
          label2.style.fontWeight = '600';
        }
      }
    }

    if (step1Done && step2Done) {
      progressPercent = 100;
      if (node3) {
        node3.querySelector('.step-circle').style.background = 'hsl(var(--primary-purple))';
        node3.querySelector('.step-circle').style.color = 'white';
        const label3 = document.getElementById('step-label-3');
        if (label3) {
          label3.style.color = 'var(--text-color)';
          label3.style.fontWeight = '700';
        }
      }
    } else {
      if (node3) {
        node3.querySelector('.step-circle').style.background = 'rgba(255,255,255,0.1)';
        node3.querySelector('.step-circle').style.color = 'var(--text-muted)';
        const label3 = document.getElementById('step-label-3');
        if (label3) {
          label3.style.color = 'var(--text-muted)';
          label3.style.fontWeight = '600';
        }
      }
    }

    if (stepFill) {
      stepFill.style.width = `${progressPercent}%`;
    }
  }

  // Register listeners on input fields
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateProgress);
    }
  });

  const guestEmailEl = document.getElementById('guest-email');
  if (guestEmailEl) {
    guestEmailEl.addEventListener('input', updateProgress);
  }

  const paymentInputs = document.querySelectorAll('input[name="payment-method"]');
  paymentInputs.forEach(input => {
    input.addEventListener('change', updateProgress);
  });

  // Run initial state check
  setTimeout(updateProgress, 200);
}

})();
