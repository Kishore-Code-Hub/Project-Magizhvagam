const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } = require('../config/jwt');

const USER_SAFE_SELECT = '-passwordHash -refreshToken';

// Generate short-lived access token (15 mins)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
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

    if (!userDoc || userDoc.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, error: 'Session expired, please login again' });
    }

    const newAccessToken = generateAccessToken(userDoc);

    res.cookie('admin_accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    req.user = await User.findById(decoded.id).select(USER_SAFE_SELECT);
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Session expired, login required' });
  }
};

// Optional auth — never returns 401; attaches req.user when session is valid
const optionalProtect = async (req, res, next) => {
  let token = null;

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
      const refreshToken = req.cookies ? req.cookies.admin_refreshToken : null;
      if (!refreshToken) {
        req.user = null;
        return next();
      }
      try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const userDoc = await User.findById(decoded.id);
        if (!userDoc || userDoc.refreshToken !== refreshToken) {
          req.user = null;
          return next();
        }
        const newAccessToken = generateAccessToken(userDoc);
        res.cookie('admin_accessToken', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000
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

module.exports = {
  protect,
  optionalProtect,
  adminOnly,
  customerOnly,
  generateAccessToken,
  generateRefreshToken
};
