const nodemailer = require('nodemailer');
require('dotenv').config();

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: port ? parseInt(port, 10) : 587,
    secure: port && parseInt(port, 10) === 465,
    auth: { user, pass }
  });
}

const transporter = createTransporter();

// Debug: show SMTP config state at startup (non-sensitive values only)
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP configured:', !!transporter);

// Attempt an async verify at startup to log immediate diagnostics
if (transporter) {
  transporter.verify()
    .then(() => console.log('SMTP verify: OK'))
    .catch((err) => console.log('SMTP verify error:', err && err.message ? err.message : err));
}

async function getDiagnostics() {
  const host = process.env.SMTP_HOST || null;
  const port = process.env.SMTP_PORT || null;
  const user = process.env.SMTP_USER || null;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || null;
  const transporterPresent = !!transporter;
  let verified = { success: false };
  if (transporter) {
    try {
      await transporter.verify();
      verified = { success: true };
    } catch (err) {
      verified = { success: false, error: err && err.message ? err.message : String(err) };
    }
  }
  return {
    host,
    port,
    user,
    from,
    transporterPresent,
    verified
  };
}

async function testConnection() {
  return await getDiagnostics();
}

async function sendMail({ to, subject, html, text }) {
  if (!transporter) {
    console.log('sendMail: transporter not configured. Aborting send.');
    return { success: false, error: 'SMTP not configured' };
  }
  try {
    console.log('CALLING SMTP SERVICE', { to, subject });
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text
    });
    // Nodemailer info contains accepted/rejected/response/messageId
    console.log('SMTP RESPONSE:', {
      messageId: info && info.messageId,
      response: info && info.response,
      accepted: info && info.accepted,
      rejected: info && info.rejected
    });
    return { success: true, info };
  } catch (err) {
    console.log('EMAIL SEND FAILED:', err && err.message ? err.message : err);
    return { success: false, error: err && err.message ? err.message : String(err) };
  }
}

async function sendVerificationEmail(to, token) {
  const subject = 'Verify Your Magizhvagam Account';
  const verifyUrl = `${process.env.APP_ORIGIN || 'http://localhost:5000'}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  // Log the verification URL for diagnostics (do not keep in production)
  console.log('EMAIL VERIFY URL:', verifyUrl);
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width:600px; margin:0 auto;">
      <h2 style="color:#b8860b">Verify Your Magizhvagam Account</h2>
      <p>Click the button below to verify your email and activate your account.</p>
      <div style="text-align:center; margin:24px 0;">
        <a href="${verifyUrl}" style="background: linear-gradient(90deg,#B8860B 0%,#D4AF37 25%,#F7E27D 50%,#D4AF37 75%,#B8860B 100%); color:#111; padding:12px 20px; border-radius:6px; text-decoration:none; font-weight:700;">Verify Email</a>
      </div>
      <p>If the button doesn't work, visit this link:</p>
      <p style="word-break:break-all"><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p style="color:#666; font-size:12px;">If you did not sign up, please ignore this email.</p>
    </div>
  `;
  return await sendMail({ to, subject, html });
}

async function sendPasswordResetEmail(to, otp) {
  const subject = 'Magizhvagam Password Reset OTP';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width:600px; margin:0 auto;">
      <h2 style="color:#b8860b">Magizhvagam Password Reset</h2>
      <p>Your One-Time Password (OTP) to reset your password is:</p>
      <div style="text-align:center; margin:20px 0; font-size:32px; font-weight:700;">${otp}</div>
      <p>This code expires in 3 minutes. If you did not request this, ignore this email.</p>
    </div>
  `;
  return await sendMail({ to, subject, html });
}

async function sendTestEmail(to) {
  const subject = 'Magizhvagam Test Email';
  const html = `<p>This is a test email from Magizhvagam SMTP diagnostics.</p>`;
  return await sendMail({ to, subject, html });
}

module.exports = {
  testConnection,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendTestEmail
};
