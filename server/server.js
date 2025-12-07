const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const favoriteRoutes = require('./routes/favorites');
const adminRoutes = require('./routes/admin');
const locationRoutes = require('./routes/locations');
const orderRoutes = require('./routes/orders');
const inquiryRoutes = require('./routes/inquiries');
const paymentsRoutes = require('./routes/payments');
const paymentsNewRoutes = require('./routes/paymentsNew');
const featuredPlansRoutes = require('./routes/featuredPlans');
const healthRoutes = require('./routes/health');
const discountCodesRoutes = require('./routes/discountCodes');
const paymentHistoryRoutes = require('./routes/paymentHistory');
const adminAnalyticsRoutes = require('./routes/adminAnalytics');
const adminManagementRoutes = require('./routes/adminManagement');
const citiesRoutes = require('./routes/cities');
const uploadRoutes = require('./routes/upload');
const sanitizeInput = require('./middleware/sanitize');
const { advancedSecurityMiddleware } = require('./middleware/advancedSecurity');
const { securityMiddleware, csrfProtection } = require('./middleware/securityMiddleware');

// Admin panel routes
const adminSettingsRoutes = require('./routes/admin-settings');
const adminDiscountsRoutes = require('./routes/admin-discounts');
const adminReportsRoutes = require('./routes/admin-reports');
const adminAuditRoutes = require('./routes/admin-audit');
const adminProvidersRoutes = require('./routes/admin-providers');

// Import middleware
const { authenticateAdmin } = require('./middleware/auth');

// Import database
const { db } = require('./config/database');

// Import cron service
const featuredCron = require('./services/featuredCron');
const paymentTimeoutService = require('./services/paymentTimeout');
const backupService = require('./scripts/backup');

const app = express();
// Optional middlewares (use if installed)
let compression; try { compression = require('compression'); } catch (e) { compression = null; }
let morgan; try { morgan = require('morgan'); } catch (e) { morgan = null; }
const PORT = process.env.PORT || 8080;

// Enforce critical env in production
if ((process.env.NODE_ENV || '').toLowerCase() === 'production' && !process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET must be set in production.');
    process.exit(1);
}

// Security middleware
if (morgan) {
    app.use(morgan((process.env.NODE_ENV || 'development') === 'production' ? 'combined' : 'dev'));
}
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

if (compression) {
    app.use(compression());
}

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // limit each IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً بعداً تلاش کنید.'
    }
});

const otpLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: parseInt(process.env.OTP_RATE_LIMIT_MAX || '3', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'تعداد درخواست‌های OTP بیش از حد مجاز است. لطفاً یک دقیقه صبر کنید.'
    }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '50', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'تلاش بیش از حد برای ورود. لطفاً بعداً تلاش کنید.'
    }
});

// CORS configuration (env-driven) - بهینه شده برای تمام مرورگرها
const corsOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // e.g., curl/postman
        // In development, allow localhost and 127.0.0.1 on any port
        if (process.env.NODE_ENV !== 'production') {
            if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
                return callback(null, true);
            }
        }
        if (corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('CORS blocked for origin: ' + origin), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400, // 24 hours - کش کردن preflight requests برای بهبود عملکرد
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Body parsing middleware
const BODY_LIMIT = process.env.BODY_LIMIT || '10mb';
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

// اضافه کردن header های سازگار با تمام مرورگرها
app.use((req, res, next) => {
    // اطمینان از Content-Type صحیح برای JSON
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    // جلوگیری از کش شدن در Edge و Safari
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // اضافه کردن X-Content-Type-Options برای امنیت
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    next();
});

// Input sanitization middleware
app.use(sanitizeInput);

// Advanced security middleware
app.use(advancedSecurityMiddleware({
    allowHtml: false, // عدم اجازه HTML در اکثر فیلدها
    maxDepth: 5 // حداکثر عمق object ها
}));

// Security middleware - XSS, SQL Injection, Path Traversal protection
app.use(securityMiddleware({
    blockOnThreat: false,  // فقط لاگ می‌کنیم، بلاک نمی‌کنیم
    logThreats: true,
    sanitize: true,
    allowHtml: false
}));

// CSRF Protection
app.use(csrfProtection);

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Apply rate limiting
app.use('/api/', limiter);
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/verify-otp', otpLimiter);
app.use('/api/auth/admin/login', loginLimiter);

// Health check endpoint (detailed)
app.use('/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/payments', paymentsNewRoutes);
app.use('/api/payments-old', paymentsRoutes);
app.use('/api/featured-plans', featuredPlansRoutes);
app.use('/api/admin/featured-plans', featuredPlansRoutes);
app.use('/api/discount-codes', discountCodesRoutes);
app.use('/api/admin/discount-codes', discountCodesRoutes);
app.use('/api/payments', paymentHistoryRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/management', adminManagementRoutes);
app.use('/api/admin/payments', paymentsNewRoutes);
app.use('/api/admin/hierarchy', require('./routes/adminHierarchy'));
app.use('/api/user', require('./routes/userLoyalty'));
app.use('/api/cities', citiesRoutes);

// Admin panel routes
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/discounts', adminDiscountsRoutes);
app.use('/api/admin/reports', adminReportsRoutes);
app.use('/api/admin/audit', adminAuditRoutes);
app.use('/api/admin/providers', adminProvidersRoutes);
app.use('/api/admin/security', require('./routes/adminSecurity'));
app.use('/api/admin/support', require('./routes/adminSupport'));
app.use('/api/admin/static-pages', require('./routes/adminStaticPages'));
app.use('/api/admin/media', require('./routes/adminMedia'));
app.use('/api/static-pages', require('./routes/staticPages'));
app.use('/api/upload', uploadRoutes);

// Notifications, Stats, and Renewals routes
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/listing-stats', require('./routes/listingStats'));
app.use('/api/renewals', require('./routes/renewals'));
app.use('/api/admin/renewals', require('./routes/adminRenewals'));

// New Admin Dashboard Pro, Notification Center, and Advanced Search routes
app.use('/api/admin/dashboard-pro', require('./routes/adminDashboardPro'));
app.use('/api/admin/notification-center', require('./routes/adminNotificationCenter'));
app.use('/api/admin/listings', require('./routes/adminListingsSearch'));

// Static files for uploaded images
app.use('/uploads', express.static('uploads'));

// Manual cron job trigger (Admin only)
app.post('/api/admin/cron/featured', authenticateAdmin, async (req, res) => {
    try {
        const result = await featuredCron.runAll();
        res.json({
            success: true,
            data: result,
            message: 'Cron jobs executed successfully'
        });
    } catch (error) {
        console.error('Manual cron error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Error running cron jobs' }
        });
    }
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'مسیر یافت نشد'
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    // Handle specific error types
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: 'فرمت JSON نامعتبر است'
        });
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            message: 'حجم فایل بیش از حد مجاز است'
        });
    }
    
    // Default error response
    res.status(500).json({
        success: false,
        message: 'خطای داخلی سرور'
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

// Setup cron jobs for featured listings and payments
const setupCronJobs = () => {
    // Run every hour to check expired listings
    setInterval(async () => {
        try {
            await featuredCron.checkExpiredListings();
        } catch (error) {
            console.error('Cron job error (expired):', error);
        }
    }, 60 * 60 * 1000); // Every hour

    // Run every 10 minutes to check expired pending payments
    setInterval(async () => {
        try {
            await paymentTimeoutService.checkPendingPayments();
        } catch (error) {
            console.error('Cron job error (payment timeout):', error);
        }
    }, 10 * 60 * 1000); // Every 10 minutes

    // Run every 6 hours to notify expiring listings
    setInterval(async () => {
        try {
            await featuredCron.notifyExpiringListings();
        } catch (error) {
            console.error('Cron job error (notify):', error);
        }
    }, 6 * 60 * 60 * 1000); // Every 6 hours

    // Run immediately on startup
    setTimeout(async () => {
        console.log('🔄 Running initial cron jobs...');
        await featuredCron.runAll();
    }, 5000); // After 5 seconds

    // Schedule automatic backups
    backupService.scheduleBackups();

    // Schedule listing cleanup (every 40 days)
    const listingCleanup = require('./services/listingCleanup');
    
    // Run cleanup daily at 3 AM, but only delete listings older than 40 days
    setInterval(async () => {
        try {
            const now = new Date();
            if (now.getHours() === 3 && now.getMinutes() === 0) {
                console.log('🧹 Running daily listing cleanup check...');
                const result = await listingCleanup.cleanupOldListings(false);
                console.log(`✅ Cleanup completed: ${result.deleted} deleted, ${result.preserved} preserved`);
            }
        } catch (error) {
            console.error('❌ Listing cleanup error:', error);
        }
    }, 60 * 60 * 1000); // Check every hour, but only run at 3 AM

    // Renewal service - check expired listings and send reminders
    const RenewalService = require('./services/renewalService');
    const { NotificationService } = require('./services/notificationService');
    
    // Run every day at 8 AM to expire old listings and send reminders
    setInterval(async () => {
        try {
            const now = new Date();
            if (now.getHours() === 8 && now.getMinutes() === 0) {
                console.log('⏰ Running daily renewal checks...');
                
                // منقضی کردن آگهی‌های قدیمی
                const expireResult = await RenewalService.expireOldListings();
                console.log(`✅ Expired ${expireResult.expired} listings`);
                
                // ارسال یادآوری انقضا
                const reminderResult = await RenewalService.sendExpiryReminders();
                console.log(`📧 Sent ${reminderResult.sent} expiry reminders`);
                
                // پاکسازی اعلان‌های قدیمی
                await NotificationService.cleanupOld();
            }
        } catch (error) {
            console.error('❌ Renewal cron error:', error);
        }
    }, 60 * 60 * 1000); // Check every hour, but only run at 8 AM

    console.log('⏰ Cron jobs scheduled');
};

// Start server with error handling
const server = app.listen(PORT, () => {
    console.log(`🚀 گاراژ سنگین Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Setup cron jobs
    setupCronJobs();
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Error: Port ${PORT} is already in use!`);
        console.error(`💡 Solution: Run "stop-servers.bat" first, then try again.`);
        process.exit(1);
    } else {
        console.error('❌ Server error:', err);
        process.exit(1);
    }
});

module.exports = app;
