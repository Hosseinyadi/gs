const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

// Test data
const testUser = {
    phone: '09123456789',
    name: 'کاربر تست'
};

const testListing = {
    title: 'آگهی تست برای نظرات',
    description: 'این یک آگهی تست است',
    price: 1000000,
    type: 'sale',
    category_id: 1,
    location: 'تهران',
    condition: 'نو',
    images: []
};

const testReview = {
    rating: 5,
    comment: 'این یک نظر تست است. کیفیت عالی و قیمت مناسب!'
};

let authToken = '';
let listingId = '';
let reviewId = '';

async function testReviewsAPI() {
    console.log('🧪 شروع تست API نظرات...\n');

    try {
        // 1. ورود با رمز عبور (برای تست)
        console.log('1️⃣ ورود کاربر...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login-password`, {
            phone: testUser.phone,
            password: '123456',
            name: testUser.name
        });
        console.log('✅ ورود موفق:', loginResponse.data.message);
        authToken = loginResponse.data.data.token;

        // 3. ایجاد آگهی تست
        console.log('\n3️⃣ ایجاد آگهی تست...');
        const listingResponse = await axios.post(`${BASE_URL}/listings`, testListing, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ آگهی ایجاد شد:', listingResponse.data.message);
        listingId = listingResponse.data.data.listing.id;

        // 4. تایید آگهی (به عنوان ادمین)
        console.log('\n4️⃣ تایید آگهی...');
        await axios.put(`${BASE_URL}/admin/listings/${listingId}/approve`, 
            { approve: true },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('✅ آگهی تایید شد');

        // 5. ثبت نظر جدید (با کاربر دیگر)
        console.log('\n5️⃣ ثبت نظر جدید...');
        
        // ایجاد کاربر دوم برای نظر
        const testUser2 = {
            phone: '09987654321',
            name: 'کاربر دوم'
        };
        
        const login2Response = await axios.post(`${BASE_URL}/auth/login-password`, {
            phone: testUser2.phone,
            password: '123456',
            name: testUser2.name
        });
        const authToken2 = login2Response.data.data.token;

        const reviewResponse = await axios.post(`${BASE_URL}/reviews`, {
            listing_id: listingId,
            ...testReview
        }, {
            headers: { Authorization: `Bearer ${authToken2}` }
        });
        console.log('✅ نظر ثبت شد:', reviewResponse.data.message);
        reviewId = reviewResponse.data.data.review.id;

        // 6. دریافت نظرات آگهی
        console.log('\n6️⃣ دریافت نظرات آگهی...');
        const getReviewsResponse = await axios.get(`${BASE_URL}/reviews/listing/${listingId}`);
        console.log('✅ نظرات دریافت شد:');
        console.log('   - تعداد نظرات:', getReviewsResponse.data.data.statistics.total_reviews);
        console.log('   - میانگین امتیاز:', getReviewsResponse.data.data.statistics.average_rating);
        console.log('   - نظرات:', getReviewsResponse.data.data.reviews.length);

        // 7. تست مدیریت نظرات (ادمین)
        console.log('\n7️⃣ تست مدیریت نظرات...');
        
        // دریافت نظرات برای ادمین
        const adminReviewsResponse = await axios.get(`${BASE_URL}/admin/reviews`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ نظرات ادمین دریافت شد:', adminReviewsResponse.data.data.reviews.length);

        // آمار نظرات
        const statsResponse = await axios.get(`${BASE_URL}/admin/reviews/stats`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ آمار نظرات:', statsResponse.data.data);

        // تایید نظر
        await axios.put(`${BASE_URL}/admin/reviews/${reviewId}/approve`, 
            { approve: true },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('✅ نظر تایید شد');

        // اضافه کردن پاسخ ادمین
        await axios.put(`${BASE_URL}/admin/reviews/${reviewId}/response`, 
            { response: 'متشکریم از نظر مثبت شما!' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('✅ پاسخ ادمین اضافه شد');

        // 8. تست ویرایش نظر
        console.log('\n8️⃣ تست ویرایش نظر...');
        await axios.put(`${BASE_URL}/reviews/${reviewId}`, {
            rating: 4,
            comment: 'نظر ویرایش شده - کیفیت خوب اما قیمت کمی بالا'
        }, {
            headers: { Authorization: `Bearer ${authToken2}` }
        });
        console.log('✅ نظر ویرایش شد');

        // 9. دریافت نظرات کاربر
        console.log('\n9️⃣ دریافت نظرات کاربر...');
        const userReviewsResponse = await axios.get(`${BASE_URL}/reviews/user/my-reviews`, {
            headers: { Authorization: `Bearer ${authToken2}` }
        });
        console.log('✅ نظرات کاربر:', userReviewsResponse.data.data.reviews.length);

        console.log('\n🎉 همه تست‌ها با موفقیت انجام شد!');
        console.log('\n📊 خلاصه تست:');
        console.log(`   - آگهی ایجاد شده: ${listingId}`);
        console.log(`   - نظر ثبت شده: ${reviewId}`);
        console.log('   - تایید نظر: ✅');
        console.log('   - پاسخ ادمین: ✅');
        console.log('   - ویرایش نظر: ✅');

    } catch (error) {
        console.error('❌ خطا در تست:', error.response?.data || error.message);
        
        if (error.response?.status === 404) {
            console.log('💡 احتمالاً route نظرات هنوز اضافه نشده است');
        }
    }
}

// اجرای تست
testReviewsAPI();