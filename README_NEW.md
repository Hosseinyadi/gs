# 🚜 گاراژ سنگین - پلتفرم جامع ماشین‌آلات سنگین

> **پلتفرم حرفه‌ای خرید، فروش و اجاره ماشین‌آلات سنگین با پنل مدیریت پیشرفته**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/garazh-sangin)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)

---

## 📋 فهرست مطالب

- [ویژگی‌ها](#-ویژگی‌ها)
- [تکنولوژی‌ها](#-تکنولوژی‌ها)
- [نصب و راه‌اندازی](#-نصب-و-راه‌اندازی)
- [ساختار پروژه](#-ساختار-پروژه)
- [مستندات API](#-مستندات-api)
- [امنیت](#-امنیت)
- [تست](#-تست)
- [مشارکت](#-مشارکت)

---

## ✨ ویژگی‌ها

### 🔐 احراز هویت و امنیت
- ✅ ورود/ثبت‌نام با OTP (SMS.ir)
- ✅ احراز هویت با JWT Token
- ✅ نقش‌های کاربری (کاربر عادی، ادمین، سوپر ادمین)
- ✅ Rate Limiting برای جلوگیری از حملات
- ✅ Input Sanitization و XSS Protection
- ✅ CSRF Protection
- ✅ Secure Cookies (HttpOnly, Secure, SameSite)

### 📝 مدیریت آگهی‌ها
- ✅ ثبت آگهی در 3 مرحله ساده
- ✅ دسته‌بندی‌های متنوع (بیل، بولدوزر، لودر، کرین و...)
- ✅ آپلود تصاویر
- ✅ جست‌وجوی پیشرفته با فیلترها
- ✅ علاقه‌مندی‌ها
- ✅ ویرایش و حذف آگهی
- ✅ آمار بازدید

### 👤 پنل کاربری
- ✅ مدیریت پروفایل
- ✅ مشاهده و مدیریت آگهی‌های خود
- ✅ لیست علاقه‌مندی‌ها
- ✅ تاریخچه تراکنش‌ها
- ✅ کیف پول

### 🎛️ پنل مدیریت (13 تب)
- ✅ **داشبورد**: آمار لحظه‌ای و نمودارها
- ✅ **آگهی‌ها**: تأیید/رد، ویرایش، حذف، ارتقا به ویژه
- ✅ **کاربران**: مدیریت کامل کاربران
- ✅ **ارائه‌دهندگان**: تأیید درخواست‌های قطعات/خدمات
- ✅ **کدهای تخفیف**: ایجاد و مدیریت کدهای تخفیف
- ✅ **گزارش‌ها**: گزارش‌های مالی، کاربران، آگهی‌ها
- ✅ **رسانه**: مدیریت فایل‌های آپلود شده
- ✅ **صفحات**: ویرایش صفحات ثابت (درباره ما، تماس و...)
- ✅ **اعلان‌ها**: ارسال اعلان عمومی
- ✅ **تنظیمات**: تنظیمات سیستم، قیمت‌گذاری، پرداخت
- ✅ **امنیت**: مدیریت ادمین‌ها، نقش‌ها، لاگ ورود
- ✅ **پشتیبان**: Backup و Restore دیتابیس
- ✅ **لاگ‌ها**: Audit Logs تمام عملیات

### 📱 رابط کاربری
- ✅ طراحی مدرن و زیبا با Shadcn UI
- ✅ Responsive (موبایل، تبلت، دسکتاپ)
- ✅ پشتیبانی کامل از RTL
- ✅ Dark Mode Ready
- ✅ Loading States و Error Handling
- ✅ Toast Notifications

---

## 🛠️ تکنولوژی‌ها

### Frontend
```
⚛️  React 18
📘 TypeScript
⚡ Vite
🎨 Tailwind CSS
🧩 Shadcn UI
🔀 React Router
📡 Axios
🔔 Sonner (Toast)
🎯 Lucide Icons
```

### Backend
```
🟢 Node.js
🚂 Express.js
🗄️ SQLite
🔐 JWT
🔒 Bcrypt
📧 SMS.ir API
🛡️ Helmet
⏱️ Rate Limit
🗜️ Compression
```

### DevOps & Tools
```
📦 npm
🔧 Git
📝 ESLint
🎨 Prettier
```

---

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها

```bash
Node.js >= 16.0.0
npm >= 7.0.0
```

### 1️⃣ Clone کردن پروژه

```bash
git clone https://github.com/yourusername/garazh-sangin.git
cd garazh-sangin
```

### 2️⃣ نصب Frontend

```bash
# نصب dependencies
npm install

# اجرا در حالت Development
npm run dev

# Build برای Production
npm run build

# Preview Build
npm run preview
```

Frontend در آدرس `http://localhost:5173` اجرا می‌شود.

### 3️⃣ نصب Backend

```bash
# رفتن به پوشه server
cd server

# نصب dependencies
npm install

# ایجاد فایل .env
cp .env.example .env

# ویرایش .env و تنظیم متغیرها
nano .env

# اجرای migration
npm run migrate

# ایجاد ادمین تست
node scripts/create-test-admin.js

# اجرا در حالت Development
npm run dev

# اجرا در حالت Production
npm start
```

Backend در آدرس `http://localhost:8080` اجرا می‌شود.

### 4️⃣ تنظیمات `.env`

```env
# Server
PORT=8080
NODE_ENV=development

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Database
DB_PATH=./server/database/bilflow.db

# SMS
SMS_IR_API_KEY=your-sms-ir-api-key
OTP_MOCK=false

# Rate Limiting
RATE_LIMIT_MAX=100
OTP_RATE_LIMIT_MAX=3
LOGIN_RATE_LIMIT_MAX=50

# CORS
ALLOWED_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

---

## 📁 ساختار پروژه

```
garazh-sangin/
├── 📂 server/                    # Backend
│   ├── 📂 config/               # تنظیمات
│   │   ├── database.js
│   │   └── constants.js
│   ├── 📂 database/             # دیتابیس
│   │   ├── bilflow.db
│   │   ├── schema.sql
│   │   └── migrate-*.js
│   ├── 📂 middleware/           # Middleware ها
│   │   ├── auth.js
│   │   ├── adminAuth.js
│   │   ├── rateLimiter.js
│   │   └── security.js
│   ├── 📂 routes/               # API Routes
│   │   ├── auth.js
│   │   ├── listings.js
│   │   ├── admin.js
│   │   └── ...
│   ├── 📂 services/             # سرویس‌ها
│   │   ├── smsService.js
│   │   └── jwtService.js
│   ├── 📂 scripts/              # اسکریپت‌های کمکی
│   └── server.js                # Entry Point
│
├── 📂 src/                       # Frontend
│   ├── 📂 components/
│   │   ├── 📂 admin/            # کامپوننت‌های ادمین (16 فایل)
│   │   ├── 📂 ui/               # کامپوننت‌های Shadcn
│   │   └── 📂 layout/           # Layout ها
│   ├── 📂 pages/                # صفحات
│   │   ├── Home.tsx
│   │   ├── Auth.tsx
│   │   ├── PostAd.tsx
│   │   ├── UserDashboard.tsx
│   │   └── AdminDashboard.tsx
│   ├── 📂 hooks/                # Custom Hooks
│   ├── 📂 services/             # API Services
│   ├── 📂 lib/                  # Utilities
│   ├── App.tsx
│   └── main.tsx
│
├── 📂 public/                    # Static Files
├── 📄 .env                       # Environment Variables
├── 📄 .gitignore
├── 📄 package.json
├── 📄 vite.config.ts
└── 📄 README.md
```

---

## 📡 مستندات API

### Base URL
```
http://localhost:8080/api
```

### احراز هویت

#### ارسال OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "phone": "09123456789"
}
```

#### تایید OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "09123456789",
  "otp": "123456",
  "name": "نام کاربر" // اختیاری برای ورود، اجباری برای ثبت‌نام
}
```

#### ورود ادمین
```http
POST /api/auth/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### آگهی‌ها

#### لیست آگهی‌ها
```http
GET /api/listings?page=1&limit=10&type=sale&category=1
```

#### جزئیات آگهی
```http
GET /api/listings/:id
```

#### ثبت آگهی
```http
POST /api/listings
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "عنوان آگهی",
  "description": "توضیحات",
  "price": 5000000,
  "type": "sale",
  "category_id": 1,
  "location": "تهران",
  "brand": "کوماتسو",
  "model": "PC200",
  "year": 2020
}
```

### پنل مدیریت

#### آمار داشبورد
```http
GET /api/admin/dashboard
Authorization: Bearer {admin_token}
```

#### تأیید آگهی
```http
PUT /api/admin/listings/:id/approve
Authorization: Bearer {admin_token}
```

#### رد آگهی
```http
PUT /api/admin/listings/:id/reject
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "دلیل رد"
}
```

مستندات کامل API در فایل `API_DOCUMENTATION.md` موجود است.

---

## 🔒 امنیت

### اقدامات امنیتی پیاده‌سازی شده:

✅ **احراز هویت:**
- JWT Token با Expiration
- Bcrypt برای Hash کردن رمز عبور
- OTP با SMS واقعی

✅ **محافظت در برابر حملات:**
- Rate Limiting (محدودیت درخواست)
- Input Sanitization (پاکسازی ورودی)
- XSS Protection
- CSRF Protection
- SQL Injection Prevention
- Helmet Security Headers

✅ **Cookie امن:**
- HttpOnly (جلوگیری از دسترسی JavaScript)
- Secure (فقط HTTPS در production)
- SameSite (محافظت CSRF)

✅ **CORS محدود:**
- فقط origin های مجاز
- Credentials فعال

✅ **Audit Logging:**
- ثبت تمام عملیات ادمین
- ذخیره IP Address
- جزئیات کامل

---

## 🧪 تست

### تست دستی

```bash
# ثبت آگهی
1. برو به http://localhost:5173/post-ad
2. فرم را پر کن
3. آگهی را ثبت کن

# پنل مدیریت
1. برو به http://localhost:5173/admin/login
2. ورود با admin/admin123
3. تست تمام تب‌ها
```

### اجرای تست‌های خودکار

```bash
# Frontend tests
npm run test

# Backend tests
cd server
npm run test

# E2E tests
npm run test:e2e
```

---

## 📊 Performance

### Metrics هدف:

```
⚡ TTFB: < 200ms
⚡ FCP: < 1.5s
⚡ LCP: < 2.5s
⚡ TTI: < 3.5s
⚡ CLS: < 0.1
⚡ FID: < 100ms
```

### بهینه‌سازی‌های اعمال شده:

- ✅ Compression (Gzip)
- ✅ Database Indexing
- ✅ Query Optimization
- ✅ Static File Caching
- ✅ Code Splitting (آماده)
- ✅ Lazy Loading (آماده)

---

## 🤝 مشارکت

مشارکت شما خوشحال‌کننده است! لطفاً مراحل زیر را دنبال کنید:

1. Fork کنید
2. Branch جدید بسازید (`git checkout -b feature/AmazingFeature`)
3. تغییرات را Commit کنید (`git commit -m 'Add some AmazingFeature'`)
4. Push کنید (`git push origin feature/AmazingFeature`)
5. Pull Request باز کنید

---

## 📝 مستندات بیشتر

- [راهنمای کامل پنل مدیریت](ADMIN_PANEL_GUIDE.md)
- [لیست کامل قابلیت‌ها](COMPLETE_FEATURES_LIST.md)
- [راهنمای بهینه‌سازی](PROJECT_OPTIMIZATION.md)
- [تغییرات اعمال شده](FIXES_APPLIED.md)
- [چک‌لیست تست](TEST_CHECKLIST.md)

---

## 📞 پشتیبانی

- 📧 Email: support@garazhsangin.ir
- 📱 تلگرام: @garazhsangin
- 🌐 وبسایت: https://garazhsangin.ir

---

## 📜 لایسنس

این پروژه تحت لایسنس MIT منتشر شده است. برای جزئیات بیشتر فایل [LICENSE](LICENSE) را مطالعه کنید.

---

## 👨‍💻 توسعه‌دهندگان

- **تیم گاراژ سنگین** - توسعه اولیه

---

## 🙏 تشکر

از تمام کسانی که در توسعه این پروژه مشارکت داشتند، تشکر می‌کنیم.

---

<div align="center">

**ساخته شده با ❤️ توسط تیم گاراژ سنگین**

[وبسایت](https://garazhsangin.ir) • [مستندات](https://docs.garazhsangin.ir) • [پشتیبانی](mailto:support@garazhsangin.ir)

</div>
