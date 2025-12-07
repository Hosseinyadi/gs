const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');

// دریافت همه صفحات استاتیک
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    db.all('SELECT * FROM static_pages ORDER BY id', [], (err, pages) => {
      if (err) {
        console.error('Error fetching static pages:', err);
        return res.status(500).json({ success: false, message: 'خطا در دریافت صفحات' });
      }
      
      res.json({ success: true, data: { pages: pages || [] } });
    });
  } catch (error) {
    console.error('Error in get static pages:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// بروزرسانی یک صفحه استاتیک
router.put('/:slug', authenticateAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, content, meta_title, meta_description, is_active } = req.body;
    const db = req.app.locals.db;
    
    db.run(
      `UPDATE static_pages 
       SET title = ?, content = ?, meta_title = ?, meta_description = ?, 
           is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE slug = ?`,
      [title, content, meta_title || title, meta_description || '', is_active !== false ? 1 : 0, slug],
      function(err) {
        if (err) {
          console.error('Error updating static page:', err);
          return res.status(500).json({ success: false, message: 'خطا در بروزرسانی صفحه' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ success: false, message: 'صفحه یافت نشد' });
        }
        
        res.json({ success: true, message: 'صفحه با موفقیت بروزرسانی شد' });
      }
    );
  } catch (error) {
    console.error('Error in update static page:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

module.exports = router;
