const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Get all media files
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { search = '' } = req.query;

    // First, ensure media_files table exists
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS media_files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT NOT NULL,
          original_name TEXT NOT NULL,
          size INTEGER DEFAULT 0,
          mimetype TEXT,
          url TEXT NOT NULL,
          uploaded_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (uploaded_by) REFERENCES admins(id)
        )
      `, [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Also scan uploads directory for existing files
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const existingFiles = fs.readdirSync(uploadsDir);
      
      for (const filename of existingFiles) {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          // Check if file already exists in database
          const exists = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM media_files WHERE filename = ?', [filename], (err, row) => {
              if (err) reject(err);
              else resolve(row);
            });
          });

          if (!exists) {
            // Add to database
            const ext = path.extname(filename).toLowerCase();
            const mimetypes = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.gif': 'image/gif',
              '.webp': 'image/webp'
            };

            await new Promise((resolve, reject) => {
              db.run(`
                INSERT INTO media_files (filename, original_name, size, mimetype, url)
                VALUES (?, ?, ?, ?, ?)
              `, [
                filename,
                filename,
                stats.size,
                mimetypes[ext] || 'application/octet-stream',
                `/uploads/${filename}`
              ], (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          }
        }
      }
    }

    // Get files from database
    let query = 'SELECT * FROM media_files';
    const params = [];

    if (search) {
      query += ' WHERE original_name LIKE ? OR filename LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const files = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({
      success: true,
      data: { files }
    });
  } catch (error) {
    console.error('Error fetching media files:', error);
    res.status(500).json({ success: false, error: { message: 'خطا در دریافت فایل‌ها' } });
  }
});

// Delete media file
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;

    // Get file info
    const file = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM media_files WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!file) {
      return res.status(404).json({ success: false, error: { message: 'فایل یافت نشد' } });
    }

    // Delete from filesystem
    const filePath = path.join(__dirname, '..', '..', 'uploads', file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM media_files WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true, message: 'فایل حذف شد' });
  } catch (error) {
    console.error('Error deleting media file:', error);
    res.status(500).json({ success: false, error: { message: 'خطا در حذف فایل' } });
  }
});

module.exports = router;
