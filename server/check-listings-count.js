// بررسی تعداد آگهی‌ها
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('📊 آمار آگهی‌ها:\n');

db.serialize(() => {
    db.get('SELECT COUNT(*) as count FROM listings', (err, row) => {
        console.log(`کل آگهی‌ها: ${row?.count || 0}`);
    });
    
    db.get('SELECT COUNT(*) as count FROM listings WHERE is_active = 1', (err, row) => {
        console.log(`آگهی‌های فعال: ${row?.count || 0}`);
    });
    
    db.get('SELECT COUNT(*) as count FROM listings WHERE is_active = 0', (err, row) => {
        console.log(`آگهی‌های غیرفعال: ${row?.count || 0}`);
    });
    
    db.get('SELECT COUNT(*) as count FROM listings WHERE COALESCE(is_archived, 0) = 1', (err, row) => {
        console.log(`آگهی‌های بایگانی: ${row?.count || 0}`);
    });
    
    db.get('SELECT COUNT(*) as count FROM deleted_listings', (err, row) => {
        console.log(`آگهی‌های حذف شده: ${row?.count || 0}`);
    });
    
    // نمایش چند آگهی
    db.all('SELECT id, title, is_active, is_archived FROM listings LIMIT 5', (err, rows) => {
        if (rows && rows.length > 0) {
            console.log('\n📋 نمونه آگهی‌ها:');
            rows.forEach(r => console.log(`  #${r.id}: ${r.title} (active=${r.is_active}, archived=${r.is_archived})`));
        }
        db.close();
    });
});
