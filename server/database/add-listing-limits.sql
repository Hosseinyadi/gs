-- جدول پرداخت‌های آگهی اضافی
CREATE TABLE IF NOT EXISTS additional_listing_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    listing_data TEXT NOT NULL, -- JSON data of the listing
    listing_id INTEGER NULL, -- Will be set after listing is created
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
    payment_method TEXT DEFAULT 'gateway', -- gateway, card_transfer
    authority TEXT NULL,
    ref_id TEXT NULL,
    receipt_image TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (listing_id) REFERENCES listings(id)
);

-- ایندکس‌ها برای بهبود عملکرد
CREATE INDEX IF NOT EXISTS idx_additional_payments_user_id ON additional_listing_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_additional_payments_status ON additional_listing_payments(status);
CREATE INDEX IF NOT EXISTS idx_additional_payments_created_at ON additional_listing_payments(created_at);

-- اضافه کردن ستون برای ردیابی آگهی‌های پولی (اگر وجود ندارد)
-- ALTER TABLE listings ADD COLUMN is_paid_listing BOOLEAN DEFAULT FALSE;
-- ALTER TABLE listings ADD COLUMN payment_id INTEGER NULL;

-- ایندکس برای آگهی‌های پولی (فعلاً غیرفعال)
-- CREATE INDEX IF NOT EXISTS idx_listings_is_paid ON listings(is_paid_listing);
-- CREATE INDEX IF NOT EXISTS idx_listings_payment_id ON listings(payment_id);