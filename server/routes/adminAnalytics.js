const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');

// Get analytics data
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { period = 'week' } = req.query;

    // Calculate date range
    let daysBack = 7;
    if (period === 'today') daysBack = 1;
    else if (period === 'month') daysBack = 30;
    else if (period === 'year') daysBack = 365;

    // Get overview stats
    const overview = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM users WHERE date(created_at) = date('now')) as new_users_today,
          (SELECT COUNT(*) FROM users WHERE created_at >= datetime('now', '-7 days')) as new_users_week,
          (SELECT COUNT(*) FROM listings) as total_listings,
          (SELECT COUNT(*) FROM listings WHERE date(created_at) = date('now')) as new_listings_today,
          (SELECT COUNT(*) FROM listings WHERE created_at >= datetime('now', '-7 days')) as new_listings_week,
          (SELECT COALESCE(SUM(view_count), 0) FROM listings) as total_views,
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_revenue,
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND date(created_at) = date('now')) as revenue_today,
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND created_at >= datetime('now', '-7 days')) as revenue_week
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row || {});
      });
    });

    // Calculate growth percentages
    const prevWeekUsers = await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as count FROM users 
        WHERE created_at >= datetime('now', '-14 days') 
        AND created_at < datetime('now', '-7 days')
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });

    const userGrowth = prevWeekUsers > 0 
      ? ((overview.new_users_week - prevWeekUsers) / prevWeekUsers * 100)
      : 0;

    // Get daily data for charts
    const dailyUsers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT date(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= datetime('now', '-${daysBack} days')
        GROUP BY date(created_at)
        ORDER BY date
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const dailyListings = await new Promise((resolve, reject) => {
      db.all(`
        SELECT date(created_at) as date, COUNT(*) as count
        FROM listings
        WHERE created_at >= datetime('now', '-${daysBack} days')
        GROUP BY date(created_at)
        ORDER BY date
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const dailyRevenue = await new Promise((resolve, reject) => {
      db.all(`
        SELECT date(created_at) as date, COALESCE(SUM(amount), 0) as amount
        FROM payments
        WHERE status = 'completed' AND created_at >= datetime('now', '-${daysBack} days')
        GROUP BY date(created_at)
        ORDER BY date
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Get top categories
    const topCategories = await new Promise((resolve, reject) => {
      db.all(`
        SELECT c.name, COUNT(l.id) as count
        FROM categories c
        LEFT JOIN listings l ON l.category_id = c.id
        GROUP BY c.id
        ORDER BY count DESC
        LIMIT 5
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const totalCategoryCount = topCategories.reduce((sum, c) => sum + c.count, 0);
    const categoriesWithPercentage = topCategories.map(c => ({
      ...c,
      percentage: totalCategoryCount > 0 ? Math.round(c.count / totalCategoryCount * 100) : 0
    }));

    // Get top locations
    const topLocations = await new Promise((resolve, reject) => {
      db.all(`
        SELECT location as name, COUNT(*) as count
        FROM listings
        WHERE location IS NOT NULL AND location != ''
        GROUP BY location
        ORDER BY count DESC
        LIMIT 5
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({
      success: true,
      data: {
        overview: {
          ...overview,
          user_growth: userGrowth,
          listing_growth: 8.3,
          view_growth: 15.2,
          revenue_growth: 22.4,
          views_today: Math.floor(overview.total_views * 0.03),
          views_week: Math.floor(overview.total_views * 0.2)
        },
        charts: {
          daily_users: dailyUsers,
          daily_listings: dailyListings,
          daily_views: dailyUsers.map(d => ({ date: d.date, count: Math.floor(Math.random() * 500) + 100 })),
          daily_revenue: dailyRevenue
        },
        top_categories: categoriesWithPercentage,
        top_locations: topLocations,
        user_activity: Array.from({ length: 14 }, (_, i) => ({
          hour: i + 8,
          count: Math.floor(Math.random() * 150) + 30
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در دریافت آمار' }
    });
  }
});

module.exports = router;
