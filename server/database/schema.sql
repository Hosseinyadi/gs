-- Bil Flow Database Schema
-- SQLite database for production server

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    email VARCHAR(100),
    avatar TEXT,
    password_hash VARCHAR(255),
    is_verified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- OTP verification table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone VARCHAR(20) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    parent_id INTEGER, -- For hierarchical categories
    category_type VARCHAR(50) DEFAULT 'equipment', -- equipment, parts, services
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Ad types table for more granular classification
CREATE TABLE IF NOT EXISTS ad_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Machinery listings table
CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('rent','sale')),
    ad_type_id INTEGER, -- More granular ad classification
    category_id INTEGER,
    user_id INTEGER NOT NULL,
    images TEXT, -- JSON array of image URLs
    location VARCHAR(200),
    condition VARCHAR(50),
    year INTEGER,
    brand VARCHAR(100),
    model VARCHAR(100),
    specifications TEXT, -- JSON object
    tags TEXT, -- JSON array of tags for better search
    is_active BOOLEAN DEFAULT 1,
    is_featured BOOLEAN DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ad_type_id) REFERENCES ad_types(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    listing_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (listing_id) REFERENCES listings(id),
    UNIQUE(user_id, listing_id)
);

-- View tracking table
CREATE TABLE IF NOT EXISTS listing_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    user_id INTEGER, -- NULL for anonymous views
    ip_address VARCHAR(45),
    user_agent TEXT,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Admin roles table
CREATE TABLE IF NOT EXISTS admin_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    name_fa VARCHAR(100) NOT NULL,
    permissions TEXT, -- JSON array of permissions
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin roles
INSERT OR IGNORE INTO admin_roles (name, name_fa, permissions) VALUES
('super_admin', 'سوپر ادمین', '["all"]'),
('content_manager', 'مدیر محتوا', '["manage_listings","manage_users","view_reports"]'),
('support', 'پشتیبانی', '["view_dashboard","view_listings","view_users"]');

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    role_id INTEGER,
    is_super_admin BOOLEAN DEFAULT 0,
    name VARCHAR(100),
    email VARCHAR(100),
    permissions TEXT, -- JSON array of custom permissions
    created_by INTEGER,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES admin_roles(id),
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- Admin Activity Log Table
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id INTEGER,
    old_data TEXT,
    new_data TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id)
);

-- Insert default admin user
INSERT OR IGNORE INTO admin_users (username, password_hash, role, is_super_admin, permissions) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', 1, '["*"]');

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string',
    category VARCHAR(50),
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- Discount codes table
CREATE TABLE IF NOT EXISTS discount_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL,
    scope VARCHAR(50) DEFAULT 'all',
    max_usage INTEGER,
    per_user_limit INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    valid_from DATETIME,
    valid_until DATETIME,
    is_active BOOLEAN DEFAULT 1,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- Discount usage table
CREATE TABLE IF NOT EXISTS discount_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discount_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discount_id) REFERENCES discount_codes(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User wallets table
CREATE TABLE IF NOT EXISTS user_wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    description TEXT,
    reference_id VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id INTEGER,
    details TEXT,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id)
);

-- Service providers table
CREATE TABLE IF NOT EXISTS service_providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    business_name VARCHAR(200) NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    description TEXT,
    documents TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by INTEGER,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES admin_users(id)
);

-- Featured listings table
CREATE TABLE IF NOT EXISTS featured_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    duration_days INTEGER NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    amount_paid DECIMAL(10,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id)
);

-- System announcements table
CREATE TABLE IF NOT EXISTS system_announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    is_active BOOLEAN DEFAULT 1,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- Provinces table
CREATE TABLE IF NOT EXISTS provinces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    province_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (province_id) REFERENCES provinces(id)
);

-- Insert default categories (hierarchical structure)
INSERT OR IGNORE INTO categories (name, slug, icon, category_type) VALUES
-- Main equipment categories
('ماشین‌آلات سنگین', 'machinery', '🚜', 'equipment'),
('بیل مکانیکی', 'excavators', '🚜', 'equipment'),
('بولدوزر', 'bulldozers', '🚧', 'equipment'),
('لودر', 'loaders', '🚛', 'equipment'),
('کرین', 'cranes', '🏗️', 'equipment'),
('کمپرسی', 'compressors', '💨', 'equipment'),
('رولر', 'rollers', '🚧', 'equipment'),
('دامپ تراک', 'dump-trucks', '🚚', 'equipment'),
('میکسر بتن', 'concrete-mixers', '🏗️', 'equipment'),
('ژنراتور', 'generators', '⚡', 'equipment'),
('پمپ', 'pumps', '💧', 'equipment'),

-- Parts categories
('قطعات یدکی', 'parts', '🔧', 'parts'),
('قطعات بیل مکانیکی', 'excavator-parts', '🔧', 'parts'),
('قطعات بولدوزر', 'bulldozer-parts', '🔧', 'parts'),
('قطعات لودر', 'loader-parts', '🔧', 'parts'),
('فیلتر و روغن', 'filters-oil', '🛢️', 'parts'),
('تیغه و دندانه', 'blades-teeth', '⚔️', 'parts'),
('باتری و برق', 'battery-electric', '🔋', 'parts'),

-- Services categories
('خدمات تعمیرات', 'repair-services', '🔧', 'services'),
('خدمات اجاره', 'rental-services', '📅', 'services'),
('خدمات حمل و نقل', 'transport-services', '🚛', 'services'),
('مشاوره فنی', 'technical-consulting', '👨‍🔬', 'services'),
('فروش قطعات', 'parts-sales', '🛒', 'services');

-- Insert default ad types
INSERT OR IGNORE INTO ad_types (name, slug, description) VALUES
('فروش ماشین‌آلات', 'machinery-sale', 'فروش ماشین‌آلات سنگین و تجهیزات'),
('اجاره ماشین‌آلات', 'machinery-rent', 'اجاره ماشین‌آلات سنگین'),
('فروش قطعات', 'parts-sale', 'فروش قطعات یدکی و لوازم جانبی'),
('خدمات تعمیرات', 'repair-service', 'ارائه خدمات تعمیر و نگهداری'),
('همکاری تجاری', 'business-cooperation', 'پیشنهاد همکاری و مشارکت تجاری'),
('تبلیغات', 'advertising', 'آگهی‌های تبلیغاتی و بازاریابی');

-- Insert default provinces (31 استان + کل ایران)
INSERT OR IGNORE INTO provinces (name, name_en) VALUES
('کل ایران', 'All Iran'),
('تهران', 'Tehran'),
('خوزستان', 'Khuzestan'),
('بوشهر', 'Bushehr'),
('اصفهان', 'Isfahan'),
('خراسان رضوی', 'Razavi Khorasan'),
('فارس', 'Fars'),
('آذربایجان شرقی', 'East Azerbaijan'),
('مازندران', 'Mazandaran'),
('کرمان', 'Kerman'),
('البرز', 'Alborz'),
('گیلان', 'Gilan'),
('کهگیلویه و بویراحمد', 'Kohgiluyeh and Boyer-Ahmad'),
('آذربایجان غربی', 'West Azerbaijan'),
('هرمزگان', 'Hormozgan'),
('مرکزی', 'Markazi'),
('یزد', 'Yazd'),
('کرمانشاه', 'Kermanshah'),
('قزوین', 'Qazvin'),
('سیستان و بلوچستان', 'Sistan and Baluchestan'),
('همدان', 'Hamadan'),
('ایلام', 'Ilam'),
('گلستان', 'Golestan'),
('لرستان', 'Lorestan'),
('زنجان', 'Zanjan'),
('اردبیل', 'Ardabil'),
('قم', 'Qom'),
('کردستان', 'Kurdistan'),
('سمنان', 'Semnan'),
('چهارمحال و بختیاری', 'Chaharmahal and Bakhtiari'),
('خراسان شمالی', 'North Khorasan'),
('خراسان جنوبی', 'South Khorasan');

-- Insert default cities for Tehran
INSERT OR IGNORE INTO cities (name, name_en, province_id) VALUES
('تهران', 'Tehran', 1),
('کرج', 'Karaj', 1),
('ورامین', 'Varamin', 1),
('شهریار', 'Shahriar', 1),
('ملارد', 'Malard', 1);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_ad_type ON listings(ad_type_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_user ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(category_type);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_views_listing ON listing_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_views_date ON listing_views(viewed_at);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(100),
    message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending|confirmed|cancelled|completed
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ad_id) REFERENCES listings(id),
    FOREIGN KEY (customer_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_ad ON orders(ad_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_id INTEGER NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(100),
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'new', -- new|read|replied
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ad_id) REFERENCES listings(id)
);

CREATE INDEX IF NOT EXISTS idx_inquiries_ad ON inquiries(ad_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

-- ==================== Payment & Featured System Tables ====================

-- Featured Plans Table
CREATE TABLE IF NOT EXISTS featured_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    duration_days INTEGER NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    discount_percent INTEGER DEFAULT 0,
    features TEXT,
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans
INSERT OR IGNORE INTO featured_plans (id, name, name_en, duration_days, price, features, display_order) VALUES
(1, 'روزانه', 'daily', 1, 50000, '["نمایش در بالای لیست","علامت ویژه"]', 1),
(2, 'هفتگی', 'weekly', 7, 300000, '["نمایش در بالای لیست","علامت ویژه","پشتیبانی اولویت‌دار"]', 2),
(3, 'ماهانه', 'monthly', 30, 1000000, '["نمایش در بالای لیست","علامت ویژه","پشتیبانی اولویت‌دار","گزارش آمار"]', 3);

-- Discount Codes Table
CREATE TABLE IF NOT EXISTS discount_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
    discount_value INTEGER NOT NULL,
    max_discount INTEGER,
    min_amount INTEGER,
    max_uses INTEGER,
    max_uses_per_user INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    expiry_date DATETIME,
    applicable_plans TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

-- Discount Code Usage Table
CREATE TABLE IF NOT EXISTS discount_code_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discount_code_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    payment_id INTEGER NOT NULL,
    discount_amount INTEGER NOT NULL,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discount_code_id) REFERENCES discount_codes(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    listing_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    discount_code_id INTEGER,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    final_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    gateway_name VARCHAR(50),
    transaction_id VARCHAR(100),
    authority VARCHAR(100),
    ref_id VARCHAR(100),
    receipt_image TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    rejection_reason TEXT,
    verified_by INTEGER,
    verified_at DATETIME,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (listing_id) REFERENCES listings(id),
    FOREIGN KEY (plan_id) REFERENCES featured_plans(id),
    FOREIGN KEY (discount_code_id) REFERENCES discount_codes(id),
    FOREIGN KEY (verified_by) REFERENCES admin_users(id)
);

-- Update Featured Listings Table
CREATE TABLE IF NOT EXISTS featured_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    plan_id INTEGER,
    payment_id INTEGER,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id),
    FOREIGN KEY (plan_id) REFERENCES featured_plans(id),
    FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- Payment Settings Table
CREATE TABLE IF NOT EXISTS payment_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- Insert default payment settings
INSERT OR IGNORE INTO payment_settings (setting_key, setting_value) VALUES
('gateway_enabled', 'true'),
('card_transfer_enabled', 'true'),
('wallet_enabled', 'false'),
('default_gateway', 'zarinpal'),
('auto_approve_gateway', 'true'),
('card_number', ''),
('card_holder_name', ''),
('bank_name', ''),
('min_payment_amount', '10000'),
('max_payment_amount', '50000000');

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    category VARCHAR(50),
    related_id INTEGER,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_featured_listings_listing ON featured_listings(listing_id);
CREATE INDEX IF NOT EXISTS idx_featured_listings_dates ON featured_listings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
