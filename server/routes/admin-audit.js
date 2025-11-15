const express = require('express');
const { query, validationResult } = require('express-validator');
const { dbHelpers } = require('../config/database');
const { authenticateAdmin, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// Get audit logs (super admin only)
router.get('/', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('admin_id').optional().isInt(),
    query('action').optional(),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601()
], authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'پارامترهای نامعتبر',
                errors: errors.array()
            });
        }
        
        const {
            page = 1,
            limit = 50,
            admin_id,
            action,
            start_date,
            end_date
        } = req.query;
        
        const offset = (page - 1) * limit;
        
        let whereConditions = [];
        let params = [];
        
        if (admin_id) {
            whereConditions.push('al.admin_id = ?');
            params.push(admin_id);
        }
        
        if (action) {
            whereConditions.push('al.action LIKE ?');
            params.push(`%${action}%`);
        }
        
        if (start_date && end_date) {
            whereConditions.push('al.created_at BETWEEN ? AND ?');
            params.push(start_date, end_date);
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        const logs = await dbHelpers.all(`
            SELECT 
                al.*,
                a.username,
                a.name as admin_name
            FROM audit_logs al
            LEFT JOIN admin_users a ON al.admin_id = a.id
            ${whereClause}
            ORDER BY al.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);
        
        const countResult = await dbHelpers.get(`
            SELECT COUNT(*) as total FROM audit_logs al ${whereClause}
        `, params);
        
        const total = countResult.total;
        const totalPages = Math.ceil(total / limit);
        
        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: totalPages,
                    total_items: total,
                    items_per_page: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Get admin activity summary
router.get('/summary', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        
        // Activity by admin
        const byAdmin = await dbHelpers.all(`
            SELECT 
                a.id,
                a.username,
                a.name,
                COUNT(al.id) as action_count,
                MAX(al.created_at) as last_activity
            FROM admin_users a
            LEFT JOIN audit_logs al ON a.id = al.admin_id 
                AND al.created_at >= date("now", "-${parseInt(days)} days")
            GROUP BY a.id
            ORDER BY action_count DESC
        `);
        
        // Activity by action type
        const byAction = await dbHelpers.all(`
            SELECT 
                action,
                COUNT(*) as count
            FROM audit_logs
            WHERE created_at >= date("now", "-${parseInt(days)} days")
            GROUP BY action
            ORDER BY count DESC
        `);
        
        // Daily activity
        const dailyActivity = await dbHelpers.all(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as action_count,
                COUNT(DISTINCT admin_id) as active_admins
            FROM audit_logs
            WHERE created_at >= date("now", "-${parseInt(days)} days")
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);
        
        res.json({
            success: true,
            data: {
                by_admin: byAdmin,
                by_action: byAction,
                daily_activity: dailyActivity
            }
        });
    } catch (error) {
        console.error('Get audit summary error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

module.exports = router;
