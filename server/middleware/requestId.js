// Request ID Middleware for tracking
const crypto = require('crypto');

const requestIdMiddleware = (req, res, next) => {
  // Generate unique request ID
  req.id = crypto.randomBytes(16).toString('hex');
  
  // Add to response headers
  res.setHeader('X-Request-ID', req.id);
  
  // Log request
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${req.id}] ${req.method} ${req.path}`);
  
  // Track response time
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.id}] Completed in ${duration}ms - Status: ${res.statusCode}`);
  });
  
  next();
};

module.exports = requestIdMiddleware;
