-- Deleted Listings Table
-- برای ذخیره آگهی‌های حذف شده با دلیل حذف

CREATE TABLE IF NOT EXISTS deleted_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(15,2),
    type VARCHAR(20),
    category_id INTEGER,
    images TEXT,
    location VARCHAR(200),
    deleted_by VARCHAR(20) NOT NULL, -- 'user' or 'admin'
    delete_reason VARCHAR(50) NOT NULL, -- sold, rented, changed_mind, not_interested, successful_sale, violation, other
    delete_reason_text TEXT, -- توضیحات بیشتر
    admin_id INTEGER, -- اگر توسط ادمین حذف شده
    original_created_at DATETIME,
    deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (admin_id) REFERENCES admin_users(id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_deleted_listings_user ON deleted_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_listings_deleted_by ON deleted_listings(deleted_by);
CREATE INDEX IF NOT EXISTS idx_deleted_listings_reason ON deleted_listings(delete_reason);
