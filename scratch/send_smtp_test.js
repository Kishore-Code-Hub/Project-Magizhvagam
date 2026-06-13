const emailService = require('../backend/services/emailService');

(async () => {
  try {
    console.log('Running local SMTP test runner...');
    const diag = await emailService.testConnection();
    console.log('Diagnostics:', diag);
    const recipient = process.argv[2] || process.env.SMTP_USER;
    if (!recipient) {
      console.error('No recipient specified and SMTP_USER not set. Usage: node send_smtp_test.js recipient@example.com');
      process.exit(1);
    }
    const res = await emailService.sendTestEmail(recipient);
    console.log('Send result:', res);
  } catch (err) {
    console.error('Runner error:', err);
  }
})();