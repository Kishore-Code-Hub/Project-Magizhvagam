/**
 * MAGIZHVAGAM - Wishlist JS Client
 * Handles wishlist rendering, item deletes, and adding items to the cart
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.validateUserSession === 'function') {
    await window.validateUserSession();
  }
  const user = window.__sessionUser || null;
  if (!user || user.role !== 'customer') {
    return;
  }

  if (typeof syncWishlistFromServer === 'function') {
    await syncWishlistFromServer();
  }
  renderWishlist();

  const container = document.getElementById('wishlist-grid-container');
  if (container) {
    container.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-wishlist-remove]');
      const moveBtn = e.target.closest('[data-wishlist-move]');
      if (removeBtn) {
        removeFromWishlist(
          removeBtn.getAttribute('data-product-id'),
          removeBtn.getAttribute('data-product-name')
        );
      } else if (moveBtn) {
        moveItemToCart(
          moveBtn.getAttribute('data-product-id'),
          moveBtn.getAttribute('data-product-name'),
          Number(moveBtn.getAttribute('data-product-price')),
          moveBtn.getAttribute('data-product-image')
        );
      }
    });
  }
});

window.addEventListener('wishlistUpdated', () => {
  renderWishlist();
});

function renderWishlist() {
  const container = document.getElementById('wishlist-grid-container');
  if (!container) return;

  const wishlist = getWishlist();

  if (wishlist.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding:50px 20px;">
        <h3 style="font-family:'Outfit'; font-size:22px; margin-bottom:12px;">Your Wishlist is Empty</h3>
        <p style="color:var(--text-muted); font-size:14px; margin-bottom:24px;">Save return gifts to purchase later.</p>
        <a href="/products.html" class="btn btn-primary">Browse Catalog</a>
      </div>
    `;
    return;
  }

  container.innerHTML = wishlist.map(item => `
    <div class="product-card glass hover-lift animated scale-in" style="border-radius:16px; overflow:hidden; position:relative; display:flex; flex-direction:column; justify-content:space-between; height:100%;">

      <button type="button" data-wishlist-remove data-product-id="${item.productId}" data-product-name="${encodeURIComponent(item.name)}" style="position:absolute; top:12px; right:12px; width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,0.85); display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:10; border:none; box-shadow:0 2px 5px rgba(0,0,0,0.1);" title="Remove">
        <svg style="width:18px; height:18px; fill:#ef4444; pointer-events:none;" viewBox="0 0 24 24"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>
      </button>

      <div style="height:220px; background:#FAF9F6; display:flex; align-items:center; justify-content:center; border-bottom:1px solid var(--card-border);">
        <a href="/product-details.html?id=${item.productId}" style="width:100%; height:100%;">
          <img src="${item.image || '/assets/images/default-product.webp'}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='/assets/images/default-product.webp'">
        </a>
      </div>

      <div style="padding:20px; display:flex; flex-direction:column; flex-grow:1; justify-content:space-between;">
        <div>
          <a href="/product-details.html?id=${item.productId}">
            <h4 style="font-size:15px; font-family:'Outfit'; font-weight:600; margin-bottom:12px; color:var(--text-color);">${item.name}</h4>
          </a>
        </div>

        <div>
          <div style="display:flex; align-items:baseline; gap:8px; margin-bottom:16px;">
            <span style="font-size:18px; font-weight:800; color:hsl(var(--primary-purple));">${formatPrice(item.price)}</span>
          </div>

          <button type="button" class="btn btn-primary" data-wishlist-move data-product-id="${item.productId}" data-product-name="${encodeURIComponent(item.name)}" data-product-price="${item.price}" data-product-image="${encodeURIComponent(item.image || '/assets/images/default-product.webp')}" style="width:100%; border-radius:8px; padding:8px 16px; font-size:13px;">Move to Cart</button>
        </div>
      </div>
    </div>
  `).join('');
}

window.removeFromWishlist = async (productId, encodedName) => {
  const name = decodeURIComponent(encodedName || '');
  const user = window.__sessionUser || null;

  if (!user || user.role !== 'customer') {
    if (typeof window.showLoginRegisterModal === 'function') {
      window.showLoginRegisterModal('wishlist');
    }
    return;
  }

  try {
    const res = await fetch(`/api/wishlist/items/${productId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
    const data = await res.json();
    if (data.success) {
      if (typeof window.setWishlistCache === 'function') {
        window.setWishlistCache(data.wishlist);
      }
      renderWishlist();
      syncCartCounters();
      window.dispatchEvent(new Event('wishlistUpdated'));
      showToast(`Removed "${name}" from Wishlist`, 'success');
      return;
    }
    showToast(data.error || 'Failed to remove item', 'error');
  } catch (err) {
    console.error('Failed to remove wishlist item:', err);
    showToast('Connection error updating wishlist', 'error');
  }
};

window.moveItemToCart = async (productId, encodedName, price, encodedImage) => {
  const name = decodeURIComponent(encodedName || '');
  const image = decodeURIComponent(encodedImage || '/assets/images/default-product.webp');

  const user = window.__sessionUser || null;
  if (!user || user.role !== 'customer') {
    if (typeof window.showLoginRegisterModal === 'function') {
      window.showLoginRegisterModal('cart');
    }
    return;
  }

  await addToCart(productId, name, price, image, 1, true);

  try {
    const res = await fetch(`/api/wishlist/items/${productId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
    const data = await res.json();
    if (data.success && typeof window.setWishlistCache === 'function') {
      window.setWishlistCache(data.wishlist);
    }
  } catch (err) {
    console.error('Failed to remove item from wishlist after move:', err);
  }

  renderWishlist();
  syncCartCounters();
  window.dispatchEvent(new Event('wishlistUpdated'));
  showToast(`Moved "${name}" to Cart!`, 'success');
};
