const AuditLog = require('../models/AuditLog');

const logActivity = async (req, action, details = '') => {
  try {
    const ip = req ? (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress) : '127.0.0.1';
    const userAgent = req ? req.headers['user-agent'] : 'Server Process';
    
    let userId = null;
    let email = 'unknown';

    if (req && req.user) {
      userId = req.user._id;
      email = req.user.email;
    } else if (req && req.body && req.body.email) {
      email = req.body.email.toLowerCase().trim();
    }

    await AuditLog.create({
      userId,
      email,
      action,
      details,
      ipAddress: ip,
      userAgent
    });
  } catch (err) {
    console.error(`Audit logging failed: ${err.message}`);
  }
};

module.exports = { logActivity };
