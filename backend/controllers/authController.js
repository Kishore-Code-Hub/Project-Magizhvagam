const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const https = require('https');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const Order = require('../models/Order');
const { generateAccessToken, generateRefreshToken } = require('../middleware/authMiddleware');
const { JWT_REFRESH_SECRET, JWT_ACCESS_SECRET } = require('../config/jwt');
const { logActivity } = require('../services/auditService');
const { getFeatureToggleValues } = require('./settingController');
const emailService = require('../services/emailService');
const { sendVerificationEmail, sendPasswordResetEmail } = emailService;
const normalizeEmail = require('../utils/normalizeEmail');
const { generateBase32Secret, verifyTOTP, generateRecoveryCodes } = require('../utils/totp');
const { parseUserAgent } = require('../utils/userAgentParser');


// NOTE: The original exports.register had a runtime crash (pincodeStr was never declared).
// The original exports.login bypassed the unified password check.
// Both have been removed. Active handlers: handleLocalRegister and handleLocalLogin (below).


// Helper to register active sessions in database
const createUserSession = async (req, userId, refreshToken) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const { browser, os, device } = parseUserAgent(userAgent);
    const country = req.headers['cf-ipcountry'] || 'Unknown';

    await UserSession.create({
      userId,
      refreshToken,
      userAgent,
      ipAddress: ip,
      browser,
      os,
      device,
      country,
      loginTime: new Date(),
      lastActivity: new Date()
    });
  } catch (err) {
    console.error('Session creation failed:', err);
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
      return res.status(400).json({ success: false, error: 'Invalid input format' });
    }

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) {
      await logActivity(req, 'login_failure', `Invalid email attempt for: ${email}`);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check role strictly
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

    const targetHash = user.password || user.passwordHash || '';
    const isMatch = await bcrypt.compare(password, targetHash);
    
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
    await user.save();

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Check for a valid remember-device token cookie
      const rememberCookie = req.cookies ? req.cookies.admin_remember_device : null;
      let bypass2FA = false;

      if (rememberCookie) {
        try {
          const [cookieUserId, cookieToken] = rememberCookie.split(':');
          if (cookieUserId === String(user._id)) {
            const tokenMatch = user.rememberDeviceTokens.find(
              t => t.token === cookieToken && t.expiresAt > new Date()
            );
            if (tokenMatch) {
              bypass2FA = true;
              console.log('[DEBUG AUTH] 2FA bypassed via valid remember-device token.');
            }
          }
        } catch (e) {
          console.warn('Remember-device token parsing error:', e);
        }
      }

      if (!bypass2FA) {
        // Issue short-lived temp token for 2FA validation step-up
        const tempToken = jwt.sign(
          { id: user._id, purpose: '2fa_login_pending' },
          JWT_REFRESH_SECRET,
          { expiresIn: '5m' }
        );
        return res.status(200).json({
          success: true,
          require2FA: true,
          tempToken
        });
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user model
    user.refreshToken = refreshToken;
    await user.save();

    // Create session entry
    await createUserSession(req, user._id, refreshToken);

    // Set secure HTTP-Only cookies
    res.cookie('admin_accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3 * 60 * 1000 // 3 minutes
    });

    res.cookie('admin_refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Log login success
    await logActivity(req, 'login_success', `Admin logged in successfully`);

    return res.status(200).json({
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
    return res.status(500).json({ success: false, error: `Login error: ${error.message}` });
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
      // Remove the session entry
      await UserSession.findOneAndDelete({ refreshToken });
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
      maxAge: 3 * 60 * 1000
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
    const emailStr = normalizeEmail(String(email || ''));
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

    // Generate Verification OTP (3-minute expiry)
    const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationOtpExpires = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

    // Create user record immediately
    const newUser = await User.create({
      name: nameStr,
      email: emailStr,
      phone: phoneStr,
      password: hashedPassword,
      passwordHash: hashedPassword,
      emailVerified: false,
      accountActive: false,
      isActive: false,
      verificationOtp,
      verificationOtpExpires
    });

    // Diagnostic: confirm OTP stored on new user record
    console.log('Saved OTP (registration - secondary):', newUser.verificationOtp);

    console.log('OTP GENERATED (registration - secondary)', verificationOtp);
    console.log('OTP EMAIL RECIPIENT:', newUser.email);
    try {
      const diag = await emailService.testConnection();
      console.log('SMTP status:', { transporterPresent: diag.transporterPresent, verified: diag.verified });
      if (!diag.transporterPresent || !diag.verified || !diag.verified.success) {
        console.log('OTP (SMTP not verified):', verificationOtp);
      }
    } catch (e) {
      console.log('SMTP diag error:', e && e.message ? e.message : e);
    }
    console.log('CALLING SMTP SERVICE');
    const smtpResult2 = await emailService.sendVerificationEmail(newUser.email, verificationOtp);
    console.log('SMTP RESPONSE:', smtpResult2);
    if (smtpResult2 && smtpResult2.success) console.log('EMAIL SENT SUCCESSFULLY');
    else console.log('EMAIL SEND FAILED:', smtpResult2 && smtpResult2.error);

    res.status(201).json({
      success: true,
      message: 'Registration successful! A verification OTP has been sent to your email address. Please verify using the OTP.',
      redirect: '/verify-email.html'
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

    const user = await User.findOne({ email: normalizeEmail(email) });
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
    if (user.role === 'customer' && user.emailVerified !== true) {
      return res.status(403).json({
        success: false,
        emailVerified: false,
        error: 'Please verify your email first. Request a new OTP via /api/auth/resend-otp.'
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
      maxAge: 3 * 60 * 1000 // 3 minutes
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



// @desc    Execute email verification (link-based) — deprecated
// @route   GET /api/auth/verify-email
exports.executeEmailVerification = async (req, res) => {
  // This route is intentionally deprecated. Email verification is now OTP-based.
  return res.status(410).send(`
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
      <h2 style="color: #ef4444;">Verification Links Disabled</h2>
      <p>We no longer support link-based email verification. Please use the OTP verification flow at <a href="/verify-email.html">Verify Email</a>.</p>
    </div>
  `);
};

// @desc    Verify email OTP
// @route   POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Please provide email and OTP code' });
    }
    const normalizedEmail = normalizeEmail(email);

    // Diagnostic: log incoming values
    console.log('VERIFY OTP REQUEST:', { email: normalizedEmail, enteredOtp: otp });

    // Retrieve record for diagnostic comparison (do not leak to client)
    const userByEmail = await User.findOne({ email: normalizedEmail });
    if (userByEmail) {
      console.log('Stored OTP (DB):', userByEmail.verificationOtp);
      console.log('OTP Expiry (DB):', userByEmail.verificationOtpExpires);
    } else {
      console.log('No user found for email during OTP check:', normalizedEmail);
    }

    const user = await User.findOne({
      email: normalizedEmail,
      verificationOtp: otp.trim(),
      verificationOtpExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP. Please try again or request a new OTP.' });
    }

    user.emailVerified = true;
    user.accountActive = true;
    user.verificationOtp = null;
    user.verificationOtpExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Your account is now active.',
      redirect: '/login.html?verified=true'
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

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) {
      return res.status(400).json({ success: false, error: 'No account found for this email address.' });
    }
    if (user.emailVerified === true) {
      return res.status(400).json({ success: false, error: 'Account already verified.' });
    }

    // Generate new OTP (3-minute expiry — matches registration OTP window)
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 3 * 60 * 1000); // 3 mins

    user.verificationOtp = newOtp;
    user.verificationOtpExpires = expiry;
    await user.save();

    // Diagnostic logs
    console.log('OTP GENERATED (resend)', newOtp);
    console.log('OTP EMAIL RECIPIENT:', user.email);
    console.log('Saved OTP after DB write:', user.verificationOtp);
    console.log('Saved OTP expiry after DB write:', user.verificationOtpExpires);
    try {
      const diag = await emailService.testConnection();
      console.log('SMTP status:', { transporterPresent: diag.transporterPresent, verified: diag.verified });
      if (!diag.transporterPresent || !diag.verified || !diag.verified.success) {
        console.log('OTP (SMTP not verified):', newOtp);
      }
    } catch (e) {
      console.log('SMTP diag error:', e && e.message ? e.message : e);
    }
    console.log('CALLING SMTP SERVICE');
    const smtpResResend = await emailService.sendVerificationEmail(user.email, newOtp);
    console.log('SMTP RESPONSE:', smtpResResend);
    if (smtpResResend && smtpResResend.success) console.log('EMAIL SENT SUCCESSFULLY');
    else console.log('EMAIL SEND FAILED:', smtpResResend && smtpResResend.error);

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

    // Normalize email lookup to match registration normalization rules
    const normalizedEmail = normalizeEmail(String(email || ''));
    const user = await User.findOne({ email: normalizedEmail });
    
    // Enterprise security: do not leak whether account exists
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a 6-digit OTP has been sent.'
      });
    }

    // Generate 6-digit OTP for password reset (10-minute expiry)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await user.save();

    // Diagnostic logging
    console.log('FORGOT PASSWORD REQUEST');
    console.log('Recipient:', user.email);
    console.log('OTP (generated):', otp);
    console.log('Saved resetPasswordToken (DB):', user.resetPasswordToken);
    console.log('Saved resetPasswordExpires (DB):', user.resetPasswordExpires);
    try {
      const diag = await emailService.testConnection();
      console.log('SMTP status:', { transporterPresent: diag.transporterPresent, verified: diag.verified });
      if (!diag.transporterPresent || !diag.verified || !diag.verified.success) {
        console.log('OTP (SMTP not verified):', otp);
      }
    } catch (e) {
      console.log('SMTP diag error:', e && e.message ? e.message : e);
    }
    console.log('CALLING SMTP SERVICE');
    const smtpResReset = await emailService.sendPasswordResetEmail(user.email, otp);
    console.log('SMTP RESPONSE:', smtpResReset);
    if (smtpResReset && smtpResReset.success) {
      console.log('EMAIL SENT SUCCESSFULLY (password reset)');
    } else {
      console.log('EMAIL SEND FAILED (password reset):', smtpResReset && smtpResReset.error);
      try {
        await logActivity(req, 'email_send_failure', `password_reset to ${user.email}: ${smtpResReset && smtpResReset.error}`);
      } catch (e) {
        console.log('Failed to write audit log for email send failure:', e && e.message ? e.message : e);
      }
    }

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

    console.log('VERIFY RESET OTP REQUEST:', { email: normalizeEmail(email), enteredOtp: otp });
    const userByEmail = await User.findOne({ email: normalizeEmail(email) });
    if (userByEmail) {
      console.log('Stored reset token (DB):', userByEmail.resetPasswordToken);
      console.log('Stored reset expiry (DB):', userByEmail.resetPasswordExpires);
    } else {
      console.log('No user found for email during reset OTP check:', normalizeEmail(email));
    }

    const user = await User.findOne({
      email: normalizeEmail(email),
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
      email: normalizeEmail(email),
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
    // Mark email as verified and activate account after successful password reset
    user.emailVerified = true;
    user.accountActive = true;
    user.isActive = true;
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
      const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationOtpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      user.verificationOtp = verificationOtp;
      user.verificationOtpExpires = verificationOtpExpires;
      console.log('OTP GENERATED (email change):', verificationOtp);
      console.log('OTP EMAIL RECIPIENT:', emailStr);
      await sendVerificationEmail(emailStr, verificationOtp);
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

// ─── TWO-FACTOR AUTHENTICATION CONTROLLERS ──────────────────────────────────────

// @desc    Verify 2FA TOTP code or recovery code during login
// @route   POST /api/auth/admin/verify-2fa
// @access  Public
exports.verifyAdmin2FA = async (req, res) => {
  try {
    const { tempToken, code, rememberDevice } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ success: false, error: 'Token and verification code required' });
    }

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, error: '2FA session expired. Please log in again.' });
    }

    if (decoded.purpose !== '2fa_login_pending') {
      return res.status(400).json({ success: false, error: 'Invalid authentication context' });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'User access invalid' });
    }

    let isCodeValid = false;
    let isRecovery = false;

    // Remove dashes and normalize recovery code/OTP input
    const cleanCode = code.replace(/[-\s]/g, '').trim().toUpperCase();

    // 1. Check TOTP
    if (/^\d{6}$/.test(cleanCode)) {
      isCodeValid = verifyTOTP(cleanCode, user.twoFactorSecret);
    } 
    // 2. Check Recovery Code
    else {
      // Recovery codes are formatted as XXXX-XXXX but stored plain as XXXXXXXX or formatted
      const formattedCode = code.includes('-') ? code.trim().toUpperCase() : `${code.substring(0, 4)}-${code.substring(4, 8)}`.toUpperCase();
      const codeIndex = user.twoFactorRecoveryCodes.indexOf(formattedCode);
      if (codeIndex !== -1) {
        isCodeValid = true;
        isRecovery = true;
        // Consume the recovery code
        user.twoFactorRecoveryCodes.splice(codeIndex, 1);
        await user.save();
        await logActivity(req, '2fa_recovery_code_used', `Used backup recovery code for 2FA`);
      }
    }

    if (!isCodeValid) {
      return res.status(400).json({ success: false, error: 'Invalid authentication code' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Create session entry
    await createUserSession(req, user._id, refreshToken);

    // Set cookies
    res.cookie('admin_accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3 * 60 * 1000 // 3 mins
    });

    res.cookie('admin_refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Check remember device option
    if (rememberDevice) {
      const deviceToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      user.rememberDeviceTokens.push({ token: deviceToken, expiresAt });
      await user.save();

      res.cookie('admin_remember_device', `${user._id}:${deviceToken}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    }

    await logActivity(req, 'login_success', `Admin logged in successfully with 2FA ${isRecovery ? '(Recovery Code)' : ''}`);

    return res.status(200).json({
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
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Initiate 2FA setup by generating secret and QR info
// @route   POST /api/auth/admin/2fa/setup
// @access  Private (Admin Only)
exports.setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const secret = generateBase32Secret();
    user.twoFactorTempSecret = secret;
    await user.save();

    const otpauthUri = `otpauth://totp/MAGIZHVAGAM:${user.email}?secret=${secret}&issuer=MAGIZHVAGAM`;
    return res.status(200).json({
      success: true,
      secret,
      otpauthUri
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Verify temp secret and enable 2FA
// @route   POST /api/auth/admin/2fa/enable
// @access  Private (Admin Only)
exports.enable2FA = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (!user.twoFactorTempSecret) {
      return res.status(400).json({ success: false, error: '2FA setup was not initiated. Run setup first.' });
    }

    const isValid = verifyTOTP(code, user.twoFactorTempSecret);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Verification code is invalid. Please try again.' });
    }

    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = null;
    user.twoFactorEnabled = true;

    // Generate backup recovery codes
    const recoveryCodes = generateRecoveryCodes(8);
    user.twoFactorRecoveryCodes = recoveryCodes;
    await user.save();

    await logActivity(req, '2fa_enable', 'Two-Factor Authentication enabled');

    return res.status(200).json({
      success: true,
      message: 'Two-Factor Authentication enabled successfully!',
      recoveryCodes
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Disable 2FA after password confirmation
// @route   POST /api/auth/admin/2fa/disable
// @access  Private (Admin Only)
exports.disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Password confirmation failed' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorRecoveryCodes = [];
    user.rememberDeviceTokens = [];
    await user.save();

    res.clearCookie('admin_remember_device');

    await logActivity(req, '2fa_disable', 'Two-Factor Authentication disabled');

    return res.status(200).json({
      success: true,
      message: 'Two-Factor Authentication disabled successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Regenerate new recovery codes
// @route   POST /api/auth/admin/2fa/recovery-codes
// @access  Private (Admin Only)
exports.generateNewRecoveryCodes = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Password confirmation failed' });
    }

    const newCodes = generateRecoveryCodes(8);
    user.twoFactorRecoveryCodes = newCodes;
    await user.save();

    await logActivity(req, '2fa_recovery_regenerate', 'Regenerated Two-Factor backup recovery codes');

    return res.status(200).json({
      success: true,
      recoveryCodes: newCodes
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};


// ─── ADMIN PASSWORD MANAGEMENT ──────────────────────────────────────────────────

// @desc    Update admin password with strength validation
// @route   POST /api/auth/admin/update-password
// @access  Private (Admin Only)
exports.updateAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, error: 'Please enter all password fields' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match' });
    }

    // Strict validation
    const strengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/;
    if (!strengthRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 12 characters, contain 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Validate current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    // Prevent password reuse
    const isReused = await bcrypt.compare(newPassword, user.password);
    if (isReused) {
      return res.status(400).json({ success: false, error: 'New password cannot be the same as your current password' });
    }

    // Set new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    user.passwordHash = hashedPassword;
    user.passwordChangedAt = new Date();
    user.refreshToken = null;
    await user.save();

    // Revoke all sessions
    await UserSession.deleteMany({ userId: user._id });

    // Clear authentication cookies
    res.clearCookie('admin_accessToken');
    res.clearCookie('admin_refreshToken');
    res.clearCookie('admin_remember_device');

    await logActivity(req, 'password_change_success', 'Administrator updated account password (forced logout)');

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully. All sessions revoked. Please log in again.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};


// ─── SESSION MANAGEMENT CONTROLLERS ─────────────────────────────────────────────

// @desc    Get active admin sessions list
// @route   GET /api/auth/admin/sessions
// @access  Private (Admin Only)
exports.getActiveSessions = async (req, res) => {
  try {
    const sessions = await UserSession.find({ userId: req.user._id }).sort({ lastActivity: -1 });
    const currentRefreshToken = req.cookies ? req.cookies.admin_refreshToken : null;

    const formattedSessions = sessions.map(s => ({
      id: s._id,
      ipAddress: s.ipAddress,
      browser: s.browser,
      os: s.os,
      device: s.device,
      country: s.country,
      loginTime: s.loginTime,
      lastActivity: s.lastActivity,
      isCurrent: s.refreshToken === currentRefreshToken
    }));

    return res.status(200).json({
      success: true,
      sessions: formattedSessions
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Revoke specific admin session
// @route   DELETE /api/auth/admin/sessions/:id
// @access  Private (Admin Only)
exports.revokeSession = async (req, res) => {
  try {
    const session = await UserSession.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    await logActivity(req, 'session_revoked', `Revoked active session IP: ${session.ipAddress}`);
    return res.status(200).json({ success: true, message: 'Session revoked successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Revoke other admin sessions
// @route   POST /api/auth/admin/sessions/logout-others
// @access  Private (Admin Only)
exports.revokeOtherSessions = async (req, res) => {
  try {
    const currentRefreshToken = req.cookies ? req.cookies.admin_refreshToken : null;

    const result = await UserSession.deleteMany({
      userId: req.user._id,
      refreshToken: { $ne: currentRefreshToken }
    });

    await logActivity(req, 'session_revoked_others', 'Revoked all other active admin sessions');
    return res.status(200).json({
      success: true,
      message: `Successfully closed ${result.deletedCount} other active sessions.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Revoke all sessions (force logout everywhere)
// @route   POST /api/auth/admin/sessions/logout-all
// @access  Private (Admin Only)
exports.revokeAllSessions = async (req, res) => {
  try {
    await UserSession.deleteMany({ userId: req.user._id });

    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.clearCookie('admin_accessToken');
    res.clearCookie('admin_refreshToken');
    res.clearCookie('admin_remember_device');

    await logActivity(req, 'session_revoked_all', 'Revoked all active admin sessions (forced logout)');
    return res.status(200).json({ success: true, message: 'Logged out of all sessions successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};


