const prisma = require('../services/prisma');
const { logActivity } = require('../services/auditService');

// @desc    Get dashboard metrics & sales trend logs
// @route   GET /api/reports/dashboard
// @access  Private (Admin Only)
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Core Metrics
    const totalOrders = await prisma.order.count({});
    
    // Revenue is sum of all order totals where payment is Paid
    const paidOrders = await prisma.order.findMany({
      where: { paymentStatus: 'Paid' }
    });
    const totalRevenue = paidOrders.reduce((sum, ord) => sum + ord.summaryTotal, 0);

    const totalCustomers = await prisma.user.count({
      where: { role: 'customer' }
    });
    const totalProducts = await prisma.product.count({});

    // 2. Recent Orders (Last 5)
    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    const compatRecentOrders = recentOrders.map(ord => ({
      ...ord,
      _id: ord.id,
      userId: ord.user ? {
        _id: ord.userId,
        ...ord.user
      } : null,
      summary: {
        total: ord.summaryTotal
      }
    }));

    // 3. Top Selling Products (Aggregated)
    const orders = await prisma.order.findMany({
      where: {
        NOT: { status: 'Cancelled' }
      },
      include: {
        items: true
      }
    });
    const productSales = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const prodId = item.productId;
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
        monthlySales[label] += order.summaryTotal;
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
      recentOrders: compatRecentOrders,
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
    // 1. Clear out all system transactions
    await prisma.order.deleteMany({});

    // 2. Wipe out all customer directory profiles, preserving admin accounts
    await prisma.user.deleteMany({
      where: {
        role: 'customer',
        NOT: { email: 'admin@magizhvagam.com' }
      }
    });

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
