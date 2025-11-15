const { dbHelpers } = require('../config/database');
const notificationService = require('./notification');

/**
 * Check and expire pending payments that have timed out
 */
async function checkPendingPayments() {
  try {
    const timeout = 30; // 30 minutes
    
    console.log('🕐 Checking for expired pending payments...');
    
    const expiredPayments = await dbHelpers.all(`
      SELECT 
        p.*,
        l.title as listing_title,
        u.phone as user_phone
      FROM payments p
      LEFT JOIN listings l ON p.listing_id = l.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.status = 'pending'
      AND p.payment_method = 'gateway'
      AND datetime(p.created_at, '+${timeout} minutes') < datetime('now')
    `);

    if (expiredPayments.length === 0) {
      console.log('✅ No expired pending payments found');
      return { expired: 0 };
    }

    console.log(`⚠️  Found ${expiredPayments.length} expired pending payments`);

    for (const payment of expiredPayments) {
      // Update payment status to expired
      await dbHelpers.run(
        'UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['expired', payment.id]
      );

      // Send notification to user
      if (payment.user_id) {
        await notificationService.createNotification(payment.user_id, {
          title: 'پرداخت منقضی شد',
          message: `زمان پرداخت برای آگهی "${payment.listing_title || 'نامشخص'}" به پایان رسید. لطفا دوباره تلاش کنید.`,
          type: 'warning',
          category: 'payment',
          related_id: payment.id
        });
      }

      console.log(`   ⏰ Expired payment #${payment.id} for user ${payment.user_phone || payment.user_id}`);
    }

    console.log(`✅ Expired ${expiredPayments.length} pending payments`);
    
    return {
      expired: expiredPayments.length,
      payments: expiredPayments.map(p => ({
        id: p.id,
        user_id: p.user_id,
        amount: p.amount,
        created_at: p.created_at
      }))
    };
  } catch (error) {
    console.error('❌ Error checking pending payments:', error);
    throw error;
  }
}

/**
 * Get statistics about pending payments
 */
async function getPendingPaymentsStats() {
  try {
    const stats = await dbHelpers.get(`
      SELECT 
        COUNT(*) as total_pending,
        SUM(amount) as total_amount,
        COUNT(CASE WHEN datetime(created_at, '+30 minutes') < datetime('now') THEN 1 END) as expired_count,
        COUNT(CASE WHEN datetime(created_at, '+30 minutes') >= datetime('now') THEN 1 END) as active_count
      FROM payments
      WHERE status = 'pending'
      AND payment_method = 'gateway'
    `);

    return stats;
  } catch (error) {
    console.error('Error getting pending payments stats:', error);
    return null;
  }
}

module.exports = {
  checkPendingPayments,
  getPendingPaymentsStats
};
