const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const paymentService = require('../services/payment');
const emailService = require('../services/emailService');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');

// Configure multer for receipt uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/receipts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('فقط فایل‌های تصویری و PDF مجاز هستند'));
    }
  }
});

/**
 * @route   POST /api/payments/initiate
 * @desc    شروع پرداخت
 * @access  Private
 */
router.post('/initiate', authenticateUser, async (req, res) => {
  try {
    const { listing_id, plan_id, payment_method = 'gateway', gateway_name } = req.body;
    const userId = req.user.id;

    // Validation
    if (!listing_id || !plan_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'شناسه آگهی و پلن الزامی است'
        }
      });
    }

    const result = await paymentService.initiatePayment(
      userId,
      parseInt(listing_id),
      parseInt(plan_id),
      payment_method,
      gateway_name
    );

    res.json({
      success: true,
      data: result,
      message: 'پرداخت با موفقیت آغاز شد'
    });
  } catch (error) {
    console.error('Error in POST /payments/initiate:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INITIATE_PAYMENT_ERROR',
        message: error.message || 'خطا در شروع پرداخت'
      }
    });
  }
});

/**
 * @route   POST /api/payments/verify
 * @desc    تایید پرداخت (Callback از درگاه)
 * @access  Public
 */
router.post('/verify', async (req, res) => {
  try {
    const { Authority, Status } = req.query;

    if (!Authority) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=no_authority`);
    }

    const result = await paymentService.verifyPayment(Authority, Status);

    if (result.success) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment/success?ref_id=${result.ref_id}&payment_id=${result.payment_id}`
      );
    } else {
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment/failed?message=${encodeURIComponent(result.message)}`
      );
    }
  } catch (error) {
    console.error('Error in POST /payments/verify:', error);
    return res.redirect(
      `${process.env.FRONTEND_URL}/payment/failed?error=server_error`
    );
  }
});

/**
 * @route   GET /api/payments/verify
 * @desc    تایید پرداخت (Callback از درگاه - GET method)
 * @access  Public
 */
router.get('/verify', async (req, res) => {
  try {
    const { Authority, Status } = req.query;

    if (!Authority) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=no_authority`);
    }

    const result = await paymentService.verifyPayment(Authority, Status);

    if (result.success) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment/success?ref_id=${result.ref_id}&payment_id=${result.payment_id}`
      );
    } else {
      return res.redirect(
        `${process.env.FRONTEND_URL}/payment/failed?message=${encodeURIComponent(result.message)}`
      );
    }
  } catch (error) {
    console.error('Error in GET /payments/verify:', error);
    return res.redirect(
      `${process.env.FRONTEND_URL}/payment/failed?error=server_error`
    );
  }
});

/**
 * @route   POST /api/payments/card-transfer
 * @desc    ثبت پرداخت کارت به کارت
 * @access  Private
 */
router.post('/card-transfer', authenticateUser, upload.single('receipt'), async (req, res) => {
  try {
    const { listing_id, plan_id } = req.body;
    const userId = req.user.id;

    if (!listing_id || !plan_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'شناسه آگهی و پلن الزامی است'
        }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'تصویر رسید الزامی است'
        }
      });
    }

    const receiptPath = req.file.path;

    const result = await paymentService.createCardTransferPayment(
      userId,
      parseInt(listing_id),
      parseInt(plan_id),
      receiptPath
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'رسید پرداخت با موفقیت ثبت شد'
    });
  } catch (error) {
    console.error('Error in POST /payments/card-transfer:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CARD_TRANSFER_ERROR',
        message: error.message || 'خطا در ثبت پرداخت کارت به کارت'
      }
    });
  }
});

/**
 * @route   GET /api/payments/my-payments
 * @desc    دریافت تاریخچه پرداخت‌های کاربر
 * @access  Private
 */
router.get('/my-payments', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, payment_method, limit } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (payment_method) filters.payment_method = payment_method;
    if (limit) filters.limit = parseInt(limit);

    const payments = await paymentService.getUserPayments(userId, filters);

    res.json({
      success: true,
      data: payments,
      message: 'لیست پرداخت‌ها با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('Error in GET /payments/my-payments:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PAYMENTS_ERROR',
        message: error.message || 'خطا در دریافت لیست پرداخت‌ها'
      }
    });
  }
});

/**
 * @route   GET /api/payments/:id
 * @desc    دریافت جزئیات یک پرداخت
 * @access  Private
 */
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const userId = req.user.id;
    const isAdminUser = req.user.role === 'admin';

    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYMENT_ID',
          message: 'شناسه پرداخت نامعتبر است'
        }
      });
    }

    const payment = await paymentService.getPaymentById(paymentId);

    // Check access
    if (!isAdminUser && payment.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'شما به این پرداخت دسترسی ندارید'
        }
      });
    }

    res.json({
      success: true,
      data: payment,
      message: 'جزئیات پرداخت با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('Error in GET /payments/:id:', error);
    const statusCode = error.message.includes('یافت نشد') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'FETCH_PAYMENT_ERROR',
        message: error.message || 'خطا در دریافت جزئیات پرداخت'
      }
    });
  }
});

// ==================== Admin Routes ====================

/**
 * @route   GET /api/admin/payments
 * @desc    دریافت لیست تمام پرداخت‌ها
 * @access  Admin
 */
router.get('/admin/payments', authenticateAdmin, async (req, res) => {
  try {
    const { status, payment_method, user_id, start_date, end_date, limit } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (payment_method) filters.payment_method = payment_method;
    if (user_id) filters.user_id = parseInt(user_id);
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (limit) filters.limit = parseInt(limit);

    const payments = await paymentService.getAllPayments(filters);

    res.json({
      success: true,
      data: payments,
      message: 'لیست پرداخت‌ها با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('Error in GET /admin/payments:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PAYMENTS_ERROR',
        message: error.message || 'خطا در دریافت لیست پرداخت‌ها'
      }
    });
  }
});

/**
 * @route   GET /api/admin/payments/pending
 * @desc    دریافت پرداخت‌های در انتظار تایید
 * @access  Admin
 */
router.get('/admin/payments/pending', authenticateAdmin, async (req, res) => {
  try {
    const payments = await paymentService.getPendingPayments();

    res.json({
      success: true,
      data: payments,
      message: 'لیست پرداخت‌های در انتظار با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('Error in GET /admin/payments/pending:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PENDING_PAYMENTS_ERROR',
        message: error.message || 'خطا در دریافت پرداخت‌های در انتظار'
      }
    });
  }
});

/**
 * @route   POST /api/admin/payments/:id/approve
 * @desc    تایید پرداخت
 * @access  Admin
 */
router.post('/admin/payments/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const adminId = req.user.id;

    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYMENT_ID',
          message: 'شناسه پرداخت نامعتبر است'
        }
      });
    }

    const result = await paymentService.approvePayment(paymentId, adminId);

    res.json({
      success: true,
      data: result,
      message: 'پرداخت با موفقیت تایید شد'
    });
  } catch (error) {
    console.error('Error in POST /admin/payments/:id/approve:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'APPROVE_PAYMENT_ERROR',
        message: error.message || 'خطا در تایید پرداخت'
      }
    });
  }
});

/**
 * @route   POST /api/admin/payments/:id/reject
 * @desc    رد پرداخت
 * @access  Admin
 */
router.post('/admin/payments/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const adminId = req.user.id;
    const { reason } = req.body;

    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYMENT_ID',
          message: 'شناسه پرداخت نامعتبر است'
        }
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'دلیل رد الزامی است'
        }
      });
    }

    const result = await paymentService.rejectPayment(paymentId, adminId, reason);

    res.json({
      success: true,
      data: result,
      message: 'پرداخت رد شد'
    });
  } catch (error) {
    console.error('Error in POST /admin/payments/:id/reject:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REJECT_PAYMENT_ERROR',
        message: error.message || 'خطا در رد پرداخت'
      }
    });
  }
});

/**
 * @route   GET /api/admin/payments/stats
 * @desc    دریافت آمار پرداخت‌ها
 * @access  Admin
 */
router.get('/admin/payments/stats', authenticateAdmin, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const filters = {};
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const stats = await paymentService.getPaymentStats(filters);

    res.json({
      success: true,
      data: stats,
      message: 'آمار پرداخت‌ها با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('Error in GET /admin/payments/stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_STATS_ERROR',
        message: error.message || 'خطا در دریافت آمار'
      }
    });
  }
});

module.exports = router;
