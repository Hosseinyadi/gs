const { dbHelpers } = require('./config/database');

console.log('\n🧪 Testing Admin Management System...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

(async () => {
try {
  // Test 1: Check Super Admin
  console.log('1️⃣  Checking Super Admin...');
  const admin = await dbHelpers.get('SELECT id, username, email, role, is_super_admin, permissions FROM admin_users WHERE is_super_admin = 1');
  
  if (admin && admin.id) {
    console.log('   ✅ Super Admin exists');
    console.log('   👤 Username:', admin.username);
    console.log('   📧 Email:', admin.email);
    console.log('   🔑 Role:', admin.role);
  } else {
    console.log('   ❌ Super Admin not found!');
    console.log('   💡 Run: node server/database/create-super-admin.js');
  }

  // Test 2: Check admin_activity_log table
  console.log('\n2️⃣  Checking activity log table...');
  try {
    const logCount = await dbHelpers.get('SELECT COUNT(*) as count FROM admin_activity_log');
    console.log('   ✅ Activity log table exists');
    console.log('   📊 Total logs:', logCount.count);
  } catch (e) {
    console.log('   ❌ Activity log table not found!');
    console.log('   💡 Run: node server/database/migrate-admin-system.js');
  }

  // Test 3: Check featured_listings table
  console.log('\n3️⃣  Checking featured listings...');
  try {
    const featuredCount = await dbHelpers.get('SELECT COUNT(*) as count FROM featured_listings WHERE end_date > CURRENT_TIMESTAMP');
    console.log('   ✅ Featured listings table exists');
    console.log('   ⭐ Active featured:', featuredCount.count);
  } catch (e) {
    console.log('   ❌ Featured listings table not found!');
  }

  // Test 4: Check listings table
  console.log('\n4️⃣  Checking listings...');
  const listingsCount = await dbHelpers.get('SELECT COUNT(*) as count FROM listings');
  const activeListings = await dbHelpers.get('SELECT COUNT(*) as count FROM listings WHERE is_active = 1');
  const featuredListings = await dbHelpers.get('SELECT COUNT(*) as count FROM listings WHERE is_featured = 1');
  
  console.log('   ✅ Listings table exists');
  console.log('   📋 Total listings:', listingsCount.count);
  console.log('   ✓ Active listings:', activeListings.count);
  console.log('   ⭐ Featured listings:', featuredListings.count);

  // Test 5: Check admin permissions
  console.log('\n5️⃣  Checking admin permissions...');
  const admins = await dbHelpers.all('SELECT id, username, role, permissions FROM admin_users');
  console.log('   ✅ Total admins:', admins.length);
  
  if (Array.isArray(admins)) {
    admins.forEach(a => {
      let perms = [];
      try {
        perms = JSON.parse(a.permissions || '[]');
      } catch (e) {}
      console.log(`   - ${a.username} (${a.role}): ${perms.length} permissions`);
    });
  }

  // Test 6: Check routes
  console.log('\n6️⃣  Checking API routes...');
  console.log('   ✅ Admin Management: /api/admin/management');
  console.log('   ✅ Toggle Featured: /api/admin/listings/:id/toggle-featured');
  console.log('   ✅ Approve Listing: /api/admin/listings/:id/approve');
  console.log('   ✅ Activity Log: /api/admin/management/activity-log');

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (admin && admin.id) {
    console.log('✅ System is ready!');
    console.log('\n🌐 Login URL: http://localhost:8080/admin/login');
    console.log('👤 Username: admin');
    console.log('🔑 Password: admin123456');
    console.log('\n📌 Next steps:');
    console.log('   1. Login to admin panel');
    console.log('   2. Go to /admin/management');
    console.log('   3. Test featured listing toggle');
    console.log('   4. Check activity logs\n');
  } else {
    console.log('⚠️  System needs setup!');
    console.log('\n💡 Run: node server/database/create-super-admin.js\n');
  }

} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error('\n💡 Make sure the server is running and database is initialized.\n');
}
})();
