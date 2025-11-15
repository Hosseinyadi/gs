const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const schemaPath = path.join(__dirname, 'database', 'schema.sql');

console.log('🚀 شروع اجرای schema اصلی...\n');

// Read schema SQL
const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ خطا در اتصال به دیتابیس:', err.message);
    process.exit(1);
  }
  console.log('✅ اتصال به دیتابیس موفق\n');
});

// Execute schema
db.exec(schemaSQL, (err) => {
  if (err) {
    console.error('❌ خطا در اجرای schema:', err.message);
    db.close();
    process.exit(1);
  }
  
  console.log('✅ Schema اصلی با موفقیت اجرا شد\n');
  
  // Verify main tables
  db.all(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`, (err, rows) => {
    if (err) {
      console.error('❌ خطا در بررسی جداول:', err.message);
    } else {
      console.log('📊 جداول موجود در دیتابیس:');
      rows.forEach(row => {
        console.log(`   - ${row.name}`);
      });
    }
    
    db.close((err) => {
      if (err) {
        console.error('❌ خطا در بستن دیتابیس:', err.message);
      }
      console.log('\n✅ دیتابیس آماده است!');
    });
  });
});
