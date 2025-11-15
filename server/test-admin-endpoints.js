// Test script for all admin endpoints
// Run with: node test-admin-endpoints.js

const API_URL = 'http://localhost:8080/api';

// Test all admin endpoints
async function testEndpoints() {
  console.log('🧪 Testing Admin Panel Endpoints...\n');
  
  const tests = [
    // Settings
    { name: 'Settings - GET', method: 'GET', url: '/admin/settings', needsAuth: true },
    
    // Discounts
    { name: 'Discounts - GET', method: 'GET', url: '/admin/discounts', needsAuth: true },
    
    // Providers
    { name: 'Providers - GET', method: 'GET', url: '/admin/providers', needsAuth: true },
    
    // Reports
    { name: 'Reports - Financial', method: 'GET', url: '/admin/reports/financial', needsAuth: true },
    { name: 'Reports - Users', method: 'GET', url: '/admin/reports/users', needsAuth: true },
    { name: 'Reports - Listings', method: 'GET', url: '/admin/reports/listings', needsAuth: true },
    
    // Audit
    { name: 'Audit - GET', method: 'GET', url: '/admin/audit', needsAuth: true },
    
    // Messages
    { name: 'Messages - GET', method: 'GET', url: '/admin/messages', needsAuth: true },
    
    // Notifications
    { name: 'Notifications - GET', method: 'GET', url: '/admin/notifications', needsAuth: true },
    
    // Categories
    { name: 'Categories - GET', method: 'GET', url: '/admin/categories', needsAuth: true },
    
    // Static Pages
    { name: 'Static Pages - GET', method: 'GET', url: '/admin/static-pages', needsAuth: true },
    
    // Media
    { name: 'Media - GET', method: 'GET', url: '/admin/media', needsAuth: true },
    
    // Security
    { name: 'Security - Blocked IPs', method: 'GET', url: '/admin/security/blocked-ips', needsAuth: true },
    { name: 'Security - Login Logs', method: 'GET', url: '/admin/security/login-logs', needsAuth: true },
    
    // Backup (without auth for basic check)
    { name: 'Health Check', method: 'GET', url: '/health', needsAuth: false },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const url = `${API_URL}${test.url}`;
      const response = await fetch(url, {
        method: test.method,
        headers: test.needsAuth ? {
          'Authorization': 'Bearer test-token'
        } : {}
      });
      
      // We expect 401 for protected routes without valid token
      // Or 200/success for routes that exist
      if (test.needsAuth && response.status === 401) {
        console.log(`✅ ${test.name}: Endpoint exists (Auth required)`);
        passed++;
      } else if (!test.needsAuth && response.ok) {
        console.log(`✅ ${test.name}: OK`);
        passed++;
      } else if (response.status === 404) {
        console.log(`❌ ${test.name}: NOT FOUND (404)`);
        failed++;
      } else {
        console.log(`⚠️  ${test.name}: Status ${response.status}`);
        passed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${tests.length} tests`);
  
  if (failed === 0) {
    console.log('✅ All endpoints are available!');
  }
}

testEndpoints().catch(console.error);
