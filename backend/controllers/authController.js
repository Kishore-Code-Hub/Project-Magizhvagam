const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const https = require('https');
const User = require('../models/User');
const UnverifiedStage = require('../models/UnverifiedStage');
const Order = require('../models/Order');
const { generateAccessToken, generateRefreshToken } = require('../middleware/authMiddleware');
const { JWT_REFRESH_SECRET } = require('../config/jwt');
const { logActivity } = require('../services/auditService');
const { getFeatureToggleValues } = require('./settingController');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');


// @desc    Register a new customer
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const Setting = require('../models/Setting');
    const settingObj = await Setting.findOne({ key: 'allowSignup' });
    const allowSignup = settingObj ? settingObj.value === true : true;
    
    const toggles = await getFeatureToggleValues();
    if (!toggles.registrationEnabled || !allowSignup) {
      return res.status(403).json({ success: false, error: 'New registrations are temporarily disabled. Please contact administrator.' });
    }

    const { name, email, phone, password } = req.body;

    const nameStr = String(name || '').trim();
    const emailStr = String(email || '').toLowerCase().trim();
    const phoneStr = String(phone || '').trim();
    const passwordStr = String(password || '');

    if (!nameStr || !emailStr || !phoneStr || !passwordStr) {
      return res.status(400).json({ success: false, error: 'Please provide all required fields including name, email, phone, and password' });
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

    // Enterprise Password strength checking
    const strengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!strengthRegex.test(passwordStr)) {
      return res.status(400).json({ success: false, error: 'Password does not meet enterprise strength criteria: minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 numerical digit, and 1 special symbol.' });
    }

    const userExists = await User.findOne({ email: emailStr });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordStr, salt);

    // Generate Verification OTP (5-minute expiry)
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Write parameters into the temporary staging area collection
    await UnverifiedStage.findOneAndUpdate(
      { email: emailStr },
      {
        name: nameStr,
        email: emailStr,
        phone: phoneStr,
        password: hashedPassword,
        passwordHash: hashedPassword,
        address1: '',
        city: '',
        state: '',
        pincode: '',
        verificationToken,
        verificationTokenExpires
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send Verification Email
    await sendVerificationEmail(emailStr, verificationToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful! A verification email has been sent to your email address. Please verify your email before logging in.'
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
    console.log('[DEBUG AUTH] Incoming admin login email:', email);

    if (typeof email !== 'string' || typeof password !== 'string') {
      console.log('[DEBUG AUTH] Rejection: Invalid input format');
      return res.status(400).json({ success: false, error: 'Invalid input format' });
    }

    if (!email || !password) {
      console.log('[DEBUG AUTH] Rejection: Missing email or password');
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log('[DEBUG AUTH] Rejection: User not found in database');
      await logActivity(req, 'login_failure', `Invalid email attempt for: ${email}`);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    console.log('[DEBUG AUTH] User found:', {
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
      hasPasswordHash: !!user.passwordHash,
      passwordVal: user.password ? user.password.substring(0, 10) + '...' : 'none',
      passwordHashVal: user.passwordHash ? user.passwordHash.substring(0, 10) + '...' : 'none'
    });

    // Check role strictly before checking password (or after, but strictly enforce role = 'admin')
    if (user.role !== 'admin') {
      console.log('[DEBUG AUTH] Rejection: User role is not admin. Role is:', user.role);
      await logActivity(req, 'admin_login_failure', `Unauthorized admin login attempt for: ${email}`);
      return res.status(403).json({ success: false, error: 'Access denied. Administrator account required.' });
    }

    // Check account lockout status
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMins = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      console.log('[DEBUG AUTH] Rejection: Account locked out until:', user.lockUntil);
      await logActivity(req, 'login_lockedout', `Blocked attempt for locked account: ${email}`);
      return res.status(403).json({ success: false, error: `Account is temporarily locked. Try again in ${remainingMins} minutes.` });
    }

    const targetHash = user.password || user.passwordHash || '';
    const isMatch = await bcrypt.compare(password, targetHash);
    console.log('[DEBUG AUTH] Bcrypt comparison isMatch:', isMatch);
    
    if (!isMatch) {
      console.log('[DEBUG AUTH] Rejection: Password bcrypt comparison failed');
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

    console.log('[DEBUG AUTH] Success: Password matched. Proceeding with tokens.');

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
        totalSpent,
        emailVerified: u.emailVerified,
        loginAttempts: u.loginAttempts || 0,
        lockUntil: u.lockUntil
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

// ─── NEW ENTERPRISE SECURITY & OAUTH HANDLERS ─────────────────────────────────

// @desc    Register a new customer with password strength validation and verification token
// @route   POST /api/auth/register
exports.handleLocalRegister = async (req, res) => {
  try {
    const Setting = require('../models/Setting');
    const settingObj = await Setting.findOne({ key: 'allowSignup' });
    const allowSignup = settingObj ? settingObj.value === true : true;
    
    const toggles = await getFeatureToggleValues();
    if (!toggles.registrationEnabled || !allowSignup) {
      return res.status(403).json({ success: false, error: 'New registrations are temporarily disabled. Please contact administrator.' });
    }

    const { name, email, phone, password } = req.body;

    const nameStr = String(name || '').trim();
    const emailStr = String(email || '').toLowerCase().trim();
    const phoneStr = String(phone || '').trim();
    const passwordStr = String(password || '');

    if (!nameStr || !emailStr || !phoneStr || !passwordStr) {
      return res.status(400).json({ success: false, error: 'Please provide all required fields including name, email, phone, and password' });
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

    // Enterprise Password strength checking (minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character)
    const strengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!strengthRegex.test(passwordStr)) {
      return res.status(400).json({ success: false, error: 'Password does not meet enterprise strength criteria: minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 numerical digit, and 1 special symbol.' });
    }

    const userExists = await User.findOne({ email: emailStr });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordStr, salt);

    // Generate Verification OTP (5-minute expiry)
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Write parameters into the temporary staging area collection
    await UnverifiedStage.findOneAndUpdate(
      { email: emailStr },
      {
        name: nameStr,
        email: emailStr,
        phone: phoneStr,
        password: hashedPassword,
        passwordHash: hashedPassword,
        verificationToken,
        verificationTokenExpires
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send Verification Email
    await sendVerificationEmail(emailStr, verificationToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful! A verification OTP has been sent to your email address. Please verify using the OTP.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Registration error: ${error.message}` });
  }
};

// @desc    Login customer & enforce brute force account lockout
// @route   POST /api/auth/login
exports.handleLocalLogin = async (req, res) => {
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
      return res.status(401).json({ success: false, error: 'Email address not registered.' });
    }

    // Check account lockout status
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMins = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      await logActivity(req, 'login_lockedout', `Blocked attempt for locked account: ${email}`);
      return res.status(403).json({ success: false, error: `Account is temporarily locked due to consecutive failures. Try again in ${remainingMins} minutes.` });
    }

    const isMatch = await bcrypt.compare(password, user.password || user.passwordHash || '');
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      let msg = 'Incorrect password entered.';

      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 mins lock
        msg = 'Too many failed login attempts. Your account has been temporarily locked for 30 minutes.';
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

    // Enforce email verification check for customers
    if (user.role === 'customer' && !user.emailVerified) {
      return res.status(403).json({
        success: false,
        emailVerified: false,
        error: 'Account inactive. Please verify your email address.'
      });
    }

    // Reset attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginIP = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    user.lastLoginTimestamp = new Date();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

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
        emailVerified: user.emailVerified,
        addresses: user.addresses,
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



// @desc    Execute email verification
// @route   GET /api/auth/verify-email
exports.executeEmailVerification = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).send('<h1>Verification token is missing.</h1>');
    }

    const stageRecord = await UnverifiedStage.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!stageRecord) {
      return res.status(400).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #ef4444;">Verification Link Expired or Invalid</h2>
          <p>The link may have expired or is invalid. Please try registering again.</p>
          <a href="/login.html" style="color: #6A0DAD; font-weight: bold; text-decoration: none;">Return to Login</a>
        </div>
      `);
    }

    // Instantiate user profile within verified accounts collection
    await User.create({
      name: stageRecord.name,
      email: stageRecord.email,
      phone: stageRecord.phone,
      password: stageRecord.password,
      passwordHash: stageRecord.passwordHash,
      address1: stageRecord.address1 || '',
      city: stageRecord.city || '',
      state: stageRecord.state || '',
      pincode: stageRecord.pincode || '',
      phoneVerified: true,
      emailVerified: true,
      role: 'customer',
      addresses: [{
        fullName: stageRecord.name,
        phone: stageRecord.phone,
        street: stageRecord.address1 || '',
        city: stageRecord.city || '',
        state: stageRecord.state || '',
        zipCode: stageRecord.pincode || '',
        isDefault: true
      }]
    });

    // Purge baseline staged tracking parameters safely
    await UnverifiedStage.deleteOne({ _id: stageRecord._id });

    res.send(`
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h2 style="color: #28a745;">Email Verified Successfully!</h2>
        <p>Your email has been verified. You can now checkout and manage your wishlist.</p>
        <p>Redirecting to login in 3 seconds...</p>
        <script>
          setTimeout(() => {
            window.location.href = '/login.html?verified=true';
          }, 3000);
        </script>
      </div>
    `);
  } catch (error) {
    res.status(500).send(`<h1>Server Error during verification: ${error.message}</h1>`);
  }
};

// @desc    Verify email OTP
// @route   POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Please provide email and OTP code' });
    }

    const stageRecord = await UnverifiedStage.findOne({
      email: email.toLowerCase().trim(),
      verificationToken: otp.trim(),
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!stageRecord) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP. Please try again or request a new OTP.' });
    }

    // Instantiate user profile within verified accounts collection
    await User.create({
      name: stageRecord.name,
      email: stageRecord.email,
      phone: stageRecord.phone,
      password: stageRecord.password,
      passwordHash: stageRecord.passwordHash,
      address1: stageRecord.address1 || '',
      city: stageRecord.city || '',
      state: stageRecord.state || '',
      pincode: stageRecord.pincode || '',
      phoneVerified: true,
      emailVerified: true,
      role: 'customer',
      addresses: [{
        fullName: stageRecord.name,
        phone: stageRecord.phone,
        street: stageRecord.address1 || '',
        city: stageRecord.city || '',
        state: stageRecord.state || '',
        zipCode: stageRecord.pincode || '',
        isDefault: true
      }]
    });

    // Purge staging record
    await UnverifiedStage.deleteOne({ _id: stageRecord._id });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Your account is now active.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Verification error: ${error.message}` });
  }
};

// @desc    Resend verification OTP
// @route   POST /api/auth/resend-otp
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Please provide email address' });
    }

    const stageRecord = await UnverifiedStage.findOne({ email: email.toLowerCase().trim() });
    if (!stageRecord) {
      return res.status(400).json({ success: false, error: 'No unverified account registration found for this email address.' });
    }

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    stageRecord.verificationToken = newOtp;
    stageRecord.verificationTokenExpires = expiry;
    await stageRecord.save();

    await sendVerificationEmail(stageRecord.email, newOtp);

    res.status(200).json({
      success: true,
      message: 'A new 6-digit OTP code has been sent to your email address.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Failed to resend OTP: ${error.message}` });
  }
};

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
exports.requestPasswordResetLink = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Please provide email' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // Enterprise security: do not leak whether account exists
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a 6-digit OTP has been sent.'
      });
    }

    // Generate 6-digit OTP for password reset
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes expiry
    await user.save();

    await sendPasswordResetEmail(user.email, otp);

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a 6-digit OTP has been sent.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Password recovery error: ${error.message}` });
  }
};

// @desc    Verify reset OTP
// @route   POST /api/auth/verify-reset-otp
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Please provide email and OTP code' });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: otp.trim(),
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired password reset OTP.' });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully! You may now proceed to reset your password.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `OTP verification error: ${error.message}` });
  }
};

// @desc    Reset password using email and OTP
// @route   POST /api/auth/reset-password
exports.resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email, OTP, and new password' });
    }

    const strengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!strengthRegex.test(password)) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long, and contain at least 1 uppercase letter, 1 lowercase letter, 1 numerical digit, and 1 special symbol.' });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: otp.trim(),
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired password reset OTP.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.passwordHash = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    await logActivity(req, 'password_reset_success', `Password successfully reset for: ${user.email}`);

    res.status(200).json({ success: true, message: 'Password reset successfully! You can now login.' });
  } catch (error) {
    res.status(500).json({ success: false, error: `Password update error: ${error.message}` });
  }
};

// @desc    Process secure password update (Maintain token route for backwards compatibility)
// @route   POST /api/auth/reset-password/:token
exports.processSecurePasswordUpdate = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }

    const strengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!strengthRegex.test(password)) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long, and contain at least 1 uppercase letter, 1 lowercase letter, 1 numerical digit, and 1 special symbol.' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Password reset token is invalid or has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.passwordHash = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    await logActivity(req, 'password_reset_success', `Password successfully reset for: ${user.email}`);

    res.status(200).json({ success: true, message: 'Password reset successfully! You can now login.' });
  } catch (error) {
    res.status(500).json({ success: false, error: `Password update error: ${error.message}` });
  }
};

// @desc    Log out & clear cookies
// @route   POST /api/auth/logout
exports.terminateUserSession = async (req, res) => {
  try {
    const refreshToken = req.cookies ? req.cookies.admin_refreshToken : null;

    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = null;
        await user.save();
        req.user = user;
        await logActivity(req, 'logout', `User signed out`);
      }
    }

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

// @desc    Update profile & addresses
// @route   PUT /api/auth/profile/update
exports.updateProfileMetadata = async (req, res) => {
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
      user.emailVerified = false; // require re-verification upon email change
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      user.verificationToken = verificationToken;
      user.verificationTokenExpires = verificationTokenExpires;
      await sendVerificationEmail(emailStr, verificationToken);
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
        emailVerified: user.emailVerified,
        profilePicture: user.profilePicture,
        addresses: user.addresses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Profile update error: ${error.message}` });
  }
};

// @desc    Handle Cloudinary or local avatar upload
// @route   POST /api/auth/profile/avatar
exports.handleAvatarUploadCloudinary = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an image file' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ success: false, error: 'Only image files are allowed!' });
    }

    // Optimize image using sharp
    const optimizedBuffer = await sharp(req.file.buffer)
      .resize({ width: 200, height: 200, fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    let avatarUrl = '';
    if (isCloudinaryConfigured) {
      const result = await uploadToCloudinary(optimizedBuffer, 'magizhvagam_avatars');
      avatarUrl = result.url;
    } else {
      // Local fallback
      const uploadDir = path.join(__dirname, '../../uploads/avatars');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filename = `avatar-${req.user._id}-${Date.now()}.webp`;
      await fs.promises.writeFile(path.join(uploadDir, filename), optimizedBuffer);
      avatarUrl = `/uploads/avatars/${filename}`;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    user.profilePicture = avatarUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      profilePicture: avatarUrl
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Avatar upload failed: ${error.message}` });
  }
};

// @desc    Toggle Customer role ↔ Staff
// @route   POST /api/auth/admin/toggle-role
exports.adminToggleRole = async (req, res) => {
  try {
    const { customerId } = req.body;
    const user = await User.findById(customerId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, error: 'Cannot toggle Administrator role directly' });
    }
    user.role = user.role === 'customer' ? 'staff' : 'customer';
    await user.save();
    await logActivity(req, 'admin_role_toggle', `Admin toggled user ${user.email} role to ${user.role}`);
    res.status(200).json({ success: true, message: `Role toggled to ${user.role} successfully`, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Force Account Password Reset
// @route   POST /api/auth/admin/force-reset
exports.adminForceResetPassword = async (req, res) => {
  try {
    const { customerId } = req.body;
    const user = await User.findById(customerId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const tempSalt = await bcrypt.genSalt(10);
    const tempPass = crypto.randomBytes(8).toString('hex') + '!A1';
    const hashedPassword = await bcrypt.hash(tempPass, tempSalt);
    user.password = hashedPassword;
    user.passwordHash = hashedPassword;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    await logActivity(req, 'admin_force_reset', `Admin forced password reset for user ${user.email}`);

    res.status(200).json({
      success: true,
      message: `Password reset successfully! Temporary password is: ${tempPass}`,
      tempPass
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Manually Unlock Account / Clear Login Attempts
// @route   POST /api/auth/admin/unlock
exports.adminUnlockAccount = async (req, res) => {
  try {
    const { customerId } = req.body;
    const user = await User.findById(customerId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();
    await logActivity(req, 'admin_unlock_account', `Admin unlocked user account ${user.email}`);
    res.status(200).json({ success: true, message: 'Account unlocked and login attempts cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


