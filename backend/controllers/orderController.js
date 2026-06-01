const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

const canAccessOrder = (order, user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (!order.userId) return false;
  return order.userId.toString() === user._id.toString();
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

    // Determine User context
    let userId = null;
    if (req.user) {
      userId = req.user._id;
    } else if (!guestDetails || !guestDetails.fullName || !guestDetails.email || !guestDetails.phone) {
      return res.status(400).json({ success: false, error: 'Guest checkout requires email, phone, and name' });
    }

    let subtotal = 0;
    const validatedItems = [];

    // Verify stock and fetch prices from Database
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, error: `Product with ID ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, error: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
      }

      const itemPrice = product.discountPrice !== null ? product.discountPrice : product.price;
      subtotal += itemPrice * item.quantity;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: itemPrice,
        quantity: item.quantity,
        image: product.images[0] ? product.images[0].url : '/assets/images/default-product.webp'
      });
    }

    // Coupon calculation
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim(), active: true });
      if (coupon && coupon.expiresAt > new Date() && subtotal >= coupon.minOrderValue) {
        if (coupon.discountType === 'Percentage') {
          discount = subtotal * (coupon.discountValue / 100);
        } else {
          discount = coupon.discountValue;
        }
        // Caps discount at subtotal
        discount = Math.min(discount, subtotal);
      }
    }

    // GST Tax (5%) & Shipping (Flat 100, Free above 1500)
    const tax = Math.round((subtotal - discount) * 0.05 * 100) / 100;
    const shipping = (subtotal - discount) >= 1500 ? 0 : 100;
    const total = Math.round((subtotal - discount + tax + shipping) * 100) / 100;

    // Deduct stock levels in Products collection
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    // Save Order
    const order = await Order.create({
      userId,
      guestDetails: userId ? null : guestDetails,
      items: validatedItems,
      shippingAddress,
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'COD' ? 'Pending' : 'Paid', // Assuming card/upi payments are immediately processed/paid in mock checkout
        transactionId: paymentMethod !== 'COD' ? `TXN-${Date.now()}-${Math.round(Math.random() * 10000)}` : null
      },
      summary: {
        subtotal,
        tax,
        shipping,
        discount,
        total
      },
      couponCode: couponCode || null
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully!',
      orderId: order._id,
      order
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
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: `Order history error: ${error.message}` });
  }
};

// @desc    Get details of a single order
// @route   GET /api/orders/:id
// @access  Private / Public (via guest token check if guest order)
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (!canAccessOrder(order, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: `Fetch order error: ${error.message}` });
  }
};

// @desc    Get all orders list (Admin Dashboard)
// @route   GET /api/orders
// @access  Private (Admin Only)
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('userId', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: `Fetch orders error: ${error.message}` });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin Only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (status) order.status = status;
    if (paymentStatus) order.payment.status = paymentStatus;

    // Refund stock if order is cancelled
    if (status === 'Cancelled' && order.status !== 'Cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity }
        });
      }
    }

    await order.save();
    res.status(200).json({ success: true, message: 'Order status updated successfully', order });
  } catch (error) {
    res.status(500).json({ success: false, error: `Update status error: ${error.message}` });
  }
};

// @desc    Check Coupon validation
// @route   POST /api/orders/check-coupon
// @access  Public
exports.checkCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || !subtotal) {
      return res.status(400).json({ success: false, error: 'Please provide coupon code and order subtotal' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), active: true });
    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Coupon not found or inactive' });
    }

    if (coupon.expiresAt < new Date()) {
      return res.status(400).json({ success: false, error: 'Coupon has expired' });
    }

    if (Number(subtotal) < coupon.minOrderValue) {
      return res.status(400).json({ success: false, error: `Minimum order value for coupon is ₹${coupon.minOrderValue}` });
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
    const order = await Order.findById(req.params.id).populate('userId', 'name email');
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

    const customerName = order.userId ? order.userId.name : order.guestDetails.fullName;
    const customerEmail = order.userId ? order.userId.email : order.guestDetails.email;
    const customerPhone = order.userId ? '' : `Phone: ${order.guestDetails.phone}`;

    // Inline clean print responsive design
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - Order #${order._id}</title>
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
              <div style="font-size: 12px; color: #777;">ID: ${order._id}</div>
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
              ${order.shippingAddress.fullName}<br>
              ${order.shippingAddress.street},<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zipCode}<br>
              Phone: ${order.shippingAddress.phone}
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
            <div>Subtotal: <strong>₹${order.summary.subtotal.toFixed(2)}</strong></div>
            ${order.summary.discount > 0 ? `<div>Discount: <strong style="color: #FF4F81;">-₹${order.summary.discount.toFixed(2)}</strong></div>` : ''}
            <div>GST (5%): <strong>₹${order.summary.tax.toFixed(2)}</strong></div>
            <div>Shipping: <strong>₹${order.summary.shipping > 0 ? `₹${order.summary.shipping.toFixed(2)}` : 'FREE'}</strong></div>
            <div class="total-price">Grand Total: ₹${order.summary.total.toFixed(2)}</div>
          </div>

          <div class="footer">
            Thank you for shopping at <strong>MAGIZHVAGAM</strong>.<br>
            For any queries, contact support at support@magizhvagam.com or WhatsApp us at ${displayPhone}.
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
