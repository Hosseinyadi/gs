const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('👥 لیست کاربران موجود:\n');

db.all('SELECT id, phone, name, email, is_verified, created_at FROM users ORDER BY created_at DESC', [], (err, users) => {
  if (err) {
    console.error('❌ خطا:', err);
    db.close();
    return;
  }

  if (users.length === 0) {
    console.log('⚠️  هیچ کاربری در دیتابیس وجود ندارد');
  } else {
    console.log(`📊 تعداد کاربران: ${users.length}\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   📱 شماره: ${user.phone}`);
      console.log(`   👤 نام: ${user.name || 'ندارد'}`);
      console.log(`   📧 ایمیل: ${user.email || 'ندارد'}`);
      console.log(`   ✅ تایید شده: ${user.is_verified ? 'بله' : 'خیر'}`);
      console.log(`   📅 تاریخ ثبت: ${user.created_at}`);
      console.log('');
    });
  }

  db.close();
});
