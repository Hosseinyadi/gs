// پاک کردن استان‌های تکراری و نگه داشتن فقط یکی از هر کدام
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔄 پاک کردن استان‌های تکراری...');

db.serialize(() => {
  // پیدا کردن و حذف تکراری‌ها - نگه داشتن اولین رکورد
  db.run(`
    DELETE FROM provinces 
    WHERE id NOT IN (
      SELECT MIN(id) FROM provinces GROUP BY name
    )
  `, function(err) {
    if (err) {
      console.error('❌ خطا در حذف تکراری‌ها:', err);
    } else {
      console.log(`✅ ${this.changes} رکورد تکراری حذف شد`);
    }
    
    // نمایش استان‌های باقی‌مانده
    db.all('SELECT * FROM provinces ORDER BY id', (err, rows) => {
      if (err) {
        console.error('❌ خطا:', err);
      } else {
        console.log(`\n📋 ${rows.length} استان در دیتابیس:`);
        rows.forEach(r => console.log(`  ${r.id}. ${r.name}`));
      }
      db.close();
    });
  });
});
