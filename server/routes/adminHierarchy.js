// Admin Hierarchy Routes
// مسیرهای مدیریت سلسله مراتب ادمین‌ها

const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { dbHelpers } = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');
const {
    requireAdminLevel,
    requirePermission,
    logAdminActivity,
    canManageAdmin,
    getAdminPermissions,
    ADMIN_LEVELS
} = require('../middleware/adminHierarchy');

const router = express.Router();

// دریافت لیست ادمین‌ها
router.get('/admins', authenticateAdmin, requirePermission('manage_admins'), async (req, res) => {
    try {
        const currentAdminLevel = req.admin.admin_level || 'admin';
        
        let query = 'SELECT id, username, name, admin_level, is_active, created_by, created_at, last_login FROM admins';
        let params = [];

        // Super Admin فقط ادمین‌های عادی را می‌بیند
        if (currentAdminLevel === 'super') {
            query += ' WHERE admin_level = ?';
            params.push('admin');
        }

        query += ' ORDER BY created_at DESC';

        const admins = await dbHelpers.all(query, params);

        // اضافه کردن permissions به هر ادمین
        const adminsWithPermissions = await Promise.all(admins.map(async (admin) => {
            const permissions = await getAdminPermissions(admin.id);
            return {
                ...admin,
                permissions,
                can_manage: await canManageAdmin(req.admin.id, admin.id)
            };
        }));

        res.json({
            success: true,
            data: { admins: adminsWithPermissions }
        });
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// ایجاد ادمین جدید
router.post('/admins', [
    authenticateAdmin,
    requirePermission('manage_admins'),
    body('username').isLength({ min: 3 }).withMessage('نام کاربری باید حداقل 3 کاراکتر باشد'),
    body('password').isLength({ min: 8 }).withMessage('رمز عبور باید حداقل 8 کاراکتر باشد'),
    body('name').notEmpty().withMessage('نام الزامی است'),
    body('admin_level').isIn(['super', 'admin']).withMessage('سطح دسترسی نامعتبر است')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات نامعتبر است',
                errors: errors.array()
            });
        }

        const { username, password, name, admin_level, permissions } = req.body;
        const currentAdminLevel = req.admin.admin_level || 'admin';

        // فقط Master Admin می‌تواند Super Admin بسازد
        if (admin_level === 'super' && currentAdminLevel !== 'master') {
            return res.status(403).json({
                success: false,
                message: 'فقط Master Admin می‌تواند Super Admin ایجاد کند'
            });
        }

        // چک کردن تکراری بودن username
        const existingAdmin = await dbHelpers.get('SELECT id FROM admins WHERE username = ?', [username]);
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'این نام کاربری قبلاً استفاده شده است'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // دسترسی‌های پیش‌فرض
        let defaultPermissions = {};
        if (admin_level === 'super') {
            defaultPermissions = {
                manage_listings: true,
                manage_users: true,
                view_analytics: true,
                manage_categories: true,
                manage_featured: true
            };
        } else {
            defaultPermissions = {
                manage_listings: true,
                view_analytics: true
            };
        }

        const finalPermissions = permissions || defaultPermissions;

        // ایجاد ادمین
        const result = await dbHelpers.run(`
            INSERT INTO admins (username, password, name, is_super_admin, admin_level, created_by, permissions, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `, [
            username,
            hashedPassword,
            name,
            admin_level === 'super' ? 1 : 0,
            admin_level,
            req.admin.id,
            JSON.stringify(finalPermissions)
        ]);

        // لاگ فعالیت
        await logAdminActivity(
            req.admin.id,
            'create_admin',
            'admin',
            result.id,
            JSON.stringify({ username, name, admin_level }),
            req
        );

        res.status(201).json({
            success: true,
            message: 'ادمین با موفقیت ایجاد شد',
            data: { admin_id: result.id }
        });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// به‌روزرسانی دسترسی‌های ادمین
router.put('/admins/:id/permissions', [
    authenticateAdmin,
    requirePermission('modify_permissions')
], async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;

        // چک کردن اینکه آیا می‌تواند این ادمین را مدیریت کند
        const canManage = await canManageAdmin(req.admin.id, parseInt(id));
        if (!canManage) {
            return res.status(403).json({
                success: false,
                message: 'شما نمی‌توانید دسترسی‌های این ادمین را تغییر دهید'
            });
        }

        // به‌روزرسانی permissions
        await dbHelpers.run(`
            UPDATE admins SET permissions = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `, [JSON.stringify(permissions), id]);

        // لاگ فعالیت
        await logAdminActivity(
            req.admin.id,
            'update_permissions',
            'admin',
            id,
            JSON.stringify(permissions),
            req
        );

        res.json({
            success: true,
            message: 'دسترسی‌ها با موفقیت به‌روزرسانی شد'
        });
    } catch (error) {
        console.error('Error updating permissions:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// غیرفعال/فعال کردن ادمین
router.patch('/admins/:id/status', [
    authenticateAdmin,
    requirePermission('manage_admins')
], async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        // چک کردن اینکه آیا می‌تواند این ادمین را مدیریت کند
        const canManage = await canManageAdmin(req.admin.id, parseInt(id));
        if (!canManage) {
            return res.status(403).json({
                success: false,
                message: 'شما نمی‌توانید وضعیت این ادمین را تغییر دهید'
            });
        }

        // به‌روزرسانی وضعیت
        await dbHelpers.run(`
            UPDATE admins SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `, [is_active ? 1 : 0, id]);

        // لاگ فعالیت
        await logAdminActivity(
            req.admin.id,
            is_active ? 'activate_admin' : 'deactivate_admin',
            'admin',
            id,
            null,
            req
        );

        res.json({
            success: true,
            message: `ادمین با موفقیت ${is_active ? 'فعال' : 'غیرفعال'} شد`
        });
    } catch (error) {
        console.error('Error updating admin status:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// حذف ادمین
router.delete('/admins/:id', [
    authenticateAdmin,
    requirePermission('delete_admins')
], async (req, res) => {
    try {
        const { id } = req.params;

        // چک کردن اینکه آیا می‌تواند این ادمین را حذف کند
        const canManage = await canManageAdmin(req.admin.id, parseInt(id));
        if (!canManage) {
            return res.status(403).json({
                success: false,
                message: 'شما نمی‌توانید این ادمین را حذف کنید'
            });
        }

        // حذف ادمین
        await dbHelpers.run('DELETE FROM admins WHERE id = ?', [id]);

        // لاگ فعالیت
        await logAdminActivity(
            req.admin.id,
            'delete_admin',
            'admin',
            id,
            null,
            req
        );

        res.json({
            success: true,
            message: 'ادمین با موفقیت حذف شد'
        });
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// دریافت لاگ فعالیت‌های ادمین
router.get('/activity-logs', [
    authenticateAdmin,
    requireAdminLevel('master')
], async (req, res) => {
    try {
        const { page = 1, limit = 50, admin_id } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                al.*,
                a.username,
                a.name as admin_name
            FROM admin_activity_logs al
            LEFT JOIN admins a ON al.admin_id = a.id
        `;
        let params = [];

        if (admin_id) {
            query += ' WHERE al.admin_id = ?';
            params.push(admin_id);
        }

        query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const logs = await dbHelpers.all(query, params);

        res.json({
            success: true,
            data: { logs }
        });
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

module.exports = router;
