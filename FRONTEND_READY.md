# ✅ فرانت و بک‌اند بالا اومدند!

## 🚀 سرورها در حال اجرا هستند

### فرانت (React + Vite)
- 🌐 آدرس: **http://localhost:5173/**
- ✅ وضعیت: در حال اجرا
- 📦 Vite v5.4.19

### بک‌اند (Node.js + Express)
- 🌐 آدرس: **http://localhost:8080/**
- ✅ وضعیت: در حال اجرا
- 📊 Health Check: http://localhost:8080/health

---

## 🧪 تست OTP

حالا می‌تونی OTP رو تست کنی:

### روش 1: از طریق مرورگر
1. برو به: **http://localhost:5173/**
2. روی دکمه ورود/ثبت‌نام کلیک کن
3. شماره موبایل خودت رو وارد کن (مثلاً: 09123456789)
4. کد OTP رو دریافت می‌کنی
5. کد رو وارد کن و وارد شو

### روش 2: از طریق API مستقیم
```bash
# ارسال OTP
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"09123456789\"}"

# تایید OTP
curl -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"09123456789\", \"otp\": \"کد_دریافتی\", \"name\": \"نام_تست\"}"
```

### روش 3: اسکریپت تست
```bash
cd server
node test-otp.js 09123456789
```

---

## 📱 تنظیمات SMS.ir

```env
SMS_PROVIDER=smsir
SMSIR_API_KEY=CHNIxJncFMxOXQ0CBL7DKoiv90VpGDy7LXcF0sLWvgGXgbDH
SMSIR_TEMPLATE_ID=178826
OTP_MOCK=false  ← SMS واقعی فعال است
```

---

## 🔍 مشاهده لاگ‌ها

اگر می‌خوای لاگ‌های سرور رو ببینی:

### لاگ فرانت:
- در ترمینال Kiro مشاهده می‌شود
- یا در Console مرورگر (F12)

### لاگ بک‌اند:
- در ترمینال Kiro مشاهده می‌شود
- تمام درخواست‌های OTP لاگ می‌شوند

---

## 🎯 صفحات موجود

- 🏠 صفحه اصلی: http://localhost:5173/
- 🔐 ورود/ثبت‌نام: http://localhost:5173/auth
- 👤 داشبورد کاربر: http://localhost:5173/dashboard
- 🛠️ پنل ادمین: http://localhost:5173/admin
- 📝 ثبت آگهی: http://localhost:5173/post-ad
- 🔍 جستجو: http://localhost:5173/search

---

## ⚡ دستورات مفید

### توقف سرورها:
در Kiro IDE از منوی Processes می‌تونی سرورها رو متوقف کنی

### ری‌استارت:
اگر تغییری دادی و نیاز به ری‌استارت داری:
1. سرورها رو Stop کن
2. دوباره Start کن

---

## 🎉 همه چی آماده است!

می‌تونی:
- ✅ با هر شماره‌ای ثبت‌نام کنی
- ✅ OTP واقعی دریافت کنی (از SMS.ir)
- ✅ وارد سیستم بشی
- ✅ آگهی ثبت کنی
- ✅ پرداخت انجام بدی
- ✅ از تمام امکانات استفاده کنی

**برو و تست کن! 🚀**
