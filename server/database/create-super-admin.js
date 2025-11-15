const { db } = require('../config/database');
const bcrypt = require('bcryptjs');

console.log('Creating Super Admin...\n');

try {
  // Hash password
  const password = 'admin123456';
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Create or update super admin
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO admin_users 
    (id, username, password_hash, role, is_super_admin, permissions, email, name, is_active, created_at)
    VALUES (1, ?, ?, ?, 1, ?, ?, ?, 1, CURRENT_TIMESTAMP)
  `);

  stmt.run(
    'admin',
    hashedPassword,
    'super_admin',
    '["*"]',
    'admin@bilflow.com',
    'مدیر اصلی'
  );

  console.log('✅ Super Admin created successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 اطلاعات ورود به پنل مدیریت:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌐 آدرس: http://localhost:8080/admin/login');
  console.log('👤 نام کاربری: admin');
  console.log('🔑 رمز عبور: admin123456');
  console.log('📧 ایمیل: admin@bilflow.com');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📌 پس از ورود:');
  console.log('   1. به /admin/management بروید');
  console.log('   2. ادمین‌های جدید ایجاد کنید');
  console.log('   3. رمز عبور را تغییر دهید\n');

  // Verify
  const admin = db.prepare('SELECT id, username, email, role, is_super_admin FROM admin_users WHERE id = 1').get();
  console.log('✓ Verified:', admin);

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
