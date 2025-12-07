// Migration برای ایجاد جدول deleted_listings
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔄 ایجاد جدول deleted_listings...');

const sql = `
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
    deleted_by VARCHAR(20) NOT NULL,
    delete_reason VARCHAR(50) NOT NULL,
    delete_reason_text TEXT,
    admin_id INTEGER,
    original_created_at DATETIME,
    deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (admin_id) REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_deleted_listings_user ON deleted_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_listings_deleted_by ON deleted_listings(deleted_by);
CREATE INDEX IF NOT EXISTS idx_deleted_listings_reason ON deleted_listings(delete_reason);
`;

db.exec(sql, (err) => {
    if (err) {
        console.error('❌ خطا:', err);
    } else {
        console.log('✅ جدول deleted_listings با موفقیت ایجاد شد');
    }
    db.close();
});
