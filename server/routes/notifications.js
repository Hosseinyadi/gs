/**
 * روت‌های اعلان‌های کاربر
 */

const express = require('express');
const router = express.Router();
const { NotificationService } = require('../services/notificationService');
const { authenticateToken } = require('../middleware/auth');

// دریافت اعلان‌های کاربر
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { limit = 20, offset = 0, unreadOnly = false } = req.query;
        
        const notifications = await NotificationService.getUserNotifications(
            req.user.id,
            { 
                limit: parseInt(limit), 
                offset: parseInt(offset), 
                unreadOnly: unreadOnly === 'true' 
            }
        );
        
        const unreadCount = await NotificationService.getUnreadCount(req.user.id);
        
        res.json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت اعلان‌ها' });
    }
});

// تعداد اعلان‌های خوانده نشده
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const count = await NotificationService.getUnreadCount(req.user.id);
        res.json({ success: true, count });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت تعداد' });
    }
});

// علامت‌گذاری یک اعلان به عنوان خوانده شده
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const success = await NotificationService.markAsRead(req.params.id, req.user.id);
        
        if (!success) {
            return res.status(404).json({ success: false, message: 'اعلان یافت نشد' });
        }
        
        res.json({ success: true, message: 'اعلان خوانده شد' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی' });
    }
});

// علامت‌گذاری همه به عنوان خوانده شده
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        const count = await NotificationService.markAllAsRead(req.user.id);
        res.json({ success: true, message: `${count} اعلان خوانده شد` });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی' });
    }
});

// حذف یک اعلان
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const success = await NotificationService.delete(req.params.id, req.user.id);
        
        if (!success) {
            return res.status(404).json({ success: false, message: 'اعلان یافت نشد' });
        }
        
        res.json({ success: true, message: 'اعلان حذف شد' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ success: false, message: 'خطا در حذف' });
    }
});

module.exports = router;
