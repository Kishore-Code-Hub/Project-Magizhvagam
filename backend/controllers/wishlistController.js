const User = require('../models/User');
const { getFeatureToggleValues } = require('./settingController');

const WISHLIST_DISABLED_MSG = 'This feature is temporarily undergoing holiday maintenance.';

const formatWishlist = (items) =>
  (items || []).map((item) => ({
    productId: item.productId.toString(),
    name: item.name,
    price: item.price,
    image: item.image
  }));

exports.getWishlist = async (req, res) => {
  try {
    const toggles = await getFeatureToggleValues();
    if (!toggles.wishlistEnabled) {
      return res.status(403).json({ success: false, error: WISHLIST_DISABLED_MSG });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const user = await User.findById(userId).select('wishlistItems');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({ success: true, wishlist: formatWishlist(user.wishlistItems) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Wishlist fetch error: ${error.message}` });
  }
};

exports.mergeWishlist = async (req, res) => {
  try {
    const toggles = await getFeatureToggleValues();
    if (!toggles.wishlistEnabled) {
      return res.status(403).json({ success: false, error: WISHLIST_DISABLED_MSG });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      const user = await User.findById(userId).select('wishlistItems');
      return res.status(200).json({ success: true, wishlist: formatWishlist(user?.wishlistItems) });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    for (const incoming of items) {
      if (!incoming?.productId) continue;
      const exists = user.wishlistItems.some(
        (item) => item.productId.toString() === String(incoming.productId)
      );
      if (!exists) {
        user.wishlistItems.push({
          productId: incoming.productId,
          name: incoming.name || 'Product',
          price: Number(incoming.price) || 0,
          image: incoming.image || '/assets/images/default-product.webp'
        });
      }
    }

    await user.save();
    res.status(200).json({ success: true, wishlist: formatWishlist(user.wishlistItems) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Wishlist merge error: ${error.message}` });
  }
};

exports.addWishlistItem = async (req, res) => {
  try {
    const toggles = await getFeatureToggleValues();
    if (!toggles.wishlistEnabled) {
      return res.status(403).json({ success: false, error: WISHLIST_DISABLED_MSG });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const { productId, name, price, image } = req.body;
    if (!productId || !name) {
      return res.status(400).json({ success: false, error: 'productId and name are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const idx = user.wishlistItems.findIndex(
      (item) => item.productId.toString() === String(productId)
    );
    let added = false;

    if (idx > -1) {
      user.wishlistItems.splice(idx, 1);
    } else {
      user.wishlistItems.push({
        productId,
        name,
        price: Number(price) || 0,
        image: image || '/assets/images/default-product.webp'
      });
      added = true;
    }

    await user.save();
    res.status(200).json({
      success: true,
      wishlist: formatWishlist(user.wishlistItems),
      added
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Wishlist toggle error: ${error.message}` });
  }
};

exports.removeWishlistItem = async (req, res) => {
  try {
    const toggles = await getFeatureToggleValues();
    if (!toggles.wishlistEnabled) {
      return res.status(403).json({ success: false, error: WISHLIST_DISABLED_MSG });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.wishlistItems = user.wishlistItems.filter(
      (item) => item.productId.toString() !== req.params.productId
    );
    await user.save();
    res.status(200).json({ success: true, wishlist: formatWishlist(user.wishlistItems) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Remove wishlist item error: ${error.message}` });
  }
};
