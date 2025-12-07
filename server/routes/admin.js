const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { dbHelpers } = require('../config/database');
const { authenticateAdmin, logAdminAction } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();

// Temp upload directory for backup restores
const tmpDir = path.join(__dirname, '..', 'tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}
const upload = multer({ dest: tmpDir });

// Get listing stats for admin panel - MUST BE BEFORE /listings/:id
router.get('/listings/stats', authenticateAdmin, async (req, res) => {
    try {
        // Ensure is_archived column exists
        try {
            await dbHelpers.run("ALTER TABLE listings ADD COLUMN is_archived INTEGER DEFAULT 0");
        } catch (e) { /* column may already exist */ }

        const [pending, approved, archived, deleted] = await Promise.all([
            dbHelpers.get("SELECT COUNT(*) as count FROM listings WHERE is_active = 0 AND COALESCE(is_archived, 0) = 0"),
            dbHelpers.get("SELECT COUNT(*) as count FROM listings WHERE is_active = 1 AND COALESCE(is_archived, 0) = 0"),
            dbHelpers.get("SELECT COUNT(*) as count FROM listings WHERE COALESCE(is_archived, 0) = 1"),
            dbHelpers.get("SELECT COUNT(*) as count FROM deleted_listings")
        ]);

        res.json({
            success: true,
            data: {
                pending: pending?.count || 0,
                approved: approved?.count || 0,
                archived: archived?.count || 0,
                deleted: deleted?.count || 0
            }
        });
    } catch (error) {
        console.error('Get listing stats error:', error);
        res.status(500).json({ success: false, message: 'خطای سرور' });
    }
});

// Get all listings for admin
router.get('/listings', [
    query('page').optional().isInt({ min: 1 }).withMessage('شماره صفحه نامعتبر است'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('تعداد آیتم نامعتبر است'),
    query('type').optional().isIn(['rent', 'sale']).withMessage('نوع آگهی نامعتبر است'),
    query('status').optional().isIn(['active', 'inactive', 'pending']).withMessage('وضعیت نامعتبر است')
], authenticateAdmin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'پارامترهای جستجو نامعتبر است',
                errors: errors.array()
            });
        }

        const {
            page = 1,
            limit = 20,
            type,
            status,
            search,
            approval_status,
            is_archived
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = [];
        let queryParams = [];

        if (type) {
            whereConditions.push('l.type = ?');
            queryParams.push(type);
        }

        // فیلتر بر اساس approval_status (pending = در انتظار تایید، approved = تایید شده)
        // فیلتر بایگانی - اول چک میشه
        if (is_archived === 'true' || is_archived === '1') {
            // فقط آگهی‌های بایگانی شده
            whereConditions.push('COALESCE(l.is_archived, 0) = 1');
        } else {
            // آگهی‌های غیر بایگانی
            if (approval_status === 'pending') {
                whereConditions.push('l.is_active = 0');
                whereConditions.push('COALESCE(l.is_archived, 0) = 0');
            } else if (approval_status === 'approved') {
                whereConditions.push('l.is_active = 1');
                whereConditions.push('COALESCE(l.is_archived, 0) = 0');
            } else if (is_archived === 'false' || is_archived === '0') {
                whereConditions.push('COALESCE(l.is_archived, 0) = 0');
            }
        }

        // فیلتر قدیمی status (برای سازگاری)
        if (status === 'active' && !approval_status) {
            whereConditions.push('l.is_active = 1');
        } else if (status === 'inactive' && !approval_status) {
            whereConditions.push('l.is_active = 0');
        } else if (status === 'pending' && !approval_status) {
            whereConditions.push('l.is_active = 0');
        }

        if (search) {
            whereConditions.push('(l.title LIKE ? OR l.description LIKE ? OR u.name LIKE ?)');
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get listings
        const listings = await dbHelpers.all(`
            SELECT 
                l.*,
                c.name as category_name,
                u.name as user_name,
                u.phone as user_phone,
                COUNT(v.id) as total_views
            FROM listings l
            LEFT JOIN categories c ON l.category_id = c.id
            LEFT JOIN users u ON l.user_id = u.id
            LEFT JOIN listing_views v ON l.id = v.listing_id
            ${whereClause}
            GROUP BY l.id
            ORDER BY l.created_at DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, parseInt(limit), offset]);

        // Get total count
        const countResult = await dbHelpers.get(`
            SELECT COUNT(*) as total
            FROM listings l
            LEFT JOIN users u ON l.user_id = u.id
            ${whereClause}
        `, queryParams);

        const total = countResult?.total || 0;
        const totalPages = Math.ceil(total / limit);

        // Get pending count
        const pendingCount = await dbHelpers.get(
            'SELECT COUNT(*) as count FROM listings WHERE is_active = 0 AND COALESCE(is_archived, 0) = 0'
        );

        res.json({
            success: true,
            data: {
                listings,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: totalPages,
                    total_items: total,
                    items_per_page: parseInt(limit)
                },
                pending_count: pendingCount?.count || 0
            }
        });


    } catch (error) {
        console.error('Admin get listings error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Adjust user wallet
router.post('/users/:id/wallet', [
  body('amount').isFloat().withMessage('مبلغ نامعتبر است'),
  body('note').isString().notEmpty().withMessage('توضیح الزامی است')
], authenticateAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'اطلاعات ورودی نامعتبر است', errors: errors.array() });
    }

    const { id } = req.params;
    const { amount, note } = req.body;

    const user = await dbHelpers.get('SELECT id FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ success: false, message: 'کاربر یافت نشد' });

    // Ensure wallet row exists and update balance atomically
    await dbHelpers.run(`
      INSERT OR IGNORE INTO user_wallets (user_id, balance)
      VALUES (?, 0)
    `, [id]);

    await dbHelpers.run(`
      UPDATE user_wallets SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
    `, [amount, id]);

    // Record transaction
    await dbHelpers.run(`
      INSERT INTO transactions (user_id, type, amount, status, description)
      VALUES (?, 'wallet_adjust', ?, 'completed', ?)
    `, [id, amount, note]);

    await logAdminAction(req.admin.id, 'adjust_user_wallet', 'user', id, { amount, note }, req);

    res.json({ success: true, message: 'کیف پول به‌روزرسانی شد' });
  } catch (error) {
    console.error('Adjust wallet error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// Block a user
router.post('/users/:id/block', [
  body('reason').notEmpty().withMessage('دلیل مسدودسازی الزامی است')
], authenticateAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'اطلاعات ورودی نامعتبر است', errors: errors.array() });
    }
    const { id } = req.params;
    const { reason } = req.body;

    const user = await dbHelpers.get('SELECT id FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ success: false, message: 'کاربر یافت نشد' });

    // Ensure table exists
    await dbHelpers.run(`CREATE TABLE IF NOT EXISTS user_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      reason TEXT,
      blocked_by INTEGER,
      blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (blocked_by) REFERENCES admin_users(id),
      UNIQUE(user_id)
    )`);

    await dbHelpers.run(`INSERT OR REPLACE INTO user_blocks (user_id, reason, blocked_by) VALUES (?, ?, ?)` , [id, reason, req.admin.id]);
    await logAdminAction(req.admin.id, 'block_user', 'user', id, { reason }, req);
    res.json({ success: true, message: 'کاربر مسدود شد' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// Unblock a user
router.post('/users/:id/unblock', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await dbHelpers.run('DELETE FROM user_blocks WHERE user_id = ?', [id]);
    await logAdminAction(req.admin.id, 'unblock_user', 'user', id, null, req);
    res.json({ success: true, message: 'مسدودیت کاربر رفع شد' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ==================== Security Routes ====================
// Blocked IPs
router.get('/security/blocked-ips', authenticateAdmin, async (req, res) => {
  try {
    await dbHelpers.run(`CREATE TABLE IF NOT EXISTS blocked_ips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address VARCHAR(45) UNIQUE NOT NULL,
      reason TEXT,
      blocked_by INTEGER,
      blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (blocked_by) REFERENCES admin_users(id)
    )`);
    const ips = await dbHelpers.all('SELECT * FROM blocked_ips ORDER BY blocked_at DESC');
    res.json({ success: true, data: { ips } });
  } catch (error) {
    console.error('Get blocked IPs error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

router.post('/security/blocked-ips', [
  body('ip').notEmpty().withMessage('IP الزامی است'),
  body('reason').notEmpty().withMessage('دلیل الزامی است')
], authenticateAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'اطلاعات ورودی نامعتبر است', errors: errors.array() });
    }
    const { ip, reason } = req.body;
    await dbHelpers.run('INSERT OR REPLACE INTO blocked_ips (ip_address, reason, blocked_by) VALUES (?, ?, ?)', [ip, reason, req.admin.id]);
    await logAdminAction(req.admin.id, 'block_ip', 'ip', null, { ip, reason }, req);
    res.json({ success: true, message: 'IP بلاک شد' });
  } catch (error) {
    console.error('Block IP error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

router.delete('/security/blocked-ips/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await dbHelpers.run('DELETE FROM blocked_ips WHERE id = ?', [id]);
    await logAdminAction(req.admin.id, 'unblock_ip', 'ip', id, null, req);
    res.json({ success: true, message: 'IP آنبلاک شد' });
  } catch (error) {
    console.error('Unblock IP error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// Login logs (read-only)
router.get('/security/login-logs', authenticateAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    await dbHelpers.run(`CREATE TABLE IF NOT EXISTS login_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50),
      ip_address VARCHAR(45),
      success BOOLEAN,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    const logs = await dbHelpers.all('SELECT * FROM login_logs ORDER BY created_at DESC LIMIT ?', [limit]);
    res.json({ success: true, data: { logs } });
  } catch (error) {
    console.error('Get login logs error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ==================== Backup & Restore Routes ====================
// Create backup (database or media)
router.get('/backup', authenticateAdmin, async (req, res) => {
  try {
    const type = (req.query.type || 'database').toString();
    if (type === 'database') {
      const dbPath = process.env.DB_PATH
        ? path.resolve(process.env.DB_PATH)
        : path.join(__dirname, '..', 'database', 'bilflow.db');

      if (!fs.existsSync(dbPath)) {
        return res.status(404).json({ success: false, message: 'فایل دیتابیس یافت نشد' });
      }

      await logAdminAction(req.admin.id, 'create_backup', 'database', null, null, req);

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="backup-db-${new Date().toISOString().slice(0,10)}.sqlite"`);
      return res.sendFile(dbPath);
    }

    if (type === 'media') {
      // Placeholder implementation: generate a simple listing of files
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      let files = [];
      const walk = (dir) => {
        try {
          const items = fs.readdirSync(dir);
          for (const it of items) {
            const full = path.join(dir, it);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) walk(full);
            else files.push(path.relative(uploadsDir, full));
          }
        } catch (_) { /* ignore */ }
      };
      if (fs.existsSync(uploadsDir)) {
        walk(uploadsDir);
      }

      const placeholder = [
        'Media backup placeholder file',
        `Generated at: ${new Date().toISOString()}`,
        `Total files: ${files.length}`,
        '',
        ...files
      ].join('\n');

      await logAdminAction(req.admin.id, 'create_backup', 'media', null, { count: files.length }, req);

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="backup-media-${new Date().toISOString().slice(0,10)}.zip"`);
      return res.send(Buffer.from(placeholder, 'utf8'));
    }

    return res.status(400).json({ success: false, message: 'نوع بک‌آپ نامعتبر است' });
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// Restore backup (accept file upload; placeholder implementation)
router.post('/backup/restore', authenticateAdmin, upload.single('backup'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'فایل بک‌آپ ارسال نشده است' });
    }

    // NOTE: For safety, we are not applying the backup automatically.
    // Admin can manually restore using server access. This endpoint records the action.
    await logAdminAction(req.admin.id, 'restore_backup', 'backup', null, { originalname: file.originalname, size: file.size }, req);

    // Clean up temp file
    try { fs.unlinkSync(file.path); } catch (_) {}

    return res.json({ success: true, message: 'فایل بک‌آپ دریافت شد و در صف بررسی قرار گرفت' });
  } catch (error) {
    console.error('Restore backup error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// Get single listing for admin
router.get('/listings/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const listing = await dbHelpers.get(`
            SELECT 
                l.*,
                c.name as category_name,
                u.name as user_name,
                u.phone as user_phone,
                u.email as user_email
            FROM listings l
            LEFT JOIN categories c ON l.category_id = c.id
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.id = ?
        `, [id]);

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'آگهی یافت نشد'
            });
        }

        // Get view statistics
        const viewStats = await dbHelpers.all(`
            SELECT 
                DATE(viewed_at) as date,
                COUNT(*) as views,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT ip_address) as unique_ips
            FROM listing_views 
            WHERE listing_id = ?
            GROUP BY DATE(viewed_at)
            ORDER BY date DESC
            LIMIT 30
        `, [id]);

        res.json({
            success: true,
            data: {
                listing,
                view_stats: viewStats
            }
        });

    } catch (error) {
        console.error('Admin get listing error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Toggle featured status
router.post('/listings/:id/toggle-featured', [
    body('duration_days').optional().isInt({ min: 1, max: 365 }).withMessage('مدت ویژه‌سازی نامعتبر است')
], authenticateAdmin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورودی نامعتبر است',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { duration_days = 30 } = req.body;

        const listing = await dbHelpers.get(
            'SELECT * FROM listings WHERE id = ?',
            [id]
        );

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'آگهی یافت نشد'
            });
        }

        const newFeaturedStatus = listing.is_featured ? 0 : 1;

        await dbHelpers.run(
            'UPDATE listings SET is_featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newFeaturedStatus, id]
        );

        if (newFeaturedStatus === 1) {
            // Add to featured_listings
            try {
                const durationInt = parseInt(String(duration_days), 10);
                const plusDays = `+${durationInt} days`;
                
                // Check if already exists
                const existingFeatured = await dbHelpers.get(
                    'SELECT id FROM featured_listings WHERE listing_id = ? AND end_date > CURRENT_TIMESTAMP',
                    [id]
                );
                
                if (!existingFeatured) {
                    await dbHelpers.run(
                        'INSERT INTO featured_listings (listing_id, duration_days, start_date, end_date, amount_paid) VALUES (?, ?, CURRENT_TIMESTAMP, datetime(CURRENT_TIMESTAMP, ?), 0)',
                        [id, durationInt, plusDays]
                    );
                }
            } catch (e) {
                console.error('Error inserting featured_listings record:', e);
            }
        } else {
            // Remove from featured_listings
            try {
                await dbHelpers.run(
                    'UPDATE featured_listings SET end_date = CURRENT_TIMESTAMP WHERE listing_id = ? AND end_date > CURRENT_TIMESTAMP',
                    [id]
                );
            } catch (e) {
                console.error('Error updating featured_listings record:', e);
            }
        }

        await logAdminAction(
            req.admin.id,
            newFeaturedStatus === 1 ? 'feature_listing' : 'unfeature_listing',
            'listing',
            id,
            { duration_days },
            req
        );

        res.json({
            success: true,
            message: newFeaturedStatus === 1 ? 'آگهی ویژه شد' : 'آگهی از حالت ویژه خارج شد',
            data: { is_featured: newFeaturedStatus }
        });

    } catch (error) {
        console.error('Toggle featured error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Approve listing
router.post('/listings/:id/approve', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const listing = await dbHelpers.get(
            'SELECT * FROM listings WHERE id = ?',
            [id]
        );

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'آگهی یافت نشد'
            });
        }

        await dbHelpers.run(
            'UPDATE listings SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        await logAdminAction(
            req.admin.id,
            'approve_listing',
            'listing',
            id,
            null,
            req
        );

        res.json({
            success: true,
            message: 'آگهی تایید شد'
        });

    } catch (error) {
        console.error('Approve listing error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// NOTE: Reject listing API moved to line ~1740 with notification support

// Update listing status
router.patch('/listings/:id/status', [
    body('is_active').optional().isBoolean().withMessage('وضعیت فعال بودن نامعتبر است'),
    body('is_featured').optional().isBoolean().withMessage('وضعیت ویژه بودن نامعتبر است'),
    body('duration_days').optional().isInt({ min: 1, max: 365 }).withMessage('مدت ویژه‌سازی نامعتبر است')
], authenticateAdmin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورودی نامعتبر است',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { is_active, is_featured, duration_days } = req.body;

        // Check if listing exists
        const listing = await dbHelpers.get(
            'SELECT * FROM listings WHERE id = ?',
            [id]
        );

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'آگهی یافت نشد'
            });
        }

        const updateFields = [];
        const updateValues = [];

        if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            updateValues.push(is_active ? 1 : 0);
        }

        if (is_featured !== undefined) {
            updateFields.push('is_featured = ?');
            updateValues.push(is_featured ? 1 : 0);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'هیچ فیلدی برای به‌روزرسانی ارسال نشده است'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(id);

        await dbHelpers.run(
            `UPDATE listings SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        // If marking as featured and duration provided, record in featured_listings
        if (is_featured === true && duration_days) {
            try {
                const durationInt = parseInt(String(duration_days), 10);
                if (Number.isInteger(durationInt) && durationInt > 0) {
                    // Check if already exists
                    const existingFeatured = await dbHelpers.get(
                        'SELECT id FROM featured_listings WHERE listing_id = ? AND end_date > CURRENT_TIMESTAMP',
                        [id]
                    );
                    
                    if (!existingFeatured) {
                        const plusDays = `+${durationInt} days`;
                        await dbHelpers.run(
                            'INSERT INTO featured_listings (listing_id, duration_days, start_date, end_date, amount_paid) VALUES (?, ?, CURRENT_TIMESTAMP, datetime(CURRENT_TIMESTAMP, ?), 0)',
                            [id, durationInt, plusDays]
                        );
                    }
                }
            } catch (e) {
                console.error('Error inserting featured_listings record:', e);
            }
        }

        // If removing featured status, update featured_listings
        if (is_featured === false) {
            try {
                await dbHelpers.run(
                    'UPDATE featured_listings SET end_date = CURRENT_TIMESTAMP WHERE listing_id = ? AND end_date > CURRENT_TIMESTAMP',
                    [id]
                );
            } catch (e) {
                console.error('Error updating featured_listings record:', e);
            }
        }

        const updatedListing = await dbHelpers.get(
            'SELECT * FROM listings WHERE id = ?',
            [id]
        );

        // Log action
        let actionType = 'update_listing';
        if (is_active !== undefined) {
            actionType = is_active ? 'approve_listing' : 'reject_listing';
        } else if (is_featured !== undefined) {
            actionType = is_featured ? 'feature_listing' : 'unfeature_listing';
        }

        await logAdminAction(
            req.admin.id,
            actionType,
            'listing',
            id,
            { is_active, is_featured, duration_days },
            req
        );

        res.json({
            success: true,
            message: 'وضعیت آگهی به‌روزرسانی شد',
            data: { listing: updatedListing }
        });

    } catch (error) {
        console.error('Admin update listing status error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Delete listing (admin) - انتقال به جدول آگهی‌های حذف شده
router.delete('/listings/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason = 'admin_removed', reason_text = '' } = req.body || {};

        // Check if listing exists
        const listing = await dbHelpers.get(
            'SELECT * FROM listings WHERE id = ?',
            [id]
        );

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'آگهی یافت نشد'
            });
        }

        // ذخیره آگهی در جدول آگهی‌های حذف شده
        await dbHelpers.run(`
            INSERT INTO deleted_listings (
                listing_id, user_id, title, description, price, type, 
                category_id, images, location, deleted_by, delete_reason, 
                delete_reason_text, admin_id, original_created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            listing.id, listing.user_id, listing.title, listing.description,
            listing.price, listing.type, listing.category_id, listing.images,
            listing.location, 'admin', reason, reason_text, req.admin.id, listing.created_at
        ]);

        // حذف آگهی از جدول اصلی
        await dbHelpers.run('DELETE FROM listings WHERE id = ?', [id]);
        await dbHelpers.run('DELETE FROM user_favorites WHERE listing_id = ?', [id]);
        await dbHelpers.run('DELETE FROM featured_listings WHERE listing_id = ?', [id]);

        // Log action
        await logAdminAction(
            req.admin.id,
            'delete_listing',
            'listing',
            id,
            null,
            { reason, reason_text }
        );

        res.json({
            success: true,
            message: 'آگهی به بایگانی حذف شده‌ها منتقل شد'
        });

    } catch (error) {
        console.error('Admin delete listing error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Get dashboard statistics
router.get('/dashboard', authenticateAdmin, async (req, res) => {
    try {
        // Get basic stats
        const [
            totalListings,
            activeListings,
            pendingListings,
            featuredListings,
            totalUsers,
            totalViews,
            recentListings,
            pendingListingsData,
            topCategories
        ] = await Promise.all([
            dbHelpers.get('SELECT COUNT(*) as count FROM listings'),
            dbHelpers.get('SELECT COUNT(*) as count FROM listings WHERE is_active = 1'),
            dbHelpers.get('SELECT COUNT(*) as count FROM listings WHERE is_active = 0'),
            dbHelpers.get('SELECT COUNT(*) as count FROM listings WHERE is_featured = 1'),
            dbHelpers.get('SELECT COUNT(*) as count FROM users'),
            dbHelpers.get('SELECT COUNT(*) as count FROM listing_views'),
            dbHelpers.all(`
                SELECT l.*, u.name as user_name, c.name as category_name
                FROM listings l
                LEFT JOIN users u ON l.user_id = u.id
                LEFT JOIN categories c ON l.category_id = c.id
                WHERE l.is_active = 1
                ORDER BY l.created_at DESC
                LIMIT 5
            `),
            dbHelpers.all(`
                SELECT l.*, u.name as user_name, c.name as category_name
                FROM listings l
                LEFT JOIN users u ON l.user_id = u.id
                LEFT JOIN categories c ON l.category_id = c.id
                WHERE l.is_active = 0
                ORDER BY l.created_at DESC
                LIMIT 10
            `),
            dbHelpers.all(`
                SELECT c.name, COUNT(l.id) as count
                FROM categories c
                LEFT JOIN listings l ON c.id = l.category_id AND l.is_active = 1
                GROUP BY c.id, c.name
                ORDER BY count DESC
                LIMIT 5
            `)
        ]);

        // Get daily stats for last 30 days
        const dailyStats = await dbHelpers.all(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as listings,
                SUM(view_count) as views
            FROM listings
            WHERE created_at >= date('now', '-30 days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        res.json({
            success: true,
            data: {
                stats: {
                    total_listings: totalListings.count,
                    active_listings: activeListings.count,
                    pending_listings: pendingListings.count,
                    featured_listings: featuredListings.count,
                    total_users: totalUsers.count,
                    total_views: totalViews.count
                },
                recent_listings: recentListings,
                pending_listings: pendingListingsData,
                top_categories: topCategories,
                daily_stats: dailyStats
            }
        });

    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Get all users
router.get('/users', [
    query('page').optional().isInt({ min: 1 }).withMessage('شماره صفحه نامعتبر است'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('تعداد آیتم نامعتبر است')
], authenticateAdmin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'پارامترهای جستجو نامعتبر است',
                errors: errors.array()
            });
        }

        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        await dbHelpers.run(`CREATE TABLE IF NOT EXISTS user_blocks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER UNIQUE NOT NULL,
          reason TEXT,
          blocked_by INTEGER,
          blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (blocked_by) REFERENCES admin_users(id)
        )`);
        await dbHelpers.run(`CREATE TABLE IF NOT EXISTS user_wallets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER UNIQUE NOT NULL,
          balance DECIMAL(15,2) DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        const users = await dbHelpers.all(`
            SELECT 
                u.*,
                COALESCE(w.balance, 0) as wallet_balance,
                EXISTS (SELECT 1 FROM user_blocks b WHERE b.user_id = u.id) as is_blocked,
                COUNT(DISTINCT l.id) as listings_count,
                COUNT(DISTINCT f.id) as favorites_count
            FROM users u
            LEFT JOIN user_wallets w ON u.id = w.user_id
            LEFT JOIN listings l ON u.id = l.user_id AND l.is_active = 1
            LEFT JOIN user_favorites f ON u.id = f.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        `, [parseInt(limit), offset]);

        const countResult = await dbHelpers.get('SELECT COUNT(*) as total FROM users');
        const total = countResult.total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: totalPages,
                    total_items: total,
                    items_per_page: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Admin get users error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Update listing details
router.put('/listings/:id', [
  body('title').optional().isString().notEmpty().withMessage('عنوان نامعتبر است'),
  body('description').optional().isString(),
  body('price').optional().isFloat({ min: 0 }).withMessage('قیمت نامعتبر است'),
  body('type').optional().isIn(['rent','sale']).withMessage('نوع آگهی نامعتبر است'),
  body('location').optional().isString(),
  body('category_id').optional().isInt().withMessage('دسته‌بندی نامعتبر است'),
  body('is_active').optional().isBoolean().withMessage('وضعیت فعال بودن نامعتبر است'),
], authenticateAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success:false, message:'اطلاعات ورودی نامعتبر است', errors: errors.array() });
    }

    const { id } = req.params;
    const existing = await dbHelpers.get('SELECT id FROM listings WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success:false, message:'آگهی یافت نشد' });
    }

    const fields = ['title','description','price','type','location','category_id','is_active'];
    const updateFields = [];
    const updateValues = [];

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updateFields.push(`${f} = ?`);
        updateValues.push(req.body[f]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success:false, message:'هیچ فیلدی برای به‌روزرسانی ارسال نشده است' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    await dbHelpers.run(`UPDATE listings SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    const updated = await dbHelpers.get('SELECT * FROM listings WHERE id = ?', [id]);

    await logAdminAction(req.admin.id, 'update_listing', 'listing', id, req.body, req);

    res.json({ success:true, message:'آگهی به‌روزرسانی شد', data: { listing: updated } });
  } catch (error) {
    console.error('Admin update listing error:', error);
    res.status(500).json({ success:false, message:'خطای سرور' });
  }
});

// ==================== Static Pages Routes ====================
router.get('/static-pages', authenticateAdmin, async (req, res) => {
  try {
    const pages = await dbHelpers.all(`
      SELECT id, slug, title, content, meta_title, meta_description, is_active, updated_at
      FROM static_pages
      ORDER BY slug
    `);
    
    res.json({
      success: true,
      data: { pages }
    });
  } catch (error) {
    console.error('Get static pages error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

router.get('/static-pages/:slug', authenticateAdmin, async (req, res) => {
  try {
    const page = await dbHelpers.get(
      'SELECT * FROM static_pages WHERE slug = ?',
      [req.params.slug]
    );
    
    if (!page) {
      return res.status(404).json({ success: false, message: 'صفحه یافت نشد' });
    }
    
    res.json({ success: true, data: { page } });
  } catch (error) {
    console.error('Get static page error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

router.put('/static-pages/:slug', [
  body('title').optional().notEmpty().withMessage('عنوان نمی‌تواند خالی باشد'),
  body('content').optional().notEmpty().withMessage('محتوا نمی‌تواند خالی باشد')
], authenticateAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات ورودی نامعتبر است',
        errors: errors.array()
      });
    }

    const { slug } = req.params;
    const { title, content, meta_title, meta_description, is_active } = req.body;

    const page = await dbHelpers.get('SELECT id FROM static_pages WHERE slug = ?', [slug]);
    if (!page) {
      return res.status(404).json({ success: false, message: 'صفحه یافت نشد' });
    }

    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(content);
    }
    if (meta_title !== undefined) {
      updateFields.push('meta_title = ?');
      updateValues.push(meta_title);
    }
    if (meta_description !== undefined) {
      updateFields.push('meta_description = ?');
      updateValues.push(meta_description);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active ? 1 : 0);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(slug);
      
      await dbHelpers.run(
        `UPDATE static_pages SET ${updateFields.join(', ')} WHERE slug = ?`,
        updateValues
      );
    }

    const updated = await dbHelpers.get('SELECT * FROM static_pages WHERE slug = ?', [slug]);
    await logAdminAction(req.admin.id, 'update_static_page', 'static_page', page.id, req.body, req);

    res.json({
      success: true,
      message: 'صفحه با موفقیت به‌روزرسانی شد',
      data: { page: updated }
    });
  } catch (error) {
    console.error('Update static page error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ==================== Notifications Routes ====================
router.get('/notifications', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const notifications = await dbHelpers.all(`
      SELECT id, user_id, title, message, type, is_read, created_at
      FROM notifications
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const total = await dbHelpers.get('SELECT COUNT(*) as count FROM notifications');

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total: total.count,
          total_pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

router.post('/notifications', [
  body('user_id').optional().isInt().withMessage('شناسه کاربر نامعتبر است'),
  body('title').notEmpty().withMessage('عنوان الزامی است'),
  body('message').notEmpty().withMessage('پیام الزامی است'),
  body('type').optional().isIn(['info', 'warning', 'success', 'error']).withMessage('نوع نامعتبر است')
], authenticateAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات ورودی نامعتبر است',
        errors: errors.array()
      });
    }

    const { user_id, title, message, type = 'info' } = req.body;

    if (user_id) {
      // Send to specific user
      const result = await dbHelpers.run(`
        INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
        VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `, [user_id, title, message, type]);

      await logAdminAction(req.admin.id, 'send_notification', 'notification', result.lastID, req.body, req);

      res.json({
        success: true,
        message: 'اعلان با موفقیت ارسال شد',
        data: { id: result.lastID }
      });
    } else {
      // Send to all users
      const users = await dbHelpers.all('SELECT id FROM users WHERE is_active = 1');
      
      for (const user of users) {
        await dbHelpers.run(`
          INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
          VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
        `, [user.id, title, message, type]);
      }

      await logAdminAction(req.admin.id, 'broadcast_notification', 'notification', null, req.body, req);

      res.json({
        success: true,
        message: `اعلان به ${users.length} کاربر ارسال شد`
      });
    }
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

router.delete('/notifications/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await dbHelpers.get('SELECT id FROM notifications WHERE id = ?', [id]);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'اعلان یافت نشد' });
    }

    await dbHelpers.run('DELETE FROM notifications WHERE id = ?', [id]);
    await logAdminAction(req.admin.id, 'delete_notification', 'notification', id, null, req);

    res.json({ success: true, message: 'اعلان حذف شد' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ==================== Messages Routes ====================
router.get('/messages', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const messages = await dbHelpers.all(`
      SELECT 
        i.id,
        i.customer_name AS user_name,
        i.customer_phone AS user_phone,
        i.customer_email AS user_email,
        NULL AS subject,
        i.message,
        i.status,
        i.created_at
      FROM inquiries i
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const total = await dbHelpers.get('SELECT COUNT(*) as count FROM inquiries');

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total: total.count,
          total_pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// Mark message as read (compat with frontend service)
router.post('/messages/:id/read', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const message = await dbHelpers.get('SELECT id FROM inquiries WHERE id = ?', [id]);
    if (!message) {
      return res.status(404).json({ success: false, message: 'پیام یافت نشد' });
    }

    await dbHelpers.run('UPDATE inquiries SET status = "read" WHERE id = ?', [id]);
    await logAdminAction(req.admin.id, 'read_message', 'inquiry', id, null, req);

    res.json({ success: true, message: 'پیام به عنوان خوانده شده علامت خورد' });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// Reply to a message (compat with frontend service)
router.post('/messages/:id/reply', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body || {};

    const message = await dbHelpers.get('SELECT id FROM inquiries WHERE id = ?', [id]);
    if (!message) {
      return res.status(404).json({ success: false, message: 'پیام یافت نشد' });
    }

    // Update status to replied and timestamp if column exists
    let setRepliedAt = '';
    try {
      const cols = await dbHelpers.all('PRAGMA table_info(inquiries)');
      if (Array.isArray(cols) && cols.some(c => c.name === 'replied_at')) {
        setRepliedAt = ', replied_at = CURRENT_TIMESTAMP';
      }
    } catch (_) {}

    await dbHelpers.run(`UPDATE inquiries SET status = "replied"${setRepliedAt} WHERE id = ?`, [id]);
    await logAdminAction(req.admin.id, 'reply_message', 'inquiry', id, { reply_present: !!reply }, req);

    res.json({ success: true, message: 'پاسخ ثبت شد' });
  } catch (error) {
    console.error('Reply message error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

router.patch('/messages/:id/status', [
  body('status').isIn(['new', 'read', 'replied']).withMessage('وضعیت نامعتبر است')
], authenticateAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات ورودی نامعتبر است',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const message = await dbHelpers.get('SELECT id FROM inquiries WHERE id = ?', [id]);
    if (!message) {
      return res.status(404).json({ success: false, message: 'پیام یافت نشد' });
    }

    const updateFields = ['status = ?'];
    const updateValues = [status];

    if (status === 'replied') {
      try {
        const cols = await dbHelpers.all(`PRAGMA table_info(inquiries)`);
        const hasRepliedAt = Array.isArray(cols) && cols.some(c => c.name === 'replied_at');
        if (hasRepliedAt) {
          updateFields.push('replied_at = CURRENT_TIMESTAMP');
        }
      } catch (e) {
        // ignore
      }
    }

    updateValues.push(id);

    await dbHelpers.run(
      `UPDATE inquiries SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    await logAdminAction(req.admin.id, 'update_message_status', 'inquiry', id, { status }, req);

    res.json({ success: true, message: 'وضعیت پیام به‌روزرسانی شد' });
  } catch (error) {
    console.error('Update message status error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

router.delete('/messages/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await dbHelpers.get('SELECT id FROM inquiries WHERE id = ?', [id]);
    if (!message) {
      return res.status(404).json({ success: false, message: 'پیام یافت نشد' });
    }

    await dbHelpers.run('DELETE FROM inquiries WHERE id = ?', [id]);
    await logAdminAction(req.admin.id, 'delete_message', 'inquiry', id, null, req);

    res.json({ success: true, message: 'پیام حذف شد' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ==================== Categories Routes ====================
router.get('/categories', authenticateAdmin, async (req, res) => {
  try {
    const categories = await dbHelpers.all(`
      SELECT 
        c.*,
        COUNT(l.id) as listings_count
      FROM categories c
      LEFT JOIN listings l ON c.id = l.category_id
      GROUP BY c.id
      ORDER BY c.category_type, c.name
    `);
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

router.post('/categories', [
  body('name').notEmpty().withMessage('نام دسته‌بندی الزامی است'),
  body('category_type').isIn(['equipment', 'parts', 'services']).withMessage('نوع دسته‌بندی نامعتبر است')
], authenticateAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات ورودی نامعتبر است',
        errors: errors.array()
      });
    }

    const { name, slug, icon, category_type } = req.body;

    // Check if slug already exists
    if (slug) {
      const existing = await dbHelpers.get('SELECT id FROM categories WHERE slug = ?', [slug]);
      if (existing) {
        return res.status(400).json({ success: false, message: 'این slug قبلاً استفاده شده است' });
      }
    }

    const result = await dbHelpers.run(`
      INSERT INTO categories (name, slug, icon, category_type)
      VALUES (?, ?, ?, ?)
    `, [name, slug || name.toLowerCase().replace(/\s+/g, '-'), icon || null, category_type]);

    await logAdminAction(req.admin.id, 'create_category', 'category', result.lastID, req.body, req);

    res.json({
      success: true,
      message: 'دسته‌بندی با موفقیت ایجاد شد',
      data: { id: result.lastID }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

router.put('/categories/:id', [
  body('name').optional().notEmpty().withMessage('نام دسته‌بندی نمی‌تواند خالی باشد')
], authenticateAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات ورودی نامعتبر است',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { name, slug, icon } = req.body;

    const category = await dbHelpers.get('SELECT id FROM categories WHERE id = ?', [id]);
    if (!category) {
      return res.status(404).json({ success: false, message: 'دسته‌بندی یافت نشد' });
    }

    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (slug !== undefined) {
      updateFields.push('slug = ?');
      updateValues.push(slug);
    }
    if (icon !== undefined) {
      updateFields.push('icon = ?');
      updateValues.push(icon);
    }
    // description column does not exist in schema; ignore if provided

    if (updateFields.length > 0) {
      updateValues.push(id);
      await dbHelpers.run(
        `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    await logAdminAction(req.admin.id, 'update_category', 'category', id, req.body, req);

    res.json({ success: true, message: 'دسته‌بندی با موفقیت به‌روزرسانی شد' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

router.delete('/categories/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await dbHelpers.get('SELECT id FROM categories WHERE id = ?', [id]);
    if (!category) {
      return res.status(404).json({ success: false, message: 'دسته‌بندی یافت نشد' });
    }

    // Check if category has listings
    const listings = await dbHelpers.get('SELECT COUNT(*) as count FROM listings WHERE category_id = ?', [id]);
    if (listings.count > 0) {
      return res.status(400).json({
        success: false,
        message: `این دسته‌بندی دارای ${listings.count} آگهی است و نمی‌توان آن را حذف کرد`
      });
    }

    await dbHelpers.run('DELETE FROM categories WHERE id = ?', [id]);
    await logAdminAction(req.admin.id, 'delete_category', 'category', id, null, req);

    res.json({ success: true, message: 'دسته‌بندی حذف شد' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ==================== Media Routes ====================
router.get('/media', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // For now, return media from listings
    const media = await dbHelpers.all(`
      SELECT 
        l.id as listing_id,
        l.title,
        l.images,
        l.created_at,
        u.name as uploader_name
      FROM listings l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.images IS NOT NULL AND l.images != '[]'
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // Parse images
    const parsedMedia = media.map(item => {
      let images = [];
      try {
        images = JSON.parse(item.images);
      } catch (e) {
        images = [];
      }
      return {
        ...item,
        images
      };
    });

    const total = await dbHelpers.get(`
      SELECT COUNT(*) as count 
      FROM listings 
      WHERE images IS NOT NULL AND images != '[]'
    `);

    res.json({
      success: true,
      data: {
        media: parsedMedia,
        pagination: {
          page,
          limit,
          total: total.count,
          total_pages: Math.ceil(total.count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ==================== Listing Approval System ====================

// Approve listing
router.post('/listings/:id/approve', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if listing exists
        const listing = await dbHelpers.get(
            'SELECT l.*, u.name as user_name, u.phone as user_phone FROM listings l LEFT JOIN users u ON l.user_id = u.id WHERE l.id = ?',
            [id]
        );

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'آگهی یافت نشد'
            });
        }

        // Update listing status
        await dbHelpers.run(
            'UPDATE listings SET approval_status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP, is_active = 1 WHERE id = ?',
            ['approved', req.admin.id, id]
        );

        // Create notification for user
        await dbHelpers.run(
            'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
            [
                listing.user_id,
                'listing_approved',
                'آگهی شما تایید شد',
                `آگهی "${listing.title}" شما توسط مدیریت تایید و منتشر شد.`,
                JSON.stringify({ listing_id: id, listing_title: listing.title })
            ]
        );

        // Log action
        await logAdminAction(
            req.admin.id,
            'approve_listing',
            'listing',
            id,
            { listing_title: listing.title },
            req
        );

        res.json({
            success: true,
            message: 'آگهی تایید و منتشر شد'
        });

    } catch (error) {
        console.error('Approve listing error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Reject listing
router.post('/listings/:id/reject', [
    body('reason').notEmpty().withMessage('دلیل رد الزامی است')
], authenticateAdmin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورودی نامعتبر است',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { reason } = req.body;

        // Check if listing exists
        const listing = await dbHelpers.get(
            'SELECT l.*, u.name as user_name, u.phone as user_phone FROM listings l LEFT JOIN users u ON l.user_id = u.id WHERE l.id = ?',
            [id]
        );

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'آگهی یافت نشد'
            });
        }

        // Update listing status
        await dbHelpers.run(
            'UPDATE listings SET approval_status = ?, rejection_reason = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP, is_active = 0 WHERE id = ?',
            ['rejected', reason, req.admin.id, id]
        );

        // Create notification for user
        await dbHelpers.run(
            'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
            [
                listing.user_id,
                'listing_rejected',
                'آگهی شما رد شد',
                `آگهی "${listing.title}" شما توسط مدیریت رد شد.\n\nدلیل: ${reason}`,
                JSON.stringify({ listing_id: id, listing_title: listing.title, reason })
            ]
        );

        // Log action
        await logAdminAction(
            req.admin.id,
            'reject_listing',
            'listing',
            id,
            { listing_title: listing.title, reason },
            req
        );

        res.json({
            success: true,
            message: 'آگهی رد شد و اطلاع‌رسانی به کاربر ارسال شد'
        });

    } catch (error) {
        console.error('Reject listing error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// ==================== System Settings ====================

// Get settings by category
router.get('/settings', authenticateAdmin, async (req, res) => {
    try {
        const { category } = req.query;
        
        let query = 'SELECT * FROM system_settings';
        let params = [];
        
        if (category) {
            query += ' WHERE category = ?';
            params.push(category);
        }
        
        query += ' ORDER BY setting_key';
        
        const settings = await dbHelpers.all(query, params);
        
        res.json({
            success: true,
            data: { settings }
        });
        
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Update multiple settings
router.post('/settings/bulk-update', [
    body('settings').isArray().withMessage('تنظیمات باید آرایه باشد'),
    body('settings.*.key').notEmpty().withMessage('کلید تنظیم الزامی است'),
    body('settings.*.value').notEmpty().withMessage('مقدار تنظیم الزامی است')
], authenticateAdmin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورودی نامعتبر است',
                errors: errors.array()
            });
        }

        const { settings } = req.body;
        
        // Check if user is super admin for payment settings
        const paymentKeys = ['card_number', 'cardholder_name', 'bank_name', 'price_per_day', 'payment_window_min'];
        const hasPaymentSettings = settings.some(s => paymentKeys.includes(s.key));
        
        if (hasPaymentSettings && !req.admin.is_super_admin) {
            return res.status(403).json({
                success: false,
                message: 'فقط سوپر ادمین می‌تواند تنظیمات پرداخت را تغییر دهد'
            });
        }

        for (const setting of settings) {
            await dbHelpers.run(`
                INSERT INTO system_settings (setting_key, setting_value, category, updated_by)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(setting_key) DO UPDATE SET
                    setting_value = excluded.setting_value,
                    updated_by = excluded.updated_by,
                    updated_at = CURRENT_TIMESTAMP
            `, [
                setting.key,
                setting.value,
                setting.key.startsWith('card_') || setting.key.startsWith('cardholder_') || setting.key.startsWith('bank_') || setting.key.includes('price') || setting.key.includes('payment') ? 'payment' : 'general',
                req.admin.id
            ]);
        }

        // Log action
        await logAdminAction(
            req.admin.id,
            'bulk_update_settings',
            'settings',
            null,
            { settings: settings.map(s => s.key) },
            req
        );

        res.json({
            success: true,
            message: 'تنظیمات با موفقیت به‌روزرسانی شد'
        });

    } catch (error) {
        console.error('Bulk update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Get pending listings
router.get('/listings/pending/all', authenticateAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const [listings, total] = await Promise.all([
            dbHelpers.all(`
                SELECT l.*, u.name as user_name, u.phone as user_phone, c.name as category_name
                FROM listings l
                LEFT JOIN users u ON l.user_id = u.id
                LEFT JOIN categories c ON l.category_id = c.id
                WHERE l.approval_status = 'pending'
                ORDER BY l.created_at DESC
                LIMIT ? OFFSET ?
            `, [limit, offset]),
            dbHelpers.get('SELECT COUNT(*) as count FROM listings WHERE approval_status = ?', ['pending'])
        ]);

        res.json({
            success: true,
            data: {
                listings,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total.count,
                    total_pages: Math.ceil(total.count / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get pending listings error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Get reviews for admin management
router.get('/reviews', [
    query('page').optional().isInt({ min: 1 }).withMessage('شماره صفحه نامعتبر است'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('تعداد آیتم نامعتبر است'),
    query('status').optional().isIn(['all', 'pending', 'approved', 'rejected']).withMessage('وضعیت نامعتبر است')
], authenticateAdmin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'پارامترهای جستجو نامعتبر است',
                errors: errors.array()
            });
        }

        const { page = 1, limit = 20, status = 'all', search = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '';
        let params = [];

        // Filter by status
        if (status === 'pending') {
            whereClause = 'WHERE r.is_approved = 0';
        } else if (status === 'approved') {
            whereClause = 'WHERE r.is_approved = 1';
        } else if (status === 'rejected') {
            whereClause = 'WHERE r.is_approved = -1';
        }

        // Add search
        if (search) {
            const searchCondition = whereClause ? ' AND ' : ' WHERE ';
            whereClause += searchCondition + '(r.comment LIKE ? OR u.name LIKE ? OR l.title LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const [reviews, total] = await Promise.all([
            dbHelpers.all(`
                SELECT 
                    r.id,
                    r.listing_id,
                    r.rating,
                    r.comment,
                    r.is_approved,
                    r.is_verified_purchase,
                    r.admin_response,
                    r.created_at,
                    r.updated_at,
                    u.name as user_name,
                    l.title as listing_title
                FROM reviews r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN listings l ON r.listing_id = l.id
                ${whereClause}
                ORDER BY r.created_at DESC
                LIMIT ? OFFSET ?
            `, [...params, parseInt(limit), offset]),
            
            dbHelpers.get(`
                SELECT COUNT(*) as count 
                FROM reviews r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN listings l ON r.listing_id = l.id
                ${whereClause}
            `, params)
        ]);

        await logAdminAction(req.admin.id, 'view_reviews', { 
            page, 
            limit, 
            status, 
            search,
            total_found: total.count 
        });

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total.count,
                    total_pages: Math.ceil(total.count / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get admin reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Get review statistics
router.get('/reviews/stats', authenticateAdmin, async (req, res) => {
    try {
        const [total, pending, approved, rejected, avgRating] = await Promise.all([
            dbHelpers.get('SELECT COUNT(*) as count FROM reviews'),
            dbHelpers.get('SELECT COUNT(*) as count FROM reviews WHERE is_approved = 0'),
            dbHelpers.get('SELECT COUNT(*) as count FROM reviews WHERE is_approved = 1'),
            dbHelpers.get('SELECT COUNT(*) as count FROM reviews WHERE is_approved = -1'),
            dbHelpers.get('SELECT AVG(rating) as avg FROM reviews WHERE is_approved = 1')
        ]);

        await logAdminAction(req.admin.id, 'view_review_stats');

        res.json({
            success: true,
            data: {
                total: total.count,
                pending: pending.count,
                approved: approved.count,
                rejected: rejected.count,
                average_rating: avgRating.avg || 0
            }
        });

    } catch (error) {
        console.error('Get review stats error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Approve or reject a review
router.put('/reviews/:reviewId/approve', [
    body('approve').isBoolean().withMessage('وضعیت تایید نامعتبر است')
], authenticateAdmin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورودی نامعتبر است',
                errors: errors.array()
            });
        }

        const { reviewId } = req.params;
        const { approve } = req.body;

        // Check if review exists
        const review = await dbHelpers.get('SELECT id, listing_id FROM reviews WHERE id = ?', [reviewId]);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'نظر یافت نشد'
            });
        }

        // Update review status
        await dbHelpers.run(
            'UPDATE reviews SET is_approved = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [approve ? 1 : -1, reviewId]
        );

        await logAdminAction(req.admin.id, 'update_review_status', { 
            review_id: reviewId,
            listing_id: review.listing_id,
            approved: approve 
        });

        res.json({
            success: true,
            message: approve ? 'نظر تایید شد' : 'نظر رد شد'
        });

    } catch (error) {
        console.error('Approve review error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Add admin response to a review
router.put('/reviews/:reviewId/response', [
    body('response').isLength({ max: 500 }).withMessage('پاسخ نباید بیش از 500 کاراکتر باشد')
], authenticateAdmin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورودی نامعتبر است',
                errors: errors.array()
            });
        }

        const { reviewId } = req.params;
        const { response } = req.body;

        // Check if review exists
        const review = await dbHelpers.get('SELECT id, listing_id FROM reviews WHERE id = ?', [reviewId]);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'نظر یافت نشد'
            });
        }

        // Update admin response
        await dbHelpers.run(
            'UPDATE reviews SET admin_response = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [response || null, reviewId]
        );

        await logAdminAction(req.admin.id, 'add_review_response', { 
            review_id: reviewId,
            listing_id: review.listing_id,
            has_response: !!response 
        });

        res.json({
            success: true,
            message: 'پاسخ ثبت شد'
        });

    } catch (error) {
        console.error('Add admin response error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// ==================== Trust Badge System ====================

// Grant trust badge to a listing (Super Admin only)
router.post('/listings/:listingId/trust-badge', [
    body('reason').optional().isLength({ max: 500 }).withMessage('دلیل نباید بیش از 500 کاراکتر باشد')
], authenticateAdmin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورودی نامعتبر است',
                errors: errors.array()
            });
        }

        // Check if admin is super admin
        if (!req.admin.is_super_admin) {
            return res.status(403).json({
                success: false,
                message: 'فقط سوپر ادمین می‌تواند نماد اعتماد اعطا کند'
            });
        }

        const { listingId } = req.params;
        const { reason } = req.body;

        // Check if listing exists
        const listing = await dbHelpers.get('SELECT id, title, is_trust_verified FROM listings WHERE id = ?', [listingId]);
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'آگهی یافت نشد'
            });
        }

        if (listing.is_trust_verified) {
            return res.status(400).json({
                success: false,
                message: 'این آگهی قبلاً نماد اعتماد دریافت کرده است'
            });
        }

        // Grant trust badge
        await dbHelpers.run(`
            UPDATE listings 
            SET is_trust_verified = 1, 
                trust_verified_at = CURRENT_TIMESTAMP,
                trust_verified_by = ?
            WHERE id = ?
        `, [req.admin.id, listingId]);

        // Log the action
        await dbHelpers.run(`
            INSERT INTO trust_badge_log (listing_id, admin_id, action, reason)
            VALUES (?, ?, 'granted', ?)
        `, [listingId, req.admin.id, reason || 'نماد اعتماد توسط سوپر ادمین اعطا شد']);

        await logAdminAction(req.admin.id, 'grant_trust_badge', { 
            listing_id: listingId,
            listing_title: listing.title,
            reason: reason
        });

        res.json({
            success: true,
            message: 'نماد اعتماد با موفقیت اعطا شد'
        });

    } catch (error) {
        console.error('Grant trust badge error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Revoke trust badge from a listing (Super Admin only)
router.delete('/listings/:listingId/trust-badge', [
    body('reason').optional().isLength({ max: 500 }).withMessage('دلیل نباید بیش از 500 کاراکتر باشد')
], authenticateAdmin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورودی نامعتبر است',
                errors: errors.array()
            });
        }

        // Check if admin is super admin
        if (!req.admin.is_super_admin) {
            return res.status(403).json({
                success: false,
                message: 'فقط سوپر ادمین می‌تواند نماد اعتماد لغو کند'
            });
        }

        const { listingId } = req.params;
        const { reason } = req.body;

        // Check if listing exists
        const listing = await dbHelpers.get('SELECT id, title, is_trust_verified FROM listings WHERE id = ?', [listingId]);
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'آگهی یافت نشد'
            });
        }

        if (!listing.is_trust_verified) {
            return res.status(400).json({
                success: false,
                message: 'این آگهی نماد اعتماد ندارد'
            });
        }

        // Revoke trust badge
        await dbHelpers.run(`
            UPDATE listings 
            SET is_trust_verified = 0, 
                trust_verified_at = NULL,
                trust_verified_by = NULL
            WHERE id = ?
        `, [listingId]);

        // Log the action
        await dbHelpers.run(`
            INSERT INTO trust_badge_log (listing_id, admin_id, action, reason)
            VALUES (?, ?, 'revoked', ?)
        `, [listingId, req.admin.id, reason || 'نماد اعتماد توسط سوپر ادمین لغو شد']);

        await logAdminAction(req.admin.id, 'revoke_trust_badge', { 
            listing_id: listingId,
            listing_title: listing.title,
            reason: reason
        });

        res.json({
            success: true,
            message: 'نماد اعتماد با موفقیت لغو شد'
        });

    } catch (error) {
        console.error('Revoke trust badge error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Get trust badge statistics
router.get('/trust-badge/stats', authenticateAdmin, async (req, res) => {
    try {
        const stats = await dbHelpers.get(`
            SELECT 
                COUNT(CASE WHEN is_trust_verified = 1 THEN 1 END) as total_verified,
                COUNT(*) as total_listings,
                COUNT(CASE WHEN is_trust_verified = 1 AND is_featured = 1 THEN 1 END) as verified_featured
            FROM listings 
            WHERE approval_status = 'approved'
        `);

        const recentActions = await dbHelpers.all(`
            SELECT 
                tbl.action,
                tbl.reason,
                tbl.created_at,
                l.title as listing_title,
                a.name as admin_name
            FROM trust_badge_log tbl
            LEFT JOIN listings l ON tbl.listing_id = l.id
            LEFT JOIN admins a ON tbl.admin_id = a.id
            ORDER BY tbl.created_at DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                statistics: stats,
                recent_actions: recentActions
            }
        });

    } catch (error) {
        console.error('Trust badge stats error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Get trust badge log for a specific listing
router.get('/listings/:listingId/trust-badge/log', authenticateAdmin, async (req, res) => {
    try {
        const { listingId } = req.params;

        const log = await dbHelpers.all(`
            SELECT 
                tbl.action,
                tbl.reason,
                tbl.created_at,
                a.name as admin_name
            FROM trust_badge_log tbl
            LEFT JOIN admins a ON tbl.admin_id = a.id
            WHERE tbl.listing_id = ?
            ORDER BY tbl.created_at DESC
        `, [listingId]);

        res.json({
            success: true,
            data: { log }
        });

    } catch (error) {
        console.error('Trust badge log error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// ==================== Monthly Backup System (Super Admin Only) ====================

const monthlyBackup = require('../services/monthlyBackup');

// Create monthly backup
router.post('/backup/monthly', [
    body('password').isLength({ min: 8 }).withMessage('رمز عبور باید حداقل 8 کاراکتر باشد')
], authenticateAdmin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورودی نامعتبر است',
                errors: errors.array()
            });
        }

        // Check if admin is super admin
        if (!req.admin.is_super_admin) {
            return res.status(403).json({
                success: false,
                message: 'فقط سوپر ادمین می‌تواند پشتیبان ماهانه ایجاد کند'
            });
        }

        const { password } = req.body;

        const result = await monthlyBackup.createMonthlyBackup(
            req.admin.id, 
            req.admin.is_super_admin, 
            password
        );

        res.json({
            success: true,
            message: 'پشتیبان ماهانه با موفقیت ایجاد شد',
            data: result
        });

    } catch (error) {
        console.error('Monthly backup creation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'خطای سرور'
        });
    }
});

// Loyal customers routes
router.get('/loyal-customers', authenticateAdmin, async (req, res) => {
  try {
    const { month, year } = req.query;
    const loyalCustomersService = require('../services/loyalCustomers');
    
    const customers = await loyalCustomersService.getMonthlyLoyalCustomers(
      month ? parseInt(month) : null,
      year ? parseInt(year) : null
    );
    
    const stats = await loyalCustomersService.getLoyalCustomersStats(
      month ? parseInt(month) : null,
      year ? parseInt(year) : null
    );

    res.json({
      success: true,
      data: {
        customers,
        stats
      }
    });
  } catch (error) {
    console.error('Error getting loyal customers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطا در دریافت مشتریان وفادار'
    });
  }
});

router.post('/loyal-customers/send-message', authenticateAdmin, async (req, res) => {
  try {
    const { user_id, message } = req.body;
    
    if (!user_id || !message) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات ناقص است'
      });
    }

    const loyalCustomersService = require('../services/loyalCustomers');
    const result = await loyalCustomersService.sendAppreciationMessage(user_id, message);

    res.json(result);
  } catch (error) {
    console.error('Error sending appreciation message:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطا در ارسال پیام'
    });
  }
});

router.post('/loyal-customers/grant-discount', authenticateAdmin, async (req, res) => {
  try {
    const { user_id, discount_percent, valid_days } = req.body;
    
    if (!user_id || !discount_percent) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات ناقص است'
      });
    }

    const loyalCustomersService = require('../services/loyalCustomers');
    const result = await loyalCustomersService.grantLoyaltyDiscount(
      user_id, 
      discount_percent, 
      valid_days || 30
    );

    res.json(result);
  } catch (error) {
    console.error('Error granting loyalty discount:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطا در اعطای تخفیف'
    });
  }
});

// List monthly backups
router.get('/backup/monthly/list', authenticateAdmin, async (req, res) => {
    try {
        // Check if admin is super admin
        if (!req.admin.is_super_admin) {
            return res.status(403).json({
                success: false,
                message: 'فقط سوپر ادمین می‌تواند لیست پشتیبان‌ها را مشاهده کند'
            });
        }

        const backups = await monthlyBackup.listMonthlyBackups();
        const stats = await monthlyBackup.getBackupStats();

        res.json({
            success: true,
            data: {
                backups,
                statistics: stats
            }
        });

    } catch (error) {
        console.error('List monthly backups error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Download monthly backup
router.get('/backup/monthly/download/:backupId', authenticateAdmin, async (req, res) => {
    try {
        // Check if admin is super admin
        if (!req.admin.is_super_admin) {
            return res.status(403).json({
                success: false,
                message: 'فقط سوپر ادمین می‌تواند پشتیبان دانلود کند'
            });
        }

        const { backupId } = req.params;
        const backupPath = path.join(monthlyBackup.backupDir, `${backupId}.encrypted`);

        if (!fs.existsSync(backupPath)) {
            return res.status(404).json({
                success: false,
                message: 'فایل پشتیبان یافت نشد'
            });
        }

        // Log download action
        await logAdminAction(req.admin.id, 'download_monthly_backup', {
            backup_id: backupId
        });

        // Send file
        res.download(backupPath, `${backupId}.encrypted`, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({
                    success: false,
                    message: 'خطا در دانلود فایل'
                });
            }
        });

    } catch (error) {
        console.error('Download monthly backup error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Cleanup old backups
router.delete('/backup/monthly/cleanup', authenticateAdmin, async (req, res) => {
    try {
        // Check if admin is super admin
        if (!req.admin.is_super_admin) {
            return res.status(403).json({
                success: false,
                message: 'فقط سوپر ادمین می‌تواند پشتیبان‌ها را پاک کند'
            });
        }

        const result = await monthlyBackup.cleanupOldBackups(req.admin.id);

        res.json({
            success: true,
            message: result.message,
            data: { deleted: result.deleted }
        });

    } catch (error) {
        console.error('Cleanup monthly backups error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// ==================== Home Featured Listings Management ====================

// Toggle home featured status - ویژه صفحه اصلی
router.post('/listings/:id/toggle-home-featured', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const listing = await dbHelpers.get(
            'SELECT * FROM listings WHERE id = ?',
            [id]
        );

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'آگهی یافت نشد'
            });
        }

        const newHomeFeaturedStatus = listing.is_home_featured ? 0 : 1;
        const homeFeaturedAt = newHomeFeaturedStatus === 1 ? 'CURRENT_TIMESTAMP' : 'NULL';

        await dbHelpers.run(
            `UPDATE listings SET 
                is_home_featured = ?, 
                home_featured_at = ${newHomeFeaturedStatus === 1 ? 'CURRENT_TIMESTAMP' : 'NULL'},
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?`,
            [newHomeFeaturedStatus, id]
        );

        await logAdminAction(
            req.admin.id,
            newHomeFeaturedStatus === 1 ? 'add_home_featured' : 'remove_home_featured',
            'listing',
            id,
            null,
            req
        );

        res.json({
            success: true,
            message: newHomeFeaturedStatus === 1 ? 'آگهی به ویژه صفحه اصلی اضافه شد' : 'آگهی از ویژه صفحه اصلی حذف شد',
            data: { is_home_featured: newHomeFeaturedStatus }
        });

    } catch (error) {
        console.error('Toggle home featured error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Get home featured listings for admin
router.get('/home-featured', authenticateAdmin, async (req, res) => {
    try {
        const listings = await dbHelpers.all(`
            SELECT 
                l.*,
                c.name as category_name,
                u.name as user_name,
                u.phone as user_phone
            FROM listings l
            LEFT JOIN categories c ON l.category_id = c.id
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.is_home_featured = 1
            ORDER BY l.home_featured_at DESC, l.created_at DESC
        `);

        res.json({
            success: true,
            data: { listings }
        });

    } catch (error) {
        console.error('Get home featured listings error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Bulk update home featured listings
router.post('/home-featured/bulk', [
    body('listing_ids').isArray().withMessage('لیست آگهی‌ها الزامی است'),
    body('action').isIn(['add', 'remove']).withMessage('عملیات نامعتبر است')
], authenticateAdmin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورودی نامعتبر است',
                errors: errors.array()
            });
        }

        const { listing_ids, action } = req.body;
        const newStatus = action === 'add' ? 1 : 0;

        for (const listingId of listing_ids) {
            await dbHelpers.run(
                `UPDATE listings SET 
                    is_home_featured = ?, 
                    home_featured_at = ${newStatus === 1 ? 'CURRENT_TIMESTAMP' : 'NULL'},
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?`,
                [newStatus, listingId]
            );
        }

        await logAdminAction(
            req.admin.id,
            action === 'add' ? 'bulk_add_home_featured' : 'bulk_remove_home_featured',
            'listings',
            null,
            { listing_ids },
            req
        );

        res.json({
            success: true,
            message: action === 'add' 
                ? `${listing_ids.length} آگهی به ویژه صفحه اصلی اضافه شد` 
                : `${listing_ids.length} آگهی از ویژه صفحه اصلی حذف شد`
        });

    } catch (error) {
        console.error('Bulk update home featured error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Archive listing
router.post('/listings/:id/archive', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Ensure is_archived column exists
        try {
            await dbHelpers.run("ALTER TABLE listings ADD COLUMN is_archived INTEGER DEFAULT 0");
        } catch (e) { /* column may already exist */ }

        const listing = await dbHelpers.get('SELECT id FROM listings WHERE id = ?', [id]);
        if (!listing) {
            return res.status(404).json({ success: false, message: 'آگهی یافت نشد' });
        }

        await dbHelpers.run('UPDATE listings SET is_archived = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        await logAdminAction(req.admin.id, 'archive_listing', 'listing', id, null, req);

        res.json({ success: true, message: 'آگهی به بایگانی منتقل شد' });
    } catch (error) {
        console.error('Archive listing error:', error);
        res.status(500).json({ success: false, message: 'خطای سرور' });
    }
});

// Unarchive listing
router.post('/listings/:id/unarchive', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const listing = await dbHelpers.get('SELECT id FROM listings WHERE id = ?', [id]);
        if (!listing) {
            return res.status(404).json({ success: false, message: 'آگهی یافت نشد' });
        }

        await dbHelpers.run('UPDATE listings SET is_archived = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        await logAdminAction(req.admin.id, 'unarchive_listing', 'listing', id, null, req);

        res.json({ success: true, message: 'آگهی از بایگانی بازگردانده شد' });
    } catch (error) {
        console.error('Unarchive listing error:', error);
        res.status(500).json({ success: false, message: 'خطای سرور' });
    }
});

// Get all deleted listings (admin)
router.get('/deleted-listings', authenticateAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, deleted_by, reason } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let params = [];

        if (deleted_by) {
            whereConditions.push('dl.deleted_by = ?');
            params.push(deleted_by);
        }

        if (reason) {
            whereConditions.push('dl.delete_reason = ?');
            params.push(reason);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const deletedListings = await dbHelpers.all(`
            SELECT dl.*, 
                   c.name as category_name,
                   u.name as user_name,
                   u.phone as user_phone,
                   a.name as admin_name
            FROM deleted_listings dl
            LEFT JOIN categories c ON dl.category_id = c.id
            LEFT JOIN users u ON dl.user_id = u.id
            LEFT JOIN admin_users a ON dl.admin_id = a.id
            ${whereClause}
            ORDER BY dl.deleted_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);

        const countResult = await dbHelpers.get(`
            SELECT COUNT(*) as total FROM deleted_listings dl ${whereClause}
        `, params);

        // Parse JSON fields
        const parsedListings = deletedListings.map(listing => ({
            ...listing,
            images: listing.images ? JSON.parse(listing.images) : []
        }));

        res.json({
            success: true,
            data: {
                listings: parsedListings,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(countResult.total / limit),
                    total_items: countResult.total,
                    items_per_page: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get deleted listings error:', error);
        res.status(500).json({ success: false, message: 'خطای سرور' });
    }
});

// Restore deleted listing (بازگرداندن آگهی حذف شده)
router.post('/deleted-listings/:id/restore', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // پیدا کردن آگهی حذف شده
        const deletedListing = await dbHelpers.get('SELECT * FROM deleted_listings WHERE id = ?', [id]);
        
        if (!deletedListing) {
            return res.status(404).json({
                success: false,
                message: 'آگهی حذف شده یافت نشد'
            });
        }

        // بازگرداندن آگهی به جدول اصلی
        const result = await dbHelpers.run(`
            INSERT INTO listings (
                user_id, title, description, price, type, 
                category_id, images, location, is_active, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        `, [
            deletedListing.user_id, 
            deletedListing.title, 
            deletedListing.description,
            deletedListing.price, 
            deletedListing.type, 
            deletedListing.category_id, 
            deletedListing.images,
            deletedListing.location, 
            deletedListing.original_created_at
        ]);

        // حذف از جدول آگهی‌های حذف شده
        await dbHelpers.run('DELETE FROM deleted_listings WHERE id = ?', [id]);

        await logAdminAction(req.admin.id, 'restore_listing', 'listing', result.id, null, { 
            original_id: deletedListing.listing_id,
            title: deletedListing.title 
        });

        res.json({
            success: true,
            message: 'آگهی با موفقیت بازگردانده شد',
            data: { new_listing_id: result.id }
        });
    } catch (error) {
        console.error('Restore deleted listing error:', error);
        res.status(500).json({ success: false, message: 'خطای سرور' });
    }
});

// Permanently delete listing (حذف دائمی آگهی)
router.delete('/deleted-listings/:id/permanent', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const deletedListing = await dbHelpers.get('SELECT * FROM deleted_listings WHERE id = ?', [id]);
        
        if (!deletedListing) {
            return res.status(404).json({
                success: false,
                message: 'آگهی حذف شده یافت نشد'
            });
        }

        // حذف دائمی از جدول آگهی‌های حذف شده
        await dbHelpers.run('DELETE FROM deleted_listings WHERE id = ?', [id]);

        await logAdminAction(req.admin.id, 'permanent_delete_listing', 'listing', id, null, { 
            title: deletedListing.title,
            original_id: deletedListing.listing_id
        });

        res.json({
            success: true,
            message: 'آگهی به طور دائمی حذف شد'
        });
    } catch (error) {
        console.error('Permanent delete listing error:', error);
        res.status(500).json({ success: false, message: 'خطای سرور' });
    }
});

// Admin delete listing with reason
router.delete('/listings/:id/force', [
    body('reason').optional().isString(),
    body('reason_text').optional().isString()
], authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason = 'admin_removed', reason_text = '' } = req.body;

        const listing = await dbHelpers.get('SELECT * FROM listings WHERE id = ?', [id]);

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'آگهی یافت نشد'
            });
        }

        // ذخیره آگهی در جدول آگهی‌های حذف شده
        await dbHelpers.run(`
            INSERT INTO deleted_listings (
                listing_id, user_id, title, description, price, type, 
                category_id, images, location, deleted_by, delete_reason, 
                delete_reason_text, admin_id, original_created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            listing.id, listing.user_id, listing.title, listing.description,
            listing.price, listing.type, listing.category_id, listing.images,
            listing.location, 'admin', reason, reason_text, req.admin.id, listing.created_at
        ]);

        // حذف کامل آگهی
        await dbHelpers.run('DELETE FROM listings WHERE id = ?', [id]);
        await dbHelpers.run('DELETE FROM user_favorites WHERE listing_id = ?', [id]);
        await dbHelpers.run('DELETE FROM featured_listings WHERE listing_id = ?', [id]);

        await logAdminAction(req.admin.id, 'force_delete_listing', 'listing', id, null, { reason, reason_text });

        res.json({
            success: true,
            message: 'آگهی با موفقیت حذف شد'
        });
    } catch (error) {
        console.error('Force delete listing error:', error);
        res.status(500).json({ success: false, message: 'خطای سرور' });
    }
});

module.exports = router;
