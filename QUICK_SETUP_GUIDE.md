# 🚀 راهنمای راه‌اندازی سریع

## ✅ مراحل راه‌اندازی

### 1. نصب وابستگی‌ها
```bash
# Backend
cd server
npm install

# Frontend  
cd ..
npm install
```

### 2. راه‌اندازی دیتابیس
```bash
cd server

# اجرای schema اصلی
node run-main-schema.js

# اجرای migration سیستم ادمین
node database/migrate-admin-system.js

# ایجاد سوپر ادمین
node database/create-super-admin.js

# اجرای migration نماد اعتماد
node run-trust-badge-migration.js

# اجرای migration محدودیت آگهی‌ها
node run-listing-limits-migration.js
```

### 3. تنظیم متغیرهای محیطی
```bash
# کپی فایل نمونه
cp .env.example .env

# ویرایش فایل .env و تنظیم:
# - SMS_IR_API_KEY
# - ZARINPAL_MERCHANT_ID
# - سایر تنظیمات
```

### 4. اجرای سرور
```bash
# Backend
cd server
npm start

# Frontend (در ترمینال جدید)
npm run dev
```

## 🔑 دسترسی پیش‌فرض

### Super Admin:
- **شماره:** 09123456789
- **رمز:** superadmin123

## 📋 چک‌لیست ویژگی‌ها

### ✅ ویژگی‌های پیاده‌سازی شده:

#### پنل ادمین:
- ✅ داشبورد
- ✅ مدیریت آگهی‌ها
- ✅ مدیریت کاربران
- ✅ مدیریت نظرات
- ✅ نماد اعتماد (Super Admin)
- ✅ پشتیبان‌گیری ماهانه (Super Admin)
- ✅ مشتریان وفادار
- ✅ مدیریت ادمین‌ها (Super Admin)
- ✅ مدیریت پرداخت‌ها
- ✅ تنظیمات پرداخت
- ✅ کدهای تخفیف
- ✅ مدیریت بنرها

#### سیستم پرداخت:
- ✅ درگاه زرین‌پال
- ✅ کارت به کارت
- ✅ کدهای تخفیف
- ✅ تایید خودکار/دستی

#### سیستم آگهی:
- ✅ ثبت آگهی
- ✅ ویژه‌سازی آگهی
- ✅ محدودیت ماهانه (1 رایگان)
- ✅ آگهی‌های اضافی (پولی)
- ✅ مرتب‌سازی هوشمند

#### امنیت:
- ✅ احراز هویت OTP
- ✅ نقش‌های ادمین (Super Admin / Moderator)
- ✅ رمزگذاری پشتیبان‌ها
- ✅ لاگ فعالیت‌ها

#### SEO و بهینه‌سازی:
- ✅ SEO ایرانی
- ✅ Structured Data
- ✅ Sitemap
- ✅ Meta Tags کامل

## 🔧 تنظیمات مهم

### SMS (sms.ir):
```env
SMS_IR_API_KEY=your_api_key_here
SMS_IR_LINE_NUMBER=your_line_number
```

### درگاه پرداخت (زرین‌پال):
```env
ZARINPAL_MERCHANT_ID=your_merchant_id
ZARINPAL_SANDBOX=false
```

### تنظیمات پرداخت:
- **حداقل مبلغ:** 10,000 تومان
- **حداکثر مبلغ:** 50,000,000 تومان
- **هزینه آگهی اضافی:** 50,000 تومان

## 📱 دسترسی به پنل‌ها

### پنل کاربری:
```
http://localhost:5173/dashboard
```

### پنل ادمین:
```
http://localhost:5173/admin
```

## 🧪 تست سیستم

### تست OTP:
```bash
cd server
node test-otp.js
```

### تست پشتیبان‌گیری:
```bash
cd server
node test-backup-system.js
```

### تست APIها:
```bash
cd server
node test-all-apis.js
```

## 🆘 رفع مشکلات رایج

### سرور اجرا نمی‌شود:
```bash
# بررسی پورت
netstat -ano | findstr :3001

# حذف process قبلی
taskkill /PID <process_id> /F
```

### دیتابیس خالی است:
```bash
cd server
node run-main-schema.js
```

### ادمین وجود ندارد:
```bash
cd server
node database/create-super-admin.js
```

## 📞 پشتیبانی

در صورت بروز مشکل:
1. بررسی لاگ‌های سرور
2. بررسی console مرورگر
3. مراجعه به فایل‌های مستندات

## 🎯 مراحل بعدی

1. ✅ تست کامل سیستم
2. ✅ آموزش تیم ادمین
3. ✅ تنظیم SMS واقعی
4. ✅ تنظیم درگاه پرداخت
5. ✅ راه‌اندازی production

---

**نکته:** تمام ویژگی‌های اصلی پیاده‌سازی شده و آماده استفاده هستند! 🎉