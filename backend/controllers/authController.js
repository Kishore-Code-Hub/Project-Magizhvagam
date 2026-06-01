const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const { generateAccessToken, generateRefreshToken } = require('../middleware/authMiddleware');
const { JWT_REFRESH_SECRET } = require('../config/jwt');
const { logActivity } = require('../services/auditService');

// @desc    Register a new customer
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide name, email and password' });
    }

    const emailLower = email.toLowerCase().trim();

    // Verify email formatting
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
    }

    // Verify password minimum length
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    }

    const userExists = await User.findOne({ email: emailLower });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: emailLower,
      passwordHash,
      role: 'customer' // default role
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! You can now log in.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Registration error: ${error.message}` });
  }
};

// @desc    Login user & acquire tokens
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      await logActivity(req, 'login_failure', `Invalid email attempt for: ${email}`);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check account lockout status
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMins = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      await logActivity(req, 'login_lockedout', `Blocked attempt for locked account: ${email}`);
      return res.status(403).json({ success: false, error: `Account is temporarily locked. Try again in ${remainingMins} minutes.` });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      let msg = 'Invalid credentials';
      
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 mins lock
        msg = 'Too many failed attempts. Account locked for 30 minutes.';
        await logActivity(req, 'account_locked', `Account locked after 5 failures: ${email}`);
      } else {
        await logActivity(req, 'login_failure', `Failed login attempt ${user.loginAttempts}/5 for: ${email}`);
      }
      
      await user.save();
      return res.status(401).json({ success: false, error: msg });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Administrator accounts must sign in at /admin/login'
      });
    }

    // Reset attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user model
    user.refreshToken = refreshToken;
    await user.save();

    // Set secure HTTP-Only cookies
    res.cookie('admin_accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('admin_refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Log login success
    await logActivity(req, 'login_success', `Logged in as: ${user.role}`);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Login error: ${error.message}` });
  }
};

// @desc    Admin login & role validation
// @route   POST /api/auth/admin/login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      await logActivity(req, 'login_failure', `Invalid email attempt for: ${email}`);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check role strictly before checking password (or after, but strictly enforce role = 'admin')
    if (user.role !== 'admin') {
      await logActivity(req, 'admin_login_failure', `Unauthorized admin login attempt for: ${email}`);
      return res.status(403).json({ success: false, error: 'Access denied. Administrator account required.' });
    }

    // Check account lockout status
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMins = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      await logActivity(req, 'login_lockedout', `Blocked attempt for locked account: ${email}`);
      return res.status(403).json({ success: false, error: `Account is temporarily locked. Try again in ${remainingMins} minutes.` });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      let msg = 'Invalid credentials';
      
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 mins lock
        msg = 'Too many failed attempts. Account locked for 30 minutes.';
        await logActivity(req, 'account_locked', `Account locked after 5 failures: ${email}`);
      } else {
        await logActivity(req, 'login_failure', `Failed login attempt ${user.loginAttempts}/5 for: ${email}`);
      }
      
      await user.save();
      return res.status(401).json({ success: false, error: msg });
    }

    // Reset attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user model
    user.refreshToken = refreshToken;
    await user.save();

    // Set secure HTTP-Only cookies
    res.cookie('admin_accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('admin_refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Log login success
    await logActivity(req, 'login_success', `Admin logged in successfully`);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Login error: ${error.message}` });
  }
};

// @desc    Log out & clear cookies
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies ? req.cookies.admin_refreshToken : null;

    if (refreshToken) {
      // Clear in Database
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = null;
        await user.save();
        
        // Log logout
        req.user = user; // Attach temporary user reference for logging helper
        await logActivity(req, 'logout', `User signed out`);
      }
    }

    // Clear Cookies with explicit settings matching creation
    res.clearCookie('admin_accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.clearCookie('admin_refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: `Logout error: ${error.message}` });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies ? req.cookies.admin_refreshToken : null;

    if (!refreshToken) {
      return res.status(401).json({ success: false, error: 'No refresh token cookie found' });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, error: 'Invalid or revoked refresh token session' });
    }

    // Issue new access token
    const accessToken = generateAccessToken(user);

    res.cookie('admin_accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.status(200).json({ success: true, accessToken });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Refresh token expired or invalid' });
  }
};

// @desc    Get current session (guest-safe — always 200)
// @route   GET /api/auth/session
// @access  Public
exports.getSession = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(200).json({ success: false, user: null });
    }
    return res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    return res.status(200).json({ success: false, user: null });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, error: `Profile error: ${error.message}` });
  }
};

// @desc    Update profile & addresses
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, addresses } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (email && email.toLowerCase().trim() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
      if (emailExists) {
        return res.status(400).json({ success: false, error: 'Email already in use' });
      }
      user.email = email.toLowerCase().trim();
    }

    if (addresses) {
      user.addresses = addresses.map((addr) => ({
        fullName: addr.fullName,
        phone: addr.phone,
        street: addr.street,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
        country: addr.country || 'India',
        isDefault: !!addr.isDefault
      }));
      const defaultCount = user.addresses.filter((a) => a.isDefault).length;
      if (user.addresses.length && defaultCount !== 1) {
        user.addresses = user.addresses.map((a, i) => ({ ...a, isDefault: i === 0 }));
      }
    }

    await user.save();
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Profile update error: ${error.message}` });
  }
};

// @desc    Get all customers list
// @route   GET /api/auth/customers
// @access  Private (Admin Only)
exports.getCustomers = async (req, res) => {
  try {
    // Retrieve users, sorting customers first
    const users = await User.find({}).select('-passwordHash -refreshToken');
    
    // Supplement customers with order count and total spend
    const customerList = [];
    for (const u of users) {
      const orders = await Order.find({ userId: u._id });
      const orderCount = orders.length;
      const totalSpent = orders.reduce((sum, ord) => sum + ord.summary.total, 0);
      
      customerList.push({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        addresses: u.addresses,
        orderCount,
        totalSpent
      });
    }

    res.status(200).json({ success: true, customers: customerList });
  } catch (error) {
    res.status(500).json({ success: false, error: `Customer list error: ${error.message}` });
  }
};
