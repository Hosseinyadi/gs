# 🔒 سیستم امنیتی و آپلود فایل تکمیل شد

## ✅ تغییرات اعمال شده:

### 1. سیستم اسکن امنیتی فایل
**فایل:** `server/services/fileSecurityService.js`

**قابلیت‌ها:**
- ✅ بررسی Magic Bytes (شناسایی نوع واقعی فایل)
- ✅ بررسی پسوندهای خطرناک (exe, bat, php, js, ...)
- ✅ اسکن محتوای فایل برای الگوهای مخرب
- ✅ جلوگیری از Double Extension (file.jpg.exe)
- ✅ محاسبه هش SHA256 برای هر فایل
- ✅ بررسی حجم فایل (حداکثر 10MB)
- ✅ حذف Null Bytes و کاراکترهای کنترلی

**الگوهای خطرناک شناسایی شده:**
```javascript
- <script>, <iframe>, <object>, <embed>
- javascript:, vbscript:
- <?php, <%
- eval(), exec(), system()
- SQL Injection patterns
```

---

### 2. سیستم واترمارک
**فایل:** `server/services/watermarkService.js`

**قابلیت‌ها:**
- ✅ اضافه کردن متن "garagesangin.ir" به گوشه تصاویر
- ✅ پشتیبانی از فرمت‌های مختلف (JPG, PNG, GIF, WebP)
- ✅ تنظیم خودکار اندازه واترمارک بر اساس سایز تصویر
- ✅ روش جایگزین برای سیستم‌های بدون پکیج Sharp

---

### 3. روت آپلود امن
**فایل:** `server/routes/upload.js`

**Endpoints:**

#### آپلود تک تصویر
```
POST /api/upload/image
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- image: File (حداکثر 10MB)

Response:
{
  "success": true,
  "data": {
    "url": "/uploads/images/1234567890-abc.jpg",
    "filename": "1234567890-abc.jpg",
    "securityScan": {
      "safe": true,
      "hash": "sha256..."
    },
    "watermark": true
  }
}
```

#### آپلود چند تصویر
```
POST /api/upload/images
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- images: File[] (حداکثر 10 فایل)

Response:
{
  "success": true,
  "data": {
    "uploaded": [...],
    "errors": [],
    "total": 5,
    "successful": 5,
    "failed": 0
  }
}
```

#### اسکن امنیتی فایل
```
POST /api/upload/scan
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "safe": true,
    "threats": [],
    "fileInfo": {...}
  }
}
```

---

### 4. Middleware امنیتی جامع
**فایل:** `server/middleware/securityMiddleware.js`

**محافظت در برابر:**

#### XSS (Cross-Site Scripting)
```javascript
- حذف تگ‌های <script>, <iframe>, <object>
- حذف event handlers (onclick, onerror, onload)
- حذف javascript: و vbscript:
- پاکسازی تمام ورودی‌ها
```

#### SQL Injection
```javascript
- شناسایی SELECT, INSERT, DELETE, DROP
- شناسایی UNION, OR 1=1, AND 1=1
- شناسایی کامنت‌های SQL (--, /*, */)
- شناسایی SLEEP, BENCHMARK
```

#### Path Traversal
```javascript
- شناسایی ../
- شناسایی ..\\
- شناسایی URL encoded versions
```

#### Command Injection
```javascript
- شناسایی ; | ` $ && ||
- شناسایی $()
- شناسایی backticks
```

#### CSRF Protection
```javascript
- بررسی Origin header
- بررسی Referer header
- محافظت در برابر Cross-Origin requests
```

---

### 5. مشکل آگهی‌ها حل شد
**تغییرات در:** `server/routes/listings.js`

**مشکلات حل شده:**
- ✅ حذف وابستگی به جدول ad_types که وجود نداشت
- ✅ اضافه کردن پارس JSON برای فیلدهای images, tags, specifications
- ✅ تبدیل صحیح boolean برای is_active و is_featured
- ✅ بهبود مدیریت خطا

---

## 🚀 نحوه استفاده:

### 1. آپلود تصویر در فرانت‌اند:
```typescript
const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/upload/image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const result = await response.json();
  return result.data.url;
};
```

### 2. آپلود چند تصویر:
```typescript
const uploadImages = async (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });

  const response = await fetch('/api/upload/images', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return await response.json();
};
```

---

## 📊 آمار امنیتی:

**محافظت‌های فعال:**
- ✅ 15+ الگوی XSS
- ✅ 7+ الگوی SQL Injection
- ✅ 6+ الگوی Path Traversal
- ✅ 5+ الگوی Command Injection
- ✅ 20+ پسوند خطرناک
- ✅ 10+ Magic Byte signature

**فایل‌های محافظت شده:**
- ✅ تمام ورودی‌های body
- ✅ تمام پارامترهای query
- ✅ تمام پارامترهای URL
- ✅ Headers خاص (User-Agent, Referer, X-Forwarded-For)

---

## 🔧 تنظیمات:

### فعال/غیرفعال کردن بلاک خودکار:
```javascript
// در server/server.js
app.use(securityMiddleware({
  blockOnThreat: false,  // true = بلاک خودکار
  logThreats: true,      // لاگ تهدیدات
  sanitize: true,        // پاکسازی ورودی
  allowHtml: false       // اجازه HTML
}));
```

### تغییر حداکثر حجم فایل:
```javascript
// در server/routes/upload.js
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10
  }
});
```

---

## 🌐 سرورها آماده:

- **فرانت‌اند:** http://localhost:5173/
- **بک‌اند:** http://localhost:8080/
- **Health Check:** http://localhost:8080/health

---

## ✅ تست کنید:

1. بروید به http://localhost:5173/
2. وارد شوید یا ثبت‌نام کنید
3. آگهی جدید ثبت کنید
4. تصویر آپلود کنید
5. واترمارک را در گوشه تصویر ببینید
6. آگهی‌ها را مشاهده کنید

---

**تاریخ:** 2 دسامبر 2025
**نسخه:** 2.3 - Security Enhanced
