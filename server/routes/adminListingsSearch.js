const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');

// Advanced search listings
router.get('/search', authenticateAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const {
      query,
      status,
      category,
      province,
      dateFrom,
      dateTo,
      userId,
      priceMin,
      priceMax,
      isFeatured,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];

    // Build WHERE conditions
    if (query) {
      conditions.push(`(l.title LIKE ? OR l.description LIKE ? OR u.phone LIKE ? OR u.name LIKE ?)`);
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'all') {
      conditions.push('l.status = ?');
      params.push(status);
    }

    if (category && category !== 'all') {
      conditions.push('l.category_id = ?');
      params.push(category);
    }

    if (province && province !== 'all') {
      conditions.push('l.province = ?');
      params.push(province);
    }

    if (dateFrom) {
      conditions.push('date(l.created_at) >= ?');
      params.push(dateFrom);
    }

    if (dateTo) {
      conditions.push('date(l.created_at) <= ?');
      params.push(dateTo);
    }

    if (userId) {
      conditions.push('(l.user_id = ? OR u.phone LIKE ? OR u.name LIKE ?)');
      params.push(userId, `%${userId}%`, `%${userId}%`);
    }

    if (priceMin) {
      conditions.push('l.price >= ?');
      params.push(parseInt(priceMin));
    }

    if (priceMax) {
      conditions.push('l.price <= ?');
      params.push(parseInt(priceMax));
    }

    if (isFeatured && isFeatured !== 'all') {
      conditions.push('l.is_featured = ?');
      params.push(isFeatured === 'true' ? 1 : 0);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column
    const validSortColumns = ['created_at', 'price', 'view_count', 'title', 'status'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortDir = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as total
        FROM listings l
        LEFT JOIN users u ON l.user_id = u.id
        ${whereClause}
      `, params, (err, row) => {
        if (err) reject(err);
        else resolve(row?.total || 0);
      });
    });

    // Get listings
    const listings = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          l.id,
          l.title,
          l.price,
          l.status,
          l.province,
          l.city,
          l.view_count,
          l.is_featured,
          l.images,
          l.created_at,
          c.name as category_name,
          u.name as user_name,
          u.phone as user_phone
        FROM listings l
        LEFT JOIN categories c ON l.category_id = c.id
        LEFT JOIN users u ON l.user_id = u.id
        ${whereClause}
        ORDER BY l.${sortColumn} ${sortDir}
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Parse images JSON
    const parsedListings = listings.map(l => ({
      ...l,
      images: l.images ? JSON.parse(l.images) : [],
      is_featured: Boolean(l.is_featured)
    }));

    res.json({
      success: true,
      data: {
        listings: parsedListings,
        total: countResult,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error searching listings:', error);
    res.status(500).json({ success: false, error: { message: 'خطا در جستجو' } });
  }
});

// Export listings to CSV
router.get('/export', authenticateAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { query, status, category, province } = req.query;

    const conditions = [];
    const params = [];

    if (query) {
      conditions.push(`(l.title LIKE ? OR l.description LIKE ?)`);
      params.push(`%${query}%`, `%${query}%`);
    }

    if (status && status !== 'all') {
      conditions.push('l.status = ?');
      params.push(status);
    }

    if (category && category !== 'all') {
      conditions.push('l.category_id = ?');
      params.push(category);
    }

    if (province && province !== 'all') {
      conditions.push('l.province = ?');
      params.push(province);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const listings = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          l.id,
          l.title,
          l.price,
          l.status,
          l.province,
          l.city,
          l.view_count,
          l.is_featured,
          l.created_at,
          c.name as category_name,
          u.name as user_name,
          u.phone as user_phone
        FROM listings l
        LEFT JOIN categories c ON l.category_id = c.id
        LEFT JOIN users u ON l.user_id = u.id
        ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT 1000
      `, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Generate CSV
    const headers = ['شناسه', 'عنوان', 'قیمت', 'وضعیت', 'دسته‌بندی', 'استان', 'شهر', 'کاربر', 'تلفن', 'بازدید', 'ویژه', 'تاریخ'];
    const rows = listings.map(l => [
      l.id,
      `"${l.title?.replace(/"/g, '""') || ''}"`,
      l.price || 0,
      l.status,
      l.category_name || '',
      l.province || '',
      l.city || '',
      l.user_name || '',
      l.user_phone || '',
      l.view_count || 0,
      l.is_featured ? 'بله' : 'خیر',
      l.created_at
    ]);

    const csv = '\uFEFF' + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=listings.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting listings:', error);
    res.status(500).json({ success: false, error: { message: 'خطا در خروجی گرفتن' } });
  }
});

module.exports = router;
