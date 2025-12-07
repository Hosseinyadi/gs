const express = require('express');
const { dbHelpers } = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// دریافت لیست شهرها (عمومی)
router.get('/', async (req, res) => {
    try {
        const cities = await dbHelpers.all(
            `SELECT c.id, c.name, p.name as province 
             FROM cities c 
             LEFT JOIN provinces p ON c.province_id = p.id 
             WHERE c.is_active = 1 
             ORDER BY c.name ASC`
        );
        
        res.json({
            success: true,
            data: { cities }
        });
    } catch (error) {
        console.error('Get cities error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// دریافت لیست شهرها برای ادمین
router.get('/admin', authenticateAdmin, async (req, res) => {
    try {
        const cities = await dbHelpers.all(
            `SELECT c.id, c.name, c.name_en, c.is_active, c.created_at, p.name as province 
             FROM cities c 
             LEFT JOIN provinces p ON c.province_id = p.id 
             ORDER BY c.name ASC`
        );
        
        res.json({
            success: true,
            data: { cities }
        });
    } catch (error) {
        console.error('Get admin cities error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// فعال/غیرفعال کردن شهر (ادمین)
router.put('/:id/toggle', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // بررسی وجود شهر
        const existingCity = await dbHelpers.get(
            'SELECT * FROM cities WHERE id = ?',
            [id]
        );
        
        if (!existingCity) {
            return res.status(404).json({
                success: false,
                message: 'شهر یافت نشد'
            });
        }
        
        const newStatus = !existingCity.is_active;
        
        await dbHelpers.run(
            'UPDATE cities SET is_active = ? WHERE id = ?',
            [newStatus, id]
        );
        
        res.json({
            success: true,
            message: `شهر ${newStatus ? 'فعال' : 'غیرفعال'} شد`
        });
    } catch (error) {
        console.error('Toggle city status error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

module.exports = router;