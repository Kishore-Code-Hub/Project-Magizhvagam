const prisma = require('../services/prisma');
const { getFeatureToggleValues } = require('./settingController');

const WISHLIST_DISABLED_MSG = 'This feature is temporarily disabled.';

const formatWishlist = (items) =>
  (items || []).map((item) => ({
    productId: item.productId,
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

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const items = await prisma.wishlistItem.findMany({
      where: { userId }
    });

    res.status(200).json({ success: true, wishlist: formatWishlist(items) });
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

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      const currentItems = await prisma.wishlistItem.findMany({
        where: { userId }
      });
      return res.status(200).json({ success: true, wishlist: formatWishlist(currentItems) });
    }

    await prisma.$transaction(async (tx) => {
      for (const incoming of items) {
        if (!incoming || !incoming.productId) continue;
        const exists = await tx.wishlistItem.findFirst({
          where: { userId, productId: incoming.productId }
        });
        if (!exists) {
          await tx.wishlistItem.create({
            data: {
              userId,
              productId: incoming.productId,
              name: incoming.name || 'Product',
              price: Number(incoming.price) || 0,
              image: incoming.image || '/assets/images/default-product.webp'
            }
          });
        }
      }
    });

    const finalItems = await prisma.wishlistItem.findMany({
      where: { userId }
    });

    res.status(200).json({ success: true, wishlist: formatWishlist(finalItems) });
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

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const { productId, name, price, image } = req.body;
    if (!productId || !name) {
      return res.status(400).json({ success: false, error: 'productId and name are required' });
    }

    const existing = await prisma.wishlistItem.findFirst({
      where: { userId, productId }
    });
    let added = false;

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { id: existing.id }
      });
    } else {
      await prisma.wishlistItem.create({
        data: {
          userId,
          productId,
          name,
          price: Number(price) || 0,
          image: image || '/assets/images/default-product.webp'
        }
      });
      added = true;
    }

    const finalItems = await prisma.wishlistItem.findMany({
      where: { userId }
    });

    res.status(200).json({
      success: true,
      wishlist: formatWishlist(finalItems),
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

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    await prisma.wishlistItem.deleteMany({
      where: { userId, productId: req.params.productId }
    });

    const finalItems = await prisma.wishlistItem.findMany({
      where: { userId }
    });

    res.status(200).json({ success: true, wishlist: formatWishlist(finalItems) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Remove wishlist item error: ${error.message}` });
  }
};
