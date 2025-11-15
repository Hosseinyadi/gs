# 🔧 رفع خطای "خطا در بارگذاری"

## ⚠️ مشکل
وقتی روی دکمه‌های پنل مدیریت کلیک می‌کنید، خطای "خطا در بارگذاری آگهی" یا "خطا در بارگذاری" نمایش داده می‌شود.

## 🔍 علت مشکل
توکن احراز هویت ادمین به API service پاس داده نمی‌شد، بنابراین تمام درخواست‌های API بدون Authorization header ارسال می‌شدند و سرور آنها را رد می‌کرد.

## ✅ راه‌حل (اعمال شد)

### تغییرات کد:

#### 1. فایل `src/hooks/useAuth.tsx`
```typescript
// اضافه شد:
apiService.setToken(response.data.token);
```
بعد از لاگین موفق ادمین، توکن به apiService پاس داده می‌شود.

#### 2. فایل `src/services/api.ts`
```typescript
// قبل:
this.token = localStorage.getItem('auth_token');

// بعد:
this.token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token');
```
حالا apiService هر دو توکن (ادمین و کاربر عادی) را چک می‌کند.

---

## 🚀 مراحل رفع مشکل

### مرحله 1: خروج از پنل
1. از پنل مدیریت خارج شوید (دکمه خروج)
2. یا console مرورگر را باز کنید (F12) و این کد را اجرا کنید:
```javascript
localStorage.clear();
location.reload();
```

### مرحله 2: Restart سرور و Frontend

#### Stop کردن همه:
```bash
# در PowerShell:
Get-Process -Name node | Stop-Process -Force
```

#### Start کردن سرور:
```bash
cd c:\Users\rose\Desktop\site\server
npm start
```

#### Start کردن Frontend:
```bash
cd c:\Users\rose\Desktop\site
npm run dev
```

### مرحله 3: ورود مجدد
1. به آدرس زیر بروید:
```
http://localhost:5173/admin/login
```

2. با اطلاعات زیر وارد شوید:
- نام کاربری: `hossein`
- رمز عبور: `password`

### مرحله 4: تست
حالا تمام دکمه‌های پنل باید کار کنند:
- ✅ جزئیات سریع
- ✅ مشاهده در سایت
- ✅ ویرایش
- ✅ فعال/غیرفعال
- ✅ ویژه کردن
- ✅ حذف

---

## 🔍 چک کردن مشکل

### در Console مرورگر (F12):
```javascript
// چک کردن توکن:
console.log('Admin Token:', localStorage.getItem('admin_token'));
console.log('Auth Token:', localStorage.getItem('auth_token'));

// باید یکی از آنها مقدار داشته باشد
```

### چک کردن Network:
1. F12 را بزنید
2. به تب Network بروید
3. روی یک دکمه کلیک کنید
4. درخواست API را پیدا کنید
5. Headers را چک کنید - باید `Authorization: Bearer ...` وجود داشته باشد

---

## 📊 تست API با cURL

برای تست اینکه API کار می‌کند:

```bash
# 1. لاگین و گرفتن توکن:
curl -X POST http://localhost:8080/api/auth/admin/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"hossein\",\"password\":\"password\"}"

# خروجی شامل token است، آن را کپی کنید

# 2. تست یک endpoint با توکن:
curl -X GET http://localhost:8080/api/admin/listings?page=1 ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# باید لیست آگهی‌ها را برگرداند
```

---

## 🐛 Debug با Console Log

اگر هنوز مشکل دارید، در Console مرورگر چک کنید:

### لاگ‌های موجود:
```
🔵 API Request: http://localhost:8080/api/admin/listings?page=1
🟢 API Response Status: 200 OK
📦 API Response Data: {...}
```

### اگر خطا دارید:
```
❌ API Request Error: ...
```

این به شما کمک می‌کند تا ببینید دقیقاً کجا مشکل است.

---

## ✅ چک‌لیست نهایی

- [ ] کد‌های جدید را دریافت کردید؟
- [ ] سرور را restart کردید؟
- [ ] Frontend را restart کردید؟
- [ ] localStorage را پاک کردید؟
- [ ] دوباره لاگین کردید؟
- [ ] دکمه‌ها کار می‌کنند؟

---

## 📞 مشکلات رایج

### مشکل: هنوز خطا می‌دهد
**راه‌حل:**
1. Cache مرورگر را پاک کنید (Ctrl+Shift+Del)
2. در حالت Incognito/Private تست کنید
3. مطمئن شوید سرور روی پورت 8080 در حال اجراست

### مشکل: توکن در localStorage نیست
**راه‌حل:**
1. خروج و ورود مجدد
2. چک کنید که API login موفق باشد:
```javascript
// در Console:
fetch('http://localhost:8080/api/auth/admin/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({username:'hossein',password:'password'})
}).then(r=>r.json()).then(console.log)
```

### مشکل: Authorization header ارسال نمی‌شود
**راه‌حل:**
این مشکل رفع شده است. فقط مطمئن شوید که:
1. کد جدید را دارید
2. سرور و frontend را restart کردید
3. دوباره لاگین کردید

---

## 🎉 پس از رفع مشکل

بعد از انجام مراحل بالا، پنل مدیریت باید **کاملاً کاربردی** شود:

| بخش | وضعیت |
|-----|-------|
| لاگین | ✅ |
| داشبورد | ✅ |
| آگهی‌ها | ✅ |
| کاربران | ✅ |
| ارائه‌دهندگان | ✅ |
| تخفیف‌ها | ✅ |
| گزارش‌ها | ✅ |
| بقیه تب‌ها | ✅ |

---

**تاریخ:** 1403/08/18  
**نسخه:** 1.0.1  
**وضعیت:** ✅ رفع شد
