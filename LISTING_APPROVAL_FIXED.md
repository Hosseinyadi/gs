# مشکلات مدیریت آگهی‌ها برطرف شد ✅

## مشکلات برطرف شده:

### 1. آگهی‌ها مستقیم منتشر نمی‌شوند
- **قبل**: آگهی‌ها بلافاصله پس از ثبت منتشر می‌شدند
- **حالا**: آگهی‌ها با `is_active = 0` ایجاد می‌شوند و باید توسط مدیر تایید شوند
- **پیام به کاربر**: "آگهی با موفقیت ایجاد شد و در انتظار تایید مدیریت است"

### 2. دکمه ویژه کردن آگهی درست کار می‌کند
- **قبل**: دکمه ویژه کردن به درستی کار نمی‌کرد
- **حالا**: 
  - دکمه ویژه کردن با endpoint جدید `/api/admin/listings/:id/toggle-featured` کار می‌کند
  - وضعیت ویژه بودن در جدول `listings` و `featured_listings` ذخیره می‌شود
  - مدت زمان ویژه بودن قابل تنظیم است (پیش‌فرض 30 روز)

### 3. سیستم تایید آگهی‌ها
- **Endpoint جدید برای تایید**: `POST /api/admin/listings/:id/approve`
- **Endpoint جدید برای رد**: `POST /api/admin/listings/:id/reject`
- **فیلتر آگهی‌های در انتظار**: `GET /api/admin/listings?status=pending`

## API Endpoints جدید:

### 1. تایید آگهی
```
POST /api/admin/listings/:id/approve
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "message": "آگهی تایید شد"
}
```

### 2. رد آگهی
```
POST /api/admin/listings/:id/reject
Authorization: Bearer {admin_token}
Content-Type: application/json

Body:
{
  "reason": "دلیل رد آگهی (اختیاری)"
}

Response:
{
  "success": true,
  "message": "آگهی رد شد"
}
```

### 3. تغییر وضعیت ویژه بودن
```
POST /api/admin/listings/:id/toggle-featured
Authorization: Bearer {admin_token}
Content-Type: application/json

Body:
{
  "duration_days": 30  // اختیاری، پیش‌فرض 30 روز
}

Response:
{
  "success": true,
  "message": "آگهی ویژه شد" یا "آگهی از حالت ویژه خارج شد",
  "data": {
    "is_featured": 1 یا 0
  }
}
```

### 4. دریافت آگهی‌ها با فیلتر
```
GET /api/admin/listings?status=pending&page=1&limit=20
Authorization: Bearer {admin_token}

Query Parameters:
- status: active | inactive | pending
- page: شماره صفحه
- limit: تعداد آیتم در هر صفحه
- type: rent | sale
- search: جستجو در عنوان، توضیحات و نام کاربر

Response:
{
  "success": true,
  "data": {
    "listings": [...],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 100,
      "items_per_page": 20
    },
    "pending_count": 15  // تعداد آگهی‌های در انتظار تایید
  }
}
```

### 5. داشبورد مدیریت (به‌روزرسانی شده)
```
GET /api/admin/dashboard
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "data": {
    "stats": {
      "total_listings": 100,
      "active_listings": 80,
      "pending_listings": 15,      // جدید
      "featured_listings": 10,     // جدید
      "total_users": 50,
      "total_views": 1000
    },
    "recent_listings": [...],
    "pending_listings": [...],     // جدید - لیست آگهی‌های در انتظار
    "top_categories": [...],
    "daily_stats": [...]
  }
}
```

## تغییرات در فایل‌ها:

### `server/routes/listings.js`
- آگهی‌های جدید با `is_active = 0` و `is_featured = 0` ایجاد می‌شوند
- پیام موفقیت به "آگهی با موفقیت ایجاد شد و در انتظار تایید مدیریت است" تغییر کرد

### `server/routes/admin.js`
- Endpoint تایید آگهی اضافه شد
- Endpoint رد آگهی اضافه شد
- Endpoint تغییر وضعیت ویژه بودن اضافه شد
- فیلتر `pending` به لیست آگهی‌ها اضافه شد
- داشبورد برای نمایش آگهی‌های در انتظار به‌روزرسانی شد
- لاگ‌های مدیریتی برای تمام عملیات اضافه شد

## نحوه استفاده در فرانت‌اند:

### 1. نمایش آگهی‌های در انتظار تایید
```javascript
// دریافت آگهی‌های در انتظار
const response = await fetch('/api/admin/listings?status=pending', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
const data = await response.json();
```

### 2. تایید آگهی
```javascript
const approveAd = async (listingId) => {
  const response = await fetch(`/api/admin/listings/${listingId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  return await response.json();
};
```

### 3. ویژه کردن آگهی
```javascript
const toggleFeatured = async (listingId, durationDays = 30) => {
  const response = await fetch(`/api/admin/listings/${listingId}/toggle-featured`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ duration_days: durationDays })
  });
  return await response.json();
};
```

## نکات مهم:

1. **تمام آگهی‌های جدید باید تایید شوند**: کاربران نمی‌توانند آگهی‌های خود را مستقیماً منتشر کنند
2. **دکمه ویژه کردن**: فقط برای آگهی‌های تایید شده قابل استفاده است
3. **لاگ‌های مدیریتی**: تمام عملیات مدیریتی در جدول `audit_logs` ثبت می‌شوند
4. **مدت زمان ویژه بودن**: قابل تنظیم است و در جدول `featured_listings` ذخیره می‌شود

## تست کردن:

1. یک آگهی جدید ایجاد کنید (به عنوان کاربر عادی)
2. وارد پنل مدیریت شوید
3. آگهی‌های در انتظار تایید را مشاهده کنید
4. آگهی را تایید کنید
5. آگهی را ویژه کنید
6. بررسی کنید که آگهی در لیست آگهی‌های ویژه نمایش داده می‌شود

---

**تاریخ**: 2024
**وضعیت**: ✅ تکمیل شده و آماده استفاده
