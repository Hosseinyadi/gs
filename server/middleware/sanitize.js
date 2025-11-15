const xss = require('xss');

/**
 * Middleware to sanitize user input and prevent XSS attacks
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query params
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize params
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    next(); // Continue even if sanitization fails
  }
};

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeValue(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value);
  }
  return sanitized;
}

/**
 * Sanitize a single value
 */
function sanitizeValue(value) {
  if (typeof value === 'string') {
    return xss(value, {
      whiteList: {
        // Allow some safe HTML tags if needed
        b: [],
        i: [],
        em: [],
        strong: [],
        br: []
      },
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script', 'style']
    });
  }
  
  if (typeof value === 'object' && value !== null) {
    return sanitizeObject(value);
  }
  
  return value;
}

module.exports = sanitizeInput;
