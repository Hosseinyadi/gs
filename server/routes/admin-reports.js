const express = require('express');
const { query, validationResult } = require('express-validator');
const { dbHelpers } = require('../config/database');
const { authenticateAdmin, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Get financial reports
router.get('/financial', [
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    query('type').optional().isIn(['daily', 'weekly', 'monthly'])
], authenticateAdmin, checkPermission('view_reports'), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'پارامترهای نامعتبر',
                errors: errors.array()
            });
        }
        
        const { start_date, end_date, type = 'daily' } = req.query;
        
        let dateFilter = '';
        let params = [];
        
        if (start_date && end_date) {
            dateFilter = 'WHERE created_at BETWEEN ? AND ?';
            params = [start_date, end_date];
        } else {
            // Default: last 30 days
            dateFilter = 'WHERE created_at >= date("now", "-30 days")';
        }
        
        // Get total revenue by type
        const revenueByType = await dbHelpers.all(`
            SELECT 
                type,
                COUNT(*) as count,
                SUM(amount) as total_amount
            FROM transactions
            ${dateFilter} AND status = 'completed'
            GROUP BY type
        `, params);
        
        // Get daily/weekly/monthly breakdown
        let groupBy = 'DATE(created_at)';
        if (type === 'weekly') {
            groupBy = 'strftime("%Y-%W", created_at)';
        } else if (type === 'monthly') {
            groupBy = 'strftime("%Y-%m", created_at)';
        }
        
        const timeline = await dbHelpers.all(`
            SELECT 
                ${groupBy} as period,
                COUNT(*) as transaction_count,
                SUM(amount) as total_amount,
                type
            FROM transactions
            ${dateFilter} AND status = 'completed'
            GROUP BY period, type
            ORDER BY period DESC
        `, params);
        
        // Get summary statistics
        const summary = await dbHelpers.get(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(amount) as total_revenue,
                AVG(amount) as avg_transaction,
                MIN(amount) as min_transaction,
                MAX(amount) as max_transaction
            FROM transactions
            ${dateFilter} AND status = 'completed'
        `, params);
        
        res.json({
            success: true,
            data: {
                revenue_by_type: revenueByType,
                timeline,
                summary
            }
        });
    } catch (error) {
        console.error('Financial report error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Get user growth report
router.get('/users', [
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601()
], authenticateAdmin, checkPermission('view_reports'), async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        let dateFilter = '';
        let params = [];
        
        if (start_date && end_date) {
            dateFilter = 'WHERE created_at BETWEEN ? AND ?';
            params = [start_date, end_date];
        } else {
            dateFilter = 'WHERE created_at >= date("now", "-30 days")';
        }
        
        // Daily registrations
        const dailyRegistrations = await dbHelpers.all(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as new_users
            FROM users
            ${dateFilter}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `, params);
        
        // Active users (logged in last 30 days)
        const activeUsers = await dbHelpers.get(`
            SELECT COUNT(DISTINCT user_id) as count
            FROM listing_views
            WHERE viewed_at >= date("now", "-30 days")
        `);
        
        // User statistics
        const stats = await dbHelpers.get(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_users
            FROM users
        `);
        
        res.json({
            success: true,
            data: {
                daily_registrations: dailyRegistrations,
                active_users: activeUsers.count,
                stats
            }
        });
    } catch (error) {
        console.error('User report error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Get listings report
router.get('/listings', authenticateAdmin, checkPermission('view_reports'), async (req, res) => {
    try {
        // Listings by category
        const byCategory = await dbHelpers.all(`
            SELECT 
                c.name as category,
                COUNT(l.id) as count,
                SUM(CASE WHEN l.is_active = 1 THEN 1 ELSE 0 END) as active_count
            FROM categories c
            LEFT JOIN listings l ON c.id = l.category_id
            GROUP BY c.id, c.name
            ORDER BY count DESC
        `);
        
        // Listings by type
        const byType = await dbHelpers.all(`
            SELECT 
                type,
                COUNT(*) as count,
                AVG(price) as avg_price
            FROM listings
            WHERE is_active = 1
            GROUP BY type
        `);
        
        // View statistics
        const viewStats = await dbHelpers.get(`
            SELECT 
                COUNT(*) as total_views,
                COUNT(DISTINCT listing_id) as viewed_listings,
                COUNT(DISTINCT user_id) as unique_viewers
            FROM listing_views
            WHERE viewed_at >= date("now", "-30 days")
        `);
        
        // Top viewed listings
        const topListings = await dbHelpers.all(`
            SELECT 
                l.id,
                l.title,
                l.price,
                COUNT(v.id) as view_count,
                u.name as owner_name
            FROM listings l
            LEFT JOIN listing_views v ON l.id = v.listing_id
            LEFT JOIN users u ON l.user_id = u.id
            WHERE v.viewed_at >= date("now", "-30 days")
            GROUP BY l.id
            ORDER BY view_count DESC
            LIMIT 10
        `);
        
        // Conversion rate (featured listings)
        const conversionRate = await dbHelpers.get(`
            SELECT 
                COUNT(DISTINCT id) as total_listings,
                COUNT(DISTINCT CASE WHEN is_featured = 1 THEN id END) as featured_listings
            FROM listings
            WHERE is_active = 1
        `);
        
        res.json({
            success: true,
            data: {
                by_category: byCategory,
                by_type: byType,
                view_stats: viewStats,
                top_listings: topListings,
                conversion_rate: conversionRate
            }
        });
    } catch (error) {
        console.error('Listings report error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Export report as CSV
router.get('/export/:type', authenticateAdmin, checkPermission('view_reports'), async (req, res) => {
    try {
        const { type } = req.params;
        const { start_date, end_date } = req.query;
        
        let data = [];
        let filename = 'report.csv';
        
        if (type === 'transactions') {
            let dateFilter = '';
            let params = [];
            
            if (start_date && end_date) {
                dateFilter = 'WHERE t.created_at BETWEEN ? AND ?';
                params = [start_date, end_date];
            }
            
            data = await dbHelpers.all(`
                SELECT 
                    t.id,
                    t.type,
                    t.amount,
                    t.status,
                    t.payment_method,
                    t.reference_id,
                    u.name as user_name,
                    u.phone as user_phone,
                    t.created_at
                FROM transactions t
                LEFT JOIN users u ON t.user_id = u.id
                ${dateFilter}
                ORDER BY t.created_at DESC
            `, params);
            
            filename = `transactions_${Date.now()}.csv`;
        }
        
        // Convert to CSV
        if (data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'داده‌ای برای خروجی یافت نشد'
            });
        }
        
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).join(',')).join('\n');
        const csv = headers + '\n' + rows;
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send('\uFEFF' + csv); // Add BOM for Excel UTF-8 support
    } catch (error) {
        console.error('Export report error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

module.exports = router;
