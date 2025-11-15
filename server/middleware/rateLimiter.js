const rateLimit = require('express-rate-limit');

// محدودیت عمومی برای تمام API ها
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقیقه
  max: 100, // حداکثر 100 درخواست
  message: {
    success: false,
    message: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// محدودیت سخت‌گیرانه برای ورود و ثبت‌نام
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقیقه
  max: 5, // فقط 5 تلاش
  message: {
    success: false,
    message: 'تعداد تلاش‌های ورود بیش از حد است. لطفاً 15 دقیقه صبر کنید.'
  },
  skipSuccessfulRequests: true, // درخواست‌های موفق را نشمار
});

// محدودیت برای ارسال OTP
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 دقیقه
  max: 3, // فقط 3 بار ارسال OTP
  message: {
    success: false,
    message: 'تعداد درخواست ارسال کد بیش از حد است. لطفاً 5 دقیقه صبر کنید.'
  },
});

// محدودیت برای ثبت آگهی
const createListingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ساعت
  max: 10, // حداکثر 10 آگهی در ساعت
  message: {
    success: false,
    message: 'تعداد آگهی‌های ثبت شده بیش از حد است. لطفاً بعداً تلاش کنید.'
  },
});

// محدودیت برای آپلود فایل
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ساعت
  max: 50, // حداکثر 50 آپلود در ساعت
  message: {
    success: false,
    message: 'تعداد آپلود فایل بیش از حد است. لطفاً بعداً تلاش کنید.'
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  otpLimiter,
  createListingLimiter,
  uploadLimiter
};
