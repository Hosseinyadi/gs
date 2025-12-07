const fs = require('fs');
const path = require('path');
const { dbHelpers } = require('../config/database');

async function runMigration() {
    console.log('🚀 شروع migration محله‌ها...');
    
    try {
        // صبر برای آماده شدن دیتابیس
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const sqlPath = path.join(__dirname, 'add-neighborhoods.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        const statements = sql.split(';').filter(s => s.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await dbHelpers.run(statement);
                    console.log('✅ اجرا شد:', statement.substring(0, 50) + '...');
                } catch (err) {
                    if (err.message.includes('already exists') || err.message.includes('UNIQUE constraint')) {
                        console.log('⚠️ قبلاً وجود داشت:', statement.substring(0, 50) + '...');
                    } else {
                        console.error('❌ خطا:', err.message);
                    }
                }
            }
        }
        
        // بررسی نتیجه
        const count = await dbHelpers.get('SELECT COUNT(*) as count FROM neighborhoods');
        console.log(`\n✅ Migration کامل شد! تعداد محله‌ها: ${count?.count || 0}`);
        
    } catch (error) {
        console.error('❌ خطا در migration:', error);
    }
    
    process.exit(0);
}

runMigration();
