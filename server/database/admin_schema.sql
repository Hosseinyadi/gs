-- Enhanced Admin Panel Schema for Garazh Sangin
-- این فایل جداول جدید برای پنل مدیریت کامل را ایجاد می‌کند

-- جدول سطوح دسترسی ادمین
CREATE TABLE IF NOT EXISTS admin_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    name_fa VARCHAR(100) NOT NULL,
    permissions TEXT NOT NULL, -- JSON array of permissions
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Note: admin_users columns will be added via migration script if they don't exist

-- جدول تنظیمات سیستم (کاملاً پویا)
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(50) NOT NULL, -- string, number, boolean, json
    category VARCHAR(50) NOT NULL, -- pricing, general, listings, payment
    description TEXT,
    updated_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- جدول کدهای تخفیف
CREATE TABLE IF NOT EXISTS discount_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL, -- percentage, fixed
    value DECIMAL(10,2) NOT NULL,
    max_usage INTEGER, -- NULL = unlimited
    per_user_limit INTEGER DEFAULT 1,
    usage_count INTEGER DEFAULT 0,
    valid_from DATETIME,
    valid_until DATETIME,
    scope VARCHAR(50) NOT NULL, -- featured, wallet, all
    min_amount DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- جدول استفاده از کدهای تخفیف
CREATE TABLE IF NOT EXISTS discount_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discount_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    order_id INTEGER,
    amount_discounted DECIMAL(10,2) NOT NULL,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discount_id) REFERENCES discount_codes(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- جدول کیف پول کاربران
CREATE TABLE IF NOT EXISTS user_wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    balance DECIMAL(15,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- جدول تراکنش‌های مالی
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- wallet_charge, featured_ad, extra_ad, refund
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL, -- pending, completed, failed, refunded
    payment_method VARCHAR(50), -- zarinpal, manual, free
    reference_id VARCHAR(100), -- شماره پیگیری درگاه
    description TEXT,
    metadata TEXT, -- JSON for additional data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- جدول لاگ فعالیت‌های ادمین (Audit Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL, -- login, logout, approve_listing, reject_listing, etc.
    target_type VARCHAR(50), -- listing, user, setting, discount, etc.
    target_id INTEGER,
    details TEXT, -- JSON with full details
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id)
);

-- جدول ارائه‌دهندگان خدمات/قطعات (برای تأیید)
CREATE TABLE IF NOT EXISTS service_providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    business_name VARCHAR(200) NOT NULL,
    business_type VARCHAR(50) NOT NULL, -- parts, services
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    description TEXT,
    documents TEXT, -- JSON array of document URLs
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, suspended
    rejection_reason TEXT,
    approved_by INTEGER,
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES admin_users(id)
);

-- جدول آگهی‌های ویژه (برای ردیابی بهتر)
CREATE TABLE IF NOT EXISTS featured_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    duration_days INTEGER NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50), -- wallet, free, manual
    created_by INTEGER, -- admin_id if manually created
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id),
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- جدول اعلانات عمومی
CREATE TABLE IF NOT EXISTS system_announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info', -- info, warning, error, success
    is_active BOOLEAN DEFAULT 1,
    start_date DATETIME,
    end_date DATETIME,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- Insert default admin roles
INSERT OR IGNORE INTO admin_roles (name, name_fa, permissions) VALUES
('super_admin', 'سوپر ادمین', '["all"]'),
('content_manager', 'مدیر محتوا', '["view_dashboard", "manage_listings", "manage_users", "view_reports"]'),
('support', 'پشتیبانی', '["view_dashboard", "view_listings", "view_users", "manage_inquiries"]');

-- Insert default system settings
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
-- قیمت‌گذاری
('featured_ad_daily_price', '50000', 'number', 'pricing', 'قیمت روزانه آگهی ویژه (تومان)'),
('featured_ad_weekly_price', '300000', 'number', 'pricing', 'قیمت هفتگی آگهی ویژه (تومان)'),
('featured_ad_monthly_price', '1000000', 'number', 'pricing', 'قیمت ماهانه آگهی ویژه (تومان)'),
('extra_ad_price', '20000', 'number', 'pricing', 'قیمت آگهی اضافی پس از سهمیه رایگان (تومان)'),
('free_ads_quota', '3', 'number', 'pricing', 'تعداد آگهی رایگان برای هر کاربر'),
('min_wallet_charge', '10000', 'number', 'pricing', 'حداقل مبلغ شارژ کیف پول (تومان)'),
('transaction_fee_percent', '0', 'number', 'pricing', 'کارمزد تراکنش (درصد)'),

-- عمومی
('site_name', 'گاراژ سنگین', 'string', 'general', 'نام سایت'),
('support_phone', '09123456789', 'string', 'general', 'شماره پشتیبانی'),
('support_email', 'support@garazhsangin.com', 'string', 'general', 'ایمیل پشتیبانی'),
('maintenance_mode', 'false', 'boolean', 'general', 'حالت تعمیرات'),
('service_provider_contact', '09123456789', 'string', 'general', 'شماره تماس برای ارائه‌دهندگان خدمات/قطعات'),

-- آگهی‌ها
('listing_expiry_days', '30', 'number', 'listings', 'مدت زمان انقضای آگهی (روز)'),
('max_images_per_listing', '10', 'number', 'listings', 'حداکثر تعداد تصویر در هر آگهی'),
('require_admin_approval', 'true', 'boolean', 'listings', 'الزامی بودن تأیید ادمین برای آگهی‌ها'),
('auto_approve_verified_users', 'false', 'boolean', 'listings', 'تأیید خودکار آگهی‌های کاربران تأیید شده'),

-- پرداخت
('zarinpal_merchant_id', '', 'string', 'payment', 'Merchant ID زرین‌پال'),
('zarinpal_sandbox', 'true', 'boolean', 'payment', 'حالت تست زرین‌پال');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_usage_user ON discount_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_service_providers_status ON service_providers(status);
CREATE INDEX IF NOT EXISTS idx_featured_listings_listing ON featured_listings(listing_id);
CREATE INDEX IF NOT EXISTS idx_featured_listings_dates ON featured_listings(start_date, end_date);
