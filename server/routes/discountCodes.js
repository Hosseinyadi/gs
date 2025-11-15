const express = require('express');
const router = express.Router();
const discountCodeService = require('../services/discountCode');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');

/**
 * @route   POST /api/discount-codes/validate
 * @desc    Validate discount code
 * @access  Private
 */
router.post('/validate', authenticateUser, async (req, res) => {
  try {
    const { code, plan_id, amount } = req.body;
    const userId = req.user.id;

    if (!code || !plan_id || !amount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'کد تخفیف، پلن و مبلغ الزامی است'
        }
      });
    }

    const result = await discountCodeService.validateDiscountCode(
      code,
      userId,
      plan_id,
      amount
    );

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DISCOUNT',
          message: result.error
        }
      });
    }

    res.json({
      success: true,
      data: result.discount,
      message: 'کد تخفیف با موفقیت اعمال شد'
    });
  } catch (error) {
    console.error('Error validating discount code:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'خطا در بررسی کد تخفیف'
      }
    });
  }
});

/**
 * @route   POST /api/admin/discount-codes
 * @desc    Create discount code
 * @access  Admin
 */
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const result = await discountCodeService.createDiscountCode(
      req.body,
      req.user.id
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: result.error
        }
      });
    }

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'کد تخفیف با موفقیت ایجاد شد'
    });
  } catch (error) {
    console.error('Error creating discount code:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'خطا در ایجاد کد تخفیف'
      }
    });
  }
});

/**
 * @route   GET /api/admin/discount-codes
 * @desc    Get all discount codes
 * @access  Admin
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const filters = {
      is_active: req.query.is_active,
      search: req.query.search
    };

    const result = await discountCodeService.getAllDiscountCodes(filters);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: result.error
        }
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'لیست کدهای تخفیف با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('Error getting discount codes:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'خطا در دریافت کدهای تخفیف'
      }
    });
  }
});

/**
 * @route   PUT /api/admin/discount-codes/:id
 * @desc    Update discount code
 * @access  Admin
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const result = await discountCodeService.updateDiscountCode(
      parseInt(req.params.id),
      req.body
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: result.error
        }
      });
    }

    res.json({
      success: true,
      message: 'کد تخفیف با موفقیت بروزرسانی شد'
    });
  } catch (error) {
    console.error('Error updating discount code:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'خطا در بروزرسانی کد تخفیف'
      }
    });
  }
});

/**
 * @route   GET /api/admin/discount-codes/stats
 * @desc    Get discount code statistics
 * @access  Admin
 */
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const result = await discountCodeService.getDiscountStats();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: result.error
        }
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'آمار کدهای تخفیف با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('Error getting discount stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_ERROR',
        message: 'خطا در دریافت آمار'
      }
    });
  }
});

module.exports = router;
