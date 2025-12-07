const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const adminAuth = authenticateAdmin;

// Get login attempts
router.get('/login-attempts', adminAuth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const limit = parseInt(req.query.limit) || 100;
    
    const attempts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM login_attempts 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({ success: true, data: attempts });
  } catch (error) {
    console.error('Error fetching login attempts:', error);
    res.json({ success: true, data: [] });
  }
});

// Get blocked IPs
router.get('/blocked-ips', adminAuth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const blocked = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM blocked_ips 
        WHERE expires_at IS NULL OR expires_at > datetime('now')
        ORDER BY blocked_at DESC
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({ success: true, data: blocked });
  } catch (error) {
    console.error('Error fetching blocked IPs:', error);
    res.json({ success: true, data: [] });
  }
});

// Block IP
router.post('/block-ip', adminAuth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { ip_address, reason, duration_hours } = req.body;

    if (!ip_address) {
      return res.status(400).json({
        success: false,
        error: { message: 'آدرس IP الزامی است' }
      });
    }

    const expires_at = duration_hours 
      ? new Date(Date.now() + duration_hours * 60 * 60 * 1000).toISOString()
      : null;

    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO blocked_ips (ip_address, reason, blocked_at, expires_at)
        VALUES (?, ?, datetime('now'), ?)
      `, [ip_address, reason || 'مسدود شده توسط ادمین', expires_at], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    res.json({ success: true, message: 'IP با موفقیت مسدود شد' });
  } catch (error) {
    console.error('Error blocking IP:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در مسدود کردن IP' }
    });
  }
});

// Unblock IP
router.delete('/unblock-ip/:id', adminAuth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM blocked_ips WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });

    res.json({ success: true, message: 'IP از لیست مسدودی حذف شد' });
  } catch (error) {
    console.error('Error unblocking IP:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در رفع مسدودیت' }
    });
  }
});

// Get security settings
router.get('/settings', adminAuth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const settings = await new Promise((resolve, reject) => {
      db.all(`
        SELECT setting_key, setting_value FROM settings 
        WHERE setting_key LIKE 'security.%'
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const settingsObj = {};
    settings.forEach(s => {
      const key = s.setting_key.replace('security.', '');
      settingsObj[key] = s.setting_value;
    });

    res.json({ 
      success: true, 
      data: {
        max_login_attempts: parseInt(settingsObj.max_login_attempts) || 5,
        lockout_duration: parseInt(settingsObj.lockout_duration) || 30,
        session_timeout: parseInt(settingsObj.session_timeout) || 60,
        require_strong_password: settingsObj.require_strong_password === 'true',
        enable_2fa: settingsObj.enable_2fa === 'true',
        log_all_actions: settingsObj.log_all_actions !== 'false',
        block_suspicious_ips: settingsObj.block_suspicious_ips !== 'false'
      }
    });
  } catch (error) {
    console.error('Error fetching security settings:', error);
    res.json({ success: true, data: {} });
  }
});

// Update security settings
router.put('/settings', adminAuth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR REPLACE INTO settings (setting_key, setting_value, updated_at)
          VALUES (?, ?, datetime('now'))
        `, [`security.${key}`, String(value)], function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        });
      });
    }

    res.json({ success: true, message: 'تنظیمات امنیتی ذخیره شد' });
  } catch (error) {
    console.error('Error saving security settings:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در ذخیره تنظیمات' }
    });
  }
});

module.exports = router;
