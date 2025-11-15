const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'bilflow.db');
const schemaPath = path.join(__dirname, 'admin_schema.sql');

console.log('🚀 شروع migration پنل مدیریت...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ خطا در اتصال به دیتابیس:', err.message);
        process.exit(1);
    }
    console.log('✅ اتصال به دیتابیس برقرار شد');
});

// Helper function to add column if not exists
function addColumnIfNotExists(tableName, columnName, columnDef) {
    return new Promise((resolve) => {
        db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
            if (err) {
                console.error(`❌ خطا در بررسی جدول ${tableName}:`, err.message);
                resolve();
                return;
            }
            
            const columnExists = columns && columns.some(col => col.name === columnName);
            
            if (!columnExists) {
                db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`, (err) => {
                    if (err) {
                        console.error(`❌ خطا در افزودن ستون ${columnName}:`, err.message);
                    } else {
                        console.log(`✅ ستون ${columnName} به جدول ${tableName} اضافه شد`);
                    }
                    resolve();
                });
            } else {
                console.log(`⚠️  ستون ${columnName} قبلاً در جدول ${tableName} وجود دارد`);
                resolve();
            }
        });
    });
}

// خواندن فایل schema
const schema = fs.readFileSync(schemaPath, 'utf8');

// تقسیم دستورات SQL (بهبود یافته)
const statements = schema
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'Note: admin_users columns will be added via migration script if they don\'t exist');

// اجرای دستورات به صورت سریال
async function runMigration() {
    // ابتدا ستون‌های جدید را به admin_users اضافه کن
    console.log('📝 افزودن ستون‌های جدید به admin_users...');
    await addColumnIfNotExists('admin_users', 'role_id', 'INTEGER REFERENCES admin_roles(id)');
    await addColumnIfNotExists('admin_users', 'is_super_admin', 'BOOLEAN DEFAULT 0');
    await addColumnIfNotExists('admin_users', 'name', 'VARCHAR(100)');
    await addColumnIfNotExists('admin_users', 'email', 'VARCHAR(100)');
    await addColumnIfNotExists('admin_users', 'last_login', 'DATETIME');
    
    console.log('📝 اجرای دستورات schema...');
    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        // Skip empty or comment-only statements
        if (!statement || statement.trim().length === 0) continue;
        
        try {
            await new Promise((resolve, reject) => {
                db.run(statement, (err) => {
                    if (err) {
                        // Ignore certain errors
                        if (err.message.includes('duplicate column') || 
                            err.message.includes('already exists') ||
                            err.message.includes('no such table')) {
                            resolve();
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve();
                    }
                });
            });
            
            if (i % 5 === 0 && i > 0) {
                console.log(`📊 پیشرفت: ${i}/${statements.length} دستور اجرا شد`);
            }
        } catch (err) {
            console.error(`❌ خطا در اجرای دستور ${i + 1}:`, err.message);
        }
    }
}

runMigration()
    .then(() => {
        console.log('✅ Migration با موفقیت انجام شد');
        
        // بروزرسانی admin موجود به super admin
        db.run(`
            UPDATE admin_users 
            SET is_super_admin = 1, role_id = 1, name = 'حسین'
            WHERE username = 'hossein'
        `, (err) => {
            if (err) {
                console.error('❌ خطا در بروزرسانی admin:', err.message);
            } else {
                console.log('✅ کاربر admin به super admin ارتقا یافت');
            }
            
            db.close((err) => {
                if (err) {
                    console.error('❌ خطا در بستن دیتابیس:', err.message);
                } else {
                    console.log('✅ اتصال دیتابیس بسته شد');
                    console.log('\n🎉 تمام عملیات با موفقیت انجام شد!');
                }
            });
        });
    })
    .catch((err) => {
        console.error('❌ خطای کلی در migration:', err);
        db.close();
        process.exit(1);
    });
