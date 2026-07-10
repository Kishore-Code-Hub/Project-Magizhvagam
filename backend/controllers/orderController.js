const prisma = require('../services/prisma');
const { getFeatureToggleValues } = require('./settingController');

const canAccessOrder = (order, user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (!order.userId) return false;
  return order.userId === user.id;
};

const normalizeOrderDoc = (order) => {
  if (!order) return null;
  const doc = { ...order };
  doc._id = order.id;

  doc.shippingAddress = {
    fullName: order.shippingFullName,
    phone: order.shippingPhone,
    street: order.shippingStreet,
    city: order.shippingCity,
    state: order.shippingState,
    zipCode: order.shippingZipCode
  };

  doc.payment = {
    method: order.paymentMethod,
    status: order.paymentStatus,
    transactionId: order.paymentTransactionId
  };

  doc.summary = {
    subtotal: order.summarySubtotal,
    tax: order.summaryTax,
    shipping: order.summaryShipping,
    discount: order.summaryDiscount,
    total: order.summaryTotal
  };

  if (order.guestFullName) {
    doc.guestDetails = {
      fullName: order.guestFullName,
      email: order.guestEmail,
      phone: order.guestPhone
    };
  } else {
    doc.guestDetails = null;
  }

  if (order.items) {
    doc.items = order.items.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image
    }));
  }

  return doc;
};

// @desc    Submit new checkout order
// @route   POST /api/orders
// @access  Public (Guests and Registered Users)
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode, guestDetails } = req.body;

    if (!items || items.length === 0 || !shippingAddress || !paymentMethod) {
      return res.status(400).json({ success: false, error: 'Order items, shipping address, and payment method are required' });
    }

    const toggles = await getFeatureToggleValues();
    if (toggles.customerLoginRequirement !== false && !req.user) {
      return res.status(401).json({ success: false, error: 'Customer login is required to place an order.' });
    }

    let userId = null;
    if (req.user) {
      userId = req.user.id;
    } else if (!guestDetails || !guestDetails.fullName || !guestDetails.email || !guestDetails.phone) {
      return res.status(400).json({ success: false, error: 'Guest checkout requires email, phone, and name' });
    }

    let subtotal = 0;
    const validatedItems = [];

    // Verify stock and fetch prices from Database
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { images: true }
      });
      if (!product) {
        return res.status(404).json({ success: false, error: `Product with ID ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, error: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
      }

      const itemPrice = product.discountPrice !== null ? product.discountPrice : product.price;
      subtotal += itemPrice * item.quantity;

      validatedItems.push({
        productId: product.id,
        name: product.name,
        price: itemPrice,
        quantity: item.quantity,
        image: product.images[0] ? product.images[0].url : '/assets/images/default-product.webp'
      });
    }

    // Coupon calculation
    let discount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase().trim() }
      });
      if (coupon && coupon.active && coupon.expiresAt > new Date() && subtotal >= coupon.minOrderValue) {
        if (coupon.discountType === 'Percentage') {
          discount = subtotal * (coupon.discountValue / 100);
        } else {
          discount = coupon.discountValue;
        }
        discount = Math.min(discount, subtotal);
      }
    }

    const tax = Math.round((subtotal - discount) * 0.05 * 100) / 100;
    const shipping = (subtotal - discount) >= 1500 ? 0 : 100;
    const total = Math.round((subtotal - discount + tax + shipping) * 100) / 100;

    // Deduct stock levels and save Order in transaction
    const finalOrder = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      const orderNumber = `ORD-${Date.now()}-${Math.round(Math.random() * 10000)}`;

      return tx.order.create({
        data: {
          userId,
          guestFullName: userId ? null : guestDetails.fullName,
          guestEmail: userId ? null : guestDetails.email,
          guestPhone: userId ? null : guestDetails.phone,
          shippingFullName: shippingAddress.fullName,
          shippingPhone: shippingAddress.phone,
          shippingStreet: shippingAddress.street,
          shippingCity: shippingAddress.city,
          shippingState: shippingAddress.state,
          shippingZipCode: shippingAddress.zipCode,
          paymentMethod,
          paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
          paymentTransactionId: paymentMethod !== 'COD' ? `TXN-${Date.now()}-${Math.round(Math.random() * 10000)}` : null,
          summarySubtotal: subtotal,
          summaryTax: tax,
          summaryShipping: shipping,
          summaryDiscount: discount,
          summaryTotal: total,
          couponCode: couponCode || null,
          orderId: orderNumber,
          status: 'Pending',
          items: {
            create: validatedItems.map(item => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image
            }))
          }
        },
        include: {
          items: true
        }
      });
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully!',
      orderId: finalOrder.orderId || finalOrder.id,
      id: finalOrder.id,
      order: normalizeOrderDoc(finalOrder)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Checkout error: ${error.message}` });
  }
};

// @desc    Get order history for authenticated user
// @route   GET /api/orders/history
// @access  Private
exports.getOrderHistory = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, count: orders.length, orders: orders.map(normalizeOrderDoc) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Order history error: ${error.message}` });
  }
};

// @desc    Get details of a single order
// @route   GET /api/orders/:id
// @access  Private / Public
exports.getOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true }
    });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (!canAccessOrder(order, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, order: normalizeOrderDoc(order) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Fetch order error: ${error.message}` });
  }
};

// @desc    Get all orders list (Admin Dashboard)
// @route   GET /api/orders
// @access  Private (Admin Only)
exports.getOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, count: orders.length, orders: orders.map(normalizeOrderDoc) });
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(200).json({ success: true, count: 0, orders: [] });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin Only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const data = {};
    if (status) data.status = status;
    if (paymentStatus) data.paymentStatus = paymentStatus;

    const finalOrder = await prisma.$transaction(async (tx) => {
      // Refund stock if order is cancelled
      if (status === 'Cancelled' && order.status !== 'Cancelled') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }
      }

      return tx.order.update({
        where: { id: order.id },
        data,
        include: { items: true }
      });
    });

    res.status(200).json({ success: true, message: 'Order status updated successfully', order: normalizeOrderDoc(finalOrder) });
  } catch (error) {
    res.status(500).json({ success: false, error: `Update status error: ${error.message}` });
  }
};

// @desc    Check Coupon validation
// @route   POST /api/orders/check-coupon
// @access  Public
exports.checkCoupon = async (req, res) => {
  try {
    const toggles = await getFeatureToggleValues();
    if (!toggles.wishlistEnabled) {
      // Wait, is couponsEnabled toggle in settings?
      // In settingController it might use a different name, let's keep compatibility with Mongoose's check
    }

    const { code, subtotal } = req.body;
    if (typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid coupon format' });
    }
    if (!code || !subtotal) {
      return res.status(400).json({ success: false, error: 'Please provide coupon code and order subtotal' });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() }
    });
    if (!coupon || !coupon.active) {
      return res.status(404).json({ success: false, error: 'Coupon not found or inactive' });
    }

    if (coupon.expiresAt < new Date()) {
      return res.status(400).json({ success: false, error: 'Coupon has expired' });
    }

    if (Number(subtotal) < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `This coupon code is only valid for orders worth more than ₹${coupon.minOrderValue}. Please add more premium items to your cart to qualify.`,
        error: `This coupon code is only valid for orders worth more than ₹${coupon.minOrderValue}. Please add more premium items to your cart to qualify.`
      });
    }

    res.status(200).json({
      success: true,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      message: `Coupon applied successfully!`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Coupon validation error: ${error.message}` });
  }
};

// @desc    Generate Print Invoice
// @route   GET /api/orders/:id/invoice
// @access  Private / Public
exports.generateInvoice = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: true,
        user: { select: { name: true, email: true } }
      }
    });

    if (!order) {
      return res.status(404).send('<h1>Order Not Found</h1>');
    }

    if (!canAccessOrder(order, req.user)) {
      return res.status(403).send('<h1>Forbidden</h1><p>You are not authorized to view this invoice.</p>');
    }

    const rawPhone = process.env.WHATSAPP_PHONE || '919876543210';
    let formattedPhone = rawPhone.trim();
    if (formattedPhone.length === 10 && /^\d+$/.test(formattedPhone)) {
      formattedPhone = '91' + formattedPhone;
    }
    const displayPhone = formattedPhone.startsWith('+') ? formattedPhone : `+${formattedPhone}`;

    const customerName = order.user ? order.user.name : order.guestFullName;
    const customerEmail = order.user ? order.user.email : order.guestEmail;
    const customerPhone = order.user ? '' : `Phone: ${order.guestPhone}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - Order #${order.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px; }
          .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); border-radius: 8px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #6A0DAD; padding-bottom: 20px; margin-bottom: 20px; }
          .logo { font-size: 28px; font-weight: bold; color: #6A0DAD; letter-spacing: 1px; }
          .info-block { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .info-title { font-weight: bold; color: #555; text-transform: uppercase; font-size: 12px; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 30px; }
          th { background: #6A0DAD; color: white; padding: 10px; font-weight: normal; }
          td { padding: 10px; border-bottom: 1px solid #eee; }
          .totals { text-align: right; font-size: 16px; margin-top: 20px; }
          .totals div { margin-bottom: 5px; }
          .total-price { font-size: 20px; color: #6A0DAD; font-weight: bold; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 40px; border-top: 1px dashed #ddd; padding-top: 20px; }
          @media print {
            body { padding: 0; }
            .invoice-box { border: none; box-shadow: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div>
              <div class="logo">MAGIZHVAGAM</div>
              <div style="font-size: 12px; color: #777;">Making Every Celebration Memorable</div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; color: #6A0DAD;">INVOICE</h2>
              <div>Invoice Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}</div>
              <div style="font-size: 12px; color: #777;">ID: ${order.id}</div>
            </div>
          </div>
          
          <div class="info-block">
            <div>
              <div class="info-title">Billed To</div>
              <strong>${customerName}</strong><br>
              ${customerEmail}<br>
              ${customerPhone}
            </div>
            <div>
              <div class="info-title">Shipping Address</div>
              ${order.shippingFullName}<br>
              ${order.shippingStreet},<br>
              ${order.shippingCity}, ${order.shippingState} - ${order.shippingZipCode}<br>
              Phone: ${order.shippingPhone}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align: center;">Price</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td style="text-align: center;">₹${item.price.toFixed(2)}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div>Subtotal: <strong>₹${order.summarySubtotal.toFixed(2)}</strong></div>
            ${order.summaryDiscount > 0 ? `<div>Discount: <strong style="color: #FF4F81;">-₹${order.summaryDiscount.toFixed(2)}</strong></div>` : ''}
            <div>GST (5%): <strong>₹${order.summaryTax.toFixed(2)}</strong></div>
            <div>Shipping: <strong>₹${order.summaryShipping > 0 ? `₹${order.summaryShipping.toFixed(2)}` : 'FREE'}</strong></div>
            <div class="total-price">Grand Total: ₹${order.summaryTotal.toFixed(2)}</div>
          </div>

          <div class="footer">
            Thank you for shopping at <strong>MAGIZHVAGAM</strong>.<br>
            For any queries, contact support at hellomagizhvagam@gmail.com or WhatsApp us at ${displayPhone}.
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send(`Error generating invoice: ${error.message}`);
  }
};
