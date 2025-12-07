/**
 * Security Middleware
 * محافظت جامع در برابر حملات امنیتی
 */

const xss = require('xss');

// الگوهای خطرناک SQL Injection
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|UNION|DECLARE)\b)/gi,
  /(--)|(\/\*)|(\*\/)/g,
  /(\bOR\b\s+\d+\s*=\s*\d+)/gi,
  /(\bAND\b\s+\d+\s*=\s*\d+)/gi,
  /(;|\||`)/g,
  /(\bSLEEP\b\s*\()/gi,
  /(\bBENCHMARK\b\s*\()/gi
];

// الگوهای خطرناک XSS
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /on\w+\s*=/gi,
  /data:\s*text\/html/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<form/gi,
  /expression\s*\(/gi,
  /url\s*\(/gi
];

// الگوهای Path Traversal
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\/, 
  /%2e%2e%2f/gi,
  /%2e%2e\//gi,
  /\.%2e\//gi,
  /%2e\.\//gi
];

// الگوهای Command Injection
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$]/g,
  /\$\(/g,
  /`.*`/g,
  /\|\|/g,
  /&&/g
];

/**
 * بررسی SQL Injection
 */
function checkSQLInjection(value) {
  if (typeof value !== 'string') return false;
  
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }
  return false;
}

/**
 * بررسی XSS
 */
function checkXSS(value) {
  if (typeof value !== 'string') return false;
  
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }
  return false;
}

/**
 * بررسی Path Traversal
 */
function checkPathTraversal(value) {
  if (typeof value !== 'string') return false;
  
  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }
  return false;
}

/**
 * بررسی Command Injection
 */
function checkCommandInjection(value) {
  if (typeof value !== 'string') return false;
  
  for (const pattern of COMMAND_INJECTION_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }
  return false;
}

/**
 * پاکسازی عمیق یک مقدار
 */
function deepSanitize(value, options = {}) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    // پاکسازی XSS
    let sanitized = xss(value, {
      whiteList: options.allowHtml ? {
        b: [],
        i: [],
        em: [],
        strong: [],
        br: [],
        p: [],
        ul: [],
        ol: [],
        li: []
      } : {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed']
    });

    // حذف null bytes
    sanitized = sanitized.replace(/\x00/g, '');

    // حذف کاراکترهای کنترلی
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map(item => deepSanitize(item, options));
  }

  if (typeof value === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
      // پاکسازی کلید هم
      const sanitizedKey = deepSanitize(key, options);
      sanitized[sanitizedKey] = deepSanitize(val, options);
    }
    return sanitized;
  }

  return value;
}

/**
 * بررسی امنیتی کامل یک مقدار
 */
function securityCheck(value, path = '') {
  const threats = [];

  if (typeof value === 'string') {
    if (checkSQLInjection(value)) {
      threats.push({ type: 'SQL_INJECTION', path, value: value.substring(0, 100) });
    }
    if (checkXSS(value)) {
      threats.push({ type: 'XSS', path, value: value.substring(0, 100) });
    }
    if (checkPathTraversal(value)) {
      threats.push({ type: 'PATH_TRAVERSAL', path, value: value.substring(0, 100) });
    }
    if (checkCommandInjection(value)) {
      threats.push({ type: 'COMMAND_INJECTION', path, value: value.substring(0, 100) });
    }
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => {
      threats.push(...securityCheck(item, `${path}[${index}]`));
    });
  } else if (typeof value === 'object' && value !== null) {
    for (const [key, val] of Object.entries(value)) {
      threats.push(...securityCheck(val, path ? `${path}.${key}` : key));
    }
  }

  return threats;
}

/**
 * Middleware اصلی امنیتی
 */
const securityMiddleware = (options = {}) => {
  const {
    blockOnThreat = false,  // آیا در صورت شناسایی تهدید، درخواست را بلاک کنیم؟
    logThreats = true,      // آیا تهدیدات را لاگ کنیم؟
    sanitize = true,        // آیا ورودی‌ها را پاکسازی کنیم؟
    allowHtml = false       // آیا HTML مجاز است؟
  } = options;

  return (req, res, next) => {
    try {
      const allThreats = [];

      // بررسی body
      if (req.body) {
        const bodyThreats = securityCheck(req.body, 'body');
        allThreats.push(...bodyThreats);
        
        if (sanitize) {
          req.body = deepSanitize(req.body, { allowHtml });
        }
      }

      // بررسی query
      if (req.query) {
        const queryThreats = securityCheck(req.query, 'query');
        allThreats.push(...queryThreats);
        
        if (sanitize) {
          req.query = deepSanitize(req.query, { allowHtml: false });
        }
      }

      // بررسی params
      if (req.params) {
        const paramsThreats = securityCheck(req.params, 'params');
        allThreats.push(...paramsThreats);
        
        if (sanitize) {
          req.params = deepSanitize(req.params, { allowHtml: false });
        }
      }

      // بررسی headers خاص (بدون user-agent چون false positive زیاد داره)
      const dangerousHeaders = ['x-forwarded-for', 'referer'];
      for (const header of dangerousHeaders) {
        if (req.headers[header]) {
          const headerThreats = securityCheck(req.headers[header], `header.${header}`);
          allThreats.push(...headerThreats);
        }
      }

      // لاگ تهدیدات
      if (logThreats && allThreats.length > 0) {
        console.warn('🚨 Security threats detected:', {
          ip: req.ip || req.connection?.remoteAddress,
          method: req.method,
          path: req.path,
          threats: allThreats,
          timestamp: new Date().toISOString()
        });
      }

      // بلاک کردن در صورت تهدید
      if (blockOnThreat && allThreats.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'درخواست نامعتبر شناسایی شد',
          code: 'SECURITY_THREAT'
        });
      }

      // ذخیره تهدیدات برای استفاده بعدی
      req.securityThreats = allThreats;

      next();
    } catch (error) {
      console.error('Security middleware error:', error);
      next(); // ادامه حتی در صورت خطا
    }
  };
};

/**
 * Middleware بررسی دسترسی کاربر
 */
const accessControlMiddleware = (options = {}) => {
  const {
    allowedRoles = [],
    checkOwnership = false,
    ownerField = 'user_id'
  } = options;

  return (req, res, next) => {
    try {
      // بررسی احراز هویت
      if (!req.user && !req.admin) {
        return res.status(401).json({
          success: false,
          message: 'لطفاً وارد شوید'
        });
      }

      // بررسی نقش (برای ادمین)
      if (allowedRoles.length > 0 && req.admin) {
        const hasRole = allowedRoles.includes(req.admin.role) || req.admin.is_super_admin;
        if (!hasRole) {
          return res.status(403).json({
            success: false,
            message: 'شما دسترسی به این بخش را ندارید'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Access control error:', error);
      res.status(500).json({
        success: false,
        message: 'خطای سرور'
      });
    }
  };
};

/**
 * Middleware محدودیت نرخ درخواست پیشرفته
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60000,  // 1 دقیقه
    maxRequests = 100,
    keyGenerator = (req) => req.ip,
    message = 'تعداد درخواست‌ها بیش از حد مجاز است'
  } = options;

  const requests = new Map();

  // پاکسازی دوره‌ای
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requests.entries()) {
      if (now - data.startTime > windowMs) {
        requests.delete(key);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    if (!requests.has(key)) {
      requests.set(key, { count: 1, startTime: now });
      return next();
    }

    const data = requests.get(key);

    if (now - data.startTime > windowMs) {
      requests.set(key, { count: 1, startTime: now });
      return next();
    }

    data.count++;

    if (data.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((windowMs - (now - data.startTime)) / 1000)
      });
    }

    next();
  };
};

/**
 * Middleware بررسی CSRF (برای فرم‌ها)
 */
const csrfProtection = (req, res, next) => {
  // برای درخواست‌های GET، HEAD، OPTIONS نیازی به بررسی نیست
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = req.get('origin');
  const referer = req.get('referer');
  const host = req.get('host');

  // بررسی Origin
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        console.warn('CSRF: Origin mismatch', { origin, host });
        // در محیط توسعه اجازه می‌دهیم
        if (process.env.NODE_ENV === 'production') {
          return res.status(403).json({
            success: false,
            message: 'درخواست نامعتبر'
          });
        }
      }
    } catch (e) {
      // Origin نامعتبر
    }
  }

  next();
};

module.exports = {
  securityMiddleware,
  accessControlMiddleware,
  createRateLimiter,
  csrfProtection,
  deepSanitize,
  securityCheck,
  checkSQLInjection,
  checkXSS,
  checkPathTraversal,
  checkCommandInjection
};
