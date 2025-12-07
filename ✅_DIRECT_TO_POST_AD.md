# ✅ تغییر لینک به /post-ad

## 🎯 تغییرات انجام شده:

### قبل:
```
دکمه "ثبت آگهی" → /post-ad-type → انتخاب نوع → /post-ad
```

### بعد:
```
دکمه "ثبت آگهی" → /post-ad (مستقیم)
```

## 📁 فایل‌های تغییر یافته:

### 1. src/components/HeroSection.tsx
```typescript
// قبل:
<Link to="/post-ad-type">

// بعد:
<Link to="/post-ad">
```

### 2. src/components/Header.tsx
```typescript
// همه لینک‌های post-ad-type تغییر کردن به post-ad
// در Desktop menu ✅
// در Mobile menu ✅
```

## 🎯 حالا Flow:

### کاربر Login نکرده:
```
کلیک "ثبت آگهی"
  ↓
Navigate به /post-ad
  ↓
ProtectedRoute چک می‌کنه
  ↓
Redirect به /auth
  ↓
Login موفق
  ↓
Redirect به /post-ad
  ↓
فرم ثبت آگهی باز می‌شه
```

### کاربر Login کرده:
```
کلیک "ثبت آگهی"
  ↓
Navigate به /post-ad
  ↓
ProtectedRoute چک می‌کنه (OK)
  ↓
فرم ثبت آگهی باز می‌شه
```

## ✅ مزایا:

1. **یک مرحله کمتر** - کاربر مستقیماً به فرم می‌رسه
2. **URL ساده‌تر** - `/post-ad` به جای `/post-ad-type`
3. **سریع‌تر** - بدون صفحه میانی

## 🧪 تست کن:

### Hard Refresh:
```
Ctrl + Shift + R
```

### تست:
```
1. کلیک "ثبت آگهی رایگان" در صفحه اصلی
2. ✅ باید مستقیماً به /post-ad بره
3. اگر login نیستی → /auth
4. Login کن
5. ✅ برمی‌گرده به /post-ad
```

## 📝 نکته:

اگر می‌خوای کاربر نوع آگهی رو انتخاب کنه، می‌تونی:
1. در PostAd یک step اول برای انتخاب نوع اضافه کنی
2. یا `/post-ad-type` رو نگه داری و فقط لینک‌ها رو برگردونی

**حالا همه لینک‌ها مستقیماً به /post-ad میرن! ✅**