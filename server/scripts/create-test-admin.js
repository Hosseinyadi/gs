const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/bilflow.db');

// Test admin credentials
const testAdmin = {
  username: 'admin',
  password: 'admin123',
  role: 'admin'
};

console.log('\n=== ایجاد کاربر مدیر تست ===\n');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ خطا در اتصال به دیتابیس:', err.message);
    process.exit(1);
  }
  console.log('✅ اتصال به دیتابیس برقرار شد');
});

// Hash password
const passwordHash = bcrypt.hashSync(testAdmin.password, 10);

// Check if admin already exists
db.get('SELECT * FROM admin_users WHERE username = ?', [testAdmin.username], (err, row) => {
  if (err) {
    console.error('❌ خطا در جستجوی ادمین:', err.message);
    db.close();
    process.exit(1);
  }

  if (row) {
    // Admin exists, update password
    db.run(
      'UPDATE admin_users SET password_hash = ?, is_active = 1 WHERE username = ?',
      [passwordHash, testAdmin.username],
      function(err) {
        if (err) {
          console.error('❌ خطا در به‌روزرسانی ادمین:', err.message);
        } else {
          console.log('\n✅ ادمین موجود به‌روزرسانی شد!');
          console.log(`👤 نام کاربری: ${testAdmin.username}`);
          console.log(`🔑 رمز عبور: ${testAdmin.password}`);
          console.log(`🆔 ID: ${row.id}`);
          console.log('\n💡 برای ورود به پنل مدیریت:');
          console.log('   1. به صفحه /auth بروید');
          console.log('   2. روی تب "ادمین" کلیک کنید');
          console.log(`   3. نام کاربری: ${testAdmin.username}`);
          console.log(`   4. رمز عبور: ${testAdmin.password}`);
        }
        db.close();
      }
    );
  } else {
    // Create new admin
    db.run(
      `INSERT INTO admin_users (username, password_hash, role, is_active, created_at)
       VALUES (?, ?, ?, 1, datetime('now'))`,
      [testAdmin.username, passwordHash, testAdmin.role],
      function(err) {
        if (err) {
          console.error('❌ خطا در ایجاد ادمین:', err.message);
        } else {
          console.log('\n✅ ادمین جدید ایجاد شد!');
          console.log(`👤 نام کاربری: ${testAdmin.username}`);
          console.log(`🔑 رمز عبور: ${testAdmin.password}`);
          console.log(`🆔 ID: ${this.lastID}`);
          console.log('\n💡 برای ورود به پنل مدیریت:');
          console.log('   1. به صفحه /auth بروید');
          console.log('   2. روی تب "ادمین" کلیک کنید');
          console.log(`   3. نام کاربری: ${testAdmin.username}`);
          console.log(`   4. رمز عبور: ${testAdmin.password}`);
        }
        db.close();
      }
    );
  }
});
