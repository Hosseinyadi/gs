# ⚡ رفع فوری خطا

## 🔥 مراحل سریع:

### 1️⃣ توقف سرور Frontend
```
Ctrl + C در Terminal
```

### 2️⃣ پاک کردن Cache
```powershell
Remove-Item -Recurse -Force node_modules\.vite
```

### 3️⃣ اجرای مجدد
```bash
npm run dev -- --force
```

### 4️⃣ پاک کردن Cache مرورگر
```
F12 → راست کلیک روی Refresh → Empty Cache and Hard Reload
```

---

## ✅ یا استفاده از این دستورات:

```powershell
# توقف سرور (Ctrl+C)

# پاک کردن
Remove-Item -Recurse -Force node_modules\.vite
Remove-Item -Recurse -Force dist

# اجرا
npm run dev -- --force
```

---

## 🌐 در مرورگر:

1. باز کردن Console (F12)
2. اجرای این دستور:
```javascript
localStorage.clear();
location.reload();
```

---

**بعد از این مراحل، صفحه باید کار کنه! 🎉**
