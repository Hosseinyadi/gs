const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { dbHelpers } = require('../config/database');
const { authenticateAdmin, checkPermission, logAdminAction } = require('../middleware/auth');

const router = express.Router();

// Get all discount codes
router.get('/', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['active', 'inactive', 'expired'])
], authenticateAdmin, checkPermission('manage_discounts'), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'پارامترهای نامعتبر',
                errors: errors.array()
            });
        }
        
        const { page = 1, limit = 20, status, search } = req.query;
        const offset = (page - 1) * limit;
        
        let whereConditions = [];
        let params = [];
        
        if (status === 'active') {
            whereConditions.push('is_active = 1');
            whereConditions.push('(valid_until IS NULL OR valid_until > datetime("now"))');
        } else if (status === 'inactive') {
            whereConditions.push('is_active = 0');
        } else if (status === 'expired') {
            whereConditions.push('valid_until IS NOT NULL');
            whereConditions.push('valid_until <= datetime("now")');
        }
        
        if (search) {
            whereConditions.push('code LIKE ?');
            params.push(`%${search}%`);
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        const discounts = await dbHelpers.all(`
            SELECT 
                d.*, 
                d.used_count AS usage_count,
                a.username as created_by_username,
                a.name as created_by_name
            FROM discount_codes d
            LEFT JOIN admin_users a ON d.created_by = a.id
            ${whereClause}
            ORDER BY d.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), offset]);
        
        const countResult = await dbHelpers.get(`
            SELECT COUNT(*) as total FROM discount_codes d ${whereClause}
        `, params);
        
        const total = countResult.total;
        const totalPages = Math.ceil(total / limit);
        
        res.json({
            success: true,
            data: {
                discounts,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: totalPages,
                    total_items: total,
                    items_per_page: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get discounts error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Get single discount code
router.get('/:id', authenticateAdmin, checkPermission('manage_discounts'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const discount = await dbHelpers.get(`
            SELECT 
                d.*,
                a.username as created_by_username,
                a.name as created_by_name
            FROM discount_codes d
            LEFT JOIN admin_users a ON d.created_by = a.id
            WHERE d.id = ?
        `, [id]);
        
        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'کد تخفیف یافت نشد'
            });
        }
        
        // Get usage statistics
        const usageStats = await dbHelpers.all(`
            SELECT 
                du.*,
                u.name as user_name,
                u.phone as user_phone
            FROM discount_usage du
            LEFT JOIN users u ON du.user_id = u.id
            WHERE du.discount_id = ?
            ORDER BY du.used_at DESC
            LIMIT 100
        `, [id]);
        
        res.json({
            success: true,
            data: {
                discount,
                usage_stats: usageStats
            }
        });
    } catch (error) {
        console.error('Get discount error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Create discount code
router.post('/', [
    body('code').notEmpty().withMessage('کد تخفیف الزامی است')
        .isLength({ min: 3, max: 50 }).withMessage('کد باید بین 3 تا 50 کاراکتر باشد'),
    body('type').isIn(['percentage', 'fixed']).withMessage('نوع تخفیف نامعتبر است'),
    body('value').isFloat({ min: 0 }).withMessage('مقدار تخفیف نامعتبر است'),
    body('scope').isIn(['featured', 'wallet', 'all']).withMessage('حوزه کاربرد نامعتبر است'),
    body('max_usage').optional().isInt({ min: 1 }),
    body('per_user_limit').optional().isInt({ min: 1 }),
    body('valid_from').optional().isISO8601(),
    body('valid_until').optional().isISO8601()
], authenticateAdmin, checkPermission('manage_discounts'), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورودی نامعتبر است',
                errors: errors.array()
            });
        }
        
        const {
            code,
            type,
            value,
            scope,
            max_usage = null,
            per_user_limit = 1,
            valid_from = null,
            valid_until = null
        } = req.body;
        
        // Validate percentage
        if (type === 'percentage' && (value < 0 || value > 100)) {
            return res.status(400).json({
                success: false,
                message: 'درصد تخفیف باید بین 0 تا 100 باشد'
            });
        }
        
        // Check if code already exists
        const existing = await dbHelpers.get(
            'SELECT id FROM discount_codes WHERE code = ?',
            [code.toUpperCase()]
        );
        
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'این کد تخفیف قبلاً ثبت شده است'
            });
        }
        
        // Insert discount code
        const result = await dbHelpers.run(`
            INSERT INTO discount_codes (
                code, type, value, scope, max_usage, per_user_limit, 
                valid_from, valid_until, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            code.toUpperCase(),
            type,
            value,
            scope,
            max_usage,
            per_user_limit,
            valid_from,
            valid_until,
            req.admin.id
        ]);
        
        // Log action
        await logAdminAction(
            req.admin.id,
            'create_discount',
            'discount',
            result.lastID,
            { code, type, value, scope },
            req
        );
        
        const discount = await dbHelpers.get(
            'SELECT * FROM discount_codes WHERE id = ?',
            [result.lastID]
        );
        
        res.json({
            success: true,
            message: 'کد تخفیف با موفقیت ایجاد شد',
            data: { discount }
        });
    } catch (error) {
        console.error('Create discount error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Update discount code
router.put('/:id', [
    body('is_active').optional().isBoolean(),
    body('max_usage').optional().isInt({ min: 1 }),
    body('valid_until').optional().isISO8601()
], authenticateAdmin, checkPermission('manage_discounts'), async (req, res) => {
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
        const updates = req.body;
        
        // Check if discount exists
        const discount = await dbHelpers.get(
            'SELECT * FROM discount_codes WHERE id = ?',
            [id]
        );
        
        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'کد تخفیف یافت نشد'
            });
        }
        
        const updateFields = [];
        const updateValues = [];
        
        if (updates.is_active !== undefined) {
            updateFields.push('is_active = ?');
            updateValues.push(updates.is_active ? 1 : 0);
        }
        
        if (updates.max_usage !== undefined) {
            updateFields.push('max_usage = ?');
            updateValues.push(updates.max_usage);
        }
        
        if (updates.valid_until !== undefined) {
            updateFields.push('valid_until = ?');
            updateValues.push(updates.valid_until);
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
            `UPDATE discount_codes SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );
        
        // Log action
        await logAdminAction(
            req.admin.id,
            'update_discount',
            'discount',
            id,
            updates,
            req
        );
        
        const updatedDiscount = await dbHelpers.get(
            'SELECT *, used_count AS usage_count FROM discount_codes WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: 'کد تخفیف به‌روزرسانی شد',
            data: { discount: updatedDiscount }
        });
    } catch (error) {
        console.error('Update discount error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Delete discount code
router.delete('/:id', authenticateAdmin, checkPermission('manage_discounts'), async (req, res) => {
    try {
        const { id } = req.params;
        
        const discount = await dbHelpers.get(
            'SELECT * FROM discount_codes WHERE id = ?',
            [id]
        );
        
        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'کد تخفیف یافت نشد'
            });
        }
        
        // Check if code has been used
        const usageCount = await dbHelpers.get(
            'SELECT COUNT(*) as count FROM discount_usage WHERE discount_id = ?',
            [id]
        );
        
        if (usageCount.count > 0) {
            // Don't delete, just deactivate
            await dbHelpers.run(
                'UPDATE discount_codes SET is_active = 0 WHERE id = ?',
                [id]
            );
            
            await logAdminAction(
                req.admin.id,
                'deactivate_discount',
                'discount',
                id,
                { code: discount.code },
                req
            );
            
            return res.json({
                success: true,
                message: 'کد تخفیف غیرفعال شد (به دلیل استفاده قبلی حذف نشد)'
            });
        }
        
        // Delete if never used
        await dbHelpers.run('DELETE FROM discount_codes WHERE id = ?', [id]);
        
        await logAdminAction(
            req.admin.id,
            'delete_discount',
            'discount',
            id,
            { code: discount.code },
            req
        );
        
        res.json({
            success: true,
            message: 'کد تخفیف حذف شد'
        });
    } catch (error) {
        console.error('Delete discount error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Validate discount code (for users)
router.post('/validate', [
    body('code').notEmpty().withMessage('کد تخفیف الزامی است'),
    body('amount').isFloat({ min: 0 }).withMessage('مبلغ نامعتبر است'),
    body('scope').isIn(['featured', 'wallet', 'all']).withMessage('حوزه کاربرد نامعتبر است')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورودی نامعتبر است',
                errors: errors.array()
            });
        }
        
        const { code, amount, scope } = req.body;
        const userId = req.user?.id;
        
        // Get discount code
        const discount = await dbHelpers.get(`
            SELECT * FROM discount_codes 
            WHERE code = ? AND is_active = 1
        `, [code.toUpperCase()]);
        
        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'کد تخفیف نامعتبر یا غیرفعال است'
            });
        }
        
        // Check validity period
        const now = new Date().toISOString();
        if (discount.valid_from && discount.valid_from > now) {
            return res.status(400).json({
                success: false,
                message: 'این کد تخفیف هنوز فعال نشده است'
            });
        }
        
        if (discount.valid_until && discount.valid_until < now) {
            return res.status(400).json({
                success: false,
                message: 'این کد تخفیف منقضی شده است'
            });
        }
        
        // Check scope
        if (discount.scope !== 'all' && discount.scope !== scope) {
            return res.status(400).json({
                success: false,
                message: 'این کد تخفیف برای این نوع خرید قابل استفاده نیست'
            });
        }
        
        // Check max usage
        if (discount.max_usage && discount.used_count >= discount.max_usage) {
            return res.status(400).json({
                success: false,
                message: 'ظرفیت استفاده از این کد تخفیف تکمیل شده است'
            });
        }
        
        // Check per-user limit
        if (userId) {
            const userUsage = await dbHelpers.get(`
                SELECT COUNT(*) as count 
                FROM discount_usage 
                WHERE discount_id = ? AND user_id = ?
            `, [discount.id, userId]);
            
            if (userUsage.count >= discount.per_user_limit) {
                return res.status(400).json({
                    success: false,
                    message: 'شما قبلاً از این کد تخفیف استفاده کرده‌اید'
                });
            }
        }
        
        // Calculate discount amount
        let discountAmount = 0;
        if (discount.type === 'percentage') {
            discountAmount = (amount * discount.value) / 100;
        } else {
            discountAmount = discount.value;
        }
        
        // Make sure discount doesn't exceed amount
        discountAmount = Math.min(discountAmount, amount);
        
        res.json({
            success: true,
            data: {
                discount_id: discount.id,
                code: discount.code,
                type: discount.type,
                value: discount.value,
                discount_amount: discountAmount,
                final_amount: amount - discountAmount
            }
        });
    } catch (error) {
        console.error('Validate discount error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

module.exports = router;
