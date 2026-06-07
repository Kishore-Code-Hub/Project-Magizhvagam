const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./services/db');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } = require('./config/jwt');

// Route files
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const settingRoutes = require('./routes/settingRoutes');
const reportRoutes = require('./routes/reportRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const adminPageRoutes = require('./routes/adminPageRoutes');

const app = express();

app.use(compression());

// 1. Database Connection
connectDB();

// 2. Global Security Middlewares
// Setup Helmet headers with relaxed policies for fonts/images from third parties (Google Fonts/Cloudinary)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"], // Chart.js, Lucide
      scriptSrcAttr: ["'unsafe-inline'"], // Allow onclick handlers on static HTML pages
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      connectSrc: ["'self'"]
    }
  }
}));

// CORS Configuration
const corsOptions = {
  origin: true, // Allow dynamic resolution of origin
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body Parser & Cookie Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// NoSQL Query Injection Protection
app.use(mongoSanitize());

// Rate Limiting (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200, 
  message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production'
});
app.use('/api', apiLimiter);

// Database health check endpoint
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(isConnected ? 200 : 503).json({
    success: isConnected,
    status: isConnected ? 'UP' : 'DOWN',
    database: {
      status: isConnected ? 'connected' : 'disconnected',
      readyState: mongoose.connection.readyState
    },
    timestamp: new Date()
  });
});
// 3. Rate Limit Auth Routes specifically (max 20 attempts per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  message: { success: false, error: 'Too many auth requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production'
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/admin/login', authLimiter);
// Rate limiting for state-mutating checkout and product write operations
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: { success: false, error: 'Too many checkout requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production' || req.method === 'GET'
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { success: false, error: 'Too many product write requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production' || req.method === 'GET'
});

app.use('/api/orders', checkoutLimiter);
app.use('/api/products', uploadLimiter);

// 3. Mount Backend API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);


// 4. Mount Admin Protected Pages Route Router (MUST BE BEFORE ROOT STATIC ROUTE)
app.use(adminPageRoutes);

// 5. Serve Assets and Uploads statically
app.use('/assets/images/products', express.static(path.join(__dirname, '../assets/images/products')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Fallback for missing images to serve branded default assets
const serveDefaultFallbackImage = (req, res) => {
  const urlPath = req.path.toLowerCase();
  let fallbackFile = 'default-product.webp';
  
  if (urlPath.includes('category')) {
    fallbackFile = 'default-category.webp';
  } else if (urlPath.includes('/products/') || urlPath.includes('product')) {
    fallbackFile = 'products/placeholder.webp';
  } else if (urlPath.includes('banner') || urlPath.includes('hero') || urlPath.includes('promo')) {
    fallbackFile = 'default-banner.webp';
  } else if (urlPath.includes('avatar') || urlPath.includes('user') || urlPath.includes('profile')) {
    fallbackFile = 'default-avatar.webp';
  }

  const fallbackPath = path.join(__dirname, '../assets/images', fallbackFile);
  if (fs.existsSync(fallbackPath)) {
    res.sendFile(fallbackPath);
  } else {
    res.status(404).send('Image Not Found');
  }
};
app.get(['/assets/images/*', '/uploads/*'], serveDefaultFallbackImage);

// Middleware to authenticate customer pages before serving HTML files
const checkCustomerPageAuth = async (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  let token = req.cookies ? req.cookies.admin_accessToken : null;

  if (!token) {
    return res.redirect(`/login.html?redirect=${req.path.slice(1)}`);
  }

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = user;
      return next();
    }
    return res.redirect(`/login.html?redirect=${req.path.slice(1)}`);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const refreshToken = req.cookies ? req.cookies.admin_refreshToken : null;
      if (refreshToken) {
        try {
          const decodedRefresh = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
          const user = await User.findById(decodedRefresh.id);
          if (user) {
            const newAccessToken = jwt.sign(
              { id: user._id, email: user.email, role: user.role },
              JWT_ACCESS_SECRET,
              { expiresIn: '15m' }
            );
            res.cookie('admin_accessToken', newAccessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 15 * 60 * 1000
            });
            req.user = user;
            return next();
          }
        } catch (err) {}
      }
    }
    return res.redirect(`/login.html?redirect=${req.path.slice(1)}`);
  }
};

// 6. Serve Public and Protected HTML Pages Specifically
const customerPages = ['profile.html', 'wishlist.html', 'checkout.html'];
const publicPages = [
  'index.html', 'about.html', 'contact.html', 'products.html', 
  'product-details.html', 'cart.html', 'login.html', 'register.html'
];

customerPages.forEach(page => {
  app.get(`/${page}`, checkCustomerPageAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../', page));
  });
});

publicPages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, '../', page));
  });
});

// Serve sitemap.xml and robots.txt
app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, '../sitemap.xml'));
});
app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname, '../robots.txt'));
});

// Redirect root to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Fallback: 404 handler for unmatched pages
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
  res.status(404).sendFile(path.join(__dirname, '../index.html'));
});

// 7. Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(`SERVER ERROR: ${err.message}\nStack: ${err.stack}`);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
let server;
if (!process.env.VERCEL) {
  server = app.listen(PORT, () => {
    console.log(`MAGIZHVAGAM E-Commerce Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

// Graceful Shutdown implementation
const gracefulShutdown = () => {
  console.log('Initiating graceful shutdown...');
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
        console.log('Server shutdown completed');
        process.exit(0);
      } catch (err) {
        console.error('Error closing database connection:', err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = app;
