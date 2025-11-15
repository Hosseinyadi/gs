const xss = require('xss');
const validator = require('validator');

/**
 * Advanced XSS Protection Middleware
 * محافظت پیشرفته در برابر حملات XSS با روش‌های مختلف
 */

// تنظیمات پیشرفته XSS
const xssOptions = {
  whiteList: {
    // فقط تگ‌های امن مجاز هستند
    p: ['class'],
    br: [],
    strong: [],
    b: [],
    em: [],
    i: [],
    span: ['class']
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
  allowCommentTag: false,
  onIgnoreTag: function (tag, html, options) {
    // لاگ کردن تگ‌های مشکوک
    console.warn(`🚨 Suspicious tag detected: ${tag} in HTML: ${html.substring(0, 100)}`);
    return '';
  },
  onTagAttr: function (tag, name, value, isWhiteAttr) {
    // بررسی attribute های مشکوک
    if (name === 'style' || name.startsWith('on')) {
      console.warn(`🚨 Suspicious attribute: ${name}="${value}" in tag: ${tag}`);
      return '';
    }
  }
};

/**
 * پاکسازی پیشرفته متن از XSS
 */
function sanitizeText(text) {
  if (!text || typeof text !== 'string') return text;
  
  // حذف کاراکترهای کنترلی
  text = text.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  // حذف encoding های مختلف
  text = text.replace(/&#x[0-9a-fA-F]+;/g, '');
  text = text.replace(/&#[0-9]+;/g, '');
  text = text.replace(/&[a-zA-Z]+;/g, (match) => {
    // فقط entity های امن مجاز
    const safe = ['&amp;', '&lt;', '&gt;', '&quot;', '&#39;'];
    return safe.includes(match) ? match : '';
  });
  
  // حذف javascript: و data: URLs
  text = text.replace(/javascript\s*:/gi, '');
  text = text.replace(/data\s*:/gi, '');
  text = text.replace(/vbscript\s*:/gi, '');
  
  // حذف تگ‌های HTML با روش‌های مختلف
  text = text.replace(/<[^>]*>/g, '');
  text = text.replace(/\[.*?\]/g, ''); // BBCode
  text = text.replace(/\{.*?\}/g, ''); // Template injection
  
  // استفاده از XSS library
  text = xss(text, xssOptions);
  
  return text.trim();
}

/**
 * پاکسازی URL ها
 */
function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  
  // بررسی فرمت URL
  if (!validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
    allow_underscores: false,
    allow_trailing_dot: false
  })) {
    return '';
  }
  
  // حذف پارامترهای مشکوک
  try {
    const urlObj = new URL(url);
    
    // بررسی دامنه‌های مجاز (اختیاری)
    const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || [];
    if (allowedDomains.length > 0 && !allowedDomains.includes(urlObj.hostname)) {
      console.warn(`🚨 Unauthorized domain: ${urlObj.hostname}`);
      return '';
    }
    
    return urlObj.toString();
  } catch (error) {
    console.warn(`🚨 Invalid URL: ${url}`);
    return '';
  }
}

/**
 * پاکسازی شماره تلفن
 */
function sanitizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  
  // فقط اعداد و علائم مجاز
  const cleaned = phone.replace(/[^\d+\-\s()]/g, '');
  
  // بررسی فرمت ایرانی
  const iranPattern = /^(\+98|0098|98|0)?9\d{9}$/;
  const digitsOnly = cleaned.replace(/\D/g, '');
  
  if (iranPattern.test(digitsOnly)) {
    return digitsOnly.startsWith('98') ? '0' + digitsOnly.substring(2) : 
           digitsOnly.startsWith('0') ? digitsOnly : '0' + digitsOnly;
  }
  
  return '';
}

/**
 * پاکسازی ایمیل
 */
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  
  // حذف کاراکترهای مشکوک
  email = email.toLowerCase().trim();
  
  if (validator.isEmail(email)) {
    return email;
  }
  
  return '';
}

/**
 * پاکسازی عمیق object ها
 */
function deepSanitize(obj, options = {}) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const { 
    allowHtml = false, 
    maxDepth = 10, 
    currentDepth = 0 
  } = options;
  
  if (currentDepth >= maxDepth) {
    console.warn('🚨 Max depth reached in sanitization');
    return {};
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item, { ...options, currentDepth: currentDepth + 1 }));
  }
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // پاکسازی کلید
    const cleanKey = sanitizeText(key);
    if (!cleanKey) continue;
    
    if (typeof value === 'string') {
      // تشخیص نوع فیلد و پاکسازی مناسب
      if (key.includes('email')) {
        sanitized[cleanKey] = sanitizeEmail(value);
      } else if (key.includes('phone') || key.includes('mobile')) {
        sanitized[cleanKey] = sanitizePhone(value);
      } else if (key.includes('url') || key.includes('link')) {
        sanitized[cleanKey] = sanitizeUrl(value);
      } else if (allowHtml && (key.includes('description') || key.includes('content'))) {
        // برای فیلدهایی که HTML محدود مجاز است
        sanitized[cleanKey] = xss(value, xssOptions);
      } else {
        sanitized[cleanKey] = sanitizeText(value);
      }
    } else if (typeof value === 'number') {
      // بررسی محدوده عدد
      if (Number.isFinite(value) && value >= Number.MIN_SAFE_INTEGER && value <= Number.MAX_SAFE_INTEGER) {
        sanitized[cleanKey] = value;
      }
    } else if (typeof value === 'boolean') {
      sanitized[cleanKey] = value;
    } else if (value && typeof value === 'object') {
      sanitized[cleanKey] = deepSanitize(value, { ...options, currentDepth: currentDepth + 1 });
    }
  }
  
  return sanitized;
}

/**
 * Middleware اصلی
 */
const advancedSecurityMiddleware = (options = {}) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    try {
      // پاکسازی body
      if (req.body && typeof req.body === 'object') {
        req.body = deepSanitize(req.body, options);
      }
      
      // پاکسازی query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = deepSanitize(req.query, { ...options, allowHtml: false });
      }
      
      // پاکسازی params
      if (req.params && typeof req.params === 'object') {
        req.params = deepSanitize(req.params, { ...options, allowHtml: false });
      }
      
      // بررسی User-Agent مشکوک
      const userAgent = req.get('User-Agent') || '';
      const suspiciousPatterns = [
        /script/i,
        /javascript/i,
        /vbscript/i,
        /<.*>/,
        /\{.*\}/,
        /\[.*\]/
      ];
      
      if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
        console.warn(`🚨 Suspicious User-Agent: ${userAgent} from IP: ${req.ip}`);
        return res.status(400).json({
          success: false,
          message: 'درخواست نامعتبر'
        });
      }
      
      // لاگ زمان پردازش
      const processingTime = Date.now() - startTime;
      if (processingTime > 100) {
        console.warn(`⚠️ Slow sanitization: ${processingTime}ms for ${req.method} ${req.path}`);
      }
      
      next();
    } catch (error) {
      console.error('🚨 Security middleware error:', error);
      res.status(400).json({
        success: false,
        message: 'خطا در پردازش درخواست'
      });
    }
  };
};

/**
 * Middleware برای فایل‌های آپلود
 */
const fileSecurityMiddleware = (req, res, next) => {
  if (!req.file && !req.files) return next();
  
  const files = req.files || [req.file];
  
  for (const file of files) {
    if (!file) continue;
    
    // بررسی نوع فایل
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'نوع فایل مجاز نیست'
      });
    }
    
    // بررسی اندازه فایل
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'اندازه فایل بیش از حد مجاز است'
      });
    }
    
    // بررسی نام فایل
    const safeName = sanitizeText(file.originalname);
    if (!safeName || safeName !== file.originalname) {
      return res.status(400).json({
        success: false,
        message: 'نام فایل نامعتبر است'
      });
    }
  }
  
  next();
};

module.exports = {
  advancedSecurityMiddleware,
  fileSecurityMiddleware,
  sanitizeText,
  sanitizeUrl,
  sanitizePhone,
  sanitizeEmail,
  deepSanitize
};