const express = require('express');
const { body, validationResult } = require('express-validator');
const { dbHelpers } = require('../config/database');
const { authenticateAdmin, requireSuperAdmin, logAdminAction } = require('../middleware/auth');

const router = express.Router();

// Get all system settings
router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const { category } = req.query;
        
        let query = 'SELECT * FROM system_settings';
        let params = [];
        
        if (category) {
            query += ' WHERE category = ?';
            params.push(category);
        }
        
        query += ' ORDER BY category, setting_key';
        
        const settings = await dbHelpers.all(query, params);
        
        // Group by category
        const grouped = settings.reduce((acc, setting) => {
            if (!acc[setting.category]) {
                acc[setting.category] = [];
            }
            acc[setting.category].push(setting);
            return acc;
        }, {});
        
        res.json({
            success: true,
            data: {
                settings,
                grouped
            }
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Get single setting by key
router.get('/:key', authenticateAdmin, async (req, res) => {
    try {
        const { key } = req.params;
        
        const setting = await dbHelpers.get(
            'SELECT * FROM system_settings WHERE setting_key = ?',
            [key]
        );
        
        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'تنظیم یافت نشد'
            });
        }
        
        res.json({
            success: true,
            data: { setting }
        });
    } catch (error) {
        console.error('Get setting error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Update setting (super admin only)
router.put('/:key', [
    body('value').notEmpty().withMessage('مقدار نمی‌تواند خالی باشد')
], authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورودی نامعتبر است',
                errors: errors.array()
            });
        }
        
        const { key } = req.params;
        const { value } = req.body;
        
        // Check if setting exists
        const setting = await dbHelpers.get(
            'SELECT * FROM system_settings WHERE setting_key = ?',
            [key]
        );
        
        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'تنظیم یافت نشد'
            });
        }
        
        // Validate value based on type
        let validatedValue = value;
        if (setting.setting_type === 'number') {
            validatedValue = parseFloat(value);
            if (isNaN(validatedValue)) {
                return res.status(400).json({
                    success: false,
                    message: 'مقدار باید عدد باشد'
                });
            }
            validatedValue = validatedValue.toString();
        } else if (setting.setting_type === 'boolean') {
            validatedValue = (value === 'true' || value === true || value === '1' || value === 1) ? 'true' : 'false';
        }
        
        // Update setting
        await dbHelpers.run(`
            UPDATE system_settings 
            SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
            WHERE setting_key = ?
        `, [validatedValue, req.admin.id, key]);
        
        // Log action
        await logAdminAction(
            req.admin.id,
            'update_setting',
            'setting',
            null,
            { key, old_value: setting.setting_value, new_value: validatedValue },
            req
        );
        
        const updatedSetting = await dbHelpers.get(
            'SELECT * FROM system_settings WHERE setting_key = ?',
            [key]
        );
        
        res.json({
            success: true,
            message: 'تنظیم با موفقیت به‌روزرسانی شد',
            data: { setting: updatedSetting }
        });
    } catch (error) {
        console.error('Update setting error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Bulk update settings
router.post('/bulk-update', [
    body('settings').isArray().withMessage('settings باید آرایه باشد'),
    body('settings.*.key').notEmpty().withMessage('کلید نمی‌تواند خالی باشد'),
    body('settings.*.value').notEmpty().withMessage('مقدار نمی‌تواند خالی باشد')
], authenticateAdmin, requireSuperAdmin, async (req, res) => {
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
        const updated = [];
        const failed = [];
        
        for (const item of settings) {
            try {
                const setting = await dbHelpers.get(
                    'SELECT * FROM system_settings WHERE setting_key = ?',
                    [item.key]
                );
                
                if (!setting) {
                    failed.push({ key: item.key, reason: 'تنظیم یافت نشد' });
                    continue;
                }
                
                // Validate and convert value
                let validatedValue = item.value;
                if (setting.setting_type === 'number') {
                    validatedValue = parseFloat(item.value);
                    if (isNaN(validatedValue)) {
                        failed.push({ key: item.key, reason: 'مقدار باید عدد باشد' });
                        continue;
                    }
                    validatedValue = validatedValue.toString();
                } else if (setting.setting_type === 'boolean') {
                    validatedValue = (item.value === 'true' || item.value === true) ? 'true' : 'false';
                }
                
                await dbHelpers.run(`
                    UPDATE system_settings 
                    SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE setting_key = ?
                `, [validatedValue, req.admin.id, item.key]);
                
                updated.push(item.key);
                
                // Log action
                await logAdminAction(
                    req.admin.id,
                    'update_setting',
                    'setting',
                    null,
                    { key: item.key, old_value: setting.setting_value, new_value: validatedValue },
                    req
                );
            } catch (error) {
                failed.push({ key: item.key, reason: error.message });
            }
        }
        
        res.json({
            success: true,
            message: `${updated.length} تنظیم به‌روزرسانی شد`,
            data: {
                updated,
                failed
            }
        });
    } catch (error) {
        console.error('Bulk update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Get settings history (who changed what)
router.get('/:key/history', authenticateAdmin, requireSuperAdmin, async (req, res) => {
    try {
        const { key } = req.params;
        
        const history = await dbHelpers.all(`
            SELECT 
                al.*,
                a.username,
                a.name as admin_name
            FROM audit_logs al
            LEFT JOIN admin_users a ON al.admin_id = a.id
            WHERE al.action = 'update_setting' 
            AND json_extract(al.details, '$.key') = ?
            ORDER BY al.created_at DESC
            LIMIT 50
        `, [key]);
        
        res.json({
            success: true,
            data: { history }
        });
    } catch (error) {
        console.error('Get setting history error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

module.exports = router;
