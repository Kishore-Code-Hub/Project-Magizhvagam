const fs = require('fs');
const path = require('path');
const emailService = require('../services/emailService');
const { logActivity } = require('../services/auditService');
const prisma = require('../services/prisma');

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

exports.getAuditLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const skip = parseInt(req.query.skip) || 0;
    
    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit
    });
      
    const total = await prisma.auditLog.count();

    // Map id to _id for admin page frontend compatibility
    const compatLogs = logs.map(l => ({
      ...l,
      _id: l.id,
      userId: l.user ? {
        _id: l.user.id,
        ...l.user
      } : null
    }));
    
    return res.status(200).json({ success: true, count: compatLogs.length, total, data: compatLogs });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.createBackup = async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `magizhvagam_backup_${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    let sqlDump = `-- Magizhvagam PostgreSQL Dump\n`;
    sqlDump += `-- Date: ${new Date().toISOString()}\n\n`;

    const models = [
      { name: 'user', table: 'users' },
      { name: 'address', table: 'addresses' },
      { name: 'category', table: 'categories' },
      { name: 'product', table: 'products' },
      { name: 'productImage', table: 'product_images' },
      { name: 'order', table: 'orders' },
      { name: 'orderItem', table: 'order_items' },
      { name: 'coupon', table: 'coupons' },
      { name: 'setting', table: 'settings' },
      { name: 'siteSettings', table: 'site_settings' },
      { name: 'footerConfig', table: 'footer_configs' },
      { name: 'aboutPage', table: 'about_pages' },
      { name: 'animationConfig', table: 'animation_configs' },
      { name: 'homepageSections', table: 'homepage_sections' },
      { name: 'navigationConfig', table: 'navigation_configs' },
      { name: 'auditLog', table: 'audit_logs' },
      { name: 'enquiry', table: 'enquiries' }
    ];

    for (const m of models) {
      if (prisma[m.name]) {
        const rows = await prisma[m.name].findMany();
        if (rows.length > 0) {
          sqlDump += `-- Dumping data for table "${m.table}"\n`;
          sqlDump += `TRUNCATE TABLE "${m.table}" CASCADE;\n`;
          for (const row of rows) {
            const keys = Object.keys(row);
            const values = keys.map(k => {
              const val = row[k];
              if (val === null || val === undefined) return 'NULL';
              if (val instanceof Date) return `'${val.toISOString()}'`;
              if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              return val;
            });
            sqlDump += `INSERT INTO "${m.table}" ("${keys.join('", "')}") VALUES (${values.join(', ')});\n`;
          }
          sqlDump += `\n`;
        }
      }
    }

    fs.writeFileSync(filepath, sqlDump, 'utf8');

    await logActivity(req, 'database_backup', `Created database backup: ${filename}`);
    return res.status(200).json({ success: true, filename, filepath });
  } catch (err) {
    console.error('Backup error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.listBackups = async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      return res.status(200).json({ success: true, backups: [] });
    }
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.sql'));
    const backups = files.map(file => {
      const stat = fs.statSync(path.join(backupDir, file));
      return {
        filename: file,
        size: (stat.size / (1024 * 1024)).toFixed(2) + ' MB',
        createdAt: stat.birthtime
      };
    }).sort((a, b) => b.createdAt - a.createdAt);

    return res.status(200).json({ success: true, backups });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteBackup = async (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = path.join(__dirname, '../../backups');
    const filepath = path.join(backupDir, filename);

    if (path.dirname(filepath) !== backupDir) {
      return res.status(400).json({ success: false, error: 'Invalid path' });
    }

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      await logActivity(req, 'database_backup_delete', `Deleted backup file: ${filename}`);
      return res.status(200).json({ success: true });
    }
    return res.status(404).json({ success: false, error: 'File not found' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

