const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// شماره‌ای که می‌خواهید حذف کنید را اینجا وارد کنید
const phoneNumber = process.argv[2] || '09106645440';

console.log('🗑️  شروع حذف کاربر تست...');
console.log('📱 شماره:', phoneNumber);

// حذف کاربر و تمام اطلاعات مرتبط
db.serialize(() => {
  // 1. حذف OTP های کاربر
  db.run('DELETE FROM otp_verifications WHERE phone = ?', [phoneNumber], function(err) {
    if (err) {
      console.error('❌ خطا در حذف OTP:', err);
    } else {
      console.log(`✅ ${this.changes} OTP حذف شد`);
    }
  });

  // 2. پیدا کردن ID کاربر
  db.get('SELECT id FROM users WHERE phone = ?', [phoneNumber], (err, user) => {
    if (err) {
      console.error('❌ خطا در یافتن کاربر:', err);
      db.close();
      return;
    }

    if (!user) {
      console.log('⚠️  کاربر با این شماره یافت نشد');
      db.close();
      return;
    }

    const userId = user.id;
    console.log(`👤 کاربر یافت شد - ID: ${userId}`);

    // 3. حذف آگهی‌های کاربر
    db.run('DELETE FROM listings WHERE user_id = ?', [userId], function(err) {
      if (err) {
        console.error('❌ خطا در حذف آگهی‌ها:', err);
      } else {
        console.log(`✅ ${this.changes} آگهی حذف شد`);
      }
    });

    // 4. حذف علاقه‌مندی‌های کاربر
    db.run('DELETE FROM favorites WHERE user_id = ?', [userId], function(err) {
      if (err) {
        console.error('❌ خطا در حذف علاقه‌مندی‌ها:', err);
      } else {
        console.log(`✅ ${this.changes} علاقه‌مندی حذف شد`);
      }
    });

    // 5. حذف تراکنش‌های کاربر
    db.run('DELETE FROM transactions WHERE user_id = ?', [userId], function(err) {
      if (err) {
        console.error('❌ خطا در حذف تراکنش‌ها:', err);
      } else {
        console.log(`✅ ${this.changes} تراکنش حذف شد`);
      }
    });

    // 6. حذف پرداخت‌های کاربر
    db.run('DELETE FROM payments WHERE user_id = ?', [userId], function(err) {
      if (err) {
        console.error('❌ خطا در حذف پرداخت‌ها:', err);
      } else {
        console.log(`✅ ${this.changes} پرداخت حذف شد`);
      }
    });

    // 7. حذف نظرات کاربر
    db.run('DELETE FROM reviews WHERE user_id = ?', [userId], function(err) {
      if (err) {
        console.error('❌ خطا در حذف نظرات:', err);
      } else {
        console.log(`✅ ${this.changes} نظر حذف شد`);
      }
    });

    // 8. در نهایت حذف خود کاربر
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
      if (err) {
        console.error('❌ خطا در حذف کاربر:', err);
      } else {
        console.log(`✅ کاربر با موفقیت حذف شد`);
        console.log('\n🎉 تمام اطلاعات کاربر پاک شد!');
        console.log('📱 می‌توانید با شماره', phoneNumber, 'مجدداً ثبت‌نام کنید');
      }
      
      db.close((err) => {
        if (err) {
          console.error('❌ خطا در بستن دیتابیس:', err);
        } else {
          console.log('\n✅ اتصال به دیتابیس بسته شد');
        }
      });
    });
  });
});
