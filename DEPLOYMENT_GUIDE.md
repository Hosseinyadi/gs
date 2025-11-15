# 🚀 راهنمای راه‌اندازی پروژه گاراژ سنگین

## پیش‌نیازها

- Node.js (نسخه 16 یا بالاتر)
- npm یا yarn
- Git

## مراحل راه‌اندازی

### 1. دانلود پروژه

```bash
git clone <repository-url>
cd site
```

### 2. نصب وابستگی‌ها

#### Backend
```bash
cd server
npm install
cd ..
```

#### Frontend
```bash
npm install
```

### 3. پیکربندی متغیرهای محیطی

یک فایل `.env` در ریشه پروژه ایجاد کنید:

```env
# Frontend
VITE_API_URL=http://localhost:8080/api

# Backend
PORT=8080
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Payment Gateway - ZarinPal
ZARINPAL_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ZARINPAL_SANDBOX=true

# Payment Gateway - PayPing (اختیاری)
# PAYPING_TOKEN=xxxxxxxxxxxxxxxxxxxxx

# Payment Configuration
PAYMENT_CALLBACK_URL=http://localhost:8080/api/payments/verify
BACKEND_URL=http://localhost:8080

# Rate Limiting
RATE_LIMIT_MAX=100
OTP_RATE_LIMIT_MAX=3
LOGIN_RATE_LIMIT_MAX=50

# Body Size Limit
BODY_LIMIT=10mb

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 4. راه‌اندازی Backend

```bash
cd server
node server.js
```

یا با nodemon برای development:

```bash
npm run dev
```

سرور روی پورت 8080 اجرا می‌شود:
- Health Check: http://localhost:8080/health
- API Base: http://localhost:8080/api

### 5. راه‌اندازی Frontend

در ترمینال جدید:

```bash
npm run dev
```

فرانت‌اند روی پورت 5173 اجرا می‌شود:
- URL: http://localhost:5173

### 6. تست API

#### تست Health Check
```bash
curl http://localhost:8080/health
```

#### تست دریافت پلن‌های ویژه‌سازی
```bash
curl http://localhost:8080/api/featured-plans
```

#### تست با PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/featured-plans" -Method Get | ConvertTo-Json -Depth 5
```

## 📁 ساختار پروژه

```
site/
├── server/                          # Backend (Node.js + Express)
│   ├── config/                      # تنظیمات
│   │   ├── database.js             # اتصال به SQLite
│   │   └── payment.js              # تنظیمات پرداخت
│   ├── database/                    # پایگاه داده
│   │   ├── bilflow.db              # فایل SQLite
│   │   └── schema.sql              # Schema جداول
│   ├── middleware/                  # Middlewares
│   │   └── auth.js                 # احراز هویت
│   ├── routes/                      # API Routes
│   │   ├── auth.js
│   │   ├── listings.js
│   │   ├── featuredPlans.js        # پلن‌های ویژه
│   │   ├── paymentsNew.js          # پرداخت‌ها
│   │   └── ...
│   ├── services/                    # Business Logic
│   │   ├── featuredPlans.js        # سرویس پلن‌ها
│   │   ├── payment.js              # سرویس پرداخت
│   │   ├── paymentGateway.js       # درگاه‌های پرداخت
│   │   └── notification.js         # نوتیفیکیشن
│   ├── tests/                       # تست‌ها
│   ├── uploads/                     # فایل‌های آپلود شده
│   │   └── receipts/               # رسیدهای پرداخت
│   ├── package.json
│   └── server.js                    # Entry point
│
├── src/                             # Frontend (React + Vite)
│   ├── components/                  # کامپوننت‌ها
│   ├── pages/                       # صفحات
│   ├── lib/                         # کتابخانه‌ها
│   └── ...
│
├── .env                             # متغیرهای محیطی
├── .env.example                     # نمونه تنظیمات
├── package.json                     # Frontend dependencies
├── PAYMENT_SYSTEM_SUMMARY.md        # خلاصه سیستم پرداخت
└── DEPLOYMENT_GUIDE.md              # این فایل
```

## 🔧 دستورات مفید

### Backend
```bash
# اجرای سرور
cd server
node server.js

# اجرای با nodemon (auto-reload)
npm run dev

# اجرای تست‌ها
npm test
```

### Frontend
```bash
# اجرای dev server
npm run dev

# Build برای production
npm run build

# Preview build
npm run preview
```

## 🌐 API Endpoints

### Featured Plans (پلن‌های ویژه‌سازی)
```
GET    /api/featured-plans              - لیست پلن‌ها
GET    /api/featured-plans/active       - پلن‌های فعال
GET    /api/featured-plans/:id          - جزئیات پلن
GET    /api/featured-plans/:id/price    - محاسبه قیمت
POST   /api/admin/featured-plans        - ایجاد پلن (Admin)
PUT    /api/admin/featured-plans/:id    - ویرایش پلن (Admin)
DELETE /api/admin/featured-plans/:id    - حذف پلن (Admin)
GET    /api/admin/featured-plans/stats  - آمار (Admin)
```

### Payments (پرداخت‌ها)
```
POST   /api/payments/initiate           - شروع پرداخت
GET    /api/payments/verify             - تایید پرداخت (Callback)
POST   /api/payments/card-transfer      - پرداخت کارت به کارت
GET    /api/payments/my-payments        - تاریخچه کاربر
GET    /api/payments/:id                - جزئیات پرداخت
GET    /api/admin/payments              - لیست تمام پرداخت‌ها (Admin)
GET    /api/admin/payments/pending      - پرداخت‌های در انتظار (Admin)
POST   /api/admin/payments/:id/approve  - تایید پرداخت (Admin)
POST   /api/admin/payments/:id/reject   - رد پرداخت (Admin)
GET    /api/admin/payments/stats        - آمار مالی (Admin)
```

## 🔐 احراز هویت

### کاربر عادی
```javascript
// Header
Authorization: Bearer <user-token>
```

### مدیر
```javascript
// Header
Authorization: Bearer <admin-token>
```

## 💳 پیکربندی درگاه پرداخت

### ZarinPal

1. ثبت‌نام در https://www.zarinpal.com
2. دریافت Merchant ID
3. افزودن به `.env`:
```env
ZARINPAL_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ZARINPAL_SANDBOX=true  # برای تست
```

### PayPing

1. ثبت‌نام در https://www.payping.ir
2. دریافت Token
3. افزودن به `.env`:
```env
PAYPING_TOKEN=xxxxxxxxxxxxxxxxxxxxx
```

## 🐛 عیب‌یابی

### مشکل: سرور بالا نمی‌آید

**راه‌حل:**
```bash
# بررسی پورت 8080
netstat -ano | findstr :8080

# Kill process
taskkill /PID <process-id> /F

# یا استفاده از پورت دیگر
PORT=3000 node server.js
```

### مشکل: خطای دیتابیس

**راه‌حل:**
```bash
# حذف دیتابیس و ایجاد مجدد
cd server/database
del bilflow.db
cd ..
node server.js
```

### مشکل: خطای CORS

**راه‌حل:**
بررسی `ALLOWED_ORIGINS` در `.env`:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## 📊 مانیتورینگ

### لاگ‌های سرور
```bash
# Backend logs
cd server
node server.js

# با PM2 (production)
pm2 start server.js --name garazh-sangin
pm2 logs garazh-sangin
```

### بررسی دیتابیس
```bash
# نصب SQLite CLI
# Windows: https://www.sqlite.org/download.html

# اتصال به دیتابیس
sqlite3 server/database/bilflow.db

# دستورات مفید
.tables                    # لیست جداول
.schema featured_plans     # ساختار جدول
SELECT * FROM featured_plans;
.quit
```

## 🚀 Production Deployment

### 1. Build Frontend
```bash
npm run build
```

### 2. تنظیمات Production
```env
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
ZARINPAL_SANDBOX=false
```

### 3. استفاده از PM2
```bash
npm install -g pm2

# Start backend
cd server
pm2 start server.js --name garazh-sangin-backend

# Start frontend (با serve)
npm install -g serve
pm2 start "serve -s dist -l 5173" --name garazh-sangin-frontend

# Save PM2 config
pm2 save
pm2 startup
```

## 📞 پشتیبانی

در صورت بروز مشکل:
1. بررسی لاگ‌های سرور
2. بررسی فایل `.env`
3. بررسی دیتابیس
4. مراجعه به `PAYMENT_SYSTEM_SUMMARY.md`

---

**موفق باشید! 🎉**
