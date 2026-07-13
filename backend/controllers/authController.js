const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../services/prisma');
const { generateAccessToken, generateRefreshToken } = require('../middleware/authMiddleware');
const { JWT_REFRESH_SECRET, JWT_ACCESS_SECRET } = require('../config/jwt');
const { logActivity } = require('../services/auditService');
const { getFeatureToggleValues } = require('./settingController');
const emailService = require('../services/emailService');
const normalizeEmail = require('../utils/normalizeEmail');
const { generateBase32Secret, verifyTOTP, generateRecoveryCodes } = require('../utils/totp');
const { parseUserAgent } = require('../utils/userAgentParser');

// Helper to sanitize user object
const sanitizeUser = (user) => {
  if (!user) return null;
  const sanitized = { ...user };
  delete sanitized.password;
  delete sanitized.passwordHash;
  delete sanitized.refreshToken;
  sanitized._id = user.id;
  return sanitized;
};

// Helper to create session entry
const createUserSession = async (req, userId, refreshToken) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const { browser, os, device } = parseUserAgent(userAgent);
    const country = req.headers['cf-ipcountry'] || 'Unknown';

    await prisma.userSession.create({
      data: {
        userId,
        refreshToken,
        userAgent,
        ipAddress: ip,
        browser,
        os,
        device,
        country
      }
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

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid input format' });
    }

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) }
    });

    if (!user) {
      await logActivity(req, 'login_failure', `Invalid email attempt for: ${email}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.role !== 'admin') {
      await logActivity(req, 'admin_login_failure', `Unauthorized admin login attempt for: ${email}`);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMins = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
      await logActivity(req, 'login_lockedout', `Blocked attempt for locked account: ${email}`);
      return res.status(403).json({ success: false, error: `Account is temporarily locked. Try again in ${remainingMins} minutes.` });
    }

    const targetHash = user.password || user.passwordHash || '';
    const isMatch = await bcrypt.compare(password, targetHash);
    
    if (!isMatch) {
      const loginAttempts = (user.loginAttempts || 0) + 1;
      let lockUntil = null;
      let msg = 'Invalid credentials';

      if (loginAttempts >= 5) {
        lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        msg = 'Too many failed attempts. Account locked for 30 minutes.';
        await logActivity(req, 'account_locked', `Account locked after 5 failures: ${email}`);
      } else {
        await logActivity(req, 'login_failure', `Failed login attempt ${loginAttempts}/5 for: ${email}`);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts, lockUntil }
      });

      // Progressive delay (1 second per failed attempt, max 5s)
      const delayMs = Math.min(loginAttempts * 1000, 5000);
      await new Promise(resolve => setTimeout(resolve, delayMs));

      return res.status(401).json({ success: false, error: msg });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockUntil: null }
    });

    if (user.twoFactorEnabled) {
      const rememberCookie = req.cookies ? req.cookies.admin_remember_device : null;
      let bypass2FA = false;

      if (rememberCookie) {
        try {
          const [cookieUserId, cookieToken] = rememberCookie.split(':');
          if (cookieUserId === user.id) {
            const tokens = Array.isArray(user.rememberDeviceTokens) ? user.rememberDeviceTokens : JSON.parse(user.rememberDeviceTokens || '[]');
            const tokenMatch = tokens.find(
              t => t.token === cookieToken && new Date(t.expiresAt) > new Date()
            );
            if (tokenMatch) {
              bypass2FA = true;
            }
          }
        } catch (e) {
          console.warn('Remember-device token parsing error:', e);
        }
      }

      if (!bypass2FA) {
        const tempToken = jwt.sign(
          { id: user.id, purpose: '2fa_login_pending' },
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

    const oldRefreshToken = req.cookies ? req.cookies.admin_refreshToken : null;
    if (oldRefreshToken) {
      await prisma.userSession.deleteMany({ where: { refreshToken: oldRefreshToken } }).catch(() => {});
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    await createUserSession(req, user.id, refreshToken);

    res.cookie('admin_accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3 * 60 * 1000
    });

    res.cookie('admin_refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    await logActivity(req, 'login_success', `Admin logged in successfully`);

    return res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user.id,
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
      const user = await prisma.user.findFirst({
        where: { refreshToken }
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: null }
        });
      }

      await prisma.userSession.deleteMany({
        where: { refreshToken }
      });
    }

    res.clearCookie('admin_accessToken');
    res.clearCookie('admin_refreshToken');
    await logActivity(req, 'logout', `User logged out successfully`);

    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: `Logout error: ${error.message}` });
  }
};

// @desc    Refresh accessToken using refreshToken cookie
// @route   POST /api/auth/refresh
// @access  Public
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies ? req.cookies.admin_refreshToken : null;

    if (!refreshToken) {
      return res.status(401).json({ success: false, error: 'No refresh token provided' });
    }

    const session = await prisma.userSession.findUnique({
      where: { refreshToken }
    });
    if (!session) {
      return res.status(401).json({ success: false, error: 'Session not found or revoked' });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await prisma.userSession.delete({ where: { refreshToken } }).catch(() => {});
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken }
    });
    await createUserSession(req, user.id, newRefreshToken);

    res.cookie('admin_accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3 * 60 * 1000
    });

    res.cookie('admin_refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({ success: true, accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Refresh failed, login required' });
  }
};

// @desc    Get session details
// @route   GET /api/auth/session
// @access  Private
exports.getSession = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { addresses: true }
    });
    return res.status(200).json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData
    });

    return res.status(200).json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all customers (Admin only)
// @route   GET /api/auth/customers
// @access  Private/Admin
exports.getCustomers = async (req, res) => {
  try {
    const { role, all } = req.query;
    const where = {};
    if (role) {
      where.role = role;
    } else if (all !== 'true') {
      where.role = 'customer';
    }

    const users = await prisma.user.findMany({
      where,
      include: { addresses: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({
      success: true,
      customers: users.map(sanitizeUser)
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Add a shipping address
// @route   POST /api/auth/addresses
// @access  Private
exports.addAddress = async (req, res) => {
  try {
    const { fullName, phone, street, street2, city, state, zipCode, isDefault } = req.body;

    if (!fullName || !phone || !street || !city || !state || !zipCode) {
      return res.status(400).json({ success: false, error: 'Please provide all required address fields' });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false }
      });
    }

    const count = await prisma.address.count({ where: { userId: req.user.id } });
    const setAsDefault = isDefault || count === 0;

    await prisma.address.create({
      data: {
        userId: req.user.id,
        fullName,
        phone,
        street,
        street2: street2 || '',
        city,
        state,
        zipCode,
        isDefault: setAsDefault
      }
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { addresses: true }
    });

    return res.status(200).json({ success: true, user: sanitizeUser(updatedUser) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update a specific address
// @route   PUT /api/auth/addresses/:id
// @access  Private
exports.updateAddressById = async (req, res) => {
  try {
    const { fullName, phone, street, street2, city, state, zipCode, isDefault } = req.body;
    const addressId = req.params.id;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false }
      });
    }

    await prisma.address.update({
      where: { id: addressId },
      data: {
        fullName,
        phone,
        street,
        street2: street2 || '',
        city,
        state,
        zipCode,
        isDefault: !!isDefault
      }
    });

    // Ensure at least one address is default if none is set
    const defaultCount = await prisma.address.count({
      where: { userId: req.user.id, isDefault: true }
    });
    if (defaultCount === 0) {
      const firstAddr = await prisma.address.findFirst({
        where: { userId: req.user.id }
      });
      if (firstAddr) {
        await prisma.address.update({
          where: { id: firstAddr.id },
          data: { isDefault: true }
        });
      }
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { addresses: true }
    });

    return res.status(200).json({ success: true, user: sanitizeUser(updatedUser) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Register new local user
// @route   POST /api/auth/register
// @access  Public
exports.handleLocalRegister = async (req, res) => {
  try {
    const allowSignupObj = await prisma.setting.findUnique({
      where: { key: 'allowSignup' }
    });
    const allowSignup = allowSignupObj ? allowSignupObj.value === true : true;
    
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
      return res.status(400).json({ success: false, error: 'Please provide all required fields' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneStr)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10 digit mobile number' });
    }

    const strengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!strengthRegex.test(passwordStr)) {
      return res.status(400).json({ success: false, error: 'Password does not meet enterprise strength criteria: minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.' });
    }

    const userExists = await prisma.user.findUnique({
      where: { email: emailStr }
    });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(passwordStr, salt);

    const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationOtpExpires = new Date(Date.now() + 3 * 60 * 1000);

    const newUser = await prisma.user.create({
      data: {
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
      }
    });

    console.log('Saved OTP:', newUser.verificationOtp);
    await emailService.sendVerificationEmail(newUser.email, verificationOtp);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! A verification OTP has been sent to your email address.',
      redirect: '/verify-email.html'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: `Registration error: ${error.message}` });
  }
};

// @desc    Login customer
// @route   POST /api/auth/login
// @access  Public
exports.handleLocalLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid input format' });
    }

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) }
    });

    if (!user) {
      await logActivity(req, 'login_failure', `Invalid email attempt for: ${email}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMins = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
      await logActivity(req, 'login_lockedout', `Blocked attempt for locked account: ${email}`);
      return res.status(403).json({ success: false, error: `Account locked. Try again in ${remainingMins} minutes.` });
    }

    const isMatch = await bcrypt.compare(password, user.password || user.passwordHash || '');
    if (!isMatch) {
      const loginAttempts = (user.loginAttempts || 0) + 1;
      let lockUntil = null;
      let msg = 'Invalid email or password.';

      if (loginAttempts >= 5) {
        lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        msg = 'Account locked. Try again in 30 minutes.';
        await logActivity(req, 'account_locked', `Account locked after 5 failures: ${email}`);
      } else {
        await logActivity(req, 'login_failure', `Failed login attempt ${loginAttempts}/5 for: ${email}`);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts, lockUntil }
      });

      // Progressive delay (1 second per failed attempt, max 5s)
      const delayMs = Math.min(loginAttempts * 1000, 5000);
      await new Promise(resolve => setTimeout(resolve, delayMs));

      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Administrator accounts must sign in at /admin/login'
      });
    }

    if (user.role === 'customer' && !user.emailVerified) {
      return res.status(403).json({
        success: false,
        emailVerified: false,
        error: 'Please verify your email first. Request a new OTP.'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockUntil: null,
        lastLoginIP: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || null,
        lastLoginTimestamp: new Date()
      }
    });

    const oldRefreshToken = req.cookies ? req.cookies.admin_refreshToken : null;
    if (oldRefreshToken) {
      await prisma.userSession.deleteMany({ where: { refreshToken: oldRefreshToken } }).catch(() => {});
    }

    const accessToken = generateAccessToken(updatedUser);
    const refreshToken = generateRefreshToken(updatedUser);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    await createUserSession(req, user.id, refreshToken);

    res.cookie('admin_accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3 * 60 * 1000
    });

    res.cookie('admin_refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    await logActivity(req, 'login_success', `User logged in successfully`);

    return res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: `Login error: ${error.message}` });
  }
};

// @desc    Execute email verification via link
// @route   GET /api/auth/verify/:token
// @access  Public
exports.executeEmailVerification = async (req, res) => {
  // Empty stub for backwards compatibility, redirected to verification page
  res.redirect('/verify-email.html');
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Please provide email and OTP code' });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.verificationOtp !== otp || !user.verificationOtpExpires || user.verificationOtpExpires < new Date()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP code' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        isActive: true,
        accountActive: true,
        verificationOtp: null,
        verificationOtpExpires: null
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Resend registration verification OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });

    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) }
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationOtpExpires = new Date(Date.now() + 3 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationOtp, verificationOtpExpires }
    });

    await emailService.sendVerificationEmail(user.email, verificationOtp);

    return res.status(200).json({ success: true, message: 'New OTP sent successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Request password reset link/OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.requestPasswordResetLink = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });

    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) }
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetOtp,
        resetPasswordExpires: resetOtpExpires
      }
    });

    await emailService.sendPasswordResetEmail(user.email, resetOtp);

    return res.status(200).json({ success: true, message: 'Reset password OTP sent to your email.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Verify reset OTP
// @route   POST /api/auth/verify-reset-otp
// @access  Public
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, error: 'Email and OTP required' });

    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) }
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (user.resetPasswordToken !== otp || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    return res.status(200).json({ success: true, message: 'OTP verified. Please reset password.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ success: false, error: 'All fields required' });

    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) }
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (user.resetPasswordToken !== otp || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        loginAttempts: 0,
        lockUntil: null
      }
    });

    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Change logged-in user password
// @route   POST /api/auth/update-password
// @access  Private
exports.processSecurePasswordUpdate = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, error: 'Both fields required' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, error: 'Current password incorrect' });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordHash: hashedPassword,
        passwordChangedAt: new Date(),
        refreshToken: null
      }
    });

    await prisma.userSession.deleteMany({
      where: { userId: user.id }
    });

    return res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Revoke session (Log out from specific device)
// @route   POST /api/auth/terminate-session
// @access  Private
exports.terminateUserSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    await prisma.userSession.deleteMany({
      where: { id: sessionId, userId: req.user.id }
    });
    return res.status(200).json({ success: true, message: 'Session terminated' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update profile details
// @route   POST /api/auth/profile-metadata
// @access  Private
exports.updateProfileMetadata = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone }
    });
    return res.status(200).json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Avatar upload handler using Cloudinary
// @route   POST /api/auth/avatar
// @access  Private
exports.handleAvatarUploadCloudinary = async (req, res) => {
  try {
    if (!req.body.avatarUrl) return res.status(400).json({ success: false, error: 'Avatar URL required' });
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { profilePicture: req.body.avatarUrl }
    });
    return res.status(200).json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Admin toggles customer/staff roles
// @route   POST /api/auth/admin/toggle-role
// @access  Private/Admin
exports.adminToggleRole = async (req, res) => {
  try {
    const { customerId, role } = req.body;
    if (!['customer', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id: customerId },
      data: { role }
    });

    await logActivity(req, 'admin_role_toggle', `Admin toggled user ${user.email} role to ${role}`);
    return res.status(200).json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Admin forces password reset
// @route   POST /api/auth/admin/reset-password
// @access  Private/Admin
exports.adminForceResetPassword = async (req, res) => {
  try {
    const { customerId, password } = req.body;
    if (!password) return res.status(400).json({ success: false, error: 'Password required' });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.update({
      where: { id: customerId },
      data: {
        password: hashedPassword,
        passwordHash: hashedPassword,
        loginAttempts: 0,
        lockUntil: null
      }
    });

    await logActivity(req, 'admin_force_reset', `Admin forced password reset for user ${user.email}`);
    return res.status(200).json({ success: true, message: 'Password forced reset successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Admin unlocks locked out account
// @route   POST /api/auth/admin/unlock
// @access  Private/Admin
exports.adminUnlockAccount = async (req, res) => {
  try {
    const { customerId } = req.body;
    const user = await prisma.user.update({
      where: { id: customerId },
      data: {
        loginAttempts: 0,
        lockUntil: null
      }
    });

    await logActivity(req, 'admin_unlock_account', `Admin unlocked user account ${user.email}`);
    return res.status(200).json({ success: true, message: 'Account unlocked successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Verify Admin 2FA
// @route   POST /api/auth/admin/verify-2fa
// @access  Public
exports.verifyAdmin2FA = async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) return res.status(400).json({ success: false, error: 'Token and code required' });

    const decoded = jwt.verify(tempToken, JWT_REFRESH_SECRET);
    if (decoded.purpose !== '2fa_login_pending') {
      return res.status(400).json({ success: false, error: 'Invalid operation' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'User access invalid' });
    }

    const cleanCode = code.replace(/\s+/g, '');
    let isCodeValid = false;

    if (cleanCode.length === 6) {
      isCodeValid = verifyTOTP(cleanCode, user.twoFactorSecret);
    } else {
      const formattedCode = cleanCode.toLowerCase();
      const codes = Array.isArray(user.twoFactorRecoveryCodes) ? user.twoFactorRecoveryCodes : JSON.parse(user.twoFactorRecoveryCodes || '[]');
      const codeIndex = codes.indexOf(formattedCode);
      if (codeIndex !== -1) {
        isCodeValid = true;
        codes.splice(codeIndex, 1);
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorRecoveryCodes: codes }
        });
      }
    }

    if (!isCodeValid) return res.status(400).json({ success: false, error: 'Invalid verification code' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        loginAttempts: 0,
        lockUntil: null
      }
    });

    await createUserSession(req, user.id, refreshToken);

    res.cookie('admin_accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3 * 60 * 1000
    });

    res.cookie('admin_refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user.id,
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

// @desc    Set up 2FA (Secret generation)
// @route   POST /api/auth/setup-2fa
// @access  Private
exports.setup2FA = async (req, res) => {
  try {
    const secret = generateBase32Secret();
    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorTempSecret: secret }
    });

    const otpauthUri = `otpauth://totp/MAGIZHVAGAM:${req.user.email}?secret=${secret}&issuer=MAGIZHVAGAM`;
    return res.status(200).json({ success: true, secret, otpauthUri });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Enable 2FA with verification code validation
// @route   POST /api/auth/enable-2fa
// @access  Private
exports.enable2FA = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'Code required' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user.twoFactorTempSecret) {
      return res.status(400).json({ success: false, error: '2FA setup not initiated' });
    }

    const isValid = verifyTOTP(code, user.twoFactorTempSecret);
    if (!isValid) return res.status(400).json({ success: false, error: 'Verification code incorrect' });

    const recoveryCodes = generateRecoveryCodes();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: user.twoFactorTempSecret,
        twoFactorTempSecret: null,
        twoFactorEnabled: true,
        twoFactorRecoveryCodes: recoveryCodes
      }
    });

    return res.status(200).json({ success: true, recoveryCodes });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Disable 2FA
// @route   POST /api/auth/disable-2fa
// @access  Private
exports.disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, error: 'Password required' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, error: 'Password incorrect' });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorRecoveryCodes: [],
        rememberDeviceTokens: []
      }
    });

    return res.status(200).json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Regenerate 2FA recovery codes
// @route   POST /api/auth/recovery-codes
// @access  Private
exports.generateNewRecoveryCodes = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, error: 'Password required' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, error: 'Password incorrect' });

    const newCodes = generateRecoveryCodes();
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorRecoveryCodes: newCodes }
    });

    return res.status(200).json({ success: true, recoveryCodes: newCodes });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update admin password
// @route   POST /api/auth/admin/update-password
// @access  Private/Admin
exports.updateAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, error: 'Both fields required' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, error: 'Current password incorrect' });

    const isReused = await bcrypt.compare(newPassword, user.password);
    if (isReused) return res.status(400).json({ success: false, error: 'Cannot reuse current password' });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordHash: hashedPassword,
        passwordChangedAt: new Date(),
        refreshToken: null
      }
    });

    await prisma.userSession.deleteMany({
      where: { userId: user.id }
    });

    return res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get active device sessions
// @route   GET /api/auth/sessions
// @access  Private
exports.getActiveSessions = async (req, res) => {
  try {
    const sessions = await prisma.userSession.findMany({
      where: { userId: req.user.id },
      orderBy: { lastActivity: 'desc' }
    });
    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Revoke specific session
// @route   DELETE /api/auth/sessions/:id
// @access  Private
exports.revokeSession = async (req, res) => {
  try {
    await prisma.userSession.deleteMany({
      where: { id: req.params.id, userId: req.user.id }
    });
    return res.status(200).json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Revoke other device sessions
// @route   DELETE /api/auth/sessions/revoke/other
// @access  Private
exports.revokeOtherSessions = async (req, res) => {
  try {
    const refreshToken = req.cookies ? req.cookies.admin_refreshToken : null;
    if (!refreshToken) return res.status(401).json({ success: false, error: 'Invalid refresh token' });

    const currentSession = await prisma.userSession.findUnique({
      where: { refreshToken }
    });
    const activeSessionId = currentSession ? currentSession.id : '';

    await prisma.userSession.deleteMany({
      where: {
        userId: req.user.id,
        NOT: { id: activeSessionId }
      }
    });

    return res.status(200).json({ success: true, message: 'Other sessions revoked successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Revoke all sessions
// @route   DELETE /api/auth/sessions
// @access  Private
exports.revokeAllSessions = async (req, res) => {
  try {
    await prisma.userSession.deleteMany({
      where: { userId: req.user.id }
    });

    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshToken: null }
    });

    res.clearCookie('admin_accessToken');
    res.clearCookie('admin_refreshToken');

    return res.status(200).json({ success: true, message: 'All sessions revoked successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
