const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testAllAPIs() {
    console.log('🧪 تست جامع تمام API ها...\n');

    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    // Helper function to run test
    async function runTest(name, testFn) {
        try {
            console.log(`🔍 ${name}...`);
            await testFn();
            console.log(`✅ ${name} - موفق`);
            results.passed++;
            results.tests.push({ name, status: 'PASS' });
        } catch (error) {
            console.log(`❌ ${name} - ناموفق: ${error.message}`);
            results.failed++;
            results.tests.push({ name, status: 'FAIL', error: error.message });
        }
    }

    // Test 1: Health Check
    await runTest('Health Check', async () => {
        const response = await axios.get('http://localhost:8080/health');
        if (response.data.status !== 'OK') {
            throw new Error('Health check failed');
        }
    });

    // Test 2: Admin Login
    let adminToken = '';
    await runTest('Admin Login', async () => {
        const response = await axios.post(`${BASE_URL}/auth/admin/login`, {
            username: 'admin',
            password: 'admin123456'
        });
        if (!response.data.success) {
            throw new Error(response.data.message);
        }
        adminToken = response.data.data.token;
    });

    // Test 3: Get Listings
    await runTest('Get Listings', async () => {
        const response = await axios.get(`${BASE_URL}/listings`);
        if (!response.data.success) {
            throw new Error('Failed to get listings');
        }
    });

    // Test 4: Admin Dashboard
    await runTest('Admin Dashboard', async () => {
        const response = await axios.get(`${BASE_URL}/admin/dashboard`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!response.data.success) {
            throw new Error('Failed to get admin dashboard');
        }
    });

    // Test 5: Admin Listings
    await runTest('Admin Listings Management', async () => {
        const response = await axios.get(`${BASE_URL}/admin/listings`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!response.data.success) {
            throw new Error('Failed to get admin listings');
        }
    });

    // Test 6: Featured Plans
    await runTest('Featured Plans', async () => {
        const response = await axios.get(`${BASE_URL}/featured-plans`);
        if (!response.data.success) {
            throw new Error('Failed to get featured plans');
        }
    });

    // Test 7: Categories
    await runTest('Categories', async () => {
        const response = await axios.get(`${BASE_URL}/listings/categories/all`);
        if (!response.data.success) {
            throw new Error('Failed to get categories');
        }
    });

    // Test 8: Reviews API (without auth - should fail)
    await runTest('Reviews API Security', async () => {
        try {
            await axios.post(`${BASE_URL}/reviews`, {
                listing_id: 1,
                rating: 5,
                comment: 'test'
            });
            throw new Error('Reviews API should require authentication');
        } catch (error) {
            if (error.response?.status !== 401 && error.response?.status !== 404) {
                throw new Error('Unexpected error code');
            }
        }
    });

    // Test 9: Admin Reviews
    await runTest('Admin Reviews Management', async () => {
        const response = await axios.get(`${BASE_URL}/admin/reviews`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!response.data.success) {
            throw new Error('Failed to get admin reviews');
        }
    });

    // Test 10: Admin Reviews Stats
    await runTest('Admin Reviews Stats', async () => {
        const response = await axios.get(`${BASE_URL}/admin/reviews/stats`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!response.data.success) {
            throw new Error('Failed to get reviews stats');
        }
    });

    // Test 11: Payment History (without auth - should fail)
    await runTest('Payment History Security', async () => {
        try {
            await axios.get(`${BASE_URL}/payment-history`);
            throw new Error('Payment history should require authentication');
        } catch (error) {
            if (error.response?.status !== 401) {
                throw new Error('Unexpected error code');
            }
        }
    });

    // Test 12: Discount Codes (admin)
    await runTest('Admin Discount Codes', async () => {
        const response = await axios.get(`${BASE_URL}/admin/discount-codes`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!response.data.success) {
            throw new Error('Failed to get discount codes');
        }
    });

    // Test 13: Admin Analytics
    await runTest('Admin Analytics', async () => {
        const response = await axios.get(`${BASE_URL}/admin/analytics/overview`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!response.data.success) {
            throw new Error('Failed to get analytics');
        }
    });

    // Test 14: Admin Management
    await runTest('Admin Management', async () => {
        const response = await axios.get(`${BASE_URL}/admin/management/list`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!response.data.success) {
            throw new Error('Failed to get admin list');
        }
    });

    // Test 15: OTP Send (should work)
    await runTest('OTP Send API', async () => {
        const response = await axios.post(`${BASE_URL}/auth/send-otp`, {
            phone: '09123456789'
        });
        if (!response.data.success) {
            throw new Error('Failed to send OTP');
        }
    });

    // Print Results
    console.log('\n' + '='.repeat(60));
    console.log('📊 نتایج تست جامع API ها');
    console.log('='.repeat(60));
    console.log(`✅ موفق: ${results.passed}`);
    console.log(`❌ ناموفق: ${results.failed}`);
    console.log(`📊 کل: ${results.passed + results.failed}`);
    console.log(`📈 درصد موفقیت: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

    console.log('\n📋 جزئیات تست‌ها:');
    results.tests.forEach((test, index) => {
        const status = test.status === 'PASS' ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${test.name}`);
        if (test.error) {
            console.log(`   خطا: ${test.error}`);
        }
    });

    console.log('\n🎯 خلاصه:');
    if (results.failed === 0) {
        console.log('🎉 همه تست‌ها موفق بودند! سیستم آماده تولید است.');
    } else {
        console.log(`⚠️ ${results.failed} تست ناموفق بود. لطفاً بررسی کنید.`);
    }

    console.log('\n🌐 لینک‌های مهم:');
    console.log('- Frontend: http://localhost:5173');
    console.log('- Backend: http://localhost:8080');
    console.log('- Admin Panel: http://localhost:5173/admin');
    console.log('- Health Check: http://localhost:8080/health');

    return results;
}

// اجرای تست
testAllAPIs().catch(console.error);