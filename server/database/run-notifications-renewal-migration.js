/**
 * Migration: اعلان‌ها، تمدید آگهی و آمار بازدید
 * تاریخ: 2 دسامبر 2025
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'bilflow.db');

function runMigration() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath);
        
        console.log('🔄 Starting notifications and renewal migration...');
        
        db.serialize(() => {
            // جدول اعلان‌های کاربر
            db.run(`
                CREATE TABLE IF NOT EXISTS user_notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    message TEXT NOT NULL,
                    data TEXT,
                    is_read BOOLEAN DEFAULT 0,
                    read_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) console.error('Error creating user_notifications:', err.message);
                else console.log('✅ user_notifications table created');
            });

            // جدول تنظیمات تمدید
            db.run(`
                CREATE TABLE IF NOT EXISTS renewal_settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    setting_key VARCHAR(100) UNIQUE NOT NULL,
                    setting_value TEXT NOT NULL,
                    description TEXT,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) console.error('Error creating renewal_settings:', err.message);
                else console.log('✅ renewal_settings table created');
            });

            // جدول درخواست‌های تمدید
            db.run(`
                CREATE TABLE IF NOT EXISTS listing_renewals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    listing_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    renewal_type VARCHAR(20) NOT NULL,
                    duration_days INTEGER NOT NULL DEFAULT 30,
                    amount INTEGER DEFAULT 0,
                    payment_status VARCHAR(20) DEFAULT 'pending',
                    payment_method VARCHAR(20),
                    payment_proof TEXT,
                    old_expiry_date DATETIME,
                    new_expiry_date DATETIME,
                    status VARCHAR(20) DEFAULT 'pending',
                    admin_note TEXT,
                    processed_by INTEGER,
                    processed_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `, (err) => {
                if (err) console.error('Error creating listing_renewals:', err.message);
                else console.log('✅ listing_renewals table created');
            });

            // جدول آمار بازدید روزانه
            db.run(`
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
                )
            `, (err) => {
                if (err) console.error('Error creating listing_daily_stats:', err.message);
                else console.log('✅ listing_daily_stats table created');
            });

            // ایندکس‌ها
            db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(user_id)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_unread ON user_notifications(user_id, is_read)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_renewals_listing ON listing_renewals(listing_id)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_renewals_status ON listing_renewals(status)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_daily_stats_listing ON listing_daily_stats(listing_id)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON listing_daily_stats(stat_date)`);
            console.log('✅ Indexes created');

            // تنظیمات پیش‌فرض
            const settings = [
                ['listing_duration_days', '90', 'مدت اعتبار آگهی به روز'],
                ['renewal_price', '50000', 'هزینه تمدید آگهی به تومان'],
                ['free_renewal_count', '1', 'تعداد تمدید رایگان برای هر آگهی'],
                ['expiry_warning_days', '7', 'چند روز قبل از انقضا اعلان بفرستیم'],
                ['renewal_duration_days', '30', 'مدت تمدید آگهی به روز']
            ];

            settings.forEach(([key, value, desc]) => {
                db.run(
                    `INSERT OR IGNORE INTO renewal_settings (setting_key, setting_value, description) VALUES (?, ?, ?)`,
                    [key, value, desc]
                );
            });
            console.log('✅ Default settings inserted');

            // اضافه کردن فیلدهای جدید به listings
            db.run(`ALTER TABLE listings ADD COLUMN expires_at DATETIME`, (err) => {
                if (err && !err.message.includes('duplicate column')) {
                    console.log('⚠️ expires_at may already exist');
                } else if (!err) {
                    console.log('✅ expires_at column added');
                }
            });

            db.run(`ALTER TABLE listings ADD COLUMN renewal_count INTEGER DEFAULT 0`, (err) => {
                if (err && !err.message.includes('duplicate column')) {
                    console.log('⚠️ renewal_count may already exist');
                } else if (!err) {
                    console.log('✅ renewal_count column added');
                }
            });

            // به‌روزرسانی آگهی‌های موجود
            db.run(`
                UPDATE listings 
                SET expires_at = datetime(created_at, '+90 days')
                WHERE expires_at IS NULL
            `, function(err) {
                if (err) {
                    console.error('Error updating listings:', err.message);
                } else {
                    console.log(`✅ Updated ${this.changes} listings with expiry dates`);
                }
                
                db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err.message);
                        reject(err);
                    } else {
                        console.log('🎉 Migration completed successfully!');
                        resolve();
                    }
                });
            });
        });
    });
}

// اجرای migration
if (require.main === module) {
    runMigration()
        .then(() => {
            console.log('✅ All done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = runMigration;
