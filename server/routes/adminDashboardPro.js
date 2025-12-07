const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');

// Get dashboard stats
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;

    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          (SELECT COUNT(*) FROM listings) as total_listings,
          (SELECT COUNT(*) FROM listings WHERE status = 'active') as active_listings,
          (SELECT COUNT(*) FROM listings WHERE status = 'pending') as pending_listings,
          (SELECT COUNT(*) FROM listings WHERE status = 'rejected') as rejected_listings,
          (SELECT COUNT(*) FROM listings WHERE status = 'expired') as expired_listings,
          (SELECT COUNT(*) FROM listings WHERE is_featured = 1) as featured_listings,
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM users WHERE date(created_at) = date('now')) as new_users_today,
          (SELECT COUNT(*) FROM users WHERE created_at >= datetime('now', '-7 days')) as new_users_week,
          (SELECT COALESCE(SUM(view_count), 0) FROM listings) as total_views,
          (SELECT COALESCE(SUM(view_count), 0) FROM listings WHERE date(updated_at) = date('now')) as views_today,
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_revenue,
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND date(created_at) = date('now')) as revenue_today,
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND created_at >= datetime('now', '-7 days')) as revenue_week
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row || {});
      });
    });

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: { message: 'خطا در دریافت آمار' } });
  }
});

// Get chart data
router.get('/charts', authenticateAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { days = 30 } = req.query;

    // Daily listings
    const dailyListings = await new Promise((resolve, reject) => {
      db.all(`
        SELECT date(created_at) as date, COUNT(*) as count
        FROM listings
        WHERE created_at >= datetime('now', '-${days} days')
        GROUP BY date(created_at)
        ORDER BY date
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Daily users
    const dailyUsers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT date(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= datetime('now', '-${days} days')
        GROUP BY date(created_at)
        ORDER BY date
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Daily revenue
    const dailyRevenue = await new Promise((resolve, reject) => {
      db.all(`
        SELECT date(created_at) as date, COALESCE(SUM(amount), 0) as amount
        FROM payments
        WHERE status = 'completed' AND created_at >= datetime('now', '-${days} days')
        GROUP BY date(created_at)
        ORDER BY date
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Category stats
    const categoryStats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT c.name, COUNT(l.id) as count
        FROM categories c
        LEFT JOIN listings l ON l.category_id = c.id
        GROUP BY c.id
        ORDER BY count DESC
        LIMIT 6
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Province stats
    const provinceStats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT province as name, COUNT(*) as count
        FROM listings
        WHERE province IS NOT NULL AND province != ''
        GROUP BY province
        ORDER BY count DESC
        LIMIT 10
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({
      success: true,
      data: {
        daily_listings: dailyListings,
        daily_users: dailyUsers,
        daily_revenue: dailyRevenue,
        category_stats: categoryStats,
        province_stats: provinceStats
      }
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ success: false, error: { message: 'خطا در دریافت نمودارها' } });
  }
});

// Get pending items
router.get('/pending', authenticateAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;

    const pendingListings = await new Promise((resolve, reject) => {
      db.all(`
        SELECT l.id, l.title, 'listing' as type, l.created_at, u.name as user_name
        FROM listings l
        LEFT JOIN users u ON l.user_id = u.id
        WHERE l.status = 'pending'
        ORDER BY l.created_at DESC
        LIMIT 10
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const pendingPayments = await new Promise((resolve, reject) => {
      db.all(`
        SELECT p.id, 'پرداخت جدید' as title, 'payment' as type, p.created_at, u.name as user_name
        FROM payments p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.status = 'pending'
        ORDER BY p.created_at DESC
        LIMIT 10
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const allPending = [...pendingListings, ...pendingPayments]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);

    res.json({ success: true, data: allPending });
  } catch (error) {
    console.error('Error fetching pending items:', error);
    res.status(500).json({ success: false, error: { message: 'خطا در دریافت موارد در انتظار' } });
  }
});

module.exports = router;
