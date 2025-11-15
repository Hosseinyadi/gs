const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/bilflow.db');

console.log('\n=== پاک کردن کدهای OTP قدیمی ===\n');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ خطا در اتصال به دیتابیس:', err.message);
    process.exit(1);
  }
  console.log('✅ اتصال به دیتابیس برقرار شد');
});

// Delete old OTPs
db.run(
  `DELETE FROM otp_verifications WHERE expires_at < datetime('now') OR is_used = 1`,
  function(err) {
    if (err) {
      console.error('❌ خطا در پاک کردن OTP ها:', err.message);
    } else {
      console.log(`\n✅ ${this.changes} کد OTP قدیمی پاک شد`);
    }
    
    // Show remaining OTPs
    db.all(
      `SELECT phone, otp_code, expires_at, is_used FROM otp_verifications ORDER BY created_at DESC LIMIT 10`,
      [],
      (err, rows) => {
        if (err) {
          console.error('❌ خطا در نمایش OTP ها:', err.message);
        } else if (rows.length > 0) {
          console.log('\n📱 کدهای OTP فعلی:');
          rows.forEach(row => {
            console.log(`   ${row.phone}: ${row.otp_code} (منقضی: ${row.expires_at}, استفاده شده: ${row.is_used ? 'بله' : 'خیر'})`);
          });
        } else {
          console.log('\n✅ هیچ کد OTP فعالی وجود ندارد');
        }
        db.close();
      }
    );
  }
);
