const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } = require('../config/jwt');

const USER_SAFE_SELECT = '-passwordHash -refreshToken';

// Generate short-lived access token (15 mins)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_ACCESS_SECRET,
    { expiresIn: '3m' }
  );
};

// Generate long-lived refresh token (7 days)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Middleware to protect routes & automatically refresh tokens
const protect = async (req, res, next) => {
  let token = null;
  const refreshToken = req.cookies ? req.cookies.admin_refreshToken : null;

  // Enforce session check if a refresh token exists
  if (refreshToken) {
    const session = await UserSession.findOne({ refreshToken });
    if (!session) {
      // Invalidate cookies immediately if the session has been revoked/deleted
      res.clearCookie('admin_accessToken');
      res.clearCookie('admin_refreshToken');
      return res.status(401).json({ success: false, error: 'Session has been revoked or logged out' });
    }
    // Update last activity
    session.lastActivity = new Date();
    await session.save();
  }

  // 1. Try reading from Authorization Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 2. Try reading from Cookie
  else if (req.cookies && req.cookies.admin_accessToken) {
    token = req.cookies.admin_accessToken;
  }

  if (!token) {
    // If no access token, check for refresh token to try auto-refreshing
    return tryAutoRefresh(req, res, next);
  }

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = await User.findById(decoded.id).select(USER_SAFE_SELECT);
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User associated with this token no longer exists' });
    }
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return tryAutoRefresh(req, res, next);
    }
    return res.status(401).json({ success: false, error: 'Not authorized, token invalid' });
  }
};

// Attempt to auto-refresh access token via refresh token cookie
const tryAutoRefresh = async (req, res, next) => {
  const refreshToken = req.cookies ? req.cookies.admin_refreshToken : null;

  if (!refreshToken) {
    return res.status(401).json({ success: false, error: 'Not authorized, login required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const userDoc = await User.findById(decoded.id);

    const session = await UserSession.findOne({ refreshToken });
    if (!userDoc || !session) {
      res.clearCookie('admin_accessToken');
      res.clearCookie('admin_refreshToken');
      return res.status(401).json({ success: false, error: 'Session expired or revoked, please login again' });
    }

    // Update last activity
    session.lastActivity = new Date();
    await session.save();

    const newAccessToken = generateAccessToken(userDoc);

    res.cookie('admin_accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3 * 60 * 1000
    });

    req.user = await User.findById(decoded.id).select(USER_SAFE_SELECT);
    return next();
  } catch (err) {
    res.clearCookie('admin_accessToken');
    res.clearCookie('admin_refreshToken');
    return res.status(401).json({ success: false, error: 'Session expired, login required' });
  }
};

// Optional auth — never returns 401; attaches req.user when session is valid
const optionalProtect = async (req, res, next) => {
  let token = null;
  const refreshToken = req.cookies ? req.cookies.admin_refreshToken : null;

  if (refreshToken) {
    const session = await UserSession.findOne({ refreshToken });
    if (!session) {
      res.clearCookie('admin_accessToken');
      res.clearCookie('admin_refreshToken');
      req.user = null;
      return next();
    }
    session.lastActivity = new Date();
    await session.save();
  }

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.admin_accessToken) {
    token = req.cookies.admin_accessToken;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = await User.findById(decoded.id).select(USER_SAFE_SELECT);
    if (!req.user) req.user = null;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      if (!refreshToken) {
        req.user = null;
        return next();
      }
      try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const userDoc = await User.findById(decoded.id);
        const session = await UserSession.findOne({ refreshToken });
        if (!userDoc || !session) {
          res.clearCookie('admin_accessToken');
          res.clearCookie('admin_refreshToken');
          req.user = null;
          return next();
        }
        const newAccessToken = generateAccessToken(userDoc);
        res.cookie('admin_accessToken', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 3 * 60 * 1000
        });
        req.user = await User.findById(decoded.id).select(USER_SAFE_SELECT);
        return next();
      } catch {
        req.user = null;
        return next();
      }
    }
    req.user = null;
    return next();
  }
};

// Admin assertion check
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, error: 'Forbidden. Access restricted to admin users only' });
};

const customerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'customer') {
    return next();
  }
  return res.status(403).json({ success: false, error: 'This feature is for customer accounts only' });
};

// Higher-order role validation middleware
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Access denied. Insufficient administrative privileges." });
    }
    next();
  };
};

// Guard to block users with unverified email from state-mutating checkout/wishlist actions
const verifyEmailGuard = (req, res, next) => {
  if (req.user && req.user.role === 'customer' && req.user.emailVerified === false) {
    return res.status(403).json({
      success: false,
      emailVerified: false,
      error: 'Please verify your email address to proceed. Check your inbox for the verification link.'
    });
  }
  next();
};

module.exports = {
  protect,
  optionalProtect,
  adminOnly,
  customerOnly,
  authorizeRoles,
  verifyEmailGuard,
  generateAccessToken,
  generateRefreshToken
};

