const emailService = require('../services/emailService');
const { logActivity } = require('../services/auditService');

exports.testSmtp = async (req, res) => {
  try {
    const result = await emailService.testConnection();
    await logActivity(req, 'smtp_test', `SMTP test performed: ${result && result.verified && result.verified.success}`);
    if (result) return res.status(result.verified && result.verified.success ? 200 : 500).json({ success: !!(result.verified && result.verified.success), diagnostics: result });
    return res.status(500).json({ success: false, error: 'SMTP diagnostics unavailable' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.sendTestEmail = async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ success: false, error: 'Recipient email required' });
    const result = await emailService.sendTestEmail(to);
    await logActivity(req, 'smtp_send_test', `SMTP send test to ${to}: ${result && result.success}`);
    if (result && result.success) return res.status(200).json({ success: true, message: 'Test email queued/sent', info: result.info });
    return res.status(500).json({ success: false, error: result && result.error ? result.error : 'Failed to send test email' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
