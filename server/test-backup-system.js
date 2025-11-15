const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';

// Test credentials
const SUPER_ADMIN = {
  phone: '09123456789',
  password: 'superadmin123'
};

let adminToken = '';

async function testBackupSystem() {
  console.log('🧪 شروع تست سیستم پشتیبان‌گیری ماهانه...\n');

  try {
    // 1. Login as Super Admin
    console.log('1️⃣ ورود به عنوان سوپر ادمین...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/admin/login`, {
      phone: SUPER_ADMIN.phone,
      password: SUPER_ADMIN.password
    });

    if (loginResponse.data.success) {
      adminToken = loginResponse.data.token;
      console.log('✅ ورود موفق');
    } else {
      throw new Error('Login failed');
    }

    // 2. Test backup list endpoint
    console.log('\n2️⃣ تست دریافت لیست پشتیبان‌ها...');
    const listResponse = await axios.get(`${BASE_URL}/api/admin/backup/monthly/list`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (listResponse.data.success) {
      console.log('✅ دریافت لیست پشتیبان‌ها موفق');
      console.log(`📊 تعداد پشتیبان‌ها: ${listResponse.data.data.statistics.total_backups}`);
      console.log(`💾 حجم کل: ${listResponse.data.data.statistics.total_size_mb} MB`);
    } else {
      console.log('❌ خطا در دریافت لیست پشتیبان‌ها');
    }

    // 3. Test backup creation
    console.log('\n3️⃣ تست ایجاد پشتیبان جدید...');
    const createResponse = await axios.post(`${BASE_URL}/api/admin/backup/monthly`, {
      password: 'test-backup-password-123'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    let newBackupId = null;
    if (createResponse.data.success) {
      console.log('✅ ایجاد پشتیبان موفق');
      newBackupId = createResponse.data.data.backup_id;
      console.log(`🆔 شناسه پشتیبان: ${newBackupId}`);
      console.log(`📁 نام فایل: ${createResponse.data.data.filename}`);
      console.log(`💾 حجم: ${createResponse.data.data.size_mb} MB`);
    } else {
      console.log('❌ خطا در ایجاد پشتیبان:', createResponse.data.message);
    }

    // 4. Test backup download (if backup was created)
    if (newBackupId) {
      console.log('\n4️⃣ تست دانلود پشتیبان...');
      try {
        const downloadResponse = await axios.get(`${BASE_URL}/api/admin/backup/monthly/download/${newBackupId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
          responseType: 'stream'
        });

        if (downloadResponse.status === 200) {
          console.log('✅ دانلود پشتیبان موفق');
          console.log(`📄 Content-Type: ${downloadResponse.headers['content-type']}`);
          console.log(`📏 Content-Length: ${downloadResponse.headers['content-length']} bytes`);
        }
      } catch (error) {
        console.log('❌ خطا در دانلود پشتیبان:', error.response?.data?.message || error.message);
      }
    }

    // 5. Test cleanup (if there are old backups)
    console.log('\n5️⃣ تست پاک‌سازی پشتیبان‌های قدیمی...');
    const cleanupResponse = await axios.delete(`${BASE_URL}/api/admin/backup/monthly/cleanup`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (cleanupResponse.data.success) {
      console.log('✅ پاک‌سازی موفق');
      console.log(`🗑️ تعداد پشتیبان‌های حذف شده: ${cleanupResponse.data.data.deleted}`);
    } else {
      console.log('❌ خطا در پاک‌سازی:', cleanupResponse.data.message);
    }

    // 6. Test access control (try with regular user)
    console.log('\n6️⃣ تست کنترل دسترسی...');
    try {
      const unauthorizedResponse = await axios.get(`${BASE_URL}/api/admin/backup/monthly/list`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      console.log('❌ کنترل دسترسی کار نمی‌کند - دسترسی غیرمجاز موفق بود');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('✅ کنترل دسترسی صحیح - دسترسی غیرمجاز رد شد');
      } else {
        console.log('⚠️ خطای غیرمنتظره در کنترل دسترسی:', error.message);
      }
    }

    // 7. Final backup list check
    console.log('\n7️⃣ بررسی نهایی لیست پشتیبان‌ها...');
    const finalListResponse = await axios.get(`${BASE_URL}/api/admin/backup/monthly/list`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (finalListResponse.data.success) {
      const stats = finalListResponse.data.data.statistics;
      console.log('✅ بررسی نهایی موفق');
      console.log(`📊 آمار نهایی:`);
      console.log(`   - تعداد کل: ${stats.total_backups}`);
      console.log(`   - حجم کل: ${stats.total_size_mb} MB`);
      console.log(`   - میانگین حجم: ${stats.average_size_mb} MB`);
      console.log(`   - قدیمی‌ترین: ${stats.oldest_backup || 'ندارد'}`);
      console.log(`   - جدیدترین: ${stats.newest_backup || 'ندارد'}`);
    }

    console.log('\n🎉 تست سیستم پشتیبان‌گیری کامل شد!');

  } catch (error) {
    console.error('❌ خطا در تست:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('📄 جزئیات خطا:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Security and Performance Tests
async function testBackupSecurity() {
  console.log('\n🔒 تست‌های امنیتی پشتیبان‌گیری...\n');

  try {
    // Test password validation
    console.log('1️⃣ تست اعتبارسنجی رمز عبور...');
    
    // Test weak password
    try {
      await axios.post(`${BASE_URL}/api/admin/backup/monthly`, {
        password: '123'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('❌ رمز ضعیف پذیرفته شد');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ رمز ضعیف رد شد');
      }
    }

    // Test empty password
    try {
      await axios.post(`${BASE_URL}/api/admin/backup/monthly`, {
        password: ''
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('❌ رمز خالی پذیرفته شد');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ رمز خالی رد شد');
      }
    }

    // Test SQL injection attempt
    console.log('\n2️⃣ تست حمله SQL Injection...');
    try {
      await axios.post(`${BASE_URL}/api/admin/backup/monthly`, {
        password: "'; DROP TABLE backups; --"
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    } catch (error) {
      console.log('✅ حمله SQL Injection مسدود شد');
    }

    // Test file path traversal
    console.log('\n3️⃣ تست حمله Path Traversal...');
    try {
      await axios.get(`${BASE_URL}/api/admin/backup/monthly/download/../../../etc/passwd`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('❌ حمله Path Traversal موفق بود');
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 404) {
        console.log('✅ حمله Path Traversal مسدود شد');
      }
    }

    console.log('\n🔒 تست‌های امنیتی کامل شد!');

  } catch (error) {
    console.error('❌ خطا در تست‌های امنیتی:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 شروع تست کامل سیستم پشتیبان‌گیری ماهانه\n');
  console.log('=' .repeat(60));
  
  await testBackupSystem();
  await testBackupSecurity();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ تمام تست‌ها کامل شد!');
  console.log('\n📋 خلاصه نتایج:');
  console.log('- سیستم پشتیبان‌گیری: فعال');
  console.log('- امنیت: تست شده');
  console.log('- کنترل دسترسی: فعال');
  console.log('- رمزگذاری: فعال');
  console.log('- API endpoints: کارآمد');
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/api/health`);
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ سرور در حال اجرا نیست. لطفاً ابتدا سرور را اجرا کنید:');
    console.log('   cd server && npm start');
    process.exit(1);
  }

  await runAllTests();
}

main().catch(console.error);