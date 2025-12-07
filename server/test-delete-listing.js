// تست حذف آگهی
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 بررسی آگهی‌ها...\n');

// پیدا کردن یک آگهی برای تست
db.get('SELECT * FROM listings LIMIT 1', (err, listing) => {
    if (err) {
        console.error('❌ خطا:', err.message);
        db.close();
        return;
    }
    
    if (!listing) {
        console.log('⚠️ هیچ آگهی‌ای وجود ندارد');
        db.close();
        return;
    }
    
    console.log('📋 آگهی پیدا شد:');
    console.log(`  ID: ${listing.id}`);
    console.log(`  عنوان: ${listing.title}`);
    console.log(`  user_id: ${listing.user_id}`);
    console.log(`  is_archived: ${listing.is_archived}`);
    console.log(`  is_active: ${listing.is_active}`);
    
    // تست INSERT به deleted_listings
    console.log('\n🧪 تست INSERT به deleted_listings...');
    
    const insertSQL = `
        INSERT INTO deleted_listings (
            listing_id, user_id, title, description, price, type, 
            category_id, images, location, deleted_by, delete_reason, 
            delete_reason_text, admin_id, original_created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(insertSQL, [
        listing.id, listing.user_id, listing.title, listing.description,
        listing.price, listing.type, listing.category_id, listing.images,
        listing.location, 'admin', 'test', 'تست حذف', 1, listing.created_at
    ], function(err) {
        if (err) {
            console.error('❌ خطا در INSERT:', err.message);
        } else {
            console.log('✅ INSERT موفق! ID:', this.lastID);
            
            // حذف رکورد تست
            db.run('DELETE FROM deleted_listings WHERE id = ?', [this.lastID], (err) => {
                if (err) console.error('خطا در حذف تست:', err);
                else console.log('🗑️ رکورد تست حذف شد');
                db.close();
            });
        }
    });
});
