const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

// Port declaration — must be before any usage
const PORT = parseInt(process.env.PORT, 10) || 5000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const prisma = require('./services/prisma');
const connectDB = require('./services/db');
const jwt = require('jsonwebtoken');
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
const siteSettingsRoutes = require('./routes/siteSettingsRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const aboutRoutes = require('./routes/aboutRoutes');
const adminSystemRoutes = require('./routes/adminSystemRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();

// Trust Proxy for production
app.set('trust proxy', 1);

// Hide Express/Node identity
app.disable('x-powered-by');
app.set('env', IS_PRODUCTION ? 'production' : 'development');

// ─── SECURITY: Request ID Tracking ───
app.use((req, res, next) => {
  const crypto = require('crypto');
  req.id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
  res.setHeader('X-Request-ID', req.id);
  next();
});

// ─── SECURITY: Request Timeout (15 seconds limit) ───
app.use((req, res, next) => {
  res.setTimeout(15000, () => {
    if (!res.headersSent) {
      res.status(503).json({ success: false, error: 'Request timeout' });
    }
  });
  next();
});

// ─── SECURITY: Slow Request Logging (duration > 5 seconds) ───
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 5000) {
      console.warn(`SLOW REQUEST: [${req.id}] ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
  });
  next();
});

app.use(compression());

// 1. Graceful Shutdown — register BEFORE connecting
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// 2. Database Connection
connectDB()
  .then(() => {
    startServer(PORT);
  })
  .catch((err) => {
    console.error('FATAL: Could not connect to database. Server will not start.', err.message);
    process.exit(1);
  });

// ─── SECURITY: Block access to sensitive files and directories ───
app.use((req, res, next) => {
  const blocked = /^\/(\.(env|git|gitignore|dockerignore)|backend|prisma|node_modules|package\.json|package-lock\.json|tsconfig|docker|backup|logs|\.well-known\/)/i;
  if (blocked.test(req.path)) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  next();
});

// ─── SECURITY: Helmet with hardened CSP & headers ───
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
      connectSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: { policy: 'credentialless' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  originAgentCluster: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: IS_PRODUCTION ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  frameguard: { action: 'deny' },
  noSniff: true
}));

// ─── SECURITY: CORS ───
const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [];
const TRUSTED_ORIGINS = [
  process.env.APP_ORIGIN || 'https://magizhvagam.com',
  'http://localhost:' + PORT,
  'http://localhost:3000',
  'http://127.0.0.1:' + PORT,
  ...envOrigins
];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin && !IS_PRODUCTION) {
      return callback(null, true);
    }
    if (TRUSTED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// ─── SECURITY: Global XSS Input Sanitization ───
const sanitizeInput = (obj) => {
  if (typeof obj === 'string') {
    return obj
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeInput);
  }
  if (typeof obj === 'object' && obj !== null) {
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = sanitizeInput(obj[key]);
    }
    return sanitized;
  }
  return obj;
};

app.use((req, res, next) => {
  if (req.body && !req.path.startsWith('/api/settings') && !req.path.startsWith('/api/site-settings')) {
    req.body = sanitizeInput(req.body);
  }
  next();
});

// ─── SECURITY: Additional headers & dev shielding ───
app.use((req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), interest-cohort=()');
  
  // Shield documentation & dev routes in production
  const urlPath = req.path.toLowerCase();
  if (IS_PRODUCTION && (urlPath.startsWith('/docs') || urlPath.startsWith('/redoc') || urlPath === '/openapi.json')) {
    return res.status(404).json({ success: false, error: 'Endpoint not found' });
  }

  // Cache-Control for API routes
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// ─── RATE LIMITING (always active, no skip) ───
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

// Database health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      status: 'UP',
      database: {
        status: 'connected',
        readyState: 1
      },
      timestamp: new Date()
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'DOWN',
      database: { status: 'disconnected', readyState: 0 },
      timestamp: new Date()
    });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many auth requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/admin/login', authLimiter);
app.use('/api/auth/forgot-password', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, message: { success: false, error: 'Too many password reset requests.' } }));
app.use('/api/auth/verify-otp', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, error: 'Too many OTP verification attempts.' } }));

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many registration attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/register', registerLimiter);

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { success: false, error: 'Too many search requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/products/search', searchLimiter);

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, error: 'Too many checkout requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET'
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, error: 'Too many product write requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET'
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
app.use('/api/site-settings', siteSettingsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/about-page', aboutRoutes);
app.use('/api/admin/system', adminSystemRoutes);
app.use('/api/contact', contactRoutes);

// 4. Mount Admin Protected Pages Router
app.use(adminPageRoutes);

// 5. Serve Assets and Uploads statically (with cache headers)
const staticCacheOptions = { maxAge: IS_PRODUCTION ? '1y' : '0', etag: true };
app.use('/assets/images/products', express.static(path.join(__dirname, '../assets/images/products'), staticCacheOptions));
app.use('/assets', express.static(path.join(__dirname, '../assets'), staticCacheOptions));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), staticCacheOptions));

const serveDefaultFallbackImage = (req, res) => {
  const urlPath = req.path.toLowerCase();
  let fallbackFile = 'default-product.webp';

  if (urlPath.includes('category')) {
    fallbackFile = 'default-category.webp';
  } else if (urlPath.includes('/products/') || urlPath.includes('product')) {
    fallbackFile = 'products/placeholder.webp';
  } else if (urlPath.includes('banner') || urlPath.includes('hero') || urlPath.includes('promo')) {
    fallbackFile = 'products/placeholder.webp';
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

  const isCheckout = req.path === '/checkout';
  const isCart = req.path === '/cart';
  let loginRequired = true;
  if (isCheckout || isCart) {
    try {
      const settingObj = await prisma.setting.findUnique({ where: { key: 'featureToggles' } });
      const toggleVal = settingObj ? (typeof settingObj.value === 'string' ? JSON.parse(settingObj.value) : settingObj.value) : null;
      if (toggleVal && toggleVal.customerLoginRequirement === false) {
        loginRequired = false;
      }
    } catch (err) {
      console.error('Error reading featureToggles in middleware:', err);
    }
  }

  if (!token) {
    if (!loginRequired) {
      return next();
    }
    return res.redirect(`/login?redirect=${req.path.slice(1)}`);
  }

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (user) {
      req.user = user;
      return next();
    }
    if (!loginRequired) {
      return next();
    }
    return res.redirect(`/login?redirect=${req.path.slice(1)}`);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const refreshToken = req.cookies ? req.cookies.admin_refreshToken : null;
      if (refreshToken) {
        try {
          const decodedRefresh = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
          const user = await prisma.user.findUnique({ where: { id: decodedRefresh.id } });
          if (user) {
            const newAccessToken = jwt.sign(
              { id: user.id, email: user.email, role: user.role },
              JWT_ACCESS_SECRET,
              { expiresIn: '3m' }
            );
            res.cookie('admin_accessToken', newAccessToken, {
              httpOnly: true,
              secure: true,
              sameSite: 'strict',
              maxAge: 3 * 60 * 1000
            });
            req.user = user;
            return next();
          }
        } catch (err) { }
      }
    }
    if (!loginRequired) {
      return next();
    }
    return res.redirect(`/login?redirect=${req.path.slice(1)}`);
  }
};

// --- Clean URLs and Backward-Compatible 301 Redirects ---
app.use((req, res, next) => {
  const urlPath = req.path;
  const query = req.query;

  // 301 redirects for legacy HTML files
  if (urlPath === '/index.html') {
    return res.redirect(301, '/');
  }
  if (urlPath === '/products.html') {
    const qs = new URLSearchParams(query).toString();
    return res.redirect(301, `/products${qs ? '?' + qs : ''}`);
  }
  if (urlPath === '/product-details.html') {
    const id = query.id;
    if (id) {
      delete query.id;
      const qs = new URLSearchParams(query).toString();
      return res.redirect(301, `/product/${id}${qs ? '?' + qs : ''}`);
    }
    return res.redirect(301, '/products');
  }
  if (urlPath === '/contact.html') {
    return res.redirect(301, '/contact');
  }
  if (urlPath === '/about.html') {
    return res.redirect(301, '/about');
  }
  if (urlPath === '/login.html') {
    const qs = new URLSearchParams(query).toString();
    return res.redirect(301, `/login${qs ? '?' + qs : ''}`);
  }
  if (urlPath === '/register.html') {
    return res.redirect(301, '/register');
  }
  if (urlPath === '/profile.html') {
    return res.redirect(301, '/account');
  }
  if (urlPath === '/wishlist.html') {
    return res.redirect(301, '/wishlist');
  }
  if (urlPath === '/cart.html') {
    return res.redirect(301, '/cart');
  }
  if (urlPath === '/checkout.html') {
    const qs = new URLSearchParams(query).toString();
    return res.redirect(301, `/checkout${qs ? '?' + qs : ''}`);
  }

  next();
});

// Serve Customer Protected Clean Routes
app.get('/account', checkCustomerPageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../profile.html'));
});
app.get('/wishlist', checkCustomerPageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../wishlist.html'));
});
app.get('/checkout', checkCustomerPageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../checkout.html'));
});

// Serve Public Clean Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});
app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, '../products.html'));
});
app.get('/product/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../product-details.html'));
});
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../contact.html'));
});
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../about.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../login.html'));
});
app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, '../cart.html'));
});

app.get('/signup', async (req, res) => {
  try {
    const settingObj = await prisma.setting.findUnique({ where: { key: 'allowSignup' } });
    const allowSignup = settingObj ? settingObj.value === true : true;
    if (!allowSignup) {
      return res.status(200).send('New registrations are temporarily disabled. Please contact administrator.');
    }
    return res.redirect('/register');
  } catch (err) {
    return res.redirect('/register');
  }
});

app.get('/register', async (req, res) => {
  try {
    const settingObj = await prisma.setting.findUnique({ where: { key: 'allowSignup' } });
    const allowSignup = settingObj ? settingObj.value === true : true;
    if (!allowSignup) {
      return res.status(200).send('New registrations are temporarily disabled. Please contact administrator.');
    }
    res.sendFile(path.join(__dirname, '../', 'register.html'));
  } catch (err) {
    res.sendFile(path.join(__dirname, '../', 'register.html'));
  }
});

app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, '../sitemap.xml'));
});
app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname, '../robots.txt'));
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
  res.status(404).sendFile(path.join(__dirname, '../error.html'));
});

// ─── GLOBAL ERROR HANDLER (sanitized for production) ───
app.use((err, req, res, next) => {
  console.error(`SERVER ERROR: ${err.message}`);
  if (!IS_PRODUCTION && err.stack) console.error(err.stack);

  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  let clientMsg = err.message || 'Internal Server Error';

  if (IS_PRODUCTION && status === 500) {
    clientMsg = 'An unexpected error occurred on the server.';
  } else {
    // Sanitize any potential internal paths or database/SQL leaks
    if (clientMsg.includes('Prisma') || clientMsg.includes('SQL') || clientMsg.includes('database') || clientMsg.includes('pg_')) {
      clientMsg = 'Database operation failed.';
    }
    // Remove directory path leaks
    clientMsg = clientMsg.replace(/[a-zA-Z]:\\[\\\w\s\-\.]+/g, '[PATH]').replace(/\/[a-zA-Z0-9_\-\.]+\//g, '[PATH]');
  }

  res.status(status).json({
    success: false,
    error: clientMsg,
    status,
    data: null
  });
});

// ─── SERVER STARTUP (single instance only — no port auto-increment) ───
let server;
function startServer(port) {
  if (process.env.VERCEL) return;
  server = app.listen(port, () => {
    console.log(`\n  ╔══════════════════════════════════════════╗`);
    console.log(`  ║  MAGIZHVAGAM Server                      ║`);
    console.log(`  ║  Mode: ${(process.env.NODE_ENV || 'development').padEnd(33)}║`);
    console.log(`  ║  Port: ${String(port).padEnd(33)}║`);
    console.log(`  ║  PID:  ${String(process.pid).padEnd(33)}║`);
    console.log(`  ╚══════════════════════════════════════════╝\n`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`\n  FATAL: Port ${port} is already in use.`);
      console.error('  Another instance of the server may be running.');
      console.error('  Kill the existing process or use a different PORT in .env.\n');
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

function gracefulShutdown() {
  console.log('Initiating graceful shutdown...');
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await prisma.$disconnect();
        console.log('PostgreSQL connection closed.');
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
}

module.exports = app;
