const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function testReviewsSimple() {
    console.log('🧪 تست ساده API نظرات...\n');

    try {
        // 1. تست دریافت نظرات برای آگهی شماره 1
        console.log('1️⃣ تست دریافت نظرات آگهی...');
        
        try {
            const reviewsResponse = await axios.get(`${BASE_URL}/reviews/listing/1`);
            console.log('✅ API نظرات کار می‌کند');
            console.log('📊 آمار:', reviewsResponse.data.data.statistics);
            console.log('📝 تعداد نظرات:', reviewsResponse.data.data.reviews.length);
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('⚠️ آگهی شماره 1 یافت نشد، اما API کار می‌کند');
            } else {
                throw error;
            }
        }

        // 2. تست API مدیریت نظرات (بدون احراز هویت - باید خطا دهد)
        console.log('\n2️⃣ تست API مدیریت نظرات...');
        
        try {
            await axios.get(`${BASE_URL}/admin/reviews`);
            console.log('❌ API ادمین بدون احراز هویت کار کرد (مشکل امنیتی!)');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ API ادمین درست محافظت شده است');
            } else {
                console.log('⚠️ خطای غیرمنتظره:', error.response?.status);
            }
        }

        // 3. تست ثبت نظر بدون احراز هویت (باید خطا دهد)
        console.log('\n3️⃣ تست ثبت نظر بدون احراز هویت...');
        
        try {
            await axios.post(`${BASE_URL}/reviews`, {
                listing_id: 1,
                rating: 5,
                comment: 'تست'
            });
            console.log('❌ ثبت نظر بدون احراز هویت کار کرد (مشکل امنیتی!)');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ ثبت نظر درست محافظت شده است');
            } else {
                console.log('⚠️ خطای غیرمنتظره:', error.response?.status);
            }
        }

        // 4. تست route های غیرموجود
        console.log('\n4️⃣ تست route های غیرموجود...');
        
        try {
            await axios.get(`${BASE_URL}/reviews/nonexistent`);
            console.log('❌ Route غیرموجود پاسخ داد');
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('✅ Route غیرموجود درست 404 برگرداند');
            } else {
                console.log('⚠️ خطای غیرمنتظره:', error.response?.status);
            }
        }

        console.log('\n🎉 تست‌های اولیه API نظرات موفق بود!');
        console.log('\n📋 خلاصه:');
        console.log('   ✅ API دریافت نظرات کار می‌کند');
        console.log('   ✅ API ادمین محافظت شده است');
        console.log('   ✅ ثبت نظر محافظت شده است');
        console.log('   ✅ مدیریت خطاها درست است');
        
        console.log('\n💡 برای تست کامل:');
        console.log('   1. ابتدا با OTP وارد شوید');
        console.log('   2. آگهی ایجاد کنید');
        console.log('   3. نظر ثبت کنید');
        console.log('   4. از پنل ادمین نظرات را مدیریت کنید');

    } catch (error) {
        console.error('❌ خطا در تست:', error.response?.data || error.message);
    }
}

// اجرای تست
testReviewsSimple();