# 🔧 رفع خطای useState

## ❌ خطا:
```
TypeError: Cannot read properties of null (reading 'useState')
at AuthProvider
```

## ✅ راه‌حل:

### 1. تغییر در useAuth.tsx
```typescript
// قبل:
import { useState, useEffect, ... } from 'react';

// بعد:
import React, { useState, useEffect, ... } from 'react';
```

### 2. پاک کردن Cache و Rebuild

#### Windows (PowerShell):
```powershell
# توقف سرور frontend (Ctrl+C)

# پاک کردن cache
Remove-Item -Recurse -Force node_modules/.vite
Remove-Item -Recurse -Force dist

# اجرای مجدد
npm run dev
```

#### Alternative (اگر مشکل ادامه داشت):
```powershell
# پاک کردن کامل node_modules
Remove-Item -Recurse -Force node_modules

# نصب مجدد
npm install

# اجرا
npm run dev
```

---

## 🚀 دستورات سریع:

### فقط پاک کردن cache Vite:
```bash
npm run dev -- --force
```

### یا:
```bash
# توقف سرور
# سپس:
rm -rf node_modules/.vite
npm run dev
```

---

## 🧪 تست بعد از Fix:

1. باز کردن: `http://localhost:5173`
2. ✅ صفحه باید بدون خطا لود بشه
3. کلیک "ورود/ثبت‌نام"
4. ✅ صفحه Auth باید کار کنه

---

## 📝 علت خطا:

این خطا معمولاً به دلایل زیر رخ می‌دهد:
1. Cache قدیمی Vite
2. مشکل در import React
3. نسخه‌های ناسازگار React
4. Build قدیمی

با اضافه کردن `import React` و پاک کردن cache، مشکل حل می‌شه.

---

## ✅ وضعیت بعد از Fix:

- ✅ useAuth.tsx با import React
- ✅ Cache پاک شده
- ✅ سرور مجدداً اجرا شده
- ✅ صفحه بدون خطا لود می‌شه
