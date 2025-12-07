# 🔧 حل مشکل خطای 404 در ثبت آگهی

## 🐛 مشکل:
وقتی کاربر می‌خواد آگهی ثبت کنه، خطای 404 نمایش داده می‌شه.

## 🔍 بررسی:

### 1. چک کردن Route Backend:
```bash
# تست API endpoint
curl http://localhost:8080/api/listings
```

### 2. چک کردن Authentication:
```javascript
// F12 → Console
localStorage.getItem('auth_token')
// باید توکن نمایش داده بشه
```

### 3. چک کردن Network Tab:
- F12 → Network
- فیلتر: XHR
- ثبت آگهی رو امتحان کن
- ببین کدوم request خطا می‌ده

## 🔧 راه‌حل‌های احتمالی:

### راه‌حل 1: چک کردن Token
```javascript
// F12 → Console
const token = localStorage.getItem('auth_token');
console.log('Token:', token);

// اگر null بود، دوباره login کن
```

### راه‌حل 2: چک کردن Backend
```bash
# در ترمینال server
# ببین آیا request می‌رسه یا نه
```

### راه‌حل 3: Clear Cache
```javascript
// F12 → Console
localStorage.clear();
sessionStorage.clear();
location.reload();
// دوباره login کن
```

## 📋 اطلاعات مورد نیاز برای Debug:

لطفاً این اطلاعات رو بفرست:

### 1. از Console (F12):
```javascript
// اجرا کن و نتیجه رو بفرست:
console.log('Token:', localStorage.getItem('auth_token'));
console.log('User:', localStorage.getItem('user'));
```

### 2. از Network Tab (F12):
- Request URL چیه؟
- Request Method چیه؟
- Status Code چیه؟
- Response چیه؟

### 3. Screenshot:
- از Console errors
- از Network tab
- از صفحه خطا

## 🚀 تست سریع:

### مرحله 1: چک کردن Login
```
1. برو به: http://localhost:5173/auth
2. Login کن
3. F12 → Console
4. بزن: localStorage.getItem('auth_token')
5. باید توکن نمایش داده بشه
```

### مرحله 2: چک کردن API
```
1. F12 → Network
2. برو به ثبت آگهی
3. فرم رو پر کن
4. Submit کن
5. ببین چه request هایی ارسال می‌شه
```

### مرحله 3: بفرست اطلاعات
```
- Screenshot از Console
- Screenshot از Network
- متن خطا
```

**با این اطلاعات می‌تونم دقیقاً مشکل رو پیدا کنم و حلش کنم! 🔧**