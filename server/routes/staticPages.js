const express = require('express');
const router = express.Router();

// دریافت یک صفحه استاتیک با slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const db = req.app.locals.db;
    
    db.get(
      'SELECT * FROM static_pages WHERE slug = ? AND is_active = 1',
      [slug],
      (err, page) => {
        if (err) {
          console.error('Error fetching static page:', err);
          return res.status(500).json({ success: false, message: 'خطا در دریافت صفحه' });
        }
        
        if (!page) {
          return res.status(404).json({ success: false, message: 'صفحه یافت نشد' });
        }
        
        res.json({ success: true, data: { page } });
      }
    );
  } catch (error) {
    console.error('Error in get static page:', error);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// دریافت همه صفحات استاتیک (برای مدیریت)
router.get('/', async (req, res) => {
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

module.exports = router;
