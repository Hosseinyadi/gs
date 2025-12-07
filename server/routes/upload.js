/**
 * Upload Routes
 * آپلود فایل با اسکن امنیتی و واترمارک
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateUser, optionalAuth } = require('../middleware/auth');
const fileSecurityService = require('../services/fileSecurityService');
const watermarkService = require('../services/watermarkService');

// تنظیمات ذخیره‌سازی
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // پاکسازی نام فایل
    const safeName = fileSecurityService.sanitizeFilename(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(safeName);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// فیلتر فایل
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('فقط فایل‌های تصویری (JPG, PNG, GIF, WebP) مجاز هستند'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // حداکثر 10 فایل
  },
  fileFilter: fileFilter
});

/**
 * آپلود تک تصویر
 * POST /api/upload/image
 */
router.post('/image', authenticateUser, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'فایلی آپلود نشده است'
      });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;

    // 1. اسکن امنیتی فایل
    console.log('🔍 Scanning file for security threats...');
    const scanResult = await fileSecurityService.scanFile(filePath, originalName);

    if (!scanResult.safe) {
      // حذف فایل خطرناک
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Error deleting unsafe file:', e);
      }

      console.log('⚠️ Security threat detected:', scanResult.threats);
      return res.status(400).json({
        success: false,
        message: 'فایل آپلود شده امن نیست',
        threats: scanResult.threats
      });
    }

    console.log('✅ File passed security scan');

    // 2. اضافه کردن واترمارک
    console.log('🖼️ Adding watermark...');
    const watermarkResult = await watermarkService.addTextWatermark(filePath);
    
    if (watermarkResult.success) {
      console.log('✅ Watermark added successfully');
    } else {
      console.log('⚠️ Watermark failed, continuing without watermark');
    }

    // 3. ساخت URL فایل
    const fileUrl = `/uploads/images/${req.file.filename}`;

    res.json({
      success: true,
      message: 'تصویر با موفقیت آپلود شد',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: originalName,
        size: req.file.size,
        mimetype: req.file.mimetype,
        securityScan: {
          safe: true,
          hash: scanResult.fileInfo.hash
        },
        watermark: watermarkResult.success
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // حذف فایل در صورت خطا
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }

    res.status(500).json({
      success: false,
      message: error.message || 'خطا در آپلود فایل'
    });
  }
});

/**
 * آپلود چند تصویر
 * POST /api/upload/images
 */
router.post('/images', authenticateUser, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'فایلی آپلود نشده است'
      });
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        // 1. اسکن امنیتی
        const scanResult = await fileSecurityService.scanFile(file.path, file.originalname);

        if (!scanResult.safe) {
          // حذف فایل خطرناک
          try {
            fs.unlinkSync(file.path);
          } catch (e) {}

          errors.push({
            filename: file.originalname,
            error: 'فایل امن نیست',
            threats: scanResult.threats
          });
          continue;
        }

        // 2. اضافه کردن واترمارک
        await watermarkService.addTextWatermark(file.path);

        // 3. اضافه به نتایج
        results.push({
          url: `/uploads/images/${file.filename}`,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size
        });

      } catch (error) {
        errors.push({
          filename: file.originalname,
          error: error.message
        });

        // حذف فایل در صورت خطا
        try {
          fs.unlinkSync(file.path);
        } catch (e) {}
      }
    }

    res.json({
      success: true,
      message: `${results.length} تصویر آپلود شد`,
      data: {
        uploaded: results,
        errors: errors,
        total: req.files.length,
        successful: results.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Multiple upload error:', error);

    // حذف همه فایل‌ها در صورت خطا
    if (req.files) {
      for (const file of req.files) {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {}
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || 'خطا در آپلود فایل‌ها'
    });
  }
});

/**
 * بررسی امنیت فایل (بدون آپلود)
 * POST /api/upload/scan
 */
router.post('/scan', authenticateUser, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'فایلی ارسال نشده است'
      });
    }

    const scanResult = await fileSecurityService.scanFile(req.file.path, req.file.originalname);

    // حذف فایل بعد از اسکن
    try {
      fs.unlinkSync(req.file.path);
    } catch (e) {}

    res.json({
      success: true,
      data: {
        safe: scanResult.safe,
        threats: scanResult.threats,
        fileInfo: scanResult.fileInfo,
        scannedAt: scanResult.scannedAt
      }
    });

  } catch (error) {
    console.error('Scan error:', error);

    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }

    res.status(500).json({
      success: false,
      message: 'خطا در اسکن فایل'
    });
  }
});

/**
 * حذف تصویر
 * DELETE /api/upload/image/:filename
 */
router.delete('/image/:filename', authenticateUser, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // پاکسازی نام فایل برای جلوگیری از path traversal
    const safeName = path.basename(filename);
    const filePath = path.join(__dirname, '..', 'uploads', 'images', safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'فایل یافت نشد'
      });
    }

    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'فایل حذف شد'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف فایل'
    });
  }
});

// Error handler for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'حجم فایل بیش از حد مجاز است (حداکثر 10MB)'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'تعداد فایل‌ها بیش از حد مجاز است (حداکثر 10 فایل)'
      });
    }
  }
  
  res.status(400).json({
    success: false,
    message: error.message || 'خطا در آپلود فایل'
  });
});

module.exports = router;
