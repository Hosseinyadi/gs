const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/admin/analytics/overview
 * @desc    Get overview statistics
 * @access  Admin
 */
router.get('/overview', authenticateAdmin, async (req, res) => {
  try {
    // Total users
    const { total_users } = await dbHelpers.get('SELECT COUNT(*) as total_users FROM users');
    
    // Total listings
    const { total_listings } = await dbHelpers.get('SELECT COUNT(*) as total_listings FROM listings');
    
    // Active featured listings
    const { active_featured } = await dbHelpers.get(
      `SELECT COUNT(*) as active_featured FROM featured_listings 
       WHERE end_date > datetime('now')`
    );
    
    // Total revenue
    const { total_revenue } = await dbHelpers.get(
      `SELECT COALESCE(SUM(final_amount), 0) as total_revenue FROM payments 
       WHERE status = 'completed'`
    );
    
    // This month revenue
    const { month_revenue } = await dbHelpers.get(
      `SELECT COALESCE(SUM(final_amount), 0) as month_revenue FROM payments 
       WHERE status = 'completed' 
       AND DATE(created_at) >= DATE('now', 'start of month')`
    );
    
    // Today revenue
    const { today_revenue } = await dbHelpers.get(
      `SELECT COALESCE(SUM(final_amount), 0) as today_revenue FROM payments 
       WHERE status = 'completed' 
       AND DATE(created_at) = DATE('now')`
    );
    
    // Pending payments
    const { pending_payments } = await dbHelpers.get(
      `SELECT COUNT(*) as pending_payments FROM payments WHERE status = 'pending'`
    );

    res.json({
      success: true,
      data: {
        users: {
          total: total_users,
          new_this_month: 0 // TODO: implement
        },
        listings: {
          total: total_listings,
          featured: active_featured
        },
        revenue: {
          total: total_revenue,
          this_month: month_revenue,
          today: today_revenue
        },
        payments: {
          pending: pending_payments
        }
      }
    });
  } catch (error) {
    console.error('Error getting overview:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در دریافت آمار کلی' }
    });
  }
});

/**
 * @route   GET /api/admin/analytics/revenue
 * @desc    Get revenue analytics
 * @access  Admin
 */
router.get('/revenue', authenticateAdmin, async (req, res) => {
  try {
    const { period = 'daily', days = 30 } = req.query;

    let groupBy, dateFormat;
    if (period === 'daily') {
      groupBy = "DATE(created_at)";
      dateFormat = '%Y-%m-%d';
    } else if (period === 'monthly') {
      groupBy = "strftime('%Y-%m', created_at)";
      dateFormat = '%Y-%m';
    } else {
      groupBy = "strftime('%Y-%W', created_at)";
      dateFormat = '%Y-%W';
    }

    const revenueData = await dbHelpers.all(
      `SELECT 
        ${groupBy} as period,
        COUNT(*) as payment_count,
        SUM(amount) as total_amount,
        SUM(discount_amount) as total_discount,
        SUM(final_amount) as total_revenue
      FROM payments
      WHERE status = 'completed'
      AND DATE(created_at) >= DATE('now', '-${parseInt(days)} days')
      GROUP BY ${groupBy}
      ORDER BY period DESC`
    );

    // Payment methods breakdown
    const methodsBreakdown = await dbHelpers.all(
      `SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(final_amount) as revenue
      FROM payments
      WHERE status = 'completed'
      AND DATE(created_at) >= DATE('now', '-${parseInt(days)} days')
      GROUP BY payment_method`
    );

    res.json({
      success: true,
      data: {
        revenue_chart: revenueData,
        methods_breakdown: methodsBreakdown
      }
    });
  } catch (error) {
    console.error('Error getting revenue analytics:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در دریافت آمار درآمد' }
    });
  }
});

/**
 * @route   GET /api/admin/analytics/payments
 * @desc    Get payment analytics
 * @access  Admin
 */
router.get('/payments', authenticateAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Payment status breakdown
    const statusBreakdown = await dbHelpers.all(
      `SELECT 
        status,
        COUNT(*) as count,
        SUM(final_amount) as total_amount
      FROM payments
      WHERE DATE(created_at) >= DATE('now', '-${parseInt(days)} days')
      GROUP BY status`
    );

    // Daily payment trends
    const dailyTrends = await dbHelpers.all(
      `SELECT 
        DATE(created_at) as date,
        status,
        COUNT(*) as count
      FROM payments
      WHERE DATE(created_at) >= DATE('now', '-${parseInt(days)} days')
      GROUP BY DATE(created_at), status
      ORDER BY date DESC`
    );

    // Success rate
    const { total, completed } = await dbHelpers.get(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM payments
      WHERE DATE(created_at) >= DATE('now', '-${parseInt(days)} days')`
    );

    const successRate = total > 0 ? ((completed / total) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        status_breakdown: statusBreakdown,
        daily_trends: dailyTrends,
        success_rate: parseFloat(successRate),
        total_payments: total
      }
    });
  } catch (error) {
    console.error('Error getting payment analytics:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در دریافت آمار پرداخت' }
    });
  }
});

/**
 * @route   GET /api/admin/analytics/featured
 * @desc    Get featured listings analytics
 * @access  Admin
 */
router.get('/featured', authenticateAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Featured plans usage
    const plansUsage = await dbHelpers.all(
      `SELECT 
        fp.name,
        fp.duration_days,
        fp.price,
        COUNT(fl.id) as usage_count,
        SUM(p.final_amount) as total_revenue
      FROM featured_plans fp
      LEFT JOIN featured_listings fl ON fp.id = fl.plan_id
      LEFT JOIN payments p ON fl.listing_id = p.listing_id AND p.status = 'completed'
      WHERE DATE(fl.created_at) >= DATE('now', '-${parseInt(days)} days')
      GROUP BY fp.id
      ORDER BY usage_count DESC`
    );

    // Daily featured trends
    const dailyTrends = await dbHelpers.all(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM featured_listings
      WHERE DATE(created_at) >= DATE('now', '-${parseInt(days)} days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC`
    );

    // Active vs expired
    const { active, expired } = await dbHelpers.get(
      `SELECT 
        SUM(CASE WHEN end_date > datetime('now') THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN end_date <= datetime('now') THEN 1 ELSE 0 END) as expired
      FROM featured_listings`
    );

    res.json({
      success: true,
      data: {
        plans_usage: plansUsage,
        daily_trends: dailyTrends,
        active_count: active || 0,
        expired_count: expired || 0
      }
    });
  } catch (error) {
    console.error('Error getting featured analytics:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در دریافت آمار ویژه‌سازی' }
    });
  }
});

/**
 * @route   GET /api/admin/analytics/discounts
 * @desc    Get discount codes analytics
 * @access  Admin
 */
router.get('/discounts', authenticateAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Top performing codes
    const topCodes = await dbHelpers.all(
      `SELECT 
        dc.code,
        dc.discount_type,
        dc.discount_value,
        COUNT(dcu.id) as usage_count,
        SUM(dcu.discount_amount) as total_discount_given
      FROM discount_codes dc
      LEFT JOIN discount_code_usage dcu ON dc.id = dcu.discount_code_id
      WHERE DATE(dcu.used_at) >= DATE('now', '-${parseInt(days)} days')
      GROUP BY dc.id
      ORDER BY usage_count DESC
      LIMIT 10`
    );

    // Daily discount usage
    const dailyUsage = await dbHelpers.all(
      `SELECT 
        DATE(used_at) as date,
        COUNT(*) as usage_count,
        SUM(discount_amount) as total_discount
      FROM discount_code_usage
      WHERE DATE(used_at) >= DATE('now', '-${parseInt(days)} days')
      GROUP BY DATE(used_at)
      ORDER BY date DESC`
    );

    // Total stats
    const { total_codes, active_codes, total_usage, total_discount } = await dbHelpers.get(
      `SELECT 
        (SELECT COUNT(*) FROM discount_codes) as total_codes,
        (SELECT COUNT(*) FROM discount_codes WHERE is_active = 1) as active_codes,
        (SELECT COUNT(*) FROM discount_code_usage WHERE DATE(used_at) >= DATE('now', '-${parseInt(days)} days')) as total_usage,
        (SELECT COALESCE(SUM(discount_amount), 0) FROM discount_code_usage WHERE DATE(used_at) >= DATE('now', '-${parseInt(days)} days')) as total_discount`
    );

    res.json({
      success: true,
      data: {
        top_codes: topCodes,
        daily_usage: dailyUsage,
        stats: {
          total_codes,
          active_codes,
          total_usage,
          total_discount
        }
      }
    });
  } catch (error) {
    console.error('Error getting discount analytics:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در دریافت آمار تخفیف' }
    });
  }
});

/**
 * @route   GET /api/admin/analytics/users
 * @desc    Get user analytics
 * @access  Admin
 */
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // New users trend
    const newUsersTrend = await dbHelpers.all(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE DATE(created_at) >= DATE('now', '-${parseInt(days)} days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC`
    );

    // Top users by spending
    const topUsers = await dbHelpers.all(
      `SELECT 
        u.id,
        u.phone,
        COUNT(p.id) as payment_count,
        SUM(p.final_amount) as total_spent
      FROM users u
      JOIN payments p ON u.id = p.user_id
      WHERE p.status = 'completed'
      AND DATE(p.created_at) >= DATE('now', '-${parseInt(days)} days')
      GROUP BY u.id
      ORDER BY total_spent DESC
      LIMIT 10`
    );

    // User activity stats
    const { total_users, active_users } = await dbHelpers.get(
      `SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN u.id END) as active_users
      FROM users u
      LEFT JOIN payments p ON u.id = p.user_id 
        AND DATE(p.created_at) >= DATE('now', '-${parseInt(days)} days')`
    );

    res.json({
      success: true,
      data: {
        new_users_trend: newUsersTrend,
        top_users: topUsers,
        stats: {
          total_users,
          active_users,
          activity_rate: total_users > 0 ? ((active_users / total_users) * 100).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting user analytics:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در دریافت آمار کاربران' }
    });
  }
});

module.exports = router;
