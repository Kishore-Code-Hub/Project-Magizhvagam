require('dotenv').config();
const connectDB = require('../backend/services/db');
const User = require('../backend/models/User');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

(async () => {
  try {
    await connectDB();
    const email = 'test-reset@example.com';
    console.log('Seeding test user:', email);
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: 'Test Reset',
        email,
        password: 'InitPass1!',
        role: 'customer',
        emailVerified: false
      });
      console.log('User created');
    } else {
      user.password = 'InitPass1!';
      user.emailVerified = false;
      await user.save();
      console.log('User updated');
    }

    // 1) Request forgot-password
    const baseUrl = process.env.TEST_SERVER || 'http://localhost:5004';
    console.log('\n1) Requesting forgot-password OTP');
    let res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    console.log('forgot-password status', res.status);
    console.log(await res.json());

    // Read user from DB to obtain OTP
    user = await User.findOne({ email });
    console.log('DB resetPasswordToken:', user.resetPasswordToken, 'expires:', user.resetPasswordExpires);
    const otp = user.resetPasswordToken;

    if (!otp) {
      console.error('No OTP found in DB; aborting');
      process.exit(1);
    }

    // 2) Verify reset OTP
    console.log('\n2) Verifying reset OTP');
    res = await fetch(`${baseUrl}/api/auth/verify-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    console.log('verify-reset-otp status', res.status);
    console.log(await res.json());

    // 3) Reset password
    console.log('\n3) Resetting password');
    const newPassword = 'NewP@ssw0rd!';
    res = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, password: newPassword })
    });
    console.log('reset-password status', res.status);
    console.log(await res.json());
    const afterResetUser = await User.findOne({ email });
    console.log('After reset DB flags:', { emailVerified: afterResetUser.emailVerified, accountActive: afterResetUser.accountActive, isActive: afterResetUser.isActive });

    // 4) Attempt login
    console.log('\n4) Attempting login');
    res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: newPassword })
    });
    const loginRes = await res.json();
    console.log('login status', res.status, loginRes);
    // Verify DB flags
    const freshUser = await User.findOne({ email });
    console.log('DB flags:', { emailVerified: freshUser.emailVerified, accountActive: freshUser.accountActive, isActive: freshUser.isActive });
    process.exit(0);
  } catch (err) {
    console.error('Error in flow:', err);
    process.exit(1);
  }
})();
