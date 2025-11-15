const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const dbPath = path.join(__dirname, '../database/bilflow.db');

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  console.log('\n=== ایجاد کاربر مدیر ===\n');

  const phone = await question('شماره موبایل مدیر (مثال: 09123456789): ');
  const name = await question('نام مدیر (مثال: مدیر سیستم): ');

  if (!phone || phone.length < 11) {
    console.error('❌ شماره موبایل نامعتبر است!');
    rl.close();
    return;
  }

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ خطا در اتصال به دیتابیس:', err.message);
      rl.close();
      return;
    }
    console.log('✅ اتصال به دیتابیس برقرار شد');
  });

  // Check if user already exists
  db.get('SELECT * FROM users WHERE phone = ?', [phone], (err, row) => {
    if (err) {
      console.error('❌ خطا در جستجوی کاربر:', err.message);
      db.close();
      rl.close();
      return;
    }

    if (row) {
      // User exists, update to admin
      db.run(
        'UPDATE users SET role = ?, name = ? WHERE phone = ?',
        ['admin', name || row.name, phone],
        function(err) {
          if (err) {
            console.error('❌ خطا در به‌روزرسانی کاربر:', err.message);
          } else {
            console.log(`\n✅ کاربر موجود به مدیر تبدیل شد!`);
            console.log(`📱 شماره: ${phone}`);
            console.log(`👤 نام: ${name || row.name}`);
            console.log(`🔑 نقش: admin`);
          }
          db.close();
          rl.close();
        }
      );
    } else {
      // Create new admin user
      db.run(
        `INSERT INTO users (phone, name, role, is_verified, wallet_balance, created_at)
         VALUES (?, ?, 'admin', 1, 0, datetime('now'))`,
        [phone, name || 'مدیر سیستم'],
        function(err) {
          if (err) {
            console.error('❌ خطا در ایجاد کاربر:', err.message);
          } else {
            console.log(`\n✅ کاربر مدیر جدید ایجاد شد!`);
            console.log(`📱 شماره: ${phone}`);
            console.log(`👤 نام: ${name || 'مدیر سیستم'}`);
            console.log(`🔑 نقش: admin`);
            console.log(`🆔 ID: ${this.lastID}`);
          }
          db.close();
          rl.close();
        }
      );
    }
  });
}

createAdmin().catch(err => {
  console.error('❌ خطای غیرمنتظره:', err);
  rl.close();
});
