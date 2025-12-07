-- سیستم اعلان‌ها و تمدید آگهی
-- تاریخ: 2 دسامبر 2025

-- جدول اعلان‌های کاربر
CREATE TABLE IF NOT EXISTS user_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'listing_approved', 'listing_rejected', 'listing_expiring', 'listing_expired', 'featured_expiring', 'featured_expired', 'payment_confirmed', 'renewal_reminder', 'system'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data TEXT, -- JSON data for additional info
    is_read BOOLEAN DEFAULT 0,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- جدول تنظیمات تمدید آگهی
CREATE TABLE IF NOT EXISTS renewal_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول درخواست‌های تمدید آگهی
CREATE TABLE IF NOT EXISTS listing_renewals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    renewal_type VARCHAR(20) NOT NULL, -- 'free' (اولین بار رایگان), 'paid' (پولی)
    duration_days INTEGER NOT NULL DEFAULT 30,
    amount INTEGER DEFAULT 0, -- مبلغ پرداختی (0 برای رایگان)
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    payment_method VARCHAR(20), -- 'card_transfer', 'wallet'
    payment_proof TEXT, -- توضیحات پرداخت
    old_expiry_date DATETIME,
    new_expiry_date DATETIME,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_note TEXT,
    processed_by INTEGER,
    processed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES admin_users(id)
);

-- جدول آمار بازدید روزانه آگهی‌ها
CREATE TABLE IF NOT EXISTS listing_daily_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    stat_date DATE NOT NULL,
    view_count INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    contact_clicks INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    UNIQUE(listing_id, stat_date)
);

-- اضافه کردن فیلد تاریخ انقضا به جدول آگهی‌ها (اگر وجود نداشته باشد)
-- این با ALTER TABLE انجام میشه در کد

-- ایندکس‌ها برای بهبود عملکرد
CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON user_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_renewals_listing ON listing_renewals(listing_id);
CREATE INDEX IF NOT EXISTS idx_renewals_user ON listing_renewals(user_id);
CREATE INDEX IF NOT EXISTS idx_renewals_status ON listing_renewals(status);
CREATE INDEX IF NOT EXISTS idx_daily_stats_listing ON listing_daily_stats(listing_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON listing_daily_stats(stat_date);

-- تنظیمات پیش‌فرض تمدید
INSERT OR IGNORE INTO renewal_settings (setting_key, setting_value, description) VALUES
('listing_duration_days', '90', 'مدت اعتبار آگهی به روز'),
('renewal_price', '50000', 'هزینه تمدید آگهی به تومان'),
('free_renewal_count', '1', 'تعداد تمدید رایگان برای هر آگهی'),
('expiry_warning_days', '7', 'چند روز قبل از انقضا اعلان بفرستیم'),
('renewal_duration_days', '30', 'مدت تمدید آگهی به روز');
