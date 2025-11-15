const jwt = require('jsonwebtoken');
const { dbHelpers } = require('../config/database');

// Admin roles
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  CONTENT_MANAGER: 'content_manager',
  SUPPORT: 'support'
};

// Permissions
const PERMISSIONS = {
  // User management
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',
  BLOCK_USERS: 'block_users',
  
  // Listing management
  VIEW_LISTINGS: 'view_listings',
  APPROVE_LISTINGS: 'approve_listings',
  DELETE_LISTINGS: 'delete_listings',
  FEATURE_LISTINGS: 'feature_listings',
  EDIT_LISTINGS: 'edit_listings',
  
  // Payment management
  VIEW_PAYMENTS: 'view_payments',
  MANAGE_PAYMENTS: 'manage_payments',
  APPROVE_PAYMENTS: 'approve_payments',
  REJECT_PAYMENTS: 'reject_payments',
  
  // Analytics
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_FINANCIAL_ANALYTICS: 'view_financial_analytics',
  
  // System management
  MANAGE_ADMINS: 'manage_admins',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_LOGS: 'view_logs',
  MANAGE_BACKUPS: 'manage_backups',
  
  // Discount management
  MANAGE_DISCOUNTS: 'manage_discounts',
  
  // Category management
  MANAGE_CATEGORIES: 'manage_categories',
  
  // Content management
  MANAGE_STATIC_PAGES: 'manage_static_pages',
  MANAGE_NOTIFICATIONS: 'manage_notifications',
  
  // Security
  MANAGE_SECURITY: 'manage_security',
  
  // All permissions (super admin)
  ALL: '*'
};

// Default permissions for each role
const DEFAULT_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [PERMISSIONS.ALL],
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.BLOCK_USERS,
    PERMISSIONS.VIEW_LISTINGS,
    PERMISSIONS.APPROVE_LISTINGS,
    PERMISSIONS.DELETE_LISTINGS,
    PERMISSIONS.FEATURE_LISTINGS,
    PERMISSIONS.EDIT_LISTINGS,
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.APPROVE_PAYMENTS,
    PERMISSIONS.REJECT_PAYMENTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_DISCOUNTS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.MANAGE_STATIC_PAGES,
    PERMISSIONS.MANAGE_NOTIFICATIONS
  ],
  [ROLES.CONTENT_MANAGER]: [
    PERMISSIONS.VIEW_LISTINGS,
    PERMISSIONS.APPROVE_LISTINGS,
    PERMISSIONS.EDIT_LISTINGS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.MANAGE_STATIC_PAGES
  ],
  [ROLES.MODERATOR]: [
    PERMISSIONS.VIEW_LISTINGS,
    PERMISSIONS.APPROVE_LISTINGS
  ],
  [ROLES.SUPPORT]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_LISTINGS,
    PERMISSIONS.VIEW_PAYMENTS
  ]
};

/**
 * Check if admin has specific permission
 */
const hasPermission = (admin, permission) => {
  if (!admin || !admin.permissions) return false;
  
  // Super admin has all permissions
  if (admin.is_super_admin || admin.permissions.includes(PERMISSIONS.ALL)) {
    return true;
  }
  
  // Check specific permission
  return admin.permissions.includes(permission);
};

/**
 * Middleware to require specific permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'احراز هویت الزامی است' 
        }
      });
    }

    if (!hasPermission(req.admin, permission)) {
      return res.status(403).json({
        success: false,
        error: { 
          code: 'INSUFFICIENT_PERMISSIONS', 
          message: 'دسترسی کافی ندارید',
          required_permission: permission
        }
      });
    }
    next();
  };
};

/**
 * Middleware to require super admin role
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      error: { 
        code: 'UNAUTHORIZED', 
        message: 'احراز هویت الزامی است' 
      }
    });
  }

  if (!req.admin.is_super_admin) {
    return res.status(403).json({
      success: false,
      error: { 
        code: 'SUPER_ADMIN_REQUIRED', 
        message: 'فقط مدیر اصلی دسترسی دارد' 
      }
    });
  }
  next();
};

/**
 * Log admin activity
 */
const logActivity = async (adminId, action, resource = null, resourceId = null, oldData = null, newData = null, req = null) => {
  try {
    await dbHelpers.run(
      `INSERT INTO admin_activity_log 
       (admin_id, action, resource, resource_id, old_data, new_data, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        action,
        resource,
        resourceId,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        req ? (req.ip || req.connection.remoteAddress) : null,
        req ? req.get('User-Agent') : null
      ]
    );
  } catch (error) {
    console.error('Error logging admin activity:', error);
  }
};

/**
 * Middleware to automatically log activity
 */
const autoLog = (action, resource = null) => {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to log after successful response
    res.json = function(data) {
      if (data.success && req.admin) {
        const resourceId = req.params.id || req.body.id || null;
        logActivity(
          req.admin.id,
          action,
          resource,
          resourceId,
          req.originalData || null,
          req.body || null,
          req
        );
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  hasPermission,
  requirePermission,
  requireSuperAdmin,
  logActivity,
  autoLog,
  ROLES,
  PERMISSIONS,
  DEFAULT_PERMISSIONS
};
