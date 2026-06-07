const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const { generateAccessToken, generateRefreshToken } = require('../middleware/authMiddleware');
const { JWT_REFRESH_SECRET } = require('../config/jwt');
const { logActivity } = require('../services/auditService');
const { getFeatureToggleValues } = require('./settingController');

// @desc    Register a new customer
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    // Check if registration is globally enabled
    const toggles = await getFeatureToggleValues();
    if (!toggles.registrationEnabled) {
      return res.status(403).json({ success: false, error: 'This feature is temporarily undergoing holiday maintenance.' });
    }

    const { name, email, phone, password, address1, city, state, pincode } = req.body;

    // Coerce all parameters safely to string primitives before processing
    const nameStr = String(name || '').trim();
    const emailStr = String(email || '').toLowerCase().trim();
    const phoneStr = String(phone || '').trim();
    const passwordStr = String(password || '');
    const address1Str = String(address1 || '').trim();
    const cityStr = String(city || '').trim();
    const stateStr = String(state || '').trim();
    const pincodeStr = String(pincode || '').trim();

    if (!nameStr || !emailStr || !phoneStr || !passwordStr || !address1Str || !cityStr || !stateStr || !pincodeStr) {
      return res.status(400).json({ success: false, error: 'Please provide all required fields including address, pincode, city and state' });
    }

    // Verify email formatting
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
    }

    // Verify phone formatting
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneStr)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10 digit mobile number' });
    }

    // Verify pincode formatting
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!pincodeRegex.test(pincodeStr)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 6 digit Indian pincode' });
    }

    // Verify password minimum length
    if (passwordStr.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    }

    const userExists = await User.findOne({ email: emailStr });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordStr, salt);

    const user = await User.create({
      name: nameStr,
      email: emailStr,
      phone: phoneStr,
      passwordHash,
      address1: address1Str,
      city: cityStr,
      state: stateStr,
      pincode: pincodeStr,
      phoneVerified: true, // OTP verified at registration stage
      role: 'customer', // default role
      addresses: [{
        fullName: nameStr,
        phone: phoneStr,
        street: address1Str,
        city: cityStr,
        state: stateStr,
        zipCode: pincodeStr,
        isDefault: true
      }]
    });

    // Automatically log user in: generate tokens & set cookies
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

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

    await logActivity(req, 'login_success', `Logged in on registration as: ${user.role}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful! You have been logged in.',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        address1: user.address1,
        city: user.city,
        state: user.state,
        pincode: user.pincode
      }
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

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid input format' });
    }

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
        phone: user.phone,
        role: user.role,
        address1: user.address1 || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || ''
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

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid input format' });
    }

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
        phone: user.phone,
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

    const nameStr = name ? String(name).trim() : undefined;
    const emailStr = email ? String(email).toLowerCase().trim() : undefined;

    if (nameStr) user.name = nameStr;
    if (emailStr && emailStr !== user.email) {
      const emailExists = await User.findOne({ email: emailStr });
      if (emailExists) {
        return res.status(400).json({ success: false, error: 'Email already in use' });
      }
      user.email = emailStr;
    }

    if (addresses) {
      const phoneRegex = /^[0-9]{10,15}$/;
      for (const addr of addresses) {
        const fullName = String(addr.fullName || '').trim();
        const phone = String(addr.phone || '').trim();
        const street = String(addr.street || '').trim();
        const city = String(addr.city || '').trim();
        const state = String(addr.state || '').trim();
        const zipCode = String(addr.zipCode || '').trim();

        if (!fullName || !phone || !street || !city || !state || !zipCode) {
          return res.status(400).json({ success: false, error: 'Recipient Name, Phone Number, Address Line 1, City, State, and Postal Code are strictly compulsory' });
        }
        if (!phoneRegex.test(phone)) {
          return res.status(400).json({ success: false, error: 'Please enter a valid 10 digit phone number' });
        }
      }

      user.addresses = addresses.map((addr) => {
        const street2Val = addr.street2 !== undefined && addr.street2 !== null ? String(addr.street2).trim() : '';
        return {
          fullName: String(addr.fullName || '').trim(),
          phone: String(addr.phone || '').trim(),
          street: String(addr.street || '').trim(),
          street2: street2Val,
          city: String(addr.city || '').trim(),
          state: String(addr.state || '').trim(),
          zipCode: String(addr.zipCode || '').trim(),
          country: String(addr.country || 'India').trim(),
          isDefault: !!addr.isDefault
        };
      });
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
        phone: user.phone,
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

// @desc    Add new address
// @route   POST /api/auth/profile/address
// @access  Private
exports.addAddress = async (req, res) => {
  try {
    const { fullName, phone, street, street2, city, state, zipCode, isDefault } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const phoneRegex = /^[0-9]{10,15}$/;
    const fullNameStr = String(fullName || '').trim();
    const phoneStr = String(phone || '').trim();
    const streetStr = String(street || '').trim();
    const street2Str = street2 !== undefined && street2 !== null ? String(street2).trim() : '';
    const cityStr = String(city || '').trim();
    const stateStr = String(state || '').trim();
    const zipCodeStr = String(zipCode || '').trim();

    if (!fullNameStr || !phoneStr || !streetStr || !cityStr || !stateStr || !zipCodeStr) {
      return res.status(400).json({ success: false, error: 'Recipient Name, Phone Number, Address Line 1, City, State, and Postal Code are strictly compulsory' });
    }
    if (!phoneRegex.test(phoneStr)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-15 digit phone number' });
    }

    const newAddress = {
      fullName: fullNameStr,
      phone: phoneStr,
      street: streetStr,
      street2: street2Str,
      city: cityStr,
      state: stateStr,
      zipCode: zipCodeStr,
      isDefault: !!isDefault
    };

    if (newAddress.isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    } else if (user.addresses.length === 0) {
      newAddress.isDefault = true;
    }

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({ success: true, message: 'Address added successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, error: `Add address error: ${error.message}` });
  }
};

// @desc    Update address by ID
// @route   PUT /api/auth/profile/address/:addressId
// @access  Private
exports.updateAddressById = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { fullName, phone, street, street2, city, state, zipCode, isDefault } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    const phoneRegex = /^[0-9]{10,15}$/;
    const fullNameStr = String(fullName || '').trim();
    const phoneStr = String(phone || '').trim();
    const streetStr = String(street || '').trim();
    const street2Str = street2 !== undefined && street2 !== null ? String(street2).trim() : '';
    const cityStr = String(city || '').trim();
    const stateStr = String(state || '').trim();
    const zipCodeStr = String(zipCode || '').trim();

    if (!fullNameStr || !phoneStr || !streetStr || !cityStr || !stateStr || !zipCodeStr) {
      return res.status(400).json({ success: false, error: 'Recipient Name, Phone Number, Address Line 1, City, State, and Postal Code are strictly compulsory' });
    }
    if (!phoneRegex.test(phoneStr)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-15 digit phone number' });
    }

    address.fullName = fullNameStr;
    address.phone = phoneStr;
    address.street = streetStr;
    address.street2 = street2Str;
    address.city = cityStr;
    address.state = stateStr;
    address.zipCode = zipCodeStr;
    address.isDefault = !!isDefault;

    if (address.isDefault) {
      user.addresses.forEach(a => {
        if (a._id.toString() !== addressId) {
          a.isDefault = false;
        }
      });
    } else {
      // Ensure at least one address is default
      const defaultExists = user.addresses.some(a => a.isDefault && a._id.toString() !== addressId);
      if (!defaultExists && user.addresses.length > 0) {
        address.isDefault = true;
      }
    }

    await user.save();
    res.status(200).json({ success: true, message: 'Address updated successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, error: `Update address error: ${error.message}` });
  }
};
