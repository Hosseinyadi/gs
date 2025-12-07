# 🔥 پاک کردن کامل Cache

## ❌ خطا:
```
ReferenceError: userListings is not defined
at UserDashboard
```

## ✅ راه‌حل: پاک کردن کامل Cache

### مرحله 1: توقف سرورها
```
در هر دو Terminal:
Ctrl + C
```

---

### مرحله 2: پاک کردن Cache Vite

```powershell
# پاک کردن cache Vite
Remove-Item -Recurse -Force node_modules\.vite

# پاک کردن dist
Remove-Item -Recurse -Force dist
```

---

### مرحله 3: پاک کردن Cache مرورگر

#### Chrome/Edge:
```
1. F12 (Developer Tools)
2. راست کلیک روی دکمه Refresh
3. انتخاب "Empty Cache and Hard Reload"
```

#### یا:
```
1. Ctrl + Shift + Delete
2. انتخاب "Cached images and files"
3. کلیک "Clear data"
```

---

### مرحله 4: پاک کردن localStorage

در Console مرورگر:
```javascript
localStorage.clear();
sessionStorage.clear();
```

---

### مرحله 5: اجرای مجدد

```bash
# Terminal 1 - Backend
cd server
node server.js

# Terminal 2 - Frontend
npm run dev -- --force
```

---

## 🚀 دستور سریع (همه در یک):

```powershell
# توقف سرورها (Ctrl+C)

# پاک کردن cache
Remove-Item -Recurse -Force node_modules\.vite
Remove-Item -Recurse -Force dist

# اجرای مجدد با force
npm run dev -- --force
```

---

## 🔍 اگر هنوز مشکل دارید:

### راه‌حل نهایی:
```powershell
# 1. توقف سرورها
Ctrl + C

# 2. پاک کردن کامل
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force node_modules\.vite
Remove-Item -Recurse -Force dist
Remove-Item -Recurse -Force .vite

# 3. نصب مجدد
npm install

# 4. اجرا
npm run dev
```

---

## ✅ بعد از پاک کردن Cache:

1. باز کردن: `http://localhost:5173`
2. F5 (Refresh)
3. ✅ صفحه باید بدون خطا لود بشه
4. تست ورود و پنل کاربری

---

## 📝 علت خطا:

این خطا به دلایل زیر رخ می‌دهد:
1. ✅ Cache قدیمی Vite
2. ✅ Cache مرورگر
3. ✅ localStorage قدیمی
4. ✅ Build قدیمی

با پاک کردن همه cache‌ها، مشکل حل می‌شه.

---

## 🎯 چک‌لیست:

- [ ] توقف سرورها
- [ ] پاک کردن `node_modules/.vite`
- [ ] پاک کردن `dist`
- [ ] پاک کردن cache مرورگر
- [ ] پاک کردن localStorage
- [ ] اجرای مجدد با `--force`
- [ ] Refresh مرورگر (F5)
- [ ] تست صفحه

---

**حالا این مراحل رو انجام بدید! 🚀**
