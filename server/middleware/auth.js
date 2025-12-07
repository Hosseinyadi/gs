const jwt = require('jsonwebtoken');
const { dbHelpers } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'bil-flow-secret-key-2024';
const JWT_EXPIRES_IN = '7d';

// Generate JWT token
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify JWT token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// User authentication middleware
const authenticateUser = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }

        // Get user from database
        const user = await dbHelpers.get(
            'SELECT id, phone, name, email, avatar, is_verified FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during authentication.'
        });
    }
};

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No admin token provided.'
            });
        }

        const decoded = verifyToken(token);
        if (!decoded || decoded.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin token.'
            });
        }

        // Get admin from database with role info
        const admin = await dbHelpers.get(`
            SELECT 
                a.id, 
                a.username, 
                a.name,
                a.role, 
                a.is_super_admin,
                a.is_master_admin,
                a.role_id,
                a.created_by_master,
                a.permissions as custom_permissions,
                r.name as role_name,
                r.permissions as role_permissions
            FROM admin_users a
            LEFT JOIN admin_roles r ON a.role_id = r.id
            WHERE a.id = ? AND a.is_active = 1
        `, [decoded.adminId]);

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Admin not found or inactive.'
            });
        }

        // Parse permissions - prioritize custom permissions over role permissions
        let permissions = [];
        if (admin.custom_permissions) {
            try {
                permissions = JSON.parse(admin.custom_permissions);
            } catch (e) {
                permissions = [];
            }
        } else if (admin.role_permissions) {
            try {
                permissions = JSON.parse(admin.role_permissions);
            } catch (e) {
                permissions = [];
            }
        }
        
        admin.permissions = permissions;

        // Update last login
        await dbHelpers.run(
            'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [admin.id]
        );

        req.admin = admin;
        next();
    } catch (error) {
        console.error('Admin auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during admin authentication.'
        });
    }
};

// Check if admin has specific permission
const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        // Super admin has all permissions
        if (req.admin.is_super_admin) {
            return next();
        }

        // Development-friendly fallback: if legacy 'admin' user without assigned role/permissions
        // allow access to avoid blocking the panel during setup
        const assignedPermissions = Array.isArray(req.admin.permissions) ? req.admin.permissions : [];
        if ((req.admin.role === 'admin') && (!req.admin.role_id || assignedPermissions.length === 0)) {
            return next();
        }

        // Check if admin has the required permission
        if (assignedPermissions.includes('all') || assignedPermissions.includes(permission)) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'You do not have permission to perform this action.'
        });
    };
};

// Require super admin
const requireSuperAdmin = (req, res, next) => {
    if (!req.admin) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }

    if (!req.admin.is_super_admin) {
        return res.status(403).json({
            success: false,
            message: 'Super admin access required.'
        });
    }

    next();
};

// Require master admin - بالاترین سطح دسترسی
const requireMasterAdmin = (req, res, next) => {
    if (!req.admin) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }

    if (!req.admin.is_master_admin) {
        return res.status(403).json({
            success: false,
            message: 'فقط مستر ادمین به این بخش دسترسی دارد.'
        });
    }

    next();
};

// Check if admin can manage another admin
const canManageAdmin = async (req, res, next) => {
    if (!req.admin) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }

    const targetAdminId = req.params.id || req.body.admin_id;
    
    if (!targetAdminId) {
        return next();
    }

    // Master admin can manage everyone
    if (req.admin.is_master_admin) {
        return next();
    }

    // Get target admin info
    const targetAdmin = await dbHelpers.get(
        'SELECT id, is_super_admin, is_master_admin, created_by_master FROM admin_users WHERE id = ?',
        [targetAdminId]
    );

    if (!targetAdmin) {
        return res.status(404).json({
            success: false,
            message: 'ادمین مورد نظر یافت نشد.'
        });
    }

    // Cannot manage master admin
    if (targetAdmin.is_master_admin) {
        return res.status(403).json({
            success: false,
            message: 'امکان مدیریت مستر ادمین وجود ندارد.'
        });
    }

    // Super admin can only manage non-super admins
    if (req.admin.is_super_admin && !targetAdmin.is_super_admin) {
        return next();
    }

    // Super admin cannot manage other super admins (only master can)
    if (req.admin.is_super_admin && targetAdmin.is_super_admin) {
        return res.status(403).json({
            success: false,
            message: 'فقط مستر ادمین می‌تواند سوپر ادمین‌ها را مدیریت کند.'
        });
    }

    return res.status(403).json({
        success: false,
        message: 'شما مجوز مدیریت این ادمین را ندارید.'
    });
};

// Log admin action
const logAdminAction = async (adminId, action, targetType = null, targetId = null, details = null, req = null) => {
    try {
        const ipAddress = req ? (req.ip || req.connection.remoteAddress) : null;
        
        await dbHelpers.run(`
            INSERT INTO audit_logs (admin_id, action, target_type, target_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [adminId, action, targetType, targetId, details ? JSON.stringify(details) : null, ipAddress]);
    } catch (error) {
        console.error('Error logging admin action:', error);
    }
};

// Optional authentication (for tracking views, etc.)
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (token) {
            const decoded = verifyToken(token);
            if (decoded && decoded.userId) {
                const user = await dbHelpers.get(
                    'SELECT id, phone, name FROM users WHERE id = ?',
                    [decoded.userId]
                );
                if (user) {
                    req.user = user;
                }
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication for optional auth
        next();
    }
};

module.exports = {
    generateToken,
    verifyToken,
    authenticateUser,
    authenticateToken: authenticateUser, // Alias for compatibility
    authenticateAdmin,
    checkPermission,
    requireSuperAdmin,
    requireMasterAdmin,
    canManageAdmin,
    logAdminAction,
    optionalAuth
};
