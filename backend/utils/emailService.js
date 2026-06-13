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
 * Dispatch verification OTP to user
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit verification code
 */
exports.sendVerificationEmail = async (to, otp) => {
  const subject = 'Magizhvagam Account Verification OTP';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #6A0DAD; text-align: center;">Magizhvagam E-Commerce</h2>
      <p>Hello,</p>
      <p>Thank you for registering on our platform! Please use the following One-Time Password (OTP) to verify your email address and activate your account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="background-color: #F3E8FF; border: 2px dashed #6A0DAD; color: #6A0DAD; padding: 14px 28px; font-size: 28px; font-weight: bold; border-radius: 6px; letter-spacing: 5px; display: inline-block;">${otp}</span>
      </div>
      <p style="margin-top: 30px; font-size: 12px; color: #888;">This OTP is valid for 5 minutes. If you did not register on our site, please ignore this email.</p>
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
      console.log(`Verification OTP sent successfully to ${to}`);
    } catch (error) {
      console.error(`Error sending verification OTP to ${to}:`, error.message);
      console.log(`[FALLBACK] Verification OTP for ${to}: ${otp}`);
    }
  } else {
    console.log(`----------------------------------------`);
    console.log(`[CONSOLE EMAIL ROUTE] Verification OTP for ${to}:`);
    console.log(otp);
    console.log(`----------------------------------------`);
  }
};

/**
 * Dispatch password reset OTP to user
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit reset code
 */
exports.sendPasswordResetEmail = async (to, otp) => {
  const subject = 'Magizhvagam Password Reset OTP';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #6A0DAD; text-align: center;">Magizhvagam Security</h2>
      <p>Hello,</p>
      <p>We received a request to reset the password for your Magizhvagam account. Please use the following One-Time Password (OTP) to proceed with updating your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="background-color: #F3E8FF; border: 2px dashed #6A0DAD; color: #6A0DAD; padding: 14px 28px; font-size: 28px; font-weight: bold; border-radius: 6px; letter-spacing: 5px; display: inline-block;">${otp}</span>
      </div>
      <p style="margin-top: 30px; font-size: 12px; color: #888;">This password reset OTP is valid for 3 minutes. If you did not request a password reset, please ignore this email.</p>
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
      console.log(`Password reset OTP sent successfully to ${to}`);
    } catch (error) {
      console.error(`Error sending password reset OTP to ${to}:`, error.message);
      console.log(`[FALLBACK] Reset OTP for ${to}: ${otp}`);
    }
  } else {
    console.log(`----------------------------------------`);
    console.log(`[CONSOLE EMAIL ROUTE] Password Reset OTP for ${to}:`);
    console.log(otp);
    console.log(`----------------------------------------`);
  }
};
