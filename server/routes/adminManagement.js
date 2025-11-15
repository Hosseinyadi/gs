const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { dbHelpers } = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');
const { 
  requireSuperAdmin, 
  requirePermission,
  logActivity,
  autoLog,
  ROLES, 
  PERMISSIONS,
  DEFAULT_PERMISSIONS 
} = require('../middleware/adminAuth');

/**
 * @route   POST /api/admin/management/create
 * @desc    Create new admin user (Super Admin only)
 * @access  Super Admin
 */
router.post('/create', authenticateAdmin, requireSuperAdmin, autoLog('CREATE_ADMIN', 'admin_users'), async (req, res) => {
  try {
    const { username, password, email, name, role, permissions } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'نام کاربری و رمز عبور الزامی است' }
      });
    }

    // Check if username exists
    const existing = await dbHelpers.get(
      'SELECT id FROM admin_users WHERE username = ?',
      [username]
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        error: { message: 'این نام کاربری قبلاً ثبت شده است' }
      });
    }

    // Validate role
    const validRole = role && Object.values(ROLES).includes(role) ? role : ROLES.MODERATOR;
    
    // Set permissions based on role or custom permissions
    let finalPermissions = permissions || DEFAULT_PERMISSIONS[validRole] || [];
    
    // Prevent creating another super admin unless requester is super admin
    const isSuperAdmin = validRole === ROLES.SUPER_ADMIN ? 1 : 0;
    if (isSuperAdmin && !req.admin.is_super_admin) {
      return res.status(403).json({
        success: false,
        error: { message: 'فقط مدیر اصلی می‌تواند مدیر اصلی دیگری ایجاد کند' }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const result = await dbHelpers.run(
      `INSERT INTO admin_users 
       (username, password_hash, email, name, role, is_super_admin, permissions, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        hashedPassword,
        email || null,
        name || null,
        validRole,
        isSuperAdmin,
        JSON.stringify(finalPermissions),
        req.admin.id
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.lastID,
        username,
        email,
        name,
        role: validRole,
        permissions: finalPermissions
      },
      message: 'ادمین جدید با موفقیت ایجاد شد'
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در ایجاد ادمین' }
    });
  }
});

/**
 * @route   GET /api/admin/management/list
 * @desc    Get all admin users (Super Admin only)
 * @access  Super Admin
 */
router.get('/list', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const admins = await dbHelpers.all(
      `SELECT 
        a.id, a.username, a.email, a.name, a.role, a.is_super_admin, 
        a.permissions, a.is_active, a.last_login, a.created_at,
        creator.username as created_by_username
      FROM admin_users a
      LEFT JOIN admin_users creator ON a.created_by = creator.id
      ORDER BY a.created_at DESC`
    );

    const parsedAdmins = admins.map(admin => ({
      ...admin,
      permissions: admin.permissions ? JSON.parse(admin.permissions) : []
    }));

    res.json({
      success: true,
      data: parsedAdmins
    });
  } catch (error) {
    console.error('Error getting admin list:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در دریافت لیست ادمین‌ها' }
    });
  }
});

/**
 * @route   PUT /api/admin/management/:id
 * @desc    Update admin user (Super Admin only)
 * @access  Super Admin
 */
router.put('/:id', authenticateAdmin, requireSuperAdmin, autoLog('UPDATE_ADMIN', 'admin_users'), async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    const { email, name, role, permissions, is_active } = req.body;

    // Get current admin data for logging
    const currentAdmin = await dbHelpers.get(
      'SELECT * FROM admin_users WHERE id = ?',
      [adminId]
    );

    if (!currentAdmin) {
      return res.status(404).json({
        success: false,
        error: { message: 'ادمین یافت نشد' }
      });
    }

    // Prevent modifying super admin by non-super admin
    if (currentAdmin.is_super_admin && req.admin.id !== adminId) {
      return res.status(403).json({
        success: false,
        error: { message: 'نمی‌توانید مدیر اصلی را تغییر دهید' }
      });
    }

    // Store original data for logging
    req.originalData = currentAdmin;

    const updates = [];
    const params = [];

    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }

    if (role !== undefined && Object.values(ROLES).includes(role)) {
      updates.push('role = ?');
      params.push(role);
      
      // Update is_super_admin flag
      const isSuperAdmin = role === ROLES.SUPER_ADMIN ? 1 : 0;
      updates.push('is_super_admin = ?');
      params.push(isSuperAdmin);
    }

    if (permissions !== undefined) {
      updates.push('permissions = ?');
      params.push(JSON.stringify(permissions));
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'هیچ تغییری ارسال نشده است' }
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(adminId);

    await dbHelpers.run(
      `UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'ادمین با موفقیت بروزرسانی شد'
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در بروزرسانی ادمین' }
    });
  }
});

/**
 * @route   DELETE /api/admin/management/:id
 * @desc    Delete admin user (Super Admin only)
 * @access  Super Admin
 */
router.delete('/:id', authenticateAdmin, requireSuperAdmin, autoLog('DELETE_ADMIN', 'admin_users'), async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);

    // Get admin data for logging
    const admin = await dbHelpers.get(
      'SELECT * FROM admin_users WHERE id = ?',
      [adminId]
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: { message: 'ادمین یافت نشد' }
      });
    }

    // Prevent deleting super admin
    if (admin.is_super_admin) {
      return res.status(403).json({
        success: false,
        error: { message: 'نمی‌توانید مدیر اصلی را حذف کنید' }
      });
    }

    // Prevent self-deletion
    if (adminId === req.admin.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'نمی‌توانید خودتان را حذف کنید' }
      });
    }

    // Store original data for logging
    req.originalData = admin;

    await dbHelpers.run('DELETE FROM admin_users WHERE id = ?', [adminId]);

    res.json({
      success: true,
      message: 'ادمین با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در حذف ادمین' }
    });
  }
});

/**
 * @route   GET /api/admin/management/activity-log
 * @desc    Get admin activity log (Super Admin only)
 * @access  Super Admin
 */
router.get('/activity-log', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, admin_id, action, resource } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        al.*,
        a.username as admin_username
      FROM admin_activity_log al
      JOIN admin_users a ON al.admin_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (admin_id) {
      query += ' AND al.admin_id = ?';
      params.push(admin_id);
    }

    if (action) {
      query += ' AND al.action LIKE ?';
      params.push(`%${action}%`);
    }

    if (resource) {
      query += ' AND al.resource = ?';
      params.push(resource);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const logs = await dbHelpers.all(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM admin_activity_log WHERE 1=1';
    const countParams = [];

    if (admin_id) {
      countQuery += ' AND admin_id = ?';
      countParams.push(admin_id);
    }

    if (action) {
      countQuery += ' AND action LIKE ?';
      countParams.push(`%${action}%`);
    }

    if (resource) {
      countQuery += ' AND resource = ?';
      countParams.push(resource);
    }

    const { total } = await dbHelpers.get(countQuery, countParams);

    res.json({
      success: true,
      data: {
        logs: logs.map(log => ({
          ...log,
          old_data: log.old_data ? JSON.parse(log.old_data) : null,
          new_data: log.new_data ? JSON.parse(log.new_data) : null
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting activity log:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در دریافت لاگ فعالیت‌ها' }
    });
  }
});

/**
 * @route   GET /api/admin/management/permissions
 * @desc    Get available permissions and roles
 * @access  Super Admin
 */
router.get('/permissions', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        roles: ROLES,
        permissions: PERMISSIONS,
        default_permissions: DEFAULT_PERMISSIONS
      }
    });
  } catch (error) {
    console.error('Error getting permissions:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در دریافت مجوزها' }
    });
  }
});

/**
 * @route   POST /api/admin/management/:id/change-password
 * @desc    Change admin password (Super Admin only)
 * @access  Super Admin
 */
router.post('/:id/change-password', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'رمز عبور باید حداقل 6 کاراکتر باشد' }
      });
    }

    const admin = await dbHelpers.get('SELECT id FROM admin_users WHERE id = ?', [adminId]);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: { message: 'ادمین یافت نشد' }
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await dbHelpers.run(
      'UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, adminId]
    );

    await logActivity(req.admin.id, 'CHANGE_ADMIN_PASSWORD', 'admin_users', adminId, null, null, req);

    res.json({
      success: true,
      message: 'رمز عبور با موفقیت تغییر کرد'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در تغییر رمز عبور' }
    });
  }
});

module.exports = router;
