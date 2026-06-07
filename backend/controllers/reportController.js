const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get dashboard metrics & sales trend logs
// @route   GET /api/reports/dashboard
// @access  Private (Admin Only)
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Core Metrics
    const totalOrders = await Order.countDocuments({});
    
    // Revenue is sum of all order totals where payment is Paid
    const paidOrders = await Order.find({ 'payment.status': 'Paid' });
    const totalRevenue = paidOrders.reduce((sum, ord) => sum + ord.summary.total, 0);

    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments({});

    // 2. Recent Orders (Last 5)
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name email');

    // 3. Top Selling Products (Aggregated)
    // Simply fetch orders, tally item purchases
    const orders = await Order.find({ status: { $ne: 'Cancelled' } });
    const productSales = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const prodId = item.productId.toString();
        if (!productSales[prodId]) {
          productSales[prodId] = {
            id: prodId,
            name: item.name,
            qty: 0,
            revenue: 0,
            image: item.image
          };
        }
        productSales[prodId].qty += item.quantity;
        productSales[prodId].revenue += item.price * item.quantity;
      });
    });

    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // 4. Monthly Sales (Past 6 Months Chart)
    const monthlySales = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
      monthlySales[label] = 0;
    }

    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const label = `${months[date.getMonth()]} ${date.getFullYear().toString().substr(-2)}`;
      if (monthlySales[label] !== undefined) {
        monthlySales[label] += order.summary.total;
      }
    });

    const chartData = Object.keys(monthlySales).map(label => ({
      label,
      revenue: Math.round(monthlySales[label] * 100) / 100
    }));

    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCustomers,
        totalProducts
      },
      recentOrders,
      topSellingProducts,
      chartData
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Report aggregation failed: ${error.message}` });
  }
};

// @desc    Reset store metrics and clear all orders (Admin Only)
// @route   POST /api/reports/reset-stats
// @access  Private (Admin Only)
exports.resetStats = async (req, res) => {
  try {
    // Import Order model and audit service logging helper
    const { logActivity } = require('../services/auditService');

    // 1. Clear out all system test transactions and digital invoice records (Orders)
    await Order.deleteMany({});

    // 2. Wipe out all customer directory dummy testing customer profiles, preserving administrator accounts
    await User.deleteMany({ role: 'customer' });

    // Log reset action in audit trail
    await logActivity(req, 'stats_reset', 'Store statistics were reset, orders cleared, and customer profiles wiped by admin');

    res.status(200).json({
      success: true,
      message: 'Store statistics have been reset successfully and customer directory cleared.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Reset statistics failed: ${error.message}` });
  }
};
