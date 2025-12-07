const { db } = require('./config/database');

async function checkCitiesTable() {
    try {
        console.log('🔍 Checking cities table...');
        
        // بررسی وجود جدول
        const tableExists = await new Promise((resolve, reject) => {
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='cities'", (err, row) => {
                if (err) reject(err);
                else resolve(!!row);
            });
        });
        
        console.log('Table exists:', tableExists);
        
        if (tableExists) {
            // دریافت ساختار جدول
            const schema = await new Promise((resolve, reject) => {
                db.all("PRAGMA table_info(cities)", (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            console.log('Table schema:', schema);
            
            // دریافت تعداد رکوردها
            const count = await new Promise((resolve, reject) => {
                db.get("SELECT COUNT(*) as count FROM cities", (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count);
                });
            });
            
            console.log('Records count:', count);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkCitiesTable();