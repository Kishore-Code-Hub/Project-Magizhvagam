require('dotenv').config();
const connectDB = require('../backend/services/db');
const User = require('../backend/models/User');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

(async () => {
  try {
    await connectDB();
    const baseUrl = process.env.TEST_SERVER || 'http://localhost:5004';
    const email = `test-reg+${Date.now()}@example.com`;
    console.log('Registering test user:', email);

    // 1) Register
    let res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Reg', email, phone: '9999999999', password: 'Aa!23456' })
    });
    console.log('register status', res.status);
    console.log(await res.json());

    // Read user from DB to obtain OTP
    let user = await User.findOne({ email });
    console.log('DB verificationOtp:', user.verificationOtp, 'expires:', user.verificationOtpExpires);
    const otp = user.verificationOtp;

    if (!otp) {
      console.error('No OTP found in DB; aborting');
      process.exit(1);
    }

    // 2) Verify OTP
    res = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    console.log('verify-otp status', res.status);
    console.log(await res.json());

    // 3) Login
    res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Aa!23456' })
    });
    const loginRes = await res.json();
    console.log('login status', res.status, loginRes);

    process.exit(0);
  } catch (err) {
    console.error('Error in registration flow test:', err);
    process.exit(1);
  }
})();