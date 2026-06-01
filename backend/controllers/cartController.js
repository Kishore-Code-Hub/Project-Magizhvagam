const User = require('../models/User');

const formatCart = (items) =>
  (items || []).map((item) => ({
    productId: item.productId.toString(),
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: item.quantity
  }));

exports.getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('cartItems');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({ success: true, cart: formatCart(user.cartItems) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Cart fetch error: ${error.message}` });
  }
};

exports.mergeCart = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      const user = await User.findById(req.user._id).select('cartItems');
      return res.status(200).json({ success: true, cart: formatCart(user?.cartItems) });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    for (const incoming of items) {
      if (!incoming?.productId) continue;
      const idx = user.cartItems.findIndex(
        (item) => item.productId.toString() === String(incoming.productId)
      );
      const qty = Math.max(1, Number(incoming.quantity) || 1);
      if (idx > -1) {
        user.cartItems[idx].quantity += qty;
      } else {
        user.cartItems.push({
          productId: incoming.productId,
          name: incoming.name || 'Product',
          price: Number(incoming.price) || 0,
          image: incoming.image || '/assets/images/default-product.webp',
          quantity: qty
        });
      }
    }

    await user.save();
    res.status(200).json({ success: true, cart: formatCart(user.cartItems) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Cart merge error: ${error.message}` });
  }
};

exports.addCartItem = async (req, res) => {
  try {
    const { productId, name, price, image, quantity = 1 } = req.body;
    if (!productId || !name) {
      return res.status(400).json({ success: false, error: 'productId and name are required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const qty = Math.max(1, Number(quantity) || 1);
    const idx = user.cartItems.findIndex((item) => item.productId.toString() === String(productId));

    if (idx > -1) {
      user.cartItems[idx].quantity += qty;
    } else {
      user.cartItems.push({
        productId,
        name,
        price: Number(price) || 0,
        image: image || '/assets/images/default-product.webp',
        quantity: qty
      });
    }

    await user.save();
    res.status(200).json({ success: true, cart: formatCart(user.cartItems) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Add to cart error: ${error.message}` });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const idx = user.cartItems.findIndex(
      (item) => item.productId.toString() === req.params.productId
    );
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Item not in cart' });
    }

    const qty = Number(quantity);
    if (!qty || qty < 1) {
      user.cartItems.splice(idx, 1);
    } else {
      user.cartItems[idx].quantity = qty;
    }

    await user.save();
    res.status(200).json({ success: true, cart: formatCart(user.cartItems) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Update cart error: ${error.message}` });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.cartItems = user.cartItems.filter(
      (item) => item.productId.toString() !== req.params.productId
    );
    await user.save();
    res.status(200).json({ success: true, cart: formatCart(user.cartItems) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Remove cart item error: ${error.message}` });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    user.cartItems = [];
    await user.save();
    res.status(200).json({ success: true, cart: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: `Clear cart error: ${error.message}` });
  }
};
