# 🚀 راهنمای سریع تست مرورگرها

## مرحله 1: اطمینان از اجرای سرورها

```bash
# اگر سرورها در حال اجرا نیستند:
npm run dev
```

یا:

```bash
# Frontend (Terminal 1)
cd site
npm run dev

# Backend (Terminal 2)
cd site/server
node server.js
```

## مرحله 2: باز کردن صفحه تست

### روش 1: استفاده از فایل HTML تست
```bash
# باز کردن در مرورگر پیش‌فرض
start test-browsers.html

# یا باز کردن در Edge
start msedge test-browsers.html

# یا باز کردن در Chrome
start chrome test-browsers.html
```

### روش 2: استفاده از برنامه اصلی
```bash
# Chrome
start chrome http://localhost:5173/auth

# Edge
start msedge http://localhost:5173/auth

# Firefox
start firefox http://localhost:5173/auth
```

## مرحله 3: تست OTP

### در صفحه تست (test-browsers.html):
1. ✅ بررسی اطلاعات مرورگر (خودکار)
2. 🏥 کلیک روی "تست اتصال به سرور"
3. 📱 کلیک روی "تست ارسال OTP"
4. 🔒 کلیک روی "تست CORS"

### در برنامه اصلی (localhost:5173/auth):
1. وارد کردن شماره موبایل: `09123456789`
2. کلیک روی "ارسال کد تایید"
3. کپی کردن کد OTP از Console سرور
4. وارد کردن کد و کلیک روی "تایید"

## مرحله 4: بررسی نتایج

### ✅ موفقیت‌آمیز:
- پیام سبز رنگ "کد تایید ارسال شد"
- کد OTP در Console سرور نمایش داده می‌شود
- بدون خطا در Console مرورگر
- بدون خطای CORS در Network Tab

### ❌ در صورت خطا:
1. باز کردن Developer Tools (F12)
2. رفتن به تب Console
3. رفتن به تب Network
4. بررسی خطاها و ارسال اسکرین‌شات

## 🔍 نکات مهم

### برای Edge:
- ✅ Cache پاک شده (Ctrl+Shift+Delete)
- ✅ Hard Refresh (Ctrl+F5)
- ✅ InPrivate Mode برای تست تمیز

### برای Safari:
- ✅ Develop > Disable Caches
- ✅ Develop > Empty Caches
- ✅ Private Browsing برای تست تمیز

### برای Firefox:
- ✅ Ctrl+Shift+Delete > Clear Cache
- ✅ Ctrl+F5 برای Hard Refresh
- ✅ Private Window برای تست تمیز

## 📊 چک‌لیست تست

- [ ] Chrome: ارسال OTP ✅
- [ ] Chrome: تایید OTP ✅
- [ ] Edge: ارسال OTP ✅
- [ ] Edge: تایید OTP ✅
- [ ] Firefox: ارسال OTP ✅
- [ ] Firefox: تایید OTP ✅
- [ ] Safari: ارسال OTP ✅ (اگر macOS دارید)
- [ ] Safari: تایید OTP ✅ (اگر macOS دارید)

## 🐛 عیب‌یابی سریع

### خطای "Failed to fetch":
```bash
# بررسی اجرای سرور
curl http://localhost:8080/health
```

### خطای CORS:
```bash
# بررسی تنظیمات CORS در server.js
# باید این خطوط را ببینید:
# mode: 'cors'
# credentials: 'include'
```

### خطای Timeout:
```bash
# بررسی اتصال اینترنت
# بررسی Firewall
# بررسی Antivirus
```

## ✨ انتظارات

### Response Time:
- ⚡ ارسال OTP: < 500ms
- ⚡ تایید OTP: < 300ms
- ⚡ Health Check: < 100ms

### Success Rate:
- ✅ Chrome: 99%+
- ✅ Edge: 99%+
- ✅ Firefox: 99%+
- ✅ Safari: 99%+

## 📞 در صورت مشکل

1. بررسی Console مرورگر (F12)
2. بررسی Network Tab
3. بررسی Server Logs
4. پاک کردن Cache و Cookie
5. تست در Incognito/Private Mode
6. Restart سرورها

---

**همه چیز آماده است! شروع کنید 🚀**
