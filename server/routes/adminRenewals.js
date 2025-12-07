/**
 * روت‌های مدیریت تمدید آگهی (پنل ادمین)
 */

const express = require('express');
const router = express.Router();
const RenewalService = require('../services/renewalService');
const { authenticateAdmin } = require('../middleware/auth');
const { db } = require('../config/database');

// دریافت درخواست‌های تمدید در انتظار
router.get('/pending', authenticateAdmin, async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        const renewals = await RenewalService.getPendingRenewals({ 
            limit: parseInt(limit), 
            offset: parseInt(offset) 
        });
        
        // تعداد کل
        const countResult = await new Promise((resolve, reject) => {
            db.get(
                `SELECT COUNT(*) as count FROM listing_renewals WHERE status = 'pending'`,
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row?.count || 0);
                }
            );
        });
        
        res.json({ 
            success: true, 
            renewals,
            total: countResult
        });
    } catch (error) {
        console.error('Error fetching pending renewals:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت درخواست‌ها' });
    }
});

// دریافت همه درخواست‌های تمدید
router.get('/all', authenticateAdmin, async (req, res) => {
    try {
        const { limit = 20, offset = 0, status } = req.query;
        
        let query = `
            SELECT r.*, l.title as listing_title, l.images, u.phone as user_phone, u.name as user_name,
                   a.name as admin_name
            FROM listing_renewals r
            JOIN listings l ON l.id = r.listing_id
            JOIN users u ON u.id = r.user_id
            LEFT JOIN admin_users a ON a.id = r.processed_by
        `;
        const params = [];
        
        if (status) {
            query += ` WHERE r.status = ?`;
            params.push(status);
        }
        
        query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));
        
        const renewals = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) return reject(err);
                resolve(rows || []);
            });
        });
        
        res.json({ success: true, renewals });
    } catch (error) {
        console.error('Error fetching all renewals:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت درخواست‌ها' });
    }
});

// تایید درخواست تمدید
router.post('/:id/approve', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNote } = req.body;
        
        await RenewalService.approveRenewal(id, req.admin.id, adminNote);
        
        res.json({ success: true, message: 'درخواست تمدید تایید شد' });
    } catch (error) {
        console.error('Error approving renewal:', error);
        res.status(400).json({ success: false, message: error.message || 'خطا در تایید' });
    }
});

// رد درخواست تمدید
router.post('/:id/reject', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        if (!reason) {
            return res.status(400).json({ success: false, message: 'دلیل رد الزامی است' });
        }
        
        await RenewalService.rejectRenewal(id, req.admin.id, reason);
        
        res.json({ success: true, message: 'درخواست تمدید رد شد' });
    } catch (error) {
        console.error('Error rejecting renewal:', error);
        res.status(400).json({ success: false, message: error.message || 'خطا در رد' });
    }
});

// دریافت تنظیمات تمدید
router.get('/settings', authenticateAdmin, async (req, res) => {
    try {
        const settings = await RenewalService.getSettings();
        res.json({ success: true, settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت تنظیمات' });
    }
});

// به‌روزرسانی تنظیمات تمدید
router.put('/settings', authenticateAdmin, async (req, res) => {
    try {
        const { listing_duration_days, renewal_price, free_renewal_count, expiry_warning_days, renewal_duration_days } = req.body;
        
        await RenewalService.updateSettings({
            listing_duration_days,
            renewal_price,
            free_renewal_count,
            expiry_warning_days,
            renewal_duration_days
        });
        
        res.json({ success: true, message: 'تنظیمات به‌روزرسانی شد' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی' });
    }
});

// آمار تمدیدها
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const stats = await new Promise((resolve, reject) => {
            db.get(
                `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                    SUM(CASE WHEN renewal_type = 'free' THEN 1 ELSE 0 END) as free_renewals,
                    SUM(CASE WHEN renewal_type = 'paid' THEN 1 ELSE 0 END) as paid_renewals,
                    SUM(CASE WHEN status = 'approved' AND renewal_type = 'paid' THEN amount ELSE 0 END) as total_revenue
                 FROM listing_renewals`,
                (err, row) => {
                    if (err) return reject(err);
                    resolve(row || {});
                }
            );
        });
        
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error fetching renewal stats:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت آمار' });
    }
});

// آگهی‌های در حال انقضا
router.get('/expiring-listings', authenticateAdmin, async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const listings = await RenewalService.getExpiringListings(parseInt(days));
        res.json({ success: true, listings });
    } catch (error) {
        console.error('Error fetching expiring listings:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت آگهی‌ها' });
    }
});

// اجرای دستی منقضی کردن آگهی‌ها
router.post('/expire-old', authenticateAdmin, async (req, res) => {
    try {
        const result = await RenewalService.expireOldListings();
        res.json({ success: true, message: `${result.expired} آگهی منقضی شد` });
    } catch (error) {
        console.error('Error expiring listings:', error);
        res.status(500).json({ success: false, message: 'خطا در منقضی کردن' });
    }
});

// ارسال دستی یادآوری‌ها
router.post('/send-reminders', authenticateAdmin, async (req, res) => {
    try {
        const result = await RenewalService.sendExpiryReminders();
        res.json({ success: true, message: `${result.sent} یادآوری ارسال شد` });
    } catch (error) {
        console.error('Error sending reminders:', error);
        res.status(500).json({ success: false, message: 'خطا در ارسال یادآوری' });
    }
});

module.exports = router;
