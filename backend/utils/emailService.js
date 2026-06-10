const nodemailer = require('nodemailer');
require('dotenv').config();

// Create SMTP transporter if config is present, otherwise fallback to mock console logging
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log('SMTP config is incomplete. Using local console fallback for email routing.');
    return null;
  }

  return nodemailer.createTransport({
    host: host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465, // True for 465, false for other ports
    auth: {
      user: user,
      pass: pass
    }
  });
};

const transporter = createTransporter();

/**
 * Dispatch verification email to user
 * @param {string} to - Recipient email
 * @param {string} token - Cryptographic token
 */
exports.sendVerificationEmail = async (to, token) => {
  const verificationLink = `http://localhost:${process.env.PORT || 5000}/api/auth/verify-email?token=${token}`;
  const subject = 'Magizhvagam Account Verification';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #6A0DAD; text-align: center;">Magizhvagam E-Commerce</h2>
      <p>Hello,</p>
      <p>Thank you for registering on our platform! Please click the button below to verify your email address and unlock all checkout and wishlist functionalities:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" style="background-color: #6A0DAD; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Verify Email</a>
      </div>
      <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${verificationLink}</p>
      <p style="margin-top: 30px; font-size: 12px; color: #888;">This link will expire in 24 hours. If you did not register on our site, please ignore this email.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Magizhvagam Support" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent
      });
      console.log(`Verification email sent successfully to ${to}`);
    } catch (error) {
      console.error(`Error sending verification email to ${to}:`, error.message);
      // Fallback log link to console
      console.log(`[FALLBACK LINK] Verification link for ${to}: ${verificationLink}`);
    }
  } else {
    console.log(`----------------------------------------`);
    console.log(`[CONSOLE EMAIL ROUTE] Verification link for ${to}:`);
    console.log(verificationLink);
    console.log(`----------------------------------------`);
  }
};

/**
 * Dispatch password reset email to user
 * @param {string} to - Recipient email
 * @param {string} token - Cryptographic token
 */
exports.sendPasswordResetEmail = async (to, token) => {
  const resetLink = `http://localhost:${process.env.PORT || 5000}/login.html?resetToken=${token}`;
  const subject = 'Magizhvagam Password Reset Request';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #6A0DAD; text-align: center;">Magizhvagam Security</h2>
      <p>Hello,</p>
      <p>We received a request to reset the password for your Magizhvagam account. Click the button below to update your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #6A0DAD; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Reset Password</a>
      </div>
      <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetLink}</p>
      <p style="margin-top: 30px; font-size: 12px; color: #888;">This password reset link is bound to a tight 1-hour expiration lifespan. If you did not request a password reset, please ignore this email.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Magizhvagam Support" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent
      });
      console.log(`Password reset email sent successfully to ${to}`);
    } catch (error) {
      console.error(`Error sending password reset email to ${to}:`, error.message);
      console.log(`[FALLBACK LINK] Reset link for ${to}: ${resetLink}`);
    }
  } else {
    console.log(`----------------------------------------`);
    console.log(`[CONSOLE EMAIL ROUTE] Password Reset link for ${to}:`);
    console.log(resetLink);
    console.log(`----------------------------------------`);
  }
};
