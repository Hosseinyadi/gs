const helmet = require('helmet');

// تنظیمات امنیتی با Helmet
const securityMiddleware = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "http://localhost:*"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  
  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // X-XSS-Protection
  xssFilter: true,
  
  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 سال
    includeSubDomains: true,
    preload: true
  },
  
  // Hide X-Powered-By
  hidePoweredBy: true,
});

// Sanitize input
const sanitizeInput = (req, res, next) => {
  // حذف کاراکترهای خطرناک از input ها
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key]);
      });
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
};

// Validate Content-Type
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type باید application/json باشد'
      });
    }
  }
  next();
};

// Prevent Parameter Pollution
const preventParameterPollution = (req, res, next) => {
  // اگر پارامتر تکراری وجود داشت، فقط اولین مقدار را بگیر
  Object.keys(req.query).forEach(key => {
    if (Array.isArray(req.query[key])) {
      req.query[key] = req.query[key][0];
    }
  });
  next();
};

module.exports = {
  securityMiddleware,
  sanitizeInput,
  validateContentType,
  preventParameterPollution
};
