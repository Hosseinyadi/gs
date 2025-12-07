-- Admin Hierarchy System
-- سیستم سلسله مراتبی ادمین‌ها

-- ایجاد جدول admins اگر وجود ندارد
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    is_super_admin INTEGER DEFAULT 0,
    admin_level TEXT DEFAULT 'admin' CHECK(admin_level IN ('master', 'super', 'admin')),
    created_by INTEGER REFERENCES admins(id),
    permissions TEXT DEFAULT '{}',
    is_active INTEGER DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- اضافه کردن فیلدهای جدید به جدول admins (اگر از قبل وجود داشت)
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we'll handle errors gracefully

-- جدول لاگ فعالیت‌های ادمین
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id INTEGER,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id)
);

-- جدول دسترسی‌های ادمین
CREATE TABLE IF NOT EXISTS admin_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    permission_key TEXT NOT NULL,
    permission_value INTEGER DEFAULT 1,
    granted_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id),
    FOREIGN KEY (granted_by) REFERENCES admins(id),
    UNIQUE(admin_id, permission_key)
);

-- Index برای بهبود عملکرد
CREATE INDEX IF NOT EXISTS idx_admin_level ON admins(admin_level);
CREATE INDEX IF NOT EXISTS idx_admin_active ON admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_activity_admin ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_date ON admin_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_permissions_admin ON admin_permissions(admin_id);

-- دسترسی‌های پیش‌فرض
-- Master Admin: دسترسی کامل به همه چیز
-- Super Admin: دسترسی محدود (قابل تنظیم توسط Master)
-- Admin: دسترسی پایه

-- لیست دسترسی‌ها:
-- manage_admins: مدیریت ادمین‌ها
-- manage_listings: مدیریت آگهی‌ها
-- manage_users: مدیریت کاربران
-- manage_payments: مدیریت پرداخت‌ها
-- manage_settings: مدیریت تنظیمات
-- view_analytics: مشاهده آمار
-- manage_categories: مدیریت دسته‌بندی‌ها
-- manage_featured: مدیریت آگهی‌های ویژه
-- delete_admins: حذف ادمین‌ها
-- modify_permissions: تغییر دسترسی‌ها
