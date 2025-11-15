const express = require('express');
const router = express.Router();
const featuredPlansService = require('../services/featuredPlans');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/featured-plans
 * @desc    دریافت لیست پلن‌های ویژه‌سازی (عمومی)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const activeOnly = req.query.active !== 'false';
    const plans = await featuredPlansService.getAllPlans(activeOnly);
    
    res.json({
      success: true,
      data: plans,
      message: 'لیست پلن‌ها با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('Error in GET /featured-plans:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PLANS_ERROR',
        message: error.message || 'خطا در دریافت لیست پلن‌ها'
      }
    });
  }
});

/**
 * @route   GET /api/featured-plans/active
 * @desc    دریافت پلن‌های فعال (برای نمایش به کاربران)
 * @access  Public
 */
router.get('/active', async (req, res) => {
  try {
    const plans = await featuredPlansService.getActivePlans();
    
    res.json({
      success: true,
      data: plans,
      message: 'لیست پلن‌های فعال با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('Error in GET /featured-plans/active:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ACTIVE_PLANS_ERROR',
        message: error.message || 'خطا در دریافت پلن‌های فعال'
      }
    });
  }
});

/**
 * @route   GET /api/featured-plans/:id
 * @desc    دریافت جزئیات یک پلن
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    
    if (isNaN(planId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PLAN_ID',
          message: 'شناسه پلن نامعتبر است'
        }
      });
    }

    const plan = await featuredPlansService.getPlanById(planId);
    const pricing = await featuredPlansService.calculateFinalPrice(planId);
    
    res.json({
      success: true,
      data: {
        ...plan,
        pricing
      },
      message: 'جزئیات پلن با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('Error in GET /featured-plans/:id:', error);
    const statusCode = error.message.includes('یافت نشد') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'FETCH_PLAN_ERROR',
        message: error.message || 'خطا در دریافت جزئیات پلن'
      }
    });
  }
});

/**
 * @route   GET /api/featured-plans/:id/price
 * @desc    محاسبه قیمت نهایی پلن
 * @access  Public
 */
router.get('/:id/price', async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    
    if (isNaN(planId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PLAN_ID',
          message: 'شناسه پلن نامعتبر است'
        }
      });
    }

    const pricing = await featuredPlansService.calculateFinalPrice(planId);
    
    res.json({
      success: true,
      data: pricing,
      message: 'قیمت با موفقیت محاسبه شد'
    });
  } catch (error) {
    console.error('Error in GET /featured-plans/:id/price:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CALCULATE_PRICE_ERROR',
        message: error.message || 'خطا در محاسبه قیمت'
      }
    });
  }
});

// ==================== Admin Routes ====================

/**
 * @route   POST /api/admin/featured-plans
 * @desc    ایجاد پلن جدید
 * @access  Admin
 */
router.post('/admin/featured-plans', authenticateAdmin, async (req, res) => {
  try {
    const { name, name_en, duration_days, price, discount_percent, features, is_active, display_order } = req.body;

    // Validation
    if (!name || !name_en || !duration_days || price === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'لطفا تمام فیلدهای الزامی را پر کنید'
        }
      });
    }

    const plan = await featuredPlansService.createPlan({
      name,
      name_en,
      duration_days: parseInt(duration_days),
      price: parseFloat(price),
      discount_percent: discount_percent ? parseFloat(discount_percent) : 0,
      features: features || [],
      is_active: is_active !== false,
      display_order: display_order ? parseInt(display_order) : 0
    });

    res.status(201).json({
      success: true,
      data: plan,
      message: 'پلن با موفقیت ایجاد شد'
    });
  } catch (error) {
    console.error('Error in POST /admin/featured-plans:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_PLAN_ERROR',
        message: error.message || 'خطا در ایجاد پلن'
      }
    });
  }
});

/**
 * @route   PUT /api/admin/featured-plans/:id
 * @desc    ویرایش پلن
 * @access  Admin
 */
router.put('/admin/featured-plans/:id', authenticateAdmin, async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    
    if (isNaN(planId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PLAN_ID',
          message: 'شناسه پلن نامعتبر است'
        }
      });
    }

    const updateData = {};
    const allowedFields = ['name', 'name_en', 'duration_days', 'price', 'discount_percent', 'features', 'is_active', 'display_order'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'duration_days' || field === 'display_order') {
          updateData[field] = parseInt(req.body[field]);
        } else if (field === 'price' || field === 'discount_percent') {
          updateData[field] = parseFloat(req.body[field]);
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    const plan = await featuredPlansService.updatePlan(planId, updateData);

    res.json({
      success: true,
      data: plan,
      message: 'پلن با موفقیت بروزرسانی شد'
    });
  } catch (error) {
    console.error('Error in PUT /admin/featured-plans/:id:', error);
    const statusCode = error.message.includes('یافت نشد') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'UPDATE_PLAN_ERROR',
        message: error.message || 'خطا در بروزرسانی پلن'
      }
    });
  }
});

/**
 * @route   DELETE /api/admin/featured-plans/:id
 * @desc    حذف پلن
 * @access  Admin
 */
router.delete('/admin/featured-plans/:id', authenticateAdmin, async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    
    if (isNaN(planId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PLAN_ID',
          message: 'شناسه پلن نامعتبر است'
        }
      });
    }

    await featuredPlansService.deletePlan(planId);

    res.json({
      success: true,
      message: 'پلن با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Error in DELETE /admin/featured-plans/:id:', error);
    const statusCode = error.message.includes('یافت نشد') ? 404 : 
                       error.message.includes('در حال استفاده') ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'DELETE_PLAN_ERROR',
        message: error.message || 'خطا در حذف پلن'
      }
    });
  }
});

/**
 * @route   GET /api/admin/featured-plans/stats
 * @desc    دریافت آمار پلن‌ها
 * @access  Admin
 */
router.get('/admin/featured-plans/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await featuredPlansService.getPlansStats();

    res.json({
      success: true,
      data: stats,
      message: 'آمار پلن‌ها با موفقیت دریافت شد'
    });
  } catch (error) {
    console.error('Error in GET /admin/featured-plans/stats:', error);
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
