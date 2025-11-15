const express = require('express');
const router = express.Router();
const { dbHelpers } = require('../config/database');
const { authenticateUser } = require('../middleware/auth');
const { Parser } = require('json2csv');

/**
 * @route   GET /api/payments/history
 * @desc    Get user payment history with filters
 * @access  Private
 */
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      status,
      payment_method,
      search,
      date_from,
      date_to,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT 
        p.*,
        l.title as listing_title,
        fp.name as plan_name,
        dc.code as discount_code
      FROM payments p
      LEFT JOIN listings l ON p.listing_id = l.id
      LEFT JOIN featured_plans fp ON p.plan_id = fp.id
      LEFT JOIN discount_codes dc ON p.discount_code_id = dc.id
      WHERE p.user_id = ?
    `;
    const params = [userId];

    // Apply filters
    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (payment_method) {
      query += ' AND p.payment_method = ?';
      params.push(payment_method);
    }

    if (search) {
      query += ' AND (l.title LIKE ? OR p.ref_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (date_from) {
      query += ' AND DATE(p.created_at) >= DATE(?)';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND DATE(p.created_at) <= DATE(?)';
      params.push(date_to);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const payments = await dbHelpers.all(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM payments p
      LEFT JOIN listings l ON p.listing_id = l.id
      WHERE p.user_id = ?
    `;
    const countParams = [userId];

    if (status) {
      countQuery += ' AND p.status = ?';
      countParams.push(status);
    }

    if (payment_method) {
      countQuery += ' AND p.payment_method = ?';
      countParams.push(payment_method);
    }

    if (search) {
      countQuery += ' AND (l.title LIKE ? OR p.ref_id LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (date_from) {
      countQuery += ' AND DATE(p.created_at) >= DATE(?)';
      countParams.push(date_from);
    }

    if (date_to) {
      countQuery += ' AND DATE(p.created_at) <= DATE(?)';
      countParams.push(date_to);
    }

    const { total } = await dbHelpers.get(countQuery, countParams);

    res.json({
      success: true,
      data: payments,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + payments.length < total
      }
    });
  } catch (error) {
    console.error('Error getting payment history:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HISTORY_ERROR',
        message: 'خطا در دریافت تاریخچه پرداخت'
      }
    });
  }
});

/**
 * @route   GET /api/payments/export
 * @desc    Export payment history to CSV
 * @access  Private
 */
router.get('/export', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, payment_method, date_from, date_to } = req.query;

    let query = `
      SELECT 
        p.id,
        l.title as listing_title,
        fp.name as plan_name,
        p.amount,
        p.discount_amount,
        p.final_amount,
        p.payment_method,
        p.status,
        p.ref_id,
        p.created_at,
        p.verified_at,
        dc.code as discount_code
      FROM payments p
      LEFT JOIN listings l ON p.listing_id = l.id
      LEFT JOIN featured_plans fp ON p.plan_id = fp.id
      LEFT JOIN discount_codes dc ON p.discount_code_id = dc.id
      WHERE p.user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (payment_method) {
      query += ' AND p.payment_method = ?';
      params.push(payment_method);
    }

    if (date_from) {
      query += ' AND DATE(p.created_at) >= DATE(?)';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND DATE(p.created_at) <= DATE(?)';
      params.push(date_to);
    }

    query += ' ORDER BY p.created_at DESC';

    const payments = await dbHelpers.all(query, params);

    // Convert to CSV
    const fields = [
      { label: 'شناسه', value: 'id' },
      { label: 'آگهی', value: 'listing_title' },
      { label: 'پلن', value: 'plan_name' },
      { label: 'مبلغ', value: 'amount' },
      { label: 'تخفیف', value: 'discount_amount' },
      { label: 'مبلغ نهایی', value: 'final_amount' },
      { label: 'روش پرداخت', value: 'payment_method' },
      { label: 'وضعیت', value: 'status' },
      { label: 'کد پیگیری', value: 'ref_id' },
      { label: 'کد تخفیف', value: 'discount_code' },
      { label: 'تاریخ ایجاد', value: 'created_at' },
      { label: 'تاریخ تایید', value: 'verified_at' }
    ];

    const parser = new Parser({ fields, withBOM: true });
    const csv = parser.parse(payments);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=payments-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting payments:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_ERROR',
        message: 'خطا در دانلود فایل'
      }
    });
  }
});

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment detail
 * @access  Private
 */
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const paymentId = parseInt(req.params.id);

    const payment = await dbHelpers.get(
      `SELECT 
        p.*,
        l.title as listing_title,
        l.id as listing_id,
        fp.name as plan_name,
        fp.duration_days,
        dc.code as discount_code,
        dc.description as discount_description,
        u.phone as user_phone
      FROM payments p
      LEFT JOIN listings l ON p.listing_id = l.id
      LEFT JOIN featured_plans fp ON p.plan_id = fp.id
      LEFT JOIN discount_codes dc ON p.discount_code_id = dc.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ? AND p.user_id = ?`,
      [paymentId, userId]
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'پرداخت یافت نشد'
        }
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error getting payment detail:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DETAIL_ERROR',
        message: 'خطا در دریافت جزئیات پرداخت'
      }
    });
  }
});

module.exports = router;
