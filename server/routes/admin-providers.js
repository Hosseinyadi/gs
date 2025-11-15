const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { dbHelpers } = require('../config/database');
const { authenticateAdmin, checkPermission, logAdminAction } = require('../middleware/auth');

const router = express.Router();

// Get all service providers
router.get('/', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'approved', 'rejected', 'suspended']),
    query('type').optional().isIn(['parts', 'services'])
], authenticateAdmin, checkPermission('manage_providers'), async (req, res) => {
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
            limit = 20,
            status,
            type,
            search
        } = req.query;
        
        const offset = (page - 1) * limit;
        
        let whereConditions = [];
        let params = [];
        
        if (status) {
            whereConditions.push('sp.status = ?');
            params.push(status);
        }
        
        if (type) {
            whereConditions.push('sp.business_type = ?');
            params.push(type);
        }
        
        if (search) {
            whereConditions.push('(sp.business_name LIKE ? OR sp.phone LIKE ? OR u.name LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        const providers = await dbHelpers.all(`
            SELECT 
                sp.*,
                u.name as user_name,
                u.phone as user_phone,
                u.email as user_email,
                a.username as reviewed_by_username,
                a.name as reviewed_by_name
            FROM service_providers sp
            LEFT JOIN users u ON sp.user_id = u.id
            LEFT JOIN admin_users a ON sp.reviewed_by = a.id
            ${whereClause}
            ORDER BY sp.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);
        
        const countResult = await dbHelpers.get(`
            SELECT COUNT(*) as total FROM service_providers sp
            LEFT JOIN users u ON sp.user_id = u.id
            ${whereClause}
        `, params);
        
        const total = countResult.total;
        const totalPages = Math.ceil(total / limit);
        
        res.json({
            success: true,
            data: {
                providers,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: totalPages,
                    total_items: total,
                    items_per_page: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get providers error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Get single provider
router.get('/:id', authenticateAdmin, checkPermission('manage_providers'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const provider = await dbHelpers.get(`
            SELECT 
                sp.*,
                u.name as user_name,
                u.phone as user_phone,
                u.email as user_email,
                a.username as reviewed_by_username,
                a.name as reviewed_by_name
            FROM service_providers sp
            LEFT JOIN users u ON sp.user_id = u.id
            LEFT JOIN admin_users a ON sp.reviewed_by = a.id
            WHERE sp.id = ?
        `, [id]);
        
        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'ارائه‌دهنده یافت نشد'
            });
        }
        
        // Parse documents JSON
        if (provider.documents) {
            try {
                provider.documents = JSON.parse(provider.documents);
            } catch (e) {
                provider.documents = [];
            }
        }
        
        res.json({
            success: true,
            data: { provider }
        });
    } catch (error) {
        console.error('Get provider error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Approve provider
router.post('/:id/approve', authenticateAdmin, checkPermission('manage_providers'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const provider = await dbHelpers.get(
            'SELECT * FROM service_providers WHERE id = ?',
            [id]
        );
        
        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'ارائه‌دهنده یافت نشد'
            });
        }
        
        if (provider.status === 'approved') {
            return res.status(400).json({
                success: false,
                message: 'این ارائه‌دهنده قبلاً تأیید شده است'
            });
        }
        
        await dbHelpers.run(`
            UPDATE service_providers 
            SET status = 'approved', 
                reviewed_by = ?, 
                reviewed_at = CURRENT_TIMESTAMP,
                rejection_reason = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [req.admin.id, id]);
        
        // Log action
        await logAdminAction(
            req.admin.id,
            'approve_provider',
            'service_provider',
            id,
            { business_name: provider.business_name },
            req
        );
        
        // TODO: Send notification to user
        
        res.json({
            success: true,
            message: 'ارائه‌دهنده تأیید شد'
        });
    } catch (error) {
        console.error('Approve provider error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Reject provider
router.post('/:id/reject', [
    body('reason').notEmpty().withMessage('دلیل رد الزامی است')
], authenticateAdmin, checkPermission('manage_providers'), async (req, res) => {
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
        
        const provider = await dbHelpers.get(
            'SELECT * FROM service_providers WHERE id = ?',
            [id]
        );
        
        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'ارائه‌دهنده یافت نشد'
            });
        }
        
        await dbHelpers.run(`
            UPDATE service_providers 
            SET status = 'rejected', 
                rejection_reason = ?,
                reviewed_by = ?,
                reviewed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [reason, req.admin.id, id]);
        
        // Log action
        await logAdminAction(
            req.admin.id,
            'reject_provider',
            'service_provider',
            id,
            { business_name: provider.business_name, reason },
            req
        );
        
        // TODO: Send notification to user
        
        res.json({
            success: true,
            message: 'ارائه‌دهنده رد شد'
        });
    } catch (error) {
        console.error('Reject provider error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Suspend provider
router.post('/:id/suspend', [
    body('reason').notEmpty().withMessage('دلیل تعلیق الزامی است')
], authenticateAdmin, checkPermission('manage_providers'), async (req, res) => {
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
        
        const provider = await dbHelpers.get(
            'SELECT * FROM service_providers WHERE id = ?',
            [id]
        );
        
        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'ارائه‌دهنده یافت نشد'
            });
        }
        
        await dbHelpers.run(`
            UPDATE service_providers 
            SET status = 'suspended', 
                rejection_reason = ?,
                reviewed_by = ?,
                reviewed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [reason, req.admin.id, id]);
        
        // Log action
        await logAdminAction(
            req.admin.id,
            'suspend_provider',
            'service_provider',
            id,
            { business_name: provider.business_name, reason },
            req
        );
        
        res.json({
            success: true,
            message: 'ارائه‌دهنده تعلیق شد'
        });
    } catch (error) {
        console.error('Suspend provider error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Get provider statistics
router.get('/stats/overview', authenticateAdmin, checkPermission('manage_providers'), async (req, res) => {
    try {
        const stats = await dbHelpers.get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended
            FROM service_providers
        `);
        
        const byType = await dbHelpers.all(`
            SELECT 
                business_type,
                COUNT(*) as count
            FROM service_providers
            WHERE status = 'approved'
            GROUP BY business_type
        `);
        
        res.json({
            success: true,
            data: {
                stats,
                by_type: byType
            }
        });
    } catch (error) {
        console.error('Get provider stats error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

module.exports = router;

// Create a new provider
router.post('/', [
  body('phone').notEmpty().withMessage('شماره تماس الزامی است'),
  body('business_name').notEmpty().withMessage('نام کسب‌وکار الزامی است'),
  body('business_type').isIn(['parts', 'services']).withMessage('نوع کسب‌وکار نامعتبر است'),
  body('email').optional().isEmail().withMessage('ایمیل نامعتبر است')
], authenticateAdmin, checkPermission('manage_providers'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'اطلاعات ورودی نامعتبر است', errors: errors.array() });
    }

    const { phone, business_name, business_type, email, address, description } = req.body;

    let user = await dbHelpers.get('SELECT id, phone FROM users WHERE phone = ?', [phone]);
    if (!user) {
      const created = await dbHelpers.run('INSERT INTO users (phone, name, is_verified) VALUES (?, ?, 1)', [phone, business_name]);
      user = { id: created.id, phone };
    }

    const existing = await dbHelpers.get('SELECT id FROM service_providers WHERE user_id = ?', [user.id]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'برای این کاربر قبلاً ارائه‌دهنده ثبت شده است' });
    }

    const result = await dbHelpers.run(`
      INSERT INTO service_providers (
        user_id, business_name, business_type, phone, email, address, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [user.id, business_name, business_type, phone, email || null, address || null, description || null]);

    await logAdminAction(req.admin.id, 'create_provider', 'service_provider', result.id, { user_id: user.id, business_name, business_type }, req);

    res.json({ success: true, message: 'ارائه‌دهنده ایجاد شد و در وضعیت در انتظار قرار گرفت' });
  } catch (error) {
    console.error('Create provider error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});
