# 📱 راهنمای تنظیم SMS واقعی

## 🎯 سیستم SMS فعلی

سیستم SMS قبلاً پیاده‌سازی شده و از **2 سرویس ایرانی** پشتیبانی می‌کند:
1. **Kavenegar** (کاوه‌نگار)
2. **Ghasedak** (قاصدک)

---

## 🚀 مراحل راه‌اندازی

### مرحله 1: انتخاب سرویس SMS

#### گزینه 1: Kavenegar (توصیه می‌شود)
```
🌐 وبسایت: https://panel.kavenegar.com
💰 قیمت: از 500 تومان به ازای هر پیامک
📱 خط اختصاصی: دارد
⚡ سرعت: بالا
```

#### گزینه 2: Ghasedak
```
🌐 وبسایت: https://ghasedak.me
💰 قیمت: از 400 تومان به ازای هر پیامک
📱 خط اختصاصی: دارد
⚡ سرعت: بالا
```

---

### مرحله 2: ثبت‌نام و دریافت API Key

#### برای Kavenegar:
```
1. به https://panel.kavenegar.com بروید
2. ثبت‌نام کنید
3. به بخش "تنظیمات" → "API Key" بروید
4. API Key خود را کپی کنید
5. (اختیاری) خط اختصاصی بگیرید
```

#### برای Ghasedak:
```
1. به https://ghasedak.me بروید
2. ثبت‌نام کنید
3. به بخش "API" بروید
4. API Key خود را کپی کنید
5. (اختیاری) خط اختصاصی بگیرید
```

---

### مرحله 3: تنظیم Environment Variables

فایل `.env` در پوشه `server` را ویرایش کنید:

#### برای Kavenegar:
```env
# SMS Configuration
SMS_PROVIDER=kavenegar
KAVENEGAR_API_KEY=your_api_key_here
SMS_SENDER=10008663

# OTP Mode (false برای استفاده واقعی)
OTP_MOCK=false
```

#### برای Ghasedak:
```env
# SMS Configuration
SMS_PROVIDER=ghasedak
GHASEDAK_API_KEY=your_api_key_here
SMS_SENDER=your_line_number

# OTP Mode (false برای استفاده واقعی)
OTP_MOCK=false
```

---

### مرحله 4: Restart سرور

```bash
# توقف سرور فعلی (Ctrl+C)
# سپس:
cd server
node server.js
```

---

## 🧪 تست SMS واقعی

### تست 1: ارسال OTP
```bash
curl -X POST http://localhost:8080/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789"}'
```

**انتظار**: 
- ✅ پیامک واقعی به شماره ارسال شود
- ✅ کد 6 رقمی دریافت کنید

### تست 2: تایید OTP
```bash
curl -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789","otp":"123456","name":"تست"}'
```

---

## 📊 نحوه کار سیستم

### حالت Development (OTP_MOCK=true)
```
1. کد OTP در لاگ backend نمایش داده می‌شود
2. پیامک واقعی ارسال نمی‌شود
3. برای تست محلی مناسب است
```

### حالت Production (OTP_MOCK=false)
```
1. کد OTP به شماره واقعی ارسال می‌شود
2. از API سرویس SMS استفاده می‌شود
3. هزینه پیامک محاسبه می‌شود
```

---

## 🔧 کدهای مهم

### ارسال OTP (server/config/sms.js)
```javascript
async function sendOTP(phone, code) {
  const allowMock = String(process.env.OTP_MOCK ?? 'true').toLowerCase() === 'true';
  
  const message = `کد تایید شما: ${code}\nگاراژ سنگین`;
  const result = await sendSMS(phone, message, allowMock);
  
  if (result.mock && allowMock) {
    console.log(`📱 [MOCK OTP] Code for ${phone}: ${code}`);
  }
  
  return result;
}
```

### ارسال SMS با Kavenegar
```javascript
async function sendViaKavenegar(receptor, message) {
  const url = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`;
  
  const response = await axios.post(url, {
    receptor,
    sender: smsConfig.sender,
    message
  });
  
  return {
    success: response.data.return.status === 200,
    messageId: response.data.entries?.[0]?.messageid
  };
}
```

---

## 💰 هزینه‌ها

### Kavenegar
```
📱 پیامک ساده: 500-700 تومان
📱 پیامک تبلیغاتی: 300-500 تومان
📱 خط اختصاصی: 5-10 میلیون تومان (یکبار)
💳 شارژ حداقل: 50,000 تومان
```

### Ghasedak
```
📱 پیامک ساده: 400-600 تومان
📱 پیامک تبلیغاتی: 250-400 تومان
📱 خط اختصاصی: 5-10 میلیون تومان (یکبار)
💳 شارژ حداقل: 50,000 تومان
```

---

## 🎯 توصیه‌ها

### برای تست
```
✅ OTP_MOCK=true
✅ از شماره‌های تست استفاده کنید
✅ لاگ‌ها را بررسی کنید
```

### برای Production
```
✅ OTP_MOCK=false
✅ API Key واقعی تنظیم کنید
✅ خط اختصاصی بگیرید (اختیاری)
✅ موجودی کافی داشته باشید
✅ Rate limiting فعال کنید
```

---

## 🔒 امنیت

### محافظت از API Key
```env
# NEVER commit .env file to git!
# Add to .gitignore:
.env
.env.local
.env.production
```

### Rate Limiting
```javascript
// در server.js فعال است:
const otpLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 3, // 3 requests per minute
    message: 'تعداد درخواست‌های OTP بیش از حد مجاز است'
});

app.use('/api/auth/send-otp', otpLimiter);
```

---

## 📝 مثال کامل .env

```env
# Server
PORT=8080
NODE_ENV=production

# Database
DB_PATH=./database/bilflow.db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# SMS Configuration
SMS_PROVIDER=kavenegar
KAVENEGAR_API_KEY=your_kavenegar_api_key_here
SMS_SENDER=10008663

# OTP Mode
OTP_MOCK=false

# Payment Gateway
ZARINPAL_MERCHANT_ID=your_merchant_id
```

---

## 🐛 عیب‌یابی

### مشکل 1: پیامک ارسال نمی‌شود
```
✅ بررسی کنید API Key صحیح است
✅ بررسی کنید موجودی کافی دارید
✅ بررسی کنید شماره فرستنده صحیح است
✅ لاگ‌های backend را ببینید
```

### مشکل 2: خطای 401 Unauthorized
```
✅ API Key را دوباره چک کنید
✅ مطمئن شوید که در پنل فعال است
✅ IP سرور را در پنل whitelist کنید
```

### مشکل 3: پیامک با تاخیر می‌رسد
```
✅ سرویس دیگری امتحان کنید
✅ با پشتیبانی سرویس تماس بگیرید
✅ خط اختصاصی بگیرید
```

---

## 🎉 خلاصه

**برای فعال‌سازی SMS واقعی:**

1. ✅ ثبت‌نام در Kavenegar یا Ghasedak
2. ✅ دریافت API Key
3. ✅ تنظیم در `.env`:
   ```env
   KAVENEGAR_API_KEY=your_key
   OTP_MOCK=false
   ```
4. ✅ Restart سرور
5. ✅ تست با شماره واقعی

**سیستم آماده است و فقط نیاز به API Key دارد!** 🚀

موفق باشید!
