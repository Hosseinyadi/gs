const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const adminAuth = authenticateAdmin;

// Get support tickets
router.get('/tickets', adminAuth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { status, priority, search } = req.query;
    
    let query = `
      SELECT t.*, u.name as user_name 
      FROM support_tickets t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND t.status = ?';
      params.push(status);
    }

    if (priority && priority !== 'all') {
      query += ' AND t.priority = ?';
      params.push(priority);
    }

    if (search) {
      query += ' AND (t.subject LIKE ? OR t.message LIKE ? OR t.user_phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY t.created_at DESC LIMIT 100';

    const tickets = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({ success: true, data: tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.json({ success: true, data: [] });
  }
});

// Get support stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_tickets,
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_tickets,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'resolved' AND date(updated_at) = date('now') THEN 1 ELSE 0 END) as resolved_today
        FROM support_tickets
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row || {});
      });
    });

    res.json({ 
      success: true, 
      data: {
        ...stats,
        avg_response_time: '2 ساعت'
      }
    });
  } catch (error) {
    console.error('Error fetching support stats:', error);
    res.json({ 
      success: true, 
      data: {
        total_tickets: 0,
        open_tickets: 0,
        in_progress: 0,
        resolved_today: 0,
        avg_response_time: '-'
      }
    });
  }
});

// Reply to ticket
router.post('/tickets/:id/reply', adminAuth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { message } = req.body;
    const adminId = req.admin.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: { message: 'پیام پاسخ الزامی است' }
      });
    }

    // Add response
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO ticket_responses (ticket_id, admin_id, message, is_admin, created_at)
        VALUES (?, ?, ?, 1, datetime('now'))
      `, [id, adminId, message], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    // Update ticket status
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE support_tickets 
        SET status = 'in_progress', updated_at = datetime('now')
        WHERE id = ? AND status = 'open'
      `, [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });

    res.json({ success: true, message: 'پاسخ ارسال شد' });
  } catch (error) {
    console.error('Error replying to ticket:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در ارسال پاسخ' }
    });
  }
});

// Update ticket status
router.put('/tickets/:id/status', adminAuth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { status } = req.body;

    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE support_tickets 
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [status, id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });

    res.json({ success: true, message: 'وضعیت تیکت تغییر کرد' });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'خطا در تغییر وضعیت' }
    });
  }
});

module.exports = router;
