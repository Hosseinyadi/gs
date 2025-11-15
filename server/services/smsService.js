const { sendSMS, sendOTP, sendTemplate, isSMSConfigured } = require('../config/sms');

/**
 * Send payment success SMS
 */
async function sendPaymentSuccessSMS(phone, payment, listing) {
  const message = `پرداخت شما با موفقیت انجام شد.
آگهی: ${listing.title}
مبلغ: ${payment.final_amount.toLocaleString('fa-IR')} تومان
کد پیگیری: ${payment.ref_id}
گاراژ سنگین`;

  return await sendSMS(phone, message);
}

/**
 * Send featured notification SMS
 */
async function sendFeaturedNotificationSMS(phone, listingTitle, duration) {
  const message = `آگهی "${listingTitle}" شما برای ${duration} روز ویژه شد.
گاراژ سنگین`;

  return await sendSMS(phone, message);
}

/**
 * Send expiring warning SMS
 */
async function sendExpiringWarningSMS(phone, listingTitle, hoursLeft) {
  const message = `آگهی ویژه "${listingTitle}" شما ${hoursLeft} ساعت دیگر منقضی می‌شود.
برای تمدید اقدام کنید.
گاراژ سنگین`;

  return await sendSMS(phone, message);
}

/**
 * Send payment failed SMS
 */
async function sendPaymentFailedSMS(phone, listingTitle) {
  const message = `پرداخت شما برای آگهی "${listingTitle}" ناموفق بود.
لطفا دوباره تلاش کنید.
گاراژ سنگین`;

  return await sendSMS(phone, message);
}

/**
 * Send discount code SMS
 */
async function sendDiscountCodeSMS(phone, code, description) {
  const message = `کد تخفیف ویژه شما: ${code}
${description}
گاراژ سنگین`;

  return await sendSMS(phone, message);
}

/**
 * Send welcome SMS
 */
async function sendWelcomeSMS(phone) {
  const message = `به گاراژ سنگین خوش آمدید!
سیستم خرید و فروش ماشین‌آلات سنگین`;

  return await sendSMS(phone, message);
}

/**
 * Send verification code
 */
async function sendVerificationCode(phone, code) {
  return await sendOTP(phone, code);
}

/**
 * Clean phone number (remove spaces, dashes, etc.)
 */
function cleanPhoneNumber(phone) {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, keep it
  // If starts with 98, keep it
  // Otherwise add 0
  if (cleaned.startsWith('98')) {
    cleaned = '0' + cleaned.substring(2);
  } else if (!cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  
  return cleaned;
}

/**
 * Generate random OTP code
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate phone number format
 */
function isValidPhoneNumber(phone) {
  const cleaned = cleanPhoneNumber(phone);
  // Iranian mobile numbers: 09xxxxxxxxx (11 digits)
  return /^09\d{9}$/.test(cleaned);
}

module.exports = {
  sendPaymentSuccessSMS,
  sendFeaturedNotificationSMS,
  sendExpiringWarningSMS,
  sendPaymentFailedSMS,
  sendDiscountCodeSMS,
  sendWelcomeSMS,
  sendVerificationCode,
  cleanPhoneNumber,
  generateOTP,
  isValidPhoneNumber,
  isSMSConfigured
};
