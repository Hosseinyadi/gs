const express = require('express');
const { body, validationResult } = require('express-validator');
const { dbHelpers } = require('../config/database');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Helpers
const getCardToCardConfig = () => {
  const number = process.env.CARD2CARD_NUMBER || '6037991234567890';
  const holder = process.env.CARD2CARD_HOLDER || 'گاراز سنگین';
  const bank = process.env.CARD2CARD_BANK || 'ملت';
  const pricePerDay = parseFloat(process.env.FEATURE_PRICE_PER_DAY || '200000'); // 200,000 IRR per day
  const paymentWindowMin = parseInt(process.env.CARD2CARD_WINDOW_MIN || '10', 10);
  return { number, holder, bank, pricePerDay, paymentWindowMin };
};

// GET card-to-card info
router.get('/card-to-card/info', (req, res) => {
  const { number, holder, bank, pricePerDay, paymentWindowMin } = getCardToCardConfig();
  res.json({
    success: true,
    data: { card_number: number, cardholder_name: holder, bank_name: bank, price_per_day: pricePerDay, payment_window_min: paymentWindowMin }
  });
});

// POST create card-to-card transaction for featuring
router.post('/feature/card-to-card', [
  body('listing_id').isInt({ min: 1 }).withMessage('شناسه آگهی نامعتبر است'),
  body('duration_days').optional().isInt({ min: 1, max: 90 }).withMessage('مدت ویژه‌سازی نامعتبر است')
], authenticateUser, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'اطلاعات نامعتبر است', errors: errors.array() });
    }

    const userId = req.user.id;
    const { listing_id } = req.body;
    const duration_days = parseInt(String(req.body.duration_days || 7), 10);
    const cfg = getCardToCardConfig();

    // Check listing exists and belongs to user
    const listing = await dbHelpers.get('SELECT id, user_id, is_featured FROM listings WHERE id = ?', [listing_id]);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'آگهی یافت نشد' });
    }
    if (listing.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'شما مجاز به ویژه کردن این آگهی نیستید' });
    }
    if (listing.is_featured) {
      return res.status(400).json({ success: false, message: 'این آگهی هم‌اکنون ویژه است' });
    }

    const amount = duration_days * cfg.pricePerDay;

    // Store transaction with JSON description
    const details = {
      method: 'card_to_card',
      listing_id,
      duration_days,
      price_per_day: cfg.pricePerDay
    };

    const tx = await dbHelpers.run(
      'INSERT INTO transactions (user_id, type, amount, status, description, reference_id) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, 'featured_ad', amount, 'pending', JSON.stringify(details), `feat:${listing_id}`]
    );

    const createdAtRow = await dbHelpers.get('SELECT created_at FROM transactions WHERE id = ?', [tx.id]);
    const createdAt = createdAtRow?.created_at ? new Date(createdAtRow.created_at) : new Date();
    const deadline = new Date(createdAt.getTime() + cfg.paymentWindowMin * 60 * 1000);

    return res.status(201).json({
      success: true,
      message: 'درخواست پرداخت ثبت شد',
      data: {
        transaction_id: tx.id,
        amount,
        duration_days,
        deadline: deadline.toISOString(),
        card: { number: cfg.number, holder: cfg.holder, bank: cfg.bank }
      }
    });
  } catch (error) {
    console.error('Create card2card tx error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// POST submit proof for card-to-card
router.post('/feature/card-to-card/confirm', [
  body('transaction_id').isInt({ min: 1 }).withMessage('شناسه تراکنش نامعتبر است'),
  body('proof_text').isLength({ min: 10, max: 2000 }).withMessage('توضیحات واریز نامعتبر است')
], authenticateUser, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'اطلاعات نامعتبر است', errors: errors.array() });
    }

    const userId = req.user.id;
    const { transaction_id, proof_text } = req.body;
    const cfg = getCardToCardConfig();

    const tx = await dbHelpers.get('SELECT * FROM transactions WHERE id = ? AND user_id = ?', [transaction_id, userId]);
    if (!tx) {
      return res.status(404).json({ success: false, message: 'تراکنش یافت نشد' });
    }
    if (tx.type !== 'featured_ad') {
      return res.status(400).json({ success: false, message: 'نوع تراکنش نامعتبر است' });
    }
    if (tx.status !== 'pending' && tx.status !== 'pending_review') {
      return res.status(400).json({ success: false, message: 'وضعیت تراکنش برای ثبت مستندات مجاز نیست' });
    }

    // Parse details to get listing_id, duration
    let details;
    try { details = tx.description ? JSON.parse(tx.description) : null; } catch (_) { details = null; }
    const listingId = details?.listing_id;
    const durationDays = details?.duration_days || 7;

    if (!listingId) {
      return res.status(400).json({ success: false, message: 'اطلاعات آگهی در تراکنش موجود نیست' });
    }

    // Check payment window
    const createdAt = tx.created_at ? new Date(tx.created_at) : new Date();
    const now = new Date();
    if (now.getTime() - createdAt.getTime() > cfg.paymentWindowMin * 60 * 1000) {
      return res.status(400).json({ success: false, message: 'مهلت پرداخت ۱۰ دقیقه‌ای به پایان رسیده است' });
    }

    // Create support inquiry
    const user = req.user;
    const msgLines = [
      'درخواست ویژه‌کردن آگهی - کارت به کارت',
      `شناسه تراکنش: ${transaction_id}`,
      `شناسه آگهی: ${listingId}`,
      `مبلغ واریزی: ${tx.amount} تومان`,
      `مدت ویژه‌سازی: ${durationDays} روز`,
      '---',
      'توضیحات واریز کاربر:',
      proof_text
    ];

    const inquiryResult = await dbHelpers.run(
      'INSERT INTO inquiries (ad_id, customer_name, customer_phone, customer_email, message, status) VALUES (?, ?, ?, ?, ?, "new")',
      [listingId, user.name || 'کاربر', user.phone || '', user.email || null, msgLines.join('\n')]
    );

    // Update transaction status to pending_review
    await dbHelpers.run('UPDATE transactions SET status = ? WHERE id = ?', ['pending_review', transaction_id]);

    return res.json({
      success: true,
      message: 'مستندات واریز ثبت شد و برای بررسی به پشتیبانی ارسال شد',
      data: { inquiry_id: inquiryResult.id }
    });
  } catch (error) {
    console.error('Confirm card2card error:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

module.exports = router;
