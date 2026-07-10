const prisma = require('../services/prisma');

const formatCart = (items) =>
  (items || []).map((item) => ({
    productId: item.productId,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: item.quantity
  }));

exports.getCart = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized: User authentication required' });
  }
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user.id }
    });
    res.status(200).json({ success: true, cart: formatCart(items) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Cart fetch error: ${error.message}` });
  }
};

exports.mergeCart = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized: User authentication required' });
  }
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      const currentItems = await prisma.cartItem.findMany({
        where: { userId: req.user.id }
      });
      return res.status(200).json({ success: true, cart: formatCart(currentItems) });
    }

    // Merge logic inside database transaction for consistency
    await prisma.$transaction(async (tx) => {
      for (const incoming of items) {
        if (!incoming || !incoming.productId) continue;
        const qty = Math.max(1, Number(incoming.quantity) || 1);

        const existing = await tx.cartItem.findFirst({
          where: { userId: req.user.id, productId: incoming.productId }
        });

        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + qty }
          });
        } else {
          await tx.cartItem.create({
            data: {
              userId: req.user.id,
              productId: incoming.productId,
              name: incoming.name || 'Product',
              price: Number(incoming.price) || 0,
              image: incoming.image || '/assets/images/default-product.webp',
              quantity: qty
            }
          });
        }
      }
    });

    const finalItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id }
    });

    res.status(200).json({ success: true, cart: formatCart(finalItems) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Cart merge error: ${error.message}` });
  }
};

exports.addCartItem = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized: User authentication required' });
  }
  try {
    const { productId, name, price, image, quantity = 1 } = req.body;
    if (!productId || !name) {
      return res.status(400).json({ success: false, error: 'productId and name are required' });
    }

    const qty = Math.max(1, Number(quantity) || 1);

    const existing = await prisma.cartItem.findFirst({
      where: { userId: req.user.id, productId }
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + qty }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          userId: req.user.id,
          productId,
          name,
          price: Number(price) || 0,
          image: image || '/assets/images/default-product.webp',
          quantity: qty
        }
      });
    }

    const finalItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id }
    });

    res.status(200).json({ success: true, cart: formatCart(finalItems) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Add to cart error: ${error.message}` });
  }
};

exports.updateCartItem = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized: User authentication required' });
  }
  try {
    const { quantity } = req.body;
    const productId = req.params.productId;

    const existing = await prisma.cartItem.findFirst({
      where: { userId: req.user.id, productId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Item not in cart' });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty < 1) {
      await prisma.cartItem.delete({
        where: { id: existing.id }
      });
    } else {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: qty }
      });
    }

    const finalItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id }
    });

    res.status(200).json({ success: true, cart: formatCart(finalItems) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Update cart error: ${error.message}` });
  }
};

exports.removeCartItem = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized: User authentication required' });
  }
  try {
    await prisma.cartItem.deleteMany({
      where: { userId: req.user.id, productId: req.params.productId }
    });

    const finalItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id }
    });

    res.status(200).json({ success: true, cart: formatCart(finalItems) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Remove cart item error: ${error.message}` });
  }
};

exports.clearCart = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized: User authentication required' });
  }
  try {
    await prisma.cartItem.deleteMany({
      where: { userId: req.user.id }
    });
    res.status(200).json({ success: true, cart: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: `Clear cart error: ${error.message}` });
  }
};
