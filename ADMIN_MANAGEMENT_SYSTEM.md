# 👑 سیستم مدیریت سطح‌بندی شده ادمین‌ها

## 📋 فهرست مطالب
- [معرفی](#معرفی)
- [معماری سیستم](#معماری-سیستم)
- [سطوح دسترسی](#سطوح-دسترسی)
- [مجوزها](#مجوزها)
- [نصب و راه‌اندازی](#نصب-و-راهاندازی)
- [API Documentation](#api-documentation)
- [استفاده از سیستم](#استفاده-از-سیستم)
- [امنیت](#امنیت)

---

## معرفی

سیستم مدیریت سطح‌بندی شده ادمین‌ها یک راهکار کامل برای مدیریت کاربران ادمین با قابلیت‌های زیر است:

✅ **سطح‌بندی دسترسی**: 5 سطح مختلف (Super Admin, Admin, Content Manager, Moderator, Support)  
✅ **مجوزهای دقیق**: کنترل دقیق دسترسی به هر بخش  
✅ **لاگ‌گیری کامل**: ثبت تمام فعالیت‌های ادمین‌ها  
✅ **امنیت بالا**: محافظت از عملیات حساس  
✅ **رابط کاربری زیبا**: پنل مدیریت ساده و کاربرپسند  

---

## معماری سیستم

### Database Schema

#### جدول `admin_users`
```sql
CREATE TABLE admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    role_id INTEGER,
    is_super_admin BOOLEAN DEFAULT 0,
    name VARCHAR(100),
    email VARCHAR(100),
    permissions TEXT, -- JSON array
    created_by INTEGER,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (role_id) REFERENCES admin_roles(id),
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);
```

#### جدول `admin_activity_log`
```sql
CREATE TABLE admin_activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id INTEGER,
    old_data TEXT,
    new_data TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id)
);
```

---

## سطوح دسترسی

### 1. 👑 Super Admin (مدیر اصلی)
**دسترسی**: کامل به همه بخش‌ها  
**مجوزها**: `["*"]`

**قابلیت‌ها**:
- ایجاد/حذف/ویرایش ادمین‌ها
- تغییر رمز عبور ادمین‌ها
- مشاهده لاگ فعالیت‌ها
- دسترسی به آنالیتیکس مالی
- مدیریت تنظیمات سیستم
- مدیریت backup و امنیت

**محدودیت‌ها**:
- نمی‌توان مدیر اصلی را حذف کرد
- فقط مدیر اصلی می‌تواند مدیر اصلی دیگری ایجاد کند

---

### 2. 🛡️ Admin (مدیر)
**دسترسی**: کامل بجز مدیریت ادمین‌ها  
**مجوزها**:
```json
[
  "view_users",
  "manage_users",
  "block_users",
  "view_listings",
  "approve_listings",
  "delete_listings",
  "feature_listings",
  "edit_listings",
  "view_payments",
  "manage_payments",
  "approve_payments",
  "reject_payments",
  "view_analytics",
  "manage_discounts",
  "manage_categories",
  "manage_static_pages",
  "manage_notifications"
]
```

**قابلیت‌ها**:
- مدیریت کاربران (مسدود/رفع مسدودیت)
- مدیریت آگهی‌ها (تایید/رد/حذف/ویژه)
- مدیریت پرداخت‌ها
- مشاهده آمار (بدون مالی)
- مدیریت کدهای تخفیف
- مدیریت دسته‌بندی‌ها
- مدیریت صفحات استاتیک

---

### 3. 📝 Content Manager (مدیر محتوا)
**دسترسی**: مدیریت محتوا و آگهی‌ها  
**مجوزها**:
```json
[
  "view_listings",
  "approve_listings",
  "edit_listings",
  "manage_categories",
  "manage_static_pages"
]
```

**قابلیت‌ها**:
- تایید/رد آگهی‌ها
- ویرایش آگهی‌ها
- مدیریت دسته‌بندی‌ها
- مدیریت صفحات استاتیک

---

### 4. 👁️ Moderator (ناظر)
**دسترسی**: فقط تایید آگهی‌ها  
**مجوزها**:
```json
[
  "view_listings",
  "approve_listings"
]
```

**قابلیت‌ها**:
- مشاهده لیست آگهی‌ها
- تایید/رد آگهی‌ها

---

### 5. 🎧 Support (پشتیبانی)
**دسترسی**: فقط مشاهده  
**مجوزها**:
```json
[
  "view_users",
  "view_listings",
  "view_payments"
]
```

**قابلیت‌ها**:
- مشاهده اطلاعات کاربران
- مشاهده آگهی‌ها
- مشاهده پرداخت‌ها

---

## مجوزها

### لیست کامل مجوزها

#### مدیریت کاربران
- `view_users` - مشاهده کاربران
- `manage_users` - مدیریت کاربران
- `block_users` - مسدود کردن کاربران

#### مدیریت آگهی‌ها
- `view_listings` - مشاهده آگهی‌ها
- `approve_listings` - تایید آگهی‌ها
- `delete_listings` - حذف آگهی‌ها
- `feature_listings` - ویژه کردن آگهی‌ها
- `edit_listings` - ویرایش آگهی‌ها

#### مدیریت پرداخت‌ها
- `view_payments` - مشاهده پرداخت‌ها
- `manage_payments` - مدیریت پرداخت‌ها
- `approve_payments` - تایید پرداخت‌ها
- `reject_payments` - رد پرداخت‌ها

#### آنالیتیکس
- `view_analytics` - مشاهده آمار عمومی
- `view_financial_analytics` - مشاهده آمار مالی

#### مدیریت سیستم
- `manage_admins` - مدیریت ادمین‌ها
- `manage_roles` - مدیریت نقش‌ها
- `manage_settings` - مدیریت تنظیمات
- `view_logs` - مشاهده لاگ‌ها
- `manage_backups` - مدیریت backup

#### سایر
- `manage_discounts` - مدیریت کدهای تخفیف
- `manage_categories` - مدیریت دسته‌بندی‌ها
- `manage_static_pages` - مدیریت صفحات استاتیک
- `manage_notifications` - مدیریت اعلان‌ها
- `manage_security` - مدیریت امنیت

---

## نصب و راه‌اندازی

### 1. Migration دیتابیس

```bash
node server/database/migrate-admin-system.js
```

این اسکریپت:
- ستون‌های جدید را به جدول `admin_users` اضافه می‌کند
- جدول `admin_activity_log` را ایجاد می‌کند
- مجوزهای پیش‌فرض را تنظیم می‌کند

### 2. ایجاد اولین Super Admin

اگر قبلاً ادمین ندارید:

```sql
INSERT INTO admin_users (username, password_hash, role, is_super_admin, permissions) 
VALUES (
  'superadmin', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  'super_admin', 
  1, 
  '["*"]'
);
```

رمز عبور پیش‌فرض: `password`

### 3. راه‌اندازی سرور

```bash
cd server
node server.js
```

### 4. دسترسی به پنل مدیریت

```
http://localhost:8080/admin/management
```

---

## API Documentation

### Base URL
```
/api/admin/management
```

### Authentication
همه endpoint ها نیاز به توکن Super Admin دارند:
```
Authorization: Bearer {super_admin_token}
```

---

### 1. ایجاد ادمین جدید

**POST** `/create`

**Body**:
```json
{
  "username": "new_admin",
  "password": "strong_password",
  "email": "admin@example.com",
  "name": "نام کامل",
  "role": "admin"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "new_admin",
    "email": "admin@example.com",
    "name": "نام کامل",
    "role": "admin",
    "permissions": ["view_users", "manage_users", ...]
  },
  "message": "ادمین جدید با موفقیت ایجاد شد"
}
```

---

### 2. لیست ادمین‌ها

**GET** `/list`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "superadmin",
      "email": "admin@example.com",
      "name": "مدیر اصلی",
      "role": "super_admin",
      "is_super_admin": true,
      "permissions": ["*"],
      "is_active": true,
      "last_login": "2024-11-12T10:30:00Z",
      "created_at": "2024-01-01T00:00:00Z",
      "created_by_username": null
    }
  ]
}
```

---

### 3. بروزرسانی ادمین

**PUT** `/:id`

**Body**:
```json
{
  "email": "newemail@example.com",
  "name": "نام جدید",
  "role": "moderator",
  "is_active": false
}
```

**Response**:
```json
{
  "success": true,
  "message": "ادمین با موفقیت بروزرسانی شد"
}
```

---

### 4. حذف ادمین

**DELETE** `/:id`

**Response**:
```json
{
  "success": true,
  "message": "ادمین با موفقیت حذف شد"
}
```

**محدودیت‌ها**:
- نمی‌توان Super Admin را حذف کرد
- نمی‌توان خود را حذف کرد

---

### 5. تغییر رمز عبور

**POST** `/:id/change-password`

**Body**:
```json
{
  "new_password": "new_strong_password"
}
```

**Response**:
```json
{
  "success": true,
  "message": "رمز عبور با موفقیت تغییر کرد"
}
```

---

### 6. لاگ فعالیت‌ها

**GET** `/activity-log`

**Query Parameters**:
- `page` (optional): شماره صفحه (پیش‌فرض: 1)
- `limit` (optional): تعداد در هر صفحه (پیش‌فرض: 50)
- `admin_id` (optional): فیلتر بر اساس ادمین
- `action` (optional): فیلتر بر اساس عملیات
- `resource` (optional): فیلتر بر اساس منبع

**Response**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "admin_username": "superadmin",
        "action": "CREATE_ADMIN",
        "resource": "admin_users",
        "resource_id": 2,
        "old_data": null,
        "new_data": {"username": "new_admin", "role": "admin"},
        "ip_address": "127.0.0.1",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2024-11-12T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "pages": 2
    }
  }
}
```

---

### 7. مجوزها و نقش‌ها

**GET** `/permissions`

**Response**:
```json
{
  "success": true,
  "data": {
    "roles": {
      "SUPER_ADMIN": "super_admin",
      "ADMIN": "admin",
      "MODERATOR": "moderator",
      "CONTENT_MANAGER": "content_manager",
      "SUPPORT": "support"
    },
    "permissions": {
      "VIEW_USERS": "view_users",
      "MANAGE_USERS": "manage_users",
      ...
    },
    "default_permissions": {
      "super_admin": ["*"],
      "admin": ["view_users", "manage_users", ...],
      ...
    }
  }
}
```

---

## استفاده از سیستم

### در Backend

#### بررسی مجوز در Route

```javascript
const { requirePermission, PERMISSIONS } = require('../middleware/adminAuth');

router.post('/listings/:id/approve', 
  authenticateAdmin,
  requirePermission(PERMISSIONS.APPROVE_LISTINGS),
  async (req, res) => {
    // فقط ادمین‌هایی که مجوز approve_listings دارند
  }
);
```

#### بررسی Super Admin

```javascript
const { requireSuperAdmin } = require('../middleware/adminAuth');

router.get('/sensitive-data',
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    // فقط Super Admin
  }
);
```

#### لاگ‌گیری خودکار

```javascript
const { autoLog } = require('../middleware/adminAuth');

router.put('/listings/:id',
  authenticateAdmin,
  autoLog('UPDATE_LISTING', 'listings'),
  async (req, res) => {
    // عملیات به صورت خودکار لاگ می‌شود
  }
);
```

#### لاگ‌گیری دستی

```javascript
const { logActivity } = require('../middleware/adminAuth');

await logActivity(
  req.admin.id,
  'CUSTOM_ACTION',
  'resource_name',
  resourceId,
  oldData,
  newData,
  req
);
```

---

### در Frontend

#### دسترسی به پنل مدیریت

```typescript
// در App.tsx
<Route 
  path="/admin/management" 
  element={
    <ProtectedRoute requireAdmin>
      <AdminManagement />
    </ProtectedRoute>
  } 
/>
```

#### استفاده از کامپوننت

کامپوننت `AdminManagement` شامل:
- لیست ادمین‌ها با جزئیات
- فرم ایجاد ادمین جدید
- تغییر وضعیت (فعال/غیرفعال)
- تغییر رمز عبور
- حذف ادمین
- مشاهده لاگ فعالیت‌ها

---

## امنیت

### محافظت‌های پیاده‌سازی شده

#### 1. عدم حذف Super Admin
```javascript
if (admin.is_super_admin) {
  return res.status(403).json({
    error: { message: 'نمی‌توانید مدیر اصلی را حذف کنید' }
  });
}
```

#### 2. عدم خودحذفی
```javascript
if (adminId === req.admin.id) {
  return res.status(403).json({
    error: { message: 'نمی‌توانید خودتان را حذف کنید' }
  });
}
```

#### 3. محدودیت ایجاد Super Admin
```javascript
if (isSuperAdmin && !req.admin.is_super_admin) {
  return res.status(403).json({
    error: { message: 'فقط مدیر اصلی می‌تواند مدیر اصلی دیگری ایجاد کند' }
  });
}
```

#### 4. بررسی مجوزها
```javascript
if (!hasPermission(req.admin, permission)) {
  return res.status(403).json({
    error: { 
      code: 'INSUFFICIENT_PERMISSIONS',
      message: 'دسترسی کافی ندارید'
    }
  });
}
```

### لاگ‌گیری کامل

تمام فعالیت‌های ادمین‌ها ثبت می‌شود:
- ✅ چه کسی (admin_id, admin_username)
- ✅ چه کاری (action)
- ✅ کجا (resource, resource_id)
- ✅ چه زمانی (created_at)
- ✅ از کجا (ip_address, user_agent)
- ✅ تغییرات (old_data, new_data)

### Best Practices

1. **رمزهای قوی**: حداقل 6 کاراکتر (توصیه: 12+ کاراکتر)
2. **بررسی منظم لاگ‌ها**: مشاهده فعالیت‌های مشکوک
3. **محدود کردن دسترسی**: فقط مجوزهای لازم را بدهید
4. **بروزرسانی منظم**: تغییر رمز عبور به صورت دوره‌ای
5. **Backup منظم**: پشتیبان از دیتابیس و لاگ‌ها

---

## مثال‌های کاربردی

### ایجاد ادمین برای تایید آگهی‌ها

```bash
curl -X POST http://localhost:8080/api/admin/management/create \
  -H "Authorization: Bearer {super_admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "moderator1",
    "password": "secure_password",
    "name": "ناظر اول",
    "role": "moderator"
  }'
```

### مشاهده فعالیت‌های یک ادمین خاص

```bash
curl -X GET "http://localhost:8080/api/admin/management/activity-log?admin_id=2&limit=20" \
  -H "Authorization: Bearer {super_admin_token}"
```

### غیرفعال کردن یک ادمین

```bash
curl -X PUT http://localhost:8080/api/admin/management/2 \
  -H "Authorization: Bearer {super_admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false
  }'
```

---

## Troubleshooting

### مشکل: نمی‌توانم ادمین ایجاد کنم
**راه‌حل**: مطمئن شوید که با حساب Super Admin وارد شده‌اید.

### مشکل: خطای "duplicate column name"
**راه‌حل**: Migration قبلاً اجرا شده. نیازی به اجرای مجدد نیست.

### مشکل: لاگ‌ها ثبت نمی‌شوند
**راه‌حل**: بررسی کنید که جدول `admin_activity_log` ایجاد شده باشد.

### مشکل: نمی‌توانم Super Admin را حذف کنم
**راه‌حل**: این یک محافظت امنیتی است. Super Admin قابل حذف نیست.

---

## نتیجه‌گیری

سیستم مدیریت سطح‌بندی شده ادمین‌ها یک راهکار کامل و امن برای مدیریت تیم ادمین است که:

✅ امنیت بالا  
✅ انعطاف‌پذیری در تعریف نقش‌ها  
✅ لاگ‌گیری کامل  
✅ رابط کاربری ساده  
✅ مستندات کامل  

برای سوالات بیشتر یا گزارش مشکل، لطفاً با تیم توسعه تماس بگیرید.

---

**نسخه**: 1.0.0  
**تاریخ**: 12 نوامبر 2024  
**نویسنده**: Kiro AI Assistant
