# 🚀 راهنمای سریع راه‌اندازی

## پیش‌نیازها
- Node.js 16+
- npm یا yarn

## مراحل راه‌اندازی

### 1. نصب وابستگی‌ها

```bash
# Backend
cd server
npm install

# Frontend
cd ..
npm install
```

### 2. تنظیم Environment Variables

فایل `.env` در ریشه پروژه ایجاد کنید:

```env
# Frontend
VITE_API_URL=http://localhost:8080/api

# Backend
PORT=8080
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Payment Gateway - ZarinPal (برای تست)
ZARINPAL_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ZARINPAL_SANDBOX=true

# Payment Configuration
PAYMENT_CALLBACK_URL=http://localhost:8080/api/payments/verify
BACKEND_URL=http://localhost:8080
```

### 3. راه‌اندازی Backend

```bash
cd server
node server.js
```

سرور روی http://localhost:8080 اجرا می‌شود

### 4. راه‌اندازی Frontend

در ترمینال جدید:

```bash
npm run dev
```

فرانت‌اند روی http://localhost:5173 اجرا می‌شود

## ✅ تست سیستم

### تست Backend
```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/featured-plans/active
```

### تست Frontend
مرورگر را باز کنید:
- صفحه اصلی: http://localhost:5173
- پنل مدیریت: http://localhost:5173/admin
- داشبورد کاربر: http://localhost:5173/dashboard

## 🎯 ویژگی‌های اصلی

### برای کاربران:
1. ثبت آگهی
2. ویژه کردن آگهی با پرداخت
3. پرداخت درگاهی یا کارت به کارت
4. مشاهده آگهی‌های ویژه خود

### برای مدیران:
1. مدیریت آگهی‌ها
2. مدیریت پرداخت‌ها
3. تایید/رد پرداخت‌های کارت به کارت
4. مشاهده آمار و گزارش‌ها

## 📚 مستندات بیشتر

- [راهنمای کامل راه‌اندازی](DEPLOYMENT_GUIDE.md)
- [خلاصه سیستم پرداخت](PAYMENT_SYSTEM_SUMMARY.md)
- [خلاصه نهایی پیاده‌سازی](FINAL_COMPLETE_SUMMARY.md)

## 🐛 عیب‌یابی

### مشکل: پورت 8080 در حال استفاده است
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <process-id> /F
```

### مشکل: خطای دیتابیس
```bash
cd server/database
del bilflow.db
cd ..
node server.js
```

## 🎉 موفق باشید!

برای سوالات بیشتر به فایل‌های مستندات مراجعه کنید.
