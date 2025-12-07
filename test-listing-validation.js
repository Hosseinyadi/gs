// تست validation برای ثبت آگهی
const testData = {
  title: 'بیل مکانیکی کوماتسو',
  description: 'بیل مکانیکی کوماتسو مدل PC200 در حد نو',
  price: 5000000,
  type: 'sale',
  category_id: 1,
  location: 'تهران',
  condition: 'عالی',
  year: 2020,
  brand: 'کوماتسو',
  model: 'PC200',
  specifications: {
    priceType: 'fixed',
    isNegotiable: false
  },
  tags: JSON.stringify(['کوماتسو', 'بیل']),
  images: []
};

console.log('📋 Test Data:');
console.log(JSON.stringify(testData, null, 2));

console.log('\n🔍 Data Types:');
Object.keys(testData).forEach(key => {
  console.log(`  ${key}: ${typeof testData[key]} = ${testData[key]}`);
});

// تست با fetch
async function testAPI() {
  try {
    const token = 'YOUR_TOKEN_HERE'; // توکن را از localStorage بگیرید
    
    const response = await fetch('http://localhost:8080/api/listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('\n✅ API Response:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\n❌ API Error:', error.message);
  }
}

// Uncomment to test:
// testAPI();
