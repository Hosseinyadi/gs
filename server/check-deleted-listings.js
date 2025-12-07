// بررسی جدول deleted_listings
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 بررسی جدول deleted_listings...\n');

db.all('PRAGMA table_info(deleted_listings)', (err, rows) => {
    if (err) {
        console.error('❌ خطا:', err.message);
    } else if (rows.length === 0) {
        console.log('⚠️ جدول deleted_listings وجود ندارد!');
    } else {
        console.log('✅ ستون‌های جدول:');
        rows.forEach(r => console.log(`  - ${r.name} (${r.type})`));
    }
    
    // تعداد رکوردها
    db.get('SELECT COUNT(*) as count FROM deleted_listings', (err, row) => {
        if (err) {
            console.log('\n⚠️ جدول وجود ندارد یا خطا:', err.message);
        } else {
            console.log(`\n📊 تعداد آگهی‌های حذف شده: ${row.count}`);
        }
        db.close();
    });
});
