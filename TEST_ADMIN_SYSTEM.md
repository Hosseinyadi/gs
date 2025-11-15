# 🧪 تست سیستم مدیریت ادمین

## ✅ وضعیت سرور
- سرور در حال اجرا: **بله** ✓
- پورت: **8080** ✓
- محیط: **development** ✓

---

## 👤 اطلاعات Super Admin

### ورود به پنل
```
🌐 آدرس: http://localhost:8080/admin/login
👤 نام کاربری: admin
🔑 رمز عبور: admin123456
📧 ایمیل: admin@bilflow.com
```

### دسترسی‌ها
- ✅ مدیریت ادمین‌ها: `/admin/management`
- ✅ ویژه کردن آگهی‌ها: `/admin/listings/:id/toggle-featured`
- ✅ تایید/رد آگهی‌ها: `/admin/listings/:id/approve` و `/admin/listings/:id/reject`
- ✅ مشاهده آنالیتیکس: `/admin/analytics`
- ✅ مدیریت پرداخت‌ها: `/admin/payments`

---

## 🎯 تست‌های مهم

### 1. ورود به پنل ادمین
```bash
# Test login
curl -X POST http://localhost:8080/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123456"
  }'
```

**انتظار**: دریافت توکن JWT

---

### 2. مشاهده لیست ادمین‌ها
```bash
curl -X GET http://localhost:8080/api/admin/management/list \
  -H "Authorization: Bearer {TOKEN}"
```

**انتظار**: لیست ادمین‌ها شامل Super Admin

---

### 3. ویژه کردن دستی آگهی (مهم!)
```bash
# Toggle featured status
curl -X POST http://localhost:8080/api/admin/listings/1/toggle-featured \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "duration_days": 30
  }'
```

**انتظار**: آگهی ویژه شود و در جدول `featured_listings` ثبت شود

---

### 4. تایید آگهی
```bash
curl -X POST http://localhost:8080/api/admin/listings/1/approve \
  -H "Authorization: Bearer {TOKEN}"
```

**انتظار**: آگهی تایید شود (`is_active = 1`)

---

### 5. مشاهده لاگ فعالیت‌ها
```bash
curl -X GET http://localhost:8080/api/admin/management/activity-log \
  -H "Authorization: Bearer {TOKEN}"
```

**انتظار**: لیست تمام فعالیت‌های ادمین‌ها

---

## 🔧 مراحل تست در مرورگر

### مرحله 1: ورود
1. به `http://localhost:8080/admin/login` بروید
2. نام کاربری: `admin`
3. رمز عبور: `admin123456`
4. کلیک روی "ورود"

### مرحله 2: مدیریت ادمین‌ها
1. به `http://localhost:8080/admin/management` بروید
2. لیست ادمین‌ها را مشاهده کنید
3. یک ادمین جدید ایجاد کنید (اختیاری)

### مرحله 3: ویژه کردن آگهی (مهم!)
1. به `http://localhost:8080/admin` بروید
2. یک آگهی را انتخاب کنید
3. روی دکمه "ویژه کردن" کلیک کنید
4. مدت زمان را انتخاب کنید (مثلاً 30 روز)
5. تایید کنید

### مرحله 4: بررسی آگهی ویژه
1. به صفحه اصلی بروید
2. آگهی ویژه شده را در بالای لیست ببینید
3. علامت "ویژه" روی آگهی نمایش داده شود

---

## 🐛 مشکلات احتمالی و راه‌حل

### مشکل 1: نمی‌توانم وارد شوم
**راه‌حل**: 
```bash
# Reset password
node server/database/create-super-admin.js
```

### مشکل 2: ویژه کردن کار نمی‌کنه
**بررسی**:
1. آیا جدول `featured_listings` وجود دارد؟
2. آیا توکن معتبر است؟
3. آیا آگهی وجود دارد؟

**راه‌حل**:
```bash
# Check featured_listings table
node -e "const {db} = require('./server/config/database'); console.log(db.prepare('SELECT * FROM featured_listings').all());"
```

### مشکل 3: لاگ‌ها ثبت نمی‌شوند
**بررسی**:
```bash
# Check activity log table
node -e "const {db} = require('./server/config/database'); console.log(db.prepare('SELECT * FROM admin_activity_log ORDER BY created_at DESC LIMIT 5').all());"
```

---

## 📊 بررسی وضعیت دیتابیس

### تعداد ادمین‌ها
```bash
node -e "const {db} = require('./server/config/database'); console.log('Total admins:', db.prepare('SELECT COUNT(*) as count FROM admin_users').get());"
```

### آگهی‌های ویژه
```bash
node -e "const {db} = require('./server/config/database'); console.log('Featured listings:', db.prepare('SELECT COUNT(*) as count FROM featured_listings WHERE end_date > CURRENT_TIMESTAMP').get());"
```

### لاگ‌های اخیر
```bash
node -e "const {db} = require('./server/config/database'); console.log('Recent logs:', db.prepare('SELECT COUNT(*) as count FROM admin_activity_log').get());"
```

---

## ✅ Checklist نهایی

قبل از تحویل به کاربر، این موارد را بررسی کنید:

- [ ] سرور در حال اجراست
- [ ] Super Admin ایجاد شده
- [ ] می‌توانم وارد پنل شوم
- [ ] می‌توانم ادمین جدید ایجاد کنم
- [ ] می‌توانم آگهی را ویژه کنم (مهم!)
- [ ] آگهی ویژه در صفحه اصلی نمایش داده می‌شود
- [ ] لاگ فعالیت‌ها ثبت می‌شوند
- [ ] تایید/رد آگهی کار می‌کند
- [ ] مشاهده آنالیتیکس کار می‌کند

---

## 🎉 نتیجه

اگر همه موارد بالا کار می‌کنند، سیستم آماده استفاده است!

**نکات مهم**:
1. حتماً رمز عبور Super Admin را تغییر دهید
2. برای هر نقش، ادمین جداگانه ایجاد کنید
3. به صورت منظم لاگ‌ها را بررسی کنید
4. از backup منظم دیتابیس اطمینان حاصل کنید

---

**تاریخ تست**: 12 نوامبر 2024  
**نسخه**: 1.0.0  
**وضعیت**: ✅ آماده تست
