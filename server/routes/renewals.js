/**
 * روت‌های تمدید آگهی
 */

const express = require('express');
const router = express.Router();
const RenewalService = require('../services/renewalService');
const { authenticateToken } = require('../middleware/auth');

// دریافت تنظیمات تمدید (عمومی)
router.get('/settings', async (req, res) => {
    try {
        const settings = await RenewalService.getSettings();
        res.json({ success: true, settings });
    } catch (error) {
        console.error('Error fetching renewal settings:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت تنظیمات' });
    }
});

// بررسی وضعیت تمدید یک آگهی
router.get('/check/:listingId', authenticateToken, async (req, res) => {
    try {
        const { listingId } = req.params;
        
        const [expiryInfo, renewalInfo] = await Promise.all([
            RenewalService.isListingExpired(listingId),
            RenewalService.isRenewalFree(listingId)
        ]);
        
        res.json({
            success: true,
            ...expiryInfo,
            ...renewalInfo
        });
    } catch (error) {
        console.error('Error checking renewal status:', error);
        res.status(500).json({ success: false, message: 'خطا در بررسی وضعیت' });
    }
});

// ایجاد درخواست تمدید
router.post('/request', authenticateToken, async (req, res) => {
    try {
        const { listingId, paymentMethod, paymentProof } = req.body;
        
        if (!listingId) {
            return res.status(400).json({ success: false, message: 'شناسه آگهی الزامی است' });
        }
        
        const result = await RenewalService.createRenewalRequest(
            listingId,
            req.user.id,
            paymentMethod,
            paymentProof
        );
        
        res.json({
            success: true,
            message: result.isFree ? 'آگهی با موفقیت تمدید شد' : 'درخواست تمدید ثبت شد',
            renewal: result
        });
    } catch (error) {
        console.error('Error creating renewal request:', error);
        res.status(400).json({ success: false, message: error.message || 'خطا در ثبت درخواست' });
    }
});

// دریافت تاریخچه تمدید یک آگهی
router.get('/history/:listingId', authenticateToken, async (req, res) => {
    try {
        const { listingId } = req.params;
        const history = await RenewalService.getRenewalHistory(listingId);
        res.json({ success: true, history });
    } catch (error) {
        console.error('Error fetching renewal history:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت تاریخچه' });
    }
});

// دریافت آگهی‌های در حال انقضای کاربر
router.get('/expiring', authenticateToken, async (req, res) => {
    try {
        const { db } = require('../config/database');
        
        const listings = await new Promise((resolve, reject) => {
            db.all(
                `SELECT id, title, expires_at, status, renewal_count
                 FROM listings 
                 WHERE user_id = ? 
                   AND status IN ('active', 'expired')
                   AND expires_at IS NOT NULL
                 ORDER BY expires_at ASC`,
                [req.user.id],
                (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows || []);
                }
            );
        });
        
        // محاسبه روزهای باقی‌مانده
        const now = new Date();
        const result = listings.map(listing => {
            const expiresAt = new Date(listing.expires_at);
            const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
            return {
                ...listing,
                daysLeft,
                isExpired: daysLeft <= 0
            };
        });
        
        res.json({ success: true, listings: result });
    } catch (error) {
        console.error('Error fetching expiring listings:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت آگهی‌ها' });
    }
});

module.exports = router;
