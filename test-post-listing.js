const axios = require('axios');

async function testPostListing() {
  try {
    // First login to get token
    console.log('1. Logging in...');
    const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
      phone: '09123456789',
      password: '123456'
    });
    
    const token = loginRes.data.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');
    
    // Now try to post a listing
    console.log('\n2. Posting listing...');
    const listingData = {
      title: 'تست آگهی',
      description: 'این یک آگهی تستی است برای بررسی عملکرد سیستم',
      price: 1000000,
      type: 'sale',
      category_id: 1,
      location: 'تهران',
      images: [],
      tags: ['تست'],
      specifications: {}
    };
    
    const postRes = await axios.post(
      'http://localhost:8080/api/listings',
      listingData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Listing posted successfully!');
    console.log('Response:', postRes.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

testPostListing();