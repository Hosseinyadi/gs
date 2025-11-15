# 🚛 گاراژ سنگین - Garazh Sangin

**بازارگاه آنلاین ماشین‌آلات سنگین ایران**

یک پلتفرم کامل و حرفه‌ای برای خرید، فروش و اجاره ماشین‌آلات سنگین با امکانات پیشرفته مدیریتی و پرداخت.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.3.1-blue)](https://reactjs.org/)

---

## 📋 فهرست مطالب

- [ویژگی‌های اصلی](#-ویژگی‌های-اصلی)
- [تکنولوژی‌های استفاده شده](#-تکنولوژی‌های-استفاده-شده)
- [نصب و راه‌اندازی](#-نصب-و-راه‌اندازی)
- [راهنمای استفاده](#-راهنمای-استفاده)
- [ساختار پروژه](#-ساختار-پروژه)
- [API Documentation](#-api-documentation)
- [مستندات](#-مستندات)
- [مشارکت](#-مشارکت)
- [لایسنس](#-لایسنس)

---

## ✨ ویژگی‌های اصلی

### 🔐 سیستم احراز هویت
- ✅ ورود/ثبت‌نام با OTP (کد یکبار مصرف)
- ✅ ورود با رمز عبور
- ✅ پنل مدیریت ادمین با سطوح دسترسی
- ✅ مدیریت کاربران و نقش‌ها

### 📱 سیستم آگهی‌ها
- ✅ ثبت آگهی خرید/فروش/اجاره
- ✅ آپلود تصاویر متعدد
- ✅ دسته‌بندی پیشرفته
- ✅ جستجو و فیلتر قدرتمند
- ✅ نمایش آگهی‌های ویژه
- ✅ سیستم بازدید و آمار

### 💳 سیستم پرداخت
- ✅ پرداخت کارت به کارت
- ✅ پلن‌های ویژه‌سازی آگهی
- ✅ کد تخفیف
- ✅ تاریخچه پرداخت‌ها
- ✅ مدیریت تراکنش‌ها

### 👨‍💼 پنل مدیریت حرفه‌ای
- ✅ داشبورد آماری پیشرفته
- ✅ مدیریت آگهی‌ها و کاربران
- ✅ سیستم تایید آگهی‌ها
- ✅ مدیریت پرداخت‌ها
- ✅ گزارش‌گیری جامع
- ✅ مدیریت کدهای تخفیف
- ✅ تنظیمات سایت
- ✅ پشتیبان‌گیری خودکار ماهانه
- ✅ مدیریت مشتریان وفادار
- ✅ سیستم نشان اعتماد

### 🌟 ویژگی‌های ایرانی
- ✅ تقویم شمسی
- ✅ اعتبارسنجی کارت بانکی ایرانی
- ✅ پشتیبانی کامل از زبان فارسی
- ✅ بهینه‌سازی SEO برای ایران
- ✅ سازگاری با تمام مرورگرها (Chrome, Edge, Firefox, Safari)

### 🔒 امنیت و بهینه‌سازی
- ✅ Rate Limiting
- ✅ Input Sanitization
- ✅ CORS Protection
- ✅ XSS Prevention
- ✅ SQL Injection Prevention
- ✅ Helmet Security Headers
- ✅ Cookie Consent
- ✅ Privacy Policy

### 📊 سیستم نظرات و امتیازدهی
- ✅ ثبت نظر برای آگهی‌ها
- ✅ امتیازدهی 1 تا 5 ستاره
- ✅ مدیریت نظرات توسط ادمین
- ✅ نمایش میانگین امتیاز

### 🎯 ویژگی‌های اضافی
- ✅ سیستم علاقه‌مندی‌ها
- ✅ اعلان‌های سیستمی
- ✅ پشتیبانی از PWA
- ✅ Lazy Loading تصاویر
- ✅ Performance Monitoring
- ✅ Error Boundary
- ✅ Analytics Integration

---

## 🛠 تکنولوژی‌های استفاده شده

### Frontend
- **React 18.3.1** - کتابخانه UI
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **TailwindCSS** - Styling
- **Shadcn/ui** - Component Library
- **React Router** - Routing
- **Lucide React** - Icons
- **Sonner** - Toast Notifications

### Backend
- **Node.js** - Runtime
- **Express.js** - Web Framework
- **SQLite** - Database
- **JWT** - Authentication
- **Bcrypt** - Password Hashing
- **Express Validator** - Input Validation
- **Helmet** - Security Headers
- **CORS** - Cross-Origin Resource Sharing
- **Rate Limiter** - DDoS Protection

### DevOps & Tools
- **Git** - Version Control
- **npm** - Package Manager
- **ESLint** - Code Linting
- **Prettier** - Code Formatting

---

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها
```bash
Node.js >= 18.0.0
npm >= 9.0.0
Git
```

### 1. کلون کردن پروژه
```bash
git clone https://github.com/Hosseinyadi/gs.git
cd gs
```

### 2. نصب وابستگی‌ها

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd server
npm install
cd ..
```

### 3. تنظیمات محیطی

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:8080/api
```

#### Backend (server/.env)
```env
PORT=8080
JWT_SECRET=your-secret-key-here
NODE_ENV=development

# SMS.ir Configuration (Optional)
SMSIR_API_KEY=your-smsir-api-key
SMSIR_LINE_NUMBER=your-line-number

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 4. راه‌اندازی دیتابیس
```bash
cd server
node run-main-schema.js
node database/create-super-admin.js
cd ..
```

### 5. اجرای پروژه

#### روش 1: اجرای همزمان (توصیه می‌شود)
```bash
npm run dev
```

#### روش 2: اجرای جداگانه

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd server
node server.js
```

### 6. دسترسی به برنامه

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

---

## 📖 راهنمای استفاده

### ورود به پنل ادمین

**اطلاعات پیش‌فرض:**
- نام کاربری: `admin`
- رمز عبور: `admin123`

**مسیر ورود:** http://localhost:5173/admin

### ثبت‌نام کاربر عادی

1. به صفحه ورود بروید: http://localhost:5173/auth
2. شماره موبایل خود را وارد کنید
3. کد OTP را از Console سرور کپی کنید
4. کد را وارد کرده و تایید کنید

### ثبت آگهی

1. وارد پنل کاربری شوید
2. روی "ثبت آگهی" کلیک کنید
3. اطلاعات آگهی را وارد کنید
4. تصاویر را آپلود کنید
5. آگهی را ثبت کنید

### ویژه کردن آگهی

1. به صفحه آگهی خود بروید
2. روی "ویژه کردن" کلیک کنید
3. پلن مورد نظر را انتخاب کنید
4. پرداخت را انجام دهید

---

## 📁 ساختار پروژه

```
gs/
├── src/                          # Frontend Source
│   ├── components/              # React Components
│   │   ├── admin/              # Admin Components
│   │   ├── ui/                 # UI Components
│   │   └── user/               # User Components
│   ├── pages/                  # Page Components
│   ├── hooks/                  # Custom Hooks
│   ├── services/               # API Services
│   ├── utils/                  # Utility Functions
│   └── main.tsx               # Entry Point
│
├── server/                      # Backend Source
│   ├── config/                 # Configuration Files
│   ├── database/               # Database & Migrations
│   ├── middleware/             # Express Middlewares
│   ├── routes/                 # API Routes
│   ├── services/               # Business Logic
│   ├── scripts/                # Utility Scripts
│   └── server.js              # Server Entry Point
│
├── public/                      # Static Assets
├── docs/                        # Documentation
└── README.md                   # This File
```

---

## 🔌 API Documentation

### Authentication

#### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "phone": "09123456789"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "09123456789",
  "otp": "123456",
  "name": "نام کاربر" (optional)
}
```

#### Admin Login
```http
POST /api/auth/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Listings

#### Get All Listings
```http
GET /api/listings?page=1&limit=10&type=sale&category=1
```

#### Create Listing
```http
POST /api/listings
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "عنوان آگهی",
  "description": "توضیحات",
  "price": 1000000,
  "type": "sale",
  "category_id": 1,
  "location": "تهران"
}
```

### Payments

#### Get Featured Plans
```http
GET /api/featured-plans
```

#### Create Payment
```http
POST /api/payments/feature/card-to-card
Authorization: Bearer {token}
Content-Type: application/json

{
  "listing_id": 1,
  "duration_days": 30
}
```

**مستندات کامل API:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 📚 مستندات

### راهنماهای نصب و راه‌اندازی
- [QUICK_START.md](./QUICK_START.md) - راهنمای شروع سریع
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - راهنمای استقرار
- [SMSIR_SETUP_GUIDE.md](./SMSIR_SETUP_GUIDE.md) - راه‌اندازی SMS.ir

### راهنماهای توسعه
- [ADMIN_MANAGEMENT_SYSTEM.md](./ADMIN_MANAGEMENT_SYSTEM.md) - سیستم مدیریت ادمین
- [PAYMENT_SYSTEM_SUMMARY.md](./PAYMENT_SYSTEM_SUMMARY.md) - سیستم پرداخت
- [REVIEWS_SYSTEM_COMPLETE.md](./REVIEWS_SYSTEM_COMPLETE.md) - سیستم نظرات

### راهنماهای ویژگی‌ها
- [IRANIAN_IMPROVEMENTS_COMPLETE.md](./IRANIAN_IMPROVEMENTS_COMPLETE.md) - بهبودهای ایرانی
- [BROWSER_COMPATIBILITY_FIXED.md](./BROWSER_COMPATIBILITY_FIXED.md) - سازگاری مرورگرها
- [SECURITY_PRIVACY_IMPLEMENTED.md](./SECURITY_PRIVACY_IMPLEMENTED.md) - امنیت و حریم خصوصی

### راهنماهای تست
- [QUICK_BROWSER_TEST.md](./QUICK_BROWSER_TEST.md) - تست مرورگرها
- [TEST_REVIEWS_GUIDE.md](./TEST_REVIEWS_GUIDE.md) - تست سیستم نظرات
- [OTP_TESTING_GUIDE.md](./OTP_TESTING_GUIDE.md) - تست سیستم OTP

---

## 🤝 مشارکت

مشارکت شما در بهبود این پروژه بسیار ارزشمند است!

### مراحل مشارکت:

1. **Fork کردن پروژه**
```bash
# کلیک روی دکمه Fork در GitHub
```

2. **ایجاد Branch جدید**
```bash
git checkout -b feature/amazing-feature
```

3. **Commit کردن تغییرات**
```bash
git commit -m "Add some amazing feature"
```

4. **Push کردن به Branch**
```bash
git push origin feature/amazing-feature
```

5. **ایجاد Pull Request**
```
از طریق رابط GitHub
```

### قوانین مشارکت:
- کد تمیز و خوانا بنویسید
- از TypeScript استفاده کنید
- تست‌های لازم را اضافه کنید
- مستندات را به‌روز کنید
- از Conventional Commits استفاده کنید

---

## 🐛 گزارش باگ

برای گزارش باگ یا درخواست ویژگی جدید، لطفاً یک Issue در GitHub ایجاد کنید:

[Create New Issue](https://github.com/Hosseinyadi/gs/issues/new)

---

## 📝 تغییرات

تمام تغییرات مهم در فایل [CHANGELOG.md](./CHANGELOG.md) ثبت می‌شود.

---

## 🔐 امنیت

اگر آسیب‌پذیری امنیتی پیدا کردید، لطفاً آن را به صورت خصوصی گزارش دهید:

📧 Email: security@garazhsangin.ir

---

## 📄 لایسنس

این پروژه تحت لایسنس MIT منتشر شده است. برای اطلاعات بیشتر فایل [LICENSE](./LICENSE) را مطالعه کنید.

---

## 👥 توسعه‌دهندگان

- **Hossein Yadi** - [@Hosseinyadi](https://github.com/Hosseinyadi)

---

## 🙏 تشکر

از تمام کسانی که در توسعه این پروژه مشارکت داشته‌اند، تشکر می‌کنیم.

### تکنولوژی‌ها و کتابخانه‌های استفاده شده:
- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [Shadcn/ui](https://ui.shadcn.com/)
- و بسیاری دیگر...

---

## 📞 تماس با ما

- **Website**: https://garazhsangin.ir
- **Email**: info@garazhsangin.ir
- **GitHub**: https://github.com/Hosseinyadi/gs

---

## 🌟 ستاره بدهید!

اگر این پروژه برای شما مفید بود، لطفاً یک ⭐ به آن بدهید!

---

**ساخته شده با ❤️ در ایران**
