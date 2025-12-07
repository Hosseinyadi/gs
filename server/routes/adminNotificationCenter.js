const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');

// Get admin notifications
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { filter = 'all' } = req.query;
    const adminId = req.admin.id;

    // First, ensure admin_notifications table exists
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS admin_notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          admin_id INTEGER,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT,
          data TEXT,
          priority TEXT DEFAULT 'low',
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (admin_id) REFERENCES admins(id)
        )
      `, [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Generate notifications from recent activities
    await generateNotifications(db, adminId);

    // Build query based on filter
    let whereClause = 'WHERE (admin_id IS NULL OR admin_id = ?)';
    const params = [adminId];

    if (filter === 'unread') {
      whereClause += ' AND is_read = 0';
    } else if (filter !== 'all') {
      whereClause += ' AND type = ?';
      params.push(filter);
    }

    const notifications = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM admin_notifications
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT 100
      `, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const unreadCount = await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as count FROM admin_notifications
        WHERE (admin_id IS NULL OR admin_id = ?) AND is_read = 0
      `, [adminId], (err, row) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });

    res.json({
      success: true,
      data: {
        notifications: notifications.map(n => ({
          ...n,
          data: n.data ? JSON.parse(n.data) : null,
          is_read: Boolean(n.is_read)
        })),
        unread_count: unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: { message: 'خطا در دریافت اعلان‌ها' } });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    await new Promise((resolve, reject) => {
      db.run('UPDATE admin_notifications SET is_read = 1 WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: { message: 'خطا در بروزرسانی' } });
  }
});

// Mark all as read
router.put('/read-all', authenticateAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const adminId = req.admin.id;

    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE admin_notifications 
        SET is_read = 1 
        WHERE (admin_id IS NULL OR admin_id = ?) AND is_read = 0
      `, [adminId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ success: false, error: { message: 'خطا در بروزرسانی' } });
  }
});

// Delete notification
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM admin_notifications WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, error: { message: 'خطا در حذف' } });
  }
});

// Helper function to generate notifications from recent activities
async function generateNotifications(db, adminId) {
  try {
    // Get last check time
    const lastCheck = await new Promise((resolve, reject) => {
      db.get(`
        SELECT MAX(created_at) as last_time FROM admin_notifications
        WHERE type IN ('new_listing', 'new_payment', 'new_user')
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row?.last_time || '2000-01-01');
      });
    });

    // New listings
    const newListings = await new Promise((resolve, reject) => {
      db.all(`
        SELECT l.id, l.title, l.created_at, u.name as user_name
        FROM listings l
        LEFT JOIN users u ON l.user_id = u.id
        WHERE l.created_at > ? AND l.status = 'pending'
        ORDER BY l.created_at DESC
        LIMIT 20
      `, [lastCheck], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    for (const listing of newListings) {
      // Check if notification already exists
      const exists = await new Promise((resolve, reject) => {
        db.get(`
          SELECT id FROM admin_notifications 
          WHERE type = 'new_listing' AND data LIKE ?
        `, [`%"listing_id":${listing.id}%`], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!exists) {
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO admin_notifications (type, title, message, data, priority, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            'new_listing',
            'آگهی جدید در انتظار تایید',
            `آگهی "${listing.title}" توسط ${listing.user_name || 'کاربر'} ثبت شد`,
            JSON.stringify({ listing_id: listing.id }),
            'medium',
            listing.created_at
          ], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    }

    // New users
    const newUsers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, name, phone, created_at
        FROM users
        WHERE created_at > ?
        ORDER BY created_at DESC
        LIMIT 20
      `, [lastCheck], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    for (const user of newUsers) {
      const exists = await new Promise((resolve, reject) => {
        db.get(`
          SELECT id FROM admin_notifications 
          WHERE type = 'new_user' AND data LIKE ?
        `, [`%"user_id":${user.id}%`], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!exists) {
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO admin_notifications (type, title, message, data, priority, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            'new_user',
            'کاربر جدید ثبت‌نام کرد',
            `${user.name || user.phone} به سایت پیوست`,
            JSON.stringify({ user_id: user.id }),
            'low',
            user.created_at
          ], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    }

    // New payments
    const newPayments = await new Promise((resolve, reject) => {
      db.all(`
        SELECT p.id, p.amount, p.created_at, u.name as user_name
        FROM payments p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.created_at > ? AND p.status = 'completed'
        ORDER BY p.created_at DESC
        LIMIT 20
      `, [lastCheck], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    for (const payment of newPayments) {
      const exists = await new Promise((resolve, reject) => {
        db.get(`
          SELECT id FROM admin_notifications 
          WHERE type = 'new_payment' AND data LIKE ?
        `, [`%"payment_id":${payment.id}%`], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!exists) {
        const amount = new Intl.NumberFormat('fa-IR').format(payment.amount);
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO admin_notifications (type, title, message, data, priority, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            'new_payment',
            'پرداخت جدید',
            `پرداخت ${amount} تومان توسط ${payment.user_name || 'کاربر'} انجام شد`,
            JSON.stringify({ payment_id: payment.id }),
            'high',
            payment.created_at
          ], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    }
  } catch (error) {
    console.error('Error generating notifications:', error);
  }
}

module.exports = router;
