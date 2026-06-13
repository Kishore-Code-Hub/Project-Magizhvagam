const emailService = require('../backend/services/emailService');

(async () => {
  try {
    const recipient = process.argv[2] || process.env.SMTP_USER;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Sending password reset email to', recipient, 'otp', otp);
    const res = await emailService.sendPasswordResetEmail(recipient, otp);
    console.log('Result:', res);
  } catch (err) {
    console.error('Error:', err);
  }
})();