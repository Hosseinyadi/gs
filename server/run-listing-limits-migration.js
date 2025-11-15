const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const migrationPath = path.join(__dirname, 'database', 'add-listing-limits.sql');

console.log('🚀 شروع migration سیستم محدودیت آگهی‌ها...\n');

// Read migration SQL
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ خطا در اتصال به دیتابیس:', err.message);
    process.exit(1);
  }
  console.log('✅ اتصال به دیتابیس موفق\n');
});

// Split SQL into individual statements
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`📝 تعداد دستورات SQL: ${statements.length}\n`);

// Execute each statement
let completed = 0;
let errors = 0;

statements.forEach((statement, index) => {
  db.run(statement, (err) => {
    if (err) {
      // Ignore "already exists" errors
      if (err.message.includes('already exists') || err.message.includes('duplicate column')) {
        console.log(`⚠️  دستور ${index + 1}: قبلاً اجرا شده (نادیده گرفته شد)`);
      } else {
        console.error(`❌ خطا در دستور ${index + 1}:`, err.message);
        errors++;
      }
    } else {
      console.log(`✅ دستور ${index + 1}: اجرا شد`);
    }
    
    completed++;
    
    if (completed === statements.length) {
      console.log('\n' + '='.repeat(50));
      if (errors === 0) {
        console.log('🎉 Migration با موفقیت کامل شد!');
      } else {
        console.log(`⚠️  Migration با ${errors} خطا کامل شد`);
      }
      console.log('='.repeat(50));
      
      // Verify tables
      db.all(`SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE '%listing%' OR name LIKE '%additional%')`, (err, rows) => {
        if (err) {
          console.error('❌ خطا در بررسی جداول:', err.message);
        } else {
          console.log('\n📊 جداول مرتبط با آگهی‌ها:');
          rows.forEach(row => {
            console.log(`   - ${row.name}`);
          });
        }
        
        db.close((err) => {
          if (err) {
            console.error('❌ خطا در بستن دیتابیس:', err.message);
          }
          process.exit(errors > 0 ? 1 : 0);
        });
      });
    }
  });
});
