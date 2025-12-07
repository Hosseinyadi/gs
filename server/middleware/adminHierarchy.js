// Admin Hierarchy Middleware
// Middleware برای چک کردن سطح دسترسی ادمین‌ها

const { dbHelpers } = require('../config/database');

// سطوح دسترسی
const ADMIN_LEVELS = {
    MASTER: 'master',
    SUPER: 'super',
    ADMIN: 'admin'
};

// وزن سطوح (برای مقایسه)
const LEVEL_WEIGHTS = {
    master: 3,
    super: 2,
    admin: 1
};

/**
 * چک کردن سطح دسترسی ادمین
 */
const requireAdminLevel = (requiredLevel) => {
    return async (req, res, next) => {
        try {
            if (!req.admin) {
                return res.status(401).json({
                    success: false,
                    message: 'دسترسی غیرمجاز'
                });
            }

            const adminLevel = req.admin.admin_level || 'admin';
            const requiredWeight = LEVEL_WEIGHTS[requiredLevel];
            const currentWeight = LEVEL_WEIGHTS[adminLevel];

            if (currentWeight < requiredWeight) {
                return res.status(403).json({
                    success: false,
                    message: 'شما دسترسی لازم برای این عملیات را ندارید'
                });
            }

            next();
        } catch (error) {
            console.error('Error in requireAdminLevel:', error);
            res.status(500).json({
                success: false,
                message: 'خطای سرور'
            });
        }
    };
};

/**
 * چک کردن دسترسی خاص
 */
const requirePermission = (permissionKey) => {
    return async (req, res, next) => {
        try {
            if (!req.admin) {
                return res.status(401).json({
                    success: false,
                    message: 'دسترسی غیرمجاز'
                });
            }

            // Master Admin همیشه دسترسی دارد
            if (req.admin.admin_level === 'master') {
                return next();
            }

            // چک کردن permissions
            let permissions = {};
            try {
                permissions = JSON.parse(req.admin.permissions || '{}');
            } catch (e) {
                permissions = {};
            }

            if (!permissions[permissionKey]) {
                return res.status(403).json({
                    success: false,
                    message: `شما دسترسی ${permissionKey} را ندارید`
                });
            }

            next();
        } catch (error) {
            console.error('Error in requirePermission:', error);
            res.status(500).json({
                success: false,
                message: 'خطای سرور'
            });
        }
    };
};

/**
 * لاگ کردن فعالیت ادمین
 */
const logAdminActivity = async (adminId, action, targetType = null, targetId = null, details = null, req = null) => {
    try {
        const ipAddress = req ? (req.ip || req.connection.remoteAddress) : null;
        const userAgent = req ? req.get('User-Agent') : null;

        await dbHelpers.run(`
            INSERT INTO admin_activity_logs (admin_id, action, target_type, target_id, details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [adminId, action, targetType, targetId, details, ipAddress, userAgent]);
    } catch (error) {
        console.error('Error logging admin activity:', error);
    }
};

/**
 * چک کردن اینکه آیا ادمین می‌تواند ادمین دیگری را مدیریت کند
 */
const canManageAdmin = async (managerId, targetId) => {
    try {
        const manager = await dbHelpers.get('SELECT * FROM admins WHERE id = ?', [managerId]);
        const target = await dbHelpers.get('SELECT * FROM admins WHERE id = ?', [targetId]);

        if (!manager || !target) {
            return false;
        }

        // Master Admin می‌تواند همه را مدیریت کند
        if (manager.admin_level === 'master') {
            return true;
        }

        // Super Admin نمی‌تواند Master Admin را مدیریت کند
        if (target.admin_level === 'master') {
            return false;
        }

        // Super Admin می‌تواند Admin عادی را مدیریت کند
        if (manager.admin_level === 'super' && target.admin_level === 'admin') {
            return true;
        }

        // Admin عادی نمی‌تواند کسی را مدیریت کند
        return false;
    } catch (error) {
        console.error('Error in canManageAdmin:', error);
        return false;
    }
};

/**
 * دریافت دسترسی‌های ادمین
 */
const getAdminPermissions = async (adminId) => {
    try {
        const admin = await dbHelpers.get('SELECT * FROM admins WHERE id = ?', [adminId]);
        
        if (!admin) {
            return {};
        }

        // Master Admin همه دسترسی‌ها را دارد
        if (admin.admin_level === 'master') {
            return {
                manage_admins: true,
                manage_listings: true,
                manage_users: true,
                manage_payments: true,
                manage_settings: true,
                view_analytics: true,
                manage_categories: true,
                manage_featured: true,
                delete_admins: true,
                modify_permissions: true
            };
        }

        // Parse permissions
        try {
            return JSON.parse(admin.permissions || '{}');
        } catch (e) {
            return {};
        }
    } catch (error) {
        console.error('Error getting admin permissions:', error);
        return {};
    }
};

module.exports = {
    ADMIN_LEVELS,
    requireAdminLevel,
    requirePermission,
    logAdminActivity,
    canManageAdmin,
    getAdminPermissions
};
