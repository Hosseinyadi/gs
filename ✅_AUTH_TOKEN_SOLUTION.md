# ✅ راه‌حل مشکل "Access denied. No token provided"

## 🔴 مشکل:
```
Error: Access denied. No token provided.
```

این خطا یعنی شما لاگین نیستید یا token شما منقضی شده است.

## 🎯 راه‌حل سریع:

### مرحله 1: چک کردن وضعیت لاگین
فایل `check-auth-status.html` را در مرورگر باز کنید:
```
file:///path/to/check-auth-status.html
```

این فایل به شما می‌گوید:
- ✅ لاگین هستید یا نه
- ✅ Token وجود دارد یا نه
- ✅ چه کاری باید انجام دهید

### مرحله 2: لاگین کنید
اگر لاگین نیستید:

1. به صفحه لاگین بروید:
   ```
   http://localhost:5173/auth
   ```

2. شماره موبایل خود را وارد کنید

3. کد OTP را وارد کنید
   - **نکته:** در حالت توسعه، کد OTP همیشه `123456` است

4. بعد از لاگین موفق، به dashboard هدایت می‌شوید

### مرحله 3: ثبت آگهی
حالا می‌توانید آگهی ثبت کنید:
```
http://localhost:5173/post-ad
```

## 📋 چک‌لیست کامل:

- [ ] سرور backend در حال اجرا است (port 8080)
- [ ] سرور frontend در حال اجرا است (port 5173)
- [ ] شما لاگین کرده‌اید
- [ ] Token در localStorage وجود دارد
- [ ] دسته‌بندی‌ها لود می‌شوند
- [ ] فرم را پر کرده‌اید
- [ ] دکمه ثبت را زده‌اید

## 🔍 عیب‌یابی:

### خطا 1: "Access denied. No token provided"
**علت:** لاگین نیستید

**راه‌حل:**
1. `check-auth-status.html` را باز کنید
2. اگر نوشت "شما لاگین نیستید" → لاگین کنید
3. اگر نوشت "شما لاگین هستید" → صفحه را رفرش کنید

### خطا 2: Token منقضی شده
**علت:** Token قدیمی است

**راه‌حل:**
1. Logout کنید
2. دوباره Login کنید
3. آگهی را ثبت کنید

### خطا 3: دسته‌بندی‌ها لود نمی‌شوند
**علت:** سرور مشکل دارد

**راه‌حل:**
```bash
restart-servers.bat
```

## 🧪 تست کامل:

### تست 1: چک کردن Token
```javascript
// در Console مرورگر:
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));
```

**نتیجه مورد انتظار:**
```
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
User: {"id":1,"phone":"09123456789",...}
```

### تست 2: چک کردن API
```javascript
// در Console مرورگر:
fetch('http://localhost:8080/api/listings/categories/all')
  .then(r => r.json())
  .then(d => console.log('Categories:', d));
```

**نتیجه مورد انتظار:**
```json
{
  "success": true,
  "data": {
    "categories": [...]
  }
}
```

### تست 3: چک کردن Authentication
```javascript
// در Console مرورگر:
const token = localStorage.getItem('token');
fetch('http://localhost:8080/api/listings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'تست',
    description: 'توضیحات تست',
    price: 1000000,
    type: 'sale',
    category_id: 1,
    location: 'تهران'
  })
})
.then(r => r.json())
.then(d => console.log('Result:', d));
```

## 💡 نکات مهم:

### 1. کد OTP در حالت توسعه:
```
کد همیشه: 123456
```

### 2. Token در localStorage:
```javascript
// ذخیره می‌شود در:
localStorage.setItem('token', '...')
localStorage.setItem('user', '...')
```

### 3. مدت اعتبار Token:
```
Token معمولاً 7 روز اعتبار دارد
بعد از آن باید دوباره لاگین کنید
```

## 🚀 فلوی کامل ثبت آگهی:

```
1. لاگین کنید
   ↓
2. به صفحه ثبت آگهی بروید
   ↓
3. نوع آگهی را انتخاب کنید (اجاره/فروش)
   ↓
4. فرم را پر کنید:
   - عنوان ✅
   - دسته‌بندی ✅
   - توضیحات ✅
   - قیمت ✅
   - استان ✅
   - تگ‌ها (اختیاری)
   ↓
5. دکمه "ثبت نهایی آگهی" را بزنید
   ↓
6. آگهی ثبت می‌شود و به dashboard هدایت می‌شوید
```

## 📱 دستورات مفید:

### چک کردن سرورها:
```bash
# Windows:
netstat -ano | findstr :8080
netstat -ano | findstr :5173
```

### ری‌استارت سرورها:
```bash
restart-servers.bat
```

### پاک کردن Cache:
```
Ctrl + Shift + Delete
یا
F12 → Application → Clear storage
```

## 🎯 خلاصه:

1. ✅ `check-auth-status.html` را باز کنید
2. ✅ اگر لاگین نیستید → لاگین کنید
3. ✅ اگر لاگین هستید → صفحه را رفرش کنید
4. ✅ آگهی را ثبت کنید

## 📞 اگر هنوز مشکل دارید:

1. Screenshot از `check-auth-status.html` بگیرید
2. Screenshot از Console (F12) بگیرید
3. Screenshot از Network تب بگیرید
4. به من نشان دهید

موفق باشید! 🚀
