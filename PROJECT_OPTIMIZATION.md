# 🚀 بهینه‌سازی و نظم‌دهی پروژه گاراژ سنگین

## 📁 ساختار پوشه‌های بهینه شده:

```
site/
├── 📂 server/                    # Backend
│   ├── 📂 config/               # تنظیمات
│   │   ├── database.js         # تنظیمات دیتابیس
│   │   └── constants.js        # ثابت‌ها
│   ├── 📂 database/             # دیتابیس
│   │   ├── bilflow.db          # فایل SQLite
│   │   ├── schema.sql          # Schema
│   │   └── migrate-*.js        # Migration ها
│   ├── 📂 middleware/           # Middleware ها
│   │   ├── auth.js             # احراز هویت
│   │   ├── adminAuth.js        # احراز هویت ادمین
│   │   ├── rateLimiter.js      # محدودیت درخواست
│   │   └── errorHandler.js     # مدیریت خطا
│   ├── 📂 routes/               # Route ها
│   │   ├── auth.js             # مسیرهای احراز هویت
│   │   ├── listings.js         # مسیرهای آگهی
│   │   ├── admin.js            # مسیرهای ادمین
│   │   ├── categories.js       # دسته‌بندی‌ها
│   │   └── favorites.js        # علاقه‌مندی‌ها
│   ├── 📂 services/             # سرویس‌ها
│   │   ├── smsService.js       # سرویس SMS
│   │   ├── jwtService.js       # سرویس JWT
│   │   └── uploadService.js    # سرویس آپلود
│   ├── 📂 scripts/              # اسکریپت‌های کمکی
│   │   ├── create-test-admin.js
│   │   └── clean-old-otps.js
│   ├── 📂 uploads/              # فایل‌های آپلود شده
│   └── server.js                # فایل اصلی سرور
│
├── 📂 src/                       # Frontend
│   ├── 📂 components/           # کامپوننت‌ها
│   │   ├── 📂 admin/           # کامپوننت‌های ادمین
│   │   ├── 📂 ui/              # کامپوننت‌های UI (Shadcn)
│   │   ├── 📂 layout/          # Layout ها
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navbar.tsx
│   │   └── 📂 common/          # کامپوننت‌های مشترک
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   ├── 📂 pages/                # صفحات
│   │   ├── Home.tsx
│   │   ├── Auth.tsx
│   │   ├── PostAd.tsx
│   │   ├── UserDashboard.tsx
│   │   └── AdminDashboard.tsx
│   ├── 📂 hooks/                # Custom Hooks
│   │   ├── useAuth.tsx
│   │   └── useDebounce.ts
│   ├── 📂 services/             # سرویس‌های API
│   │   ├── api.ts
│   │   └── admin-api.ts
│   ├── 📂 lib/                  # کتابخانه‌ها و Utilities
│   │   └── utils.ts
│   ├── 📂 types/                # TypeScript Types
│   │   └── index.ts
│   ├── App.tsx                  # کامپوننت اصلی
│   └── main.tsx                 # Entry Point
│
├── 📂 public/                    # فایل‌های عمومی
│   └── assets/
│
├── 📄 .env                       # متغیرهای محیطی
├── 📄 package.json
├── 📄 vite.config.ts
└── 📄 README.md
```

---

## 🔐 امنیت و بهینه‌سازی:

### 1. تنظیمات امنیتی `.env`:

```env
# Backend
PORT=8080
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Database
DB_PATH=./server/database/bilflow.db

# SMS
SMS_IR_API_KEY=your-sms-ir-api-key
OTP_MOCK=false

# Security
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
BCRYPT_ROUNDS=10

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com

# Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
```

### 2. Cookie Settings (امن):

```javascript
// در server.js
const cookieOptions = {
  httpOnly: true,      // جلوگیری از دسترسی JavaScript
  secure: process.env.NODE_ENV === 'production', // فقط HTTPS
  sameSite: 'strict',  // محافظت در برابر CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 روز
};
```

### 3. Rate Limiting:

```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقیقه
  max: 100, // حداکثر 100 درخواست
  message: 'تعداد درخواست‌های شما بیش از حد مجاز است'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // فقط 5 تلاش ورود
  message: 'تعداد تلاش‌های ورود بیش از حد است'
});

module.exports = { limiter, authLimiter };
```

### 4. Helmet (امنیت Headers):

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

### 5. CORS امن:

```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

## ⚡ بهینه‌سازی سرعت:

### 1. Compression:

```javascript
const compression = require('compression');
app.use(compression());
```

### 2. Caching:

```javascript
// Cache static files
app.use(express.static('public', {
  maxAge: '1d',
  etag: true
}));
```

### 3. Database Indexing:

```sql
-- در schema.sql
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_user ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(is_active);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
```

### 4. Frontend Optimization:

```typescript
// Lazy Loading
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));

// Code Splitting
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/admin" element={<AdminDashboard />} />
  </Routes>
</Suspense>
```

### 5. Image Optimization:

```javascript
// Sharp برای بهینه‌سازی تصاویر
const sharp = require('sharp');

const optimizeImage = async (buffer) => {
  return await sharp(buffer)
    .resize(1200, 800, { fit: 'inside' })
    .webp({ quality: 80 })
    .toBuffer();
};
```

---

## 📊 Monitoring و Logging:

### 1. Winston Logger:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### 2. Error Tracking:

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'خطای سرور' 
      : err.message
  });
};
```

---

## 🗄️ Database Optimization:

### 1. Connection Pooling:

```javascript
// استفاده از better-sqlite3
const Database = require('better-sqlite3');
const db = new Database('bilflow.db', {
  verbose: console.log,
  fileMustExist: false
});

// PRAGMA optimization
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 10000');
db.pragma('temp_store = MEMORY');
```

### 2. Query Optimization:

```javascript
// استفاده از Prepared Statements
const stmt = db.prepare('SELECT * FROM listings WHERE category_id = ?');
const listings = stmt.all(categoryId);
```

### 3. Backup Strategy:

```javascript
const backup = require('better-sqlite3-backup');

// Backup روزانه
const backupDb = () => {
  const date = new Date().toISOString().split('T')[0];
  backup({
    source: 'bilflow.db',
    destination: `backups/bilflow-${date}.db`
  });
};
```

---

## 🔄 Git Ignore بهینه:

```gitignore
# Dependencies
node_modules/
package-lock.json

# Environment
.env
.env.local
.env.production

# Database
*.db
*.db-shm
*.db-wal
backups/

# Logs
logs/
*.log
npm-debug.log*

# Build
dist/
build/
.vite/

# Uploads
uploads/
public/uploads/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Temporary
tmp/
temp/
*.tmp
```

---

## 📦 Package.json Scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "server": "node server/server.js",
    "server:dev": "nodemon server/server.js",
    "start": "concurrently \"npm run server\" \"npm run dev\"",
    "migrate": "node server/database/migrate-admin.js",
    "backup": "node server/scripts/backup-db.js",
    "clean": "node server/scripts/clean-old-otps.js",
    "test": "vitest",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

---

## 🚀 Performance Checklist:

### Backend:
- ✅ Compression فعال
- ✅ Rate Limiting پیاده‌سازی شده
- ✅ Database Indexing
- ✅ Query Optimization
- ✅ Caching Strategy
- ✅ Error Handling مناسب
- ✅ Logging System

### Frontend:
- ✅ Code Splitting
- ✅ Lazy Loading
- ✅ Image Optimization
- ✅ Minification
- ✅ Tree Shaking
- ✅ Bundle Size Optimization

### Security:
- ✅ HTTPS (در production)
- ✅ Helmet Headers
- ✅ CORS محدود
- ✅ XSS Protection
- ✅ CSRF Protection
- ✅ SQL Injection Prevention
- ✅ Rate Limiting
- ✅ Input Validation
- ✅ Secure Cookies
- ✅ JWT با Expiration

### Database:
- ✅ WAL Mode
- ✅ Indexes
- ✅ Prepared Statements
- ✅ Regular Backups
- ✅ Connection Pooling

---

## 📈 Benchmarks هدف:

```
⚡ Time to First Byte (TTFB): < 200ms
⚡ First Contentful Paint (FCP): < 1.5s
⚡ Largest Contentful Paint (LCP): < 2.5s
⚡ Time to Interactive (TTI): < 3.5s
⚡ Cumulative Layout Shift (CLS): < 0.1
⚡ First Input Delay (FID): < 100ms

📦 Bundle Size:
  - Main JS: < 200KB (gzipped)
  - Main CSS: < 50KB (gzipped)
  - Total: < 500KB (initial load)

🗄️ Database:
  - Query Time: < 50ms (average)
  - Connection Time: < 10ms
  - Backup Time: < 5s (for 100MB)

🔐 Security Score: A+ (SSL Labs)
```

---

## 🎯 توصیه‌های نهایی:

1. **استفاده از CDN** برای فایل‌های استاتیک
2. **Redis** برای Session و Caching
3. **PM2** برای مدیریت Process
4. **Nginx** به عنوان Reverse Proxy
5. **Let's Encrypt** برای SSL رایگان
6. **Monitoring** با Prometheus + Grafana
7. **Backup خودکار** روزانه
8. **Load Testing** با Artillery یا k6
9. **Security Audit** منظم
10. **Code Review** قبل از Deploy

---

**✅ با اعمال این بهینه‌سازی‌ها، پروژه شما:**
- 🚀 سریع‌تر
- 🔒 امن‌تر
- 📊 قابل نظارت
- 🔧 قابل نگهداری
- 📈 مقیاس‌پذیر

خواهد بود!
