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
  const subject = 'Magizhvagam Email Verification OTP';
  // Diagnostic logging to ensure recipient correctness
  console.log('OTP EMAIL RECIPIENT:', to);
  console.log('OTP CODE:', token);
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width:600px; margin:0 auto;">
      <h2 style="color:#b8860b">Magizhvagam Email Verification</h2>
      <p>Your One-Time Password (OTP) to verify your email is:</p>
      <div style="text-align:center; margin:20px 0; font-size:32px; font-weight:700;">${token}</div>
      <p>This code expires in 3 minutes. If you did not sign up, ignore this email.</p>
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

// Wrapper for SMTP sends with automatic exponential backoff retry mechanism
async function sendMailWithRetry(options, retries = 3, delay = 1000) {
  let lastError = 'Unknown error';
  for (let attempt = 1; attempt <= retries; attempt++) {
    const result = await sendMail(options);
    if (result.success) return result;
    lastError = result.error;
    console.warn(`[SMTP] Attempt ${attempt} failed to send mail. Retrying in ${delay}ms... Error: ${lastError}`);
    if (attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // exponential backoff
    }
  }
  return { success: false, error: lastError };
}

async function sendLoginOtpEmail(to, otp) {
  const subject = 'Magizhvagam Admin Login OTP Code';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 25px; max-width:600px; margin:0 auto; border:1px solid #e2e8f0; border-radius:12px;">
      <h2 style="color:#6a0dad; margin-bottom:15px; font-family:'Outfit', sans-serif;">Administrative Portal Access</h2>
      <p style="color:#334155; font-size:14px; line-height:1.5;">To sign into your MAGIZHVAGAM Administrator dashboard, please verify using this One-Time Password (OTP):</p>
      <div style="text-align:center; padding:15px 0; margin:20px 0; font-size:32px; font-weight:800; color:#6a0dad; background:#f8fafc; border-radius:8px; border:1px dashed #cbd5e1; letter-spacing:4px;">${otp}</div>
      <p style="color:#64748b; font-size:12px; line-height:1.5;">This OTP is valid for exactly <strong>5 minutes</strong>. For security, never share this code. If you did not initiate this login, please verify your credentials and check active sessions.</p>
    </div>
  `;
  return await sendMailWithRetry({ to, subject, html });
}

async function sendEmailChangeOtpEmail(to, otp, isNewEmail) {
  const subject = `Magizhvagam Admin Email Update OTP`;
  const targetDesc = isNewEmail ? 'new' : 'current registered';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 25px; max-width:600px; margin:0 auto; border:1px solid #e2e8f0; border-radius:12px;">
      <h2 style="color:#6a0dad; margin-bottom:15px;">Update Account Email</h2>
      <p style="color:#334155; font-size:14px; line-height:1.5;">You requested to change your MAGIZHVAGAM admin email address. To verify your <strong>${targetDesc}</strong> email, enter this verification OTP:</p>
      <div style="text-align:center; padding:15px 0; margin:20px 0; font-size:32px; font-weight:800; color:#6a0dad; background:#f8fafc; border-radius:8px; border:1px dashed #cbd5e1; letter-spacing:4px;">${otp}</div>
      <p style="color:#64748b; font-size:12px; line-height:1.5;">This code expires in <strong>5 minutes</strong>. If you did not initiate this change request, ignore this message.</p>
    </div>
  `;
  return await sendMailWithRetry({ to, subject, html });
}

async function sendEmailChangedNotification(oldEmail, newEmail) {
  const subject = 'Magizhvagam Admin Email Updated';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 25px; max-width:600px; margin:0 auto; border:1px solid #e2e8f0; border-radius:12px;">
      <h2 style="color:#6a0dad; margin-bottom:15px;">Account Email Changed</h2>
      <p style="color:#334155; font-size:14px; line-height:1.5;">The email address for your MAGIZHVAGAM administrator profile has been updated successfully.</p>
      <p style="color:#334155; font-size:14px; line-height:1.5;"><strong>Old Email:</strong> ${oldEmail}<br><strong>New Email:</strong> ${newEmail}</p>
      <p style="color:#ef4444; font-size:12px; line-height:1.5; font-weight:700;">If you did not perform this change, please contact system support immediately to secure your administrator privileges.</p>
    </div>
  `;
  // Send notification to both addresses
  await sendMailWithRetry({ to: oldEmail, subject, html });
  await sendMailWithRetry({ to: newEmail, subject, html });
  return { success: true };
}

async function sendContactEnquiryEmail({ name, email, subject, message }) {
  const adminEmail = process.env.SMTP_USER;
  const emailSubject = `New Store Enquiry from ${name}: ${subject}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 25px; max-width:600px; margin:0 auto; border:1px solid #e2e8f0; border-radius:12px; background:#ffffff;">
      <h2 style="color:#6a0dad; margin-bottom:15px; font-family:'Outfit', sans-serif;">New Store Enquiry</h2>
      <p style="color:#334155; font-size:14px; line-height:1.5;">You have received a new message from the contact form:</p>
      <table style="width:100%; border-collapse:collapse; margin-top:15px; font-size:14px;">
        <tr>
          <td style="padding:8px 0; font-weight:bold; width:120px; color:#475569;">Name:</td>
          <td style="padding:8px 0; color:#1e293b;">${name}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; font-weight:bold; color:#475569;">Email:</td>
          <td style="padding:8px 0; color:#1e293b;"><a href="mailto:${email}">${email}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0; font-weight:bold; color:#475569;">Subject:</td>
          <td style="padding:8px 0; color:#1e293b;">${subject}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; font-weight:bold; color:#475569; vertical-align:top;">Message:</td>
          <td style="padding:8px 0; color:#1e293b; white-space:pre-wrap;">${message}</td>
        </tr>
      </table>
    </div>
  `;
  return await sendMail({ to: adminEmail, subject: emailSubject, html, text: message });
}

module.exports = {
  testConnection,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendTestEmail,
  sendLoginOtpEmail,
  sendEmailChangeOtpEmail,
  sendEmailChangedNotification,
  sendContactEnquiryEmail
};
