const { dbHelpers } = require('../config/database');
const paymentConfig = require('../config/payment');
const featuredPlansService = require('./featuredPlans');
const notificationService = require('./notification');
const emailService = require('./emailService');
const smsService = require('./smsService');

class PaymentService {
  /**
   * شروع پرداخت
   */
  async initiatePayment(userId, listingId, planId, method = 'gateway', gatewayName = null) {
    try {
      // Validate inputs
      if (!userId || !listingId || !planId) {
        throw new Error('اطلاعات ناقص است');
      }

      // Check if payment method is enabled
      const isEnabled = await paymentConfig.isPaymentMethodEnabled(method);
      if (!isEnabled) {
        throw new Error('این روش پرداخت غیرفعال است');
      }

      // Get plan details
      const plan = await featuredPlansService.getPlanById(planId);
      if (!plan.is_active) {
        throw new Error('این پلن غیرفعال است');
      }

      // Calculate final price
      const pricing = await featuredPlansService.calculateFinalPrice(planId);
      const amount = pricing.final_price;

      // Validate amount
      const amountValidation = await paymentConfig.validateAmount(amount);
      if (!amountValidation.valid) {
        throw new Error(amountValidation.message);
      }

      // Check if listing exists and belongs to user
      const listing = await dbHelpers.get(
        'SELECT id, user_id, title FROM listings WHERE id = ?',
        [listingId]
      );

      if (!listing) {
        throw new Error('آگهی یافت نشد');
      }

      if (listing.user_id !== userId) {
        throw new Error('شما مالک این آگهی نیستید');
      }

      // Create payment record
      const result = await dbHelpers.run(
        `INSERT INTO payments 
        (user_id, listing_id, plan_id, amount, payment_method, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
        [userId, listingId, planId, amount, method]
      );

      const paymentId = result.id;

      // If gateway payment, initiate with gateway
      if (method === 'gateway') {
        const gateway = await paymentConfig.getGateway(gatewayName);
        const callbackUrl = paymentConfig.getCallbackUrl();

        const gatewayResponse = await gateway.request(amount, callbackUrl, {
          description: `ویژه‌سازی آگهی: ${listing.title}`,
          mobile: '', // Can be added from user profile
          email: ''
        });

        // Update payment with gateway info
        await dbHelpers.run(
          `UPDATE payments 
          SET gateway_name = ?, authority = ?, transaction_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
          [gateway.getName(), gatewayResponse.authority, gatewayResponse.authority, paymentId]
        );

        return {
          payment_id: paymentId,
          amount: amount,
          gateway_name: gateway.getName(),
          authority: gatewayResponse.authority,
          payment_url: gatewayResponse.paymentUrl
        };
      }

      // For card transfer, return payment info
      if (method === 'card_transfer') {
        const cardInfo = await paymentConfig.getCardTransferInfo();
        return {
          payment_id: paymentId,
          amount: amount,
          card_info: cardInfo
        };
      }

      return {
        payment_id: paymentId,
        amount: amount
      };
    } catch (error) {
      console.error('Error initiating payment:', error);
      throw error;
    }
  }

  /**
   * تایید پرداخت از درگاه (Callback)
   */
  async verifyPayment(authority, status) {
    try {
      // Find payment by authority
      const payment = await dbHelpers.get(
        'SELECT * FROM payments WHERE authority = ? AND payment_method = ?',
        [authority, 'gateway']
      );

      if (!payment) {
        throw new Error('پرداخت یافت نشد');
      }

      // Check if already verified
      if (payment.status === 'completed') {
        return {
          success: true,
          already_verified: true,
          payment_id: payment.id,
          ref_id: payment.ref_id
        };
      }

      // If status is not OK, mark as failed
      if (status !== 'OK') {
        await dbHelpers.run(
          'UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['failed', payment.id]
        );

        await notificationService.createNotification(payment.user_id, {
          title: 'پرداخت ناموفق',
          message: 'پرداخت شما ناموفق بود. لطفا دوباره تلاش کنید.',
          type: 'error',
          category: 'payment',
          related_id: payment.id
        });

        return {
          success: false,
          message: 'پرداخت توسط کاربر لغو شد'
        };
      }

      // Verify with gateway
      const gateway = await paymentConfig.getGateway(payment.gateway_name);
      const verifyResult = await gateway.verify(authority, payment.amount);

      if (verifyResult.success) {
        // Update payment status
        await dbHelpers.run(
          `UPDATE payments 
          SET status = ?, ref_id = ?, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
          ['completed', verifyResult.refId, payment.id]
        );

        // Check if auto-approve is enabled
        const autoApprove = await paymentConfig.isAutoApproveEnabled();
        if (autoApprove) {
          // Make listing featured
          await this.makeFeaturedAfterPayment(payment.id);
        }

        // Send notification
        await notificationService.createNotification(payment.user_id, {
          title: 'پرداخت موفق',
          message: `پرداخت شما با موفقیت انجام شد. شماره پیگیری: ${verifyResult.refId}`,
          type: 'success',
          category: 'payment',
          related_id: payment.id
        });

        // Send email and SMS notifications
        try {
          const user = await dbHelpers.get('SELECT * FROM users WHERE id = ?', [payment.user_id]);
          const listing = await dbHelpers.get('SELECT * FROM listings WHERE id = ?', [payment.listing_id]);
          
          if (user && listing) {
            // Send email
            await emailService.sendPaymentSuccessEmail(user, {
              ...payment,
              ref_id: verifyResult.refId,
              final_amount: payment.amount
            }, listing);
            
            // Send SMS
            await smsService.sendPaymentSuccessSMS(user.phone, {
              ...payment,
              ref_id: verifyResult.refId,
              final_amount: payment.amount
            }, listing);
          }
        } catch (error) {
          console.error('Notification send error:', error);
          // Don't fail the payment if notification fails
        }

        return {
          success: true,
          payment_id: payment.id,
          ref_id: verifyResult.refId,
          auto_approved: autoApprove
        };
      } else {
        // Mark as failed
        await dbHelpers.run(
          'UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['failed', payment.id]
        );

        await notificationService.createNotification(payment.user_id, {
          title: 'تایید پرداخت ناموفق',
          message: verifyResult.message || 'تایید پرداخت با خطا مواجه شد',
          type: 'error',
          category: 'payment',
          related_id: payment.id
        });

        return {
          success: false,
          message: verifyResult.message || 'تایید پرداخت ناموفق بود'
        };
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * ثبت پرداخت کارت به کارت
   */
  async createCardTransferPayment(userId, listingId, planId, receiptImage) {
    try {
      // Check if card transfer is enabled
      const isEnabled = await paymentConfig.isPaymentMethodEnabled('card_transfer');
      if (!isEnabled) {
        throw new Error('پرداخت کارت به کارت غیرفعال است');
      }

      // Get plan and calculate price
      const plan = await featuredPlansService.getPlanById(planId);
      const pricing = await featuredPlansService.calculateFinalPrice(planId);
      const amount = pricing.final_price;

      // Check listing
      const listing = await dbHelpers.get(
        'SELECT id, user_id FROM listings WHERE id = ? AND user_id = ?',
        [listingId, userId]
      );

      if (!listing) {
        throw new Error('آگهی یافت نشد یا متعلق به شما نیست');
      }

      // Create payment record
      const result = await dbHelpers.run(
        `INSERT INTO payments 
        (user_id, listing_id, plan_id, amount, payment_method, receipt_image, status, created_at)
        VALUES (?, ?, ?, ?, 'card_transfer', ?, 'pending', CURRENT_TIMESTAMP)`,
        [userId, listingId, planId, amount, receiptImage]
      );

      // Send notification to user
      await notificationService.createNotification(userId, {
        title: 'رسید پرداخت دریافت شد',
        message: 'رسید پرداخت شما دریافت شد و در انتظار تایید مدیر است.',
        type: 'info',
        category: 'payment',
        related_id: result.id
      });

      return {
        payment_id: result.id,
        status: 'pending',
        message: 'رسید پرداخت با موفقیت ثبت شد و در انتظار تایید است'
      };
    } catch (error) {
      console.error('Error creating card transfer payment:', error);
      throw error;
    }
  }

  /**
   * تایید پرداخت توسط مدیر
   */
  async approvePayment(paymentId, adminId) {
    try {
      const payment = await this.getPaymentById(paymentId);

      if (payment.status === 'completed') {
        throw new Error('این پرداخت قبلاً تایید شده است');
      }

      if (payment.status === 'rejected') {
        throw new Error('این پرداخت رد شده است');
      }

      // Update payment status
      await dbHelpers.run(
        `UPDATE payments 
        SET status = ?, verified_by = ?, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        ['completed', adminId, paymentId]
      );

      // Make listing featured
      await this.makeFeaturedAfterPayment(paymentId);

      // Send notification
      await notificationService.createNotification(payment.user_id, {
        title: 'پرداخت تایید شد',
        message: 'پرداخت شما توسط مدیر تایید شد و آگهی شما ویژه شد.',
        type: 'success',
        category: 'payment',
        related_id: paymentId
      });

      return {
        success: true,
        message: 'پرداخت با موفقیت تایید شد'
      };
    } catch (error) {
      console.error('Error approving payment:', error);
      throw error;
    }
  }

  /**
   * رد پرداخت توسط مدیر
   */
  async rejectPayment(paymentId, adminId, reason) {
    try {
      const payment = await this.getPaymentById(paymentId);

      if (payment.status === 'completed') {
        throw new Error('نمی‌توان پرداخت تایید شده را رد کرد');
      }

      // Update payment status
      await dbHelpers.run(
        `UPDATE payments 
        SET status = ?, rejection_reason = ?, verified_by = ?, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        ['rejected', reason, adminId, paymentId]
      );

      // Send notification
      await notificationService.createNotification(payment.user_id, {
        title: 'پرداخت رد شد',
        message: `پرداخت شما رد شد. دلیل: ${reason}`,
        type: 'warning',
        category: 'payment',
        related_id: paymentId
      });

      return {
        success: true,
        message: 'پرداخت رد شد'
      };
    } catch (error) {
      console.error('Error rejecting payment:', error);
      throw error;
    }
  }

  /**
   * ویژه کردن آگهی بعد از پرداخت موفق
   */
  async makeFeaturedAfterPayment(paymentId) {
    try {
      const payment = await this.getPaymentById(paymentId);
      const plan = await featuredPlansService.getPlanById(payment.plan_id);

      // Calculate start and end dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration_days);

      // Check if listing already has active featured
      const existingFeatured = await dbHelpers.get(
        'SELECT id FROM featured_listings WHERE listing_id = ? AND end_date > CURRENT_TIMESTAMP',
        [payment.listing_id]
      );

      if (existingFeatured) {
        // Extend existing featured
        await dbHelpers.run(
          `UPDATE featured_listings 
          SET end_date = datetime(end_date, '+${plan.duration_days} days'), updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
          [existingFeatured.id]
        );
      } else {
        // Create new featured listing
        await dbHelpers.run(
          `INSERT INTO featured_listings 
          (listing_id, plan_id, payment_id, start_date, end_date, created_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [payment.listing_id, payment.plan_id, paymentId, startDate.toISOString(), endDate.toISOString()]
        );
      }

      return true;
    } catch (error) {
      console.error('Error making featured after payment:', error);
      throw error;
    }
  }

  /**
   * دریافت جزئیات یک پرداخت
   */
  async getPaymentById(paymentId) {
    try {
      const payment = await dbHelpers.get(
        `SELECT p.*, 
         u.phone as user_phone,
         l.title as listing_title,
         fp.name as plan_name,
         fp.duration_days
         FROM payments p
         LEFT JOIN users u ON p.user_id = u.id
         LEFT JOIN listings l ON p.listing_id = l.id
         LEFT JOIN featured_plans fp ON p.plan_id = fp.id
         WHERE p.id = ?`,
        [paymentId]
      );

      if (!payment) {
        throw new Error('پرداخت یافت نشد');
      }

      return payment;
    } catch (error) {
      console.error('Error getting payment by id:', error);
      throw error;
    }
  }

  /**
   * دریافت پرداخت‌های کاربر
   */
  async getUserPayments(userId, filters = {}) {
    try {
      let query = `
        SELECT p.*, 
        l.title as listing_title,
        fp.name as plan_name,
        fp.duration_days
        FROM payments p
        LEFT JOIN listings l ON p.listing_id = l.id
        LEFT JOIN featured_plans fp ON p.plan_id = fp.id
        WHERE p.user_id = ?
      `;
      const params = [userId];

      if (filters.status) {
        query += ' AND p.status = ?';
        params.push(filters.status);
      }

      if (filters.payment_method) {
        query += ' AND p.payment_method = ?';
        params.push(filters.payment_method);
      }

      query += ' ORDER BY p.created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const payments = await dbHelpers.all(query, params);
      return payments;
    } catch (error) {
      console.error('Error getting user payments:', error);
      throw new Error('خطا در دریافت لیست پرداخت‌ها');
    }
  }

  /**
   * دریافت تمام پرداخت‌ها (Admin)
   */
  async getAllPayments(filters = {}) {
    try {
      let query = `
        SELECT p.*, 
        u.phone as user_phone,
        l.title as listing_title,
        fp.name as plan_name
        FROM payments p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN listings l ON p.listing_id = l.id
        LEFT JOIN featured_plans fp ON p.plan_id = fp.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.status) {
        query += ' AND p.status = ?';
        params.push(filters.status);
      }

      if (filters.payment_method) {
        query += ' AND p.payment_method = ?';
        params.push(filters.payment_method);
      }

      if (filters.user_id) {
        query += ' AND p.user_id = ?';
        params.push(filters.user_id);
      }

      if (filters.start_date) {
        query += ' AND p.created_at >= ?';
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        query += ' AND p.created_at <= ?';
        params.push(filters.end_date);
      }

      query += ' ORDER BY p.created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const payments = await dbHelpers.all(query, params);
      return payments;
    } catch (error) {
      console.error('Error getting all payments:', error);
      throw new Error('خطا در دریافت لیست پرداخت‌ها');
    }
  }

  /**
   * دریافت پرداخت‌های در انتظار تایید
   */
  async getPendingPayments() {
    try {
      return await this.getAllPayments({ 
        status: 'pending',
        payment_method: 'card_transfer'
      });
    } catch (error) {
      console.error('Error getting pending payments:', error);
      throw error;
    }
  }

  /**
   * دریافت آمار پرداخت‌ها
   */
  async getPaymentStats(filters = {}) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (filters.start_date) {
        whereClause += ' AND created_at >= ?';
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        whereClause += ' AND created_at <= ?';
        params.push(filters.end_date);
      }

      const stats = await dbHelpers.get(`
        SELECT 
          COUNT(*) as total_payments,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_payments,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_payments,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_payments,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
          AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as average_payment
        FROM payments
        ${whereClause}
      `, params);

      const methodStats = await dbHelpers.all(`
        SELECT 
          payment_method,
          COUNT(*) as count,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as revenue
        FROM payments
        ${whereClause}
        GROUP BY payment_method
      `, params);

      return {
        ...stats,
        by_method: methodStats
      };
    } catch (error) {
      console.error('Error getting payment stats:', error);
      throw new Error('خطا در دریافت آمار پرداخت‌ها');
    }
  }
}

module.exports = new PaymentService();


