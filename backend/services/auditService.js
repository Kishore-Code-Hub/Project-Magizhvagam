const prisma = require('./prisma');

const logActivity = async (req, action, details = '') => {
  try {
    const ip = req ? (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') : '127.0.0.1';
    const userAgent = req ? (req.headers['user-agent'] || 'Unknown') : 'Server Process';
    
    let userId = null;
    let email = 'unknown';

    if (req && req.user) {
      userId = req.user.id;
      email = req.user.email;
    } else if (req && req.body && req.body.email) {
      email = req.body.email.toLowerCase().trim();
    }

    await prisma.auditLog.create({
      data: {
        userId,
        email,
        action,
        details,
        ipAddress: ip,
        userAgent
      }
    });
  } catch (err) {
    console.error(`Audit logging failed: ${err.message}`);
  }
};

module.exports = { logActivity };
