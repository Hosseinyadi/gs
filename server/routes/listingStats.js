/**
 * روت‌های آمار بازدید آگهی‌ها
 */

const express = require('express');
const router = express.Router();
const ListingStatsService = require('../services/listingStatsService');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// ثبت بازدید آگهی (عمومی)
router.post('/:listingId/view', optionalAuth, async (req, res) => {
    try {
        const { listingId } = req.params;
        const userId = req.user?.id || null;
        const ip = req.ip || req.connection.remoteAddress;
        
        const result = await ListingStatsService.recordView(listingId, userId, ip);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error recording view:', error);
        res.status(500).json({ success: false, message: 'خطا در ثبت بازدید' });
    }
});

// ثبت کلیک روی اطلاعات تماس
router.post('/:listingId/contact-click', async (req, res) => {
    try {
        const { listingId } = req.params;
        await ListingStatsService.recordContactClick(listingId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error recording contact click:', error);
        res.status(500).json({ success: false, message: 'خطا در ثبت' });
    }
});

// ثبت افزودن به علاقه‌مندی
router.post('/:listingId/favorite', authenticateToken, async (req, res) => {
    try {
        const { listingId } = req.params;
        await ListingStatsService.recordFavorite(listingId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error recording favorite:', error);
        res.status(500).json({ success: false, message: 'خطا در ثبت' });
    }
});

// دریافت آمار روزانه یک آگهی (فقط مالک)
router.get('/:listingId/daily', authenticateToken, async (req, res) => {
    try {
        const { listingId } = req.params;
        const { days = 7 } = req.query;
        
        // TODO: بررسی مالکیت آگهی
        
        const stats = await ListingStatsService.getDailyStats(listingId, parseInt(days));
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error fetching daily stats:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت آمار' });
    }
});

// دریافت آمار هفتگی یک آگهی
router.get('/:listingId/weekly', authenticateToken, async (req, res) => {
    try {
        const { listingId } = req.params;
        const { weeks = 4 } = req.query;
        
        const stats = await ListingStatsService.getWeeklyStats(listingId, parseInt(weeks));
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error fetching weekly stats:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت آمار' });
    }
});

// دریافت خلاصه آمار یک آگهی
router.get('/:listingId/summary', authenticateToken, async (req, res) => {
    try {
        const { listingId } = req.params;
        const summary = await ListingStatsService.getStatsSummary(listingId);
        res.json({ success: true, summary });
    } catch (error) {
        console.error('Error fetching stats summary:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت آمار' });
    }
});

// دریافت آمار همه آگهی‌های کاربر
router.get('/my-listings', authenticateToken, async (req, res) => {
    try {
        const stats = await ListingStatsService.getUserListingsStats(req.user.id);
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error fetching user listings stats:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت آمار' });
    }
});

// پرطرفدارترین آگهی‌ها (عمومی)
router.get('/top', async (req, res) => {
    try {
        const { limit = 10, days = 7 } = req.query;
        const listings = await ListingStatsService.getTopListings(parseInt(limit), parseInt(days));
        res.json({ success: true, listings });
    } catch (error) {
        console.error('Error fetching top listings:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت' });
    }
});

module.exports = router;
