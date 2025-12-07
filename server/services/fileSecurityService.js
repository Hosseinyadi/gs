/**
 * File Security Service
 * اسکن امنیتی فایل‌ها و اضافه کردن واترمارک
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// لیست پسوندهای مجاز برای تصاویر
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// لیست پسوندهای خطرناک
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif', '.vbs', '.js', '.jse',
  '.ws', '.wsf', '.wsc', '.wsh', '.ps1', '.ps1xml', '.ps2', '.ps2xml', '.psc1',
  '.psc2', '.msh', '.msh1', '.msh2', '.mshxml', '.msh1xml', '.msh2xml', '.scf',
  '.lnk', '.inf', '.reg', '.dll', '.cpl', '.hta', '.jar', '.php', '.asp', '.aspx',
  '.sh', '.bash', '.py', '.pl', '.rb', '.svg'
];

// Magic bytes برای شناسایی نوع واقعی فایل
const FILE_SIGNATURES = {
  // JPEG
  'ffd8ff': 'image/jpeg',
  // PNG
  '89504e47': 'image/png',
  // GIF
  '47494638': 'image/gif',
  // WebP
  '52494646': 'image/webp',
  // BMP
  '424d': 'image/bmp',
  // PDF (خطرناک - می‌تواند حاوی اسکریپت باشد)
  '25504446': 'application/pdf',
  // ZIP (خطرناک)
  '504b0304': 'application/zip',
  // RAR (خطرناک)
  '52617221': 'application/rar',
  // EXE/DLL (خطرناک)
  '4d5a': 'application/x-executable',
  // PHP (خطرناک)
  '3c3f706870': 'text/php',
  // HTML/Script (خطرناک)
  '3c68746d6c': 'text/html',
  '3c736372697074': 'text/javascript'
};

// الگوهای خطرناک در محتوای فایل
const DANGEROUS_PATTERNS = [
  /<script/i,
  /<\?php/i,
  /<%/,
  /javascript:/i,
  /vbscript:/i,
  /onload\s*=/i,
  /onerror\s*=/i,
  /onclick\s*=/i,
  /eval\s*\(/i,
  /document\.cookie/i,
  /window\.location/i,
  /base64_decode/i,
  /exec\s*\(/i,
  /system\s*\(/i,
  /passthru/i,
  /shell_exec/i,
  /\x00/  // Null byte injection
];

class FileSecurityService {
  constructor() {
    this.scanResults = new Map();
  }

  /**
   * اسکن کامل امنیتی فایل
   */
  async scanFile(filePath, originalName) {
    const result = {
      safe: true,
      threats: [],
      fileInfo: {},
      scannedAt: new Date().toISOString()
    };

    try {
      // 1. بررسی وجود فایل
      if (!fs.existsSync(filePath)) {
        result.safe = false;
        result.threats.push('فایل یافت نشد');
        return result;
      }

      const stats = fs.statSync(filePath);
      result.fileInfo.size = stats.size;
      result.fileInfo.originalName = originalName;

      // 2. بررسی پسوند فایل
      const ext = path.extname(originalName).toLowerCase();
      result.fileInfo.extension = ext;

      if (DANGEROUS_EXTENSIONS.includes(ext)) {
        result.safe = false;
        result.threats.push(`پسوند خطرناک: ${ext}`);
        return result;
      }

      // 3. بررسی حجم فایل (حداکثر 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (stats.size > maxSize) {
        result.safe = false;
        result.threats.push('حجم فایل بیش از حد مجاز است');
        return result;
      }

      // 4. بررسی Magic Bytes
      const magicBytesResult = await this.checkMagicBytes(filePath);
      result.fileInfo.detectedType = magicBytesResult.type;

      if (magicBytesResult.dangerous) {
        result.safe = false;
        result.threats.push(`نوع فایل خطرناک شناسایی شد: ${magicBytesResult.type}`);
        return result;
      }

      // 5. بررسی تطابق پسوند با محتوا
      if (ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
        if (!magicBytesResult.type.startsWith('image/')) {
          result.safe = false;
          result.threats.push('پسوند فایل با محتوای آن مطابقت ندارد');
          return result;
        }
      }

      // 6. اسکن محتوای فایل برای الگوهای خطرناک
      const contentScanResult = await this.scanFileContent(filePath);
      if (!contentScanResult.safe) {
        result.safe = false;
        result.threats.push(...contentScanResult.threats);
        return result;
      }

      // 7. بررسی Double Extension
      if (this.hasDoubleExtension(originalName)) {
        result.safe = false;
        result.threats.push('فایل دارای پسوند دوگانه است');
        return result;
      }

      // 8. محاسبه هش فایل
      result.fileInfo.hash = await this.calculateFileHash(filePath);

      return result;

    } catch (error) {
      console.error('File scan error:', error);
      result.safe = false;
      result.threats.push('خطا در اسکن فایل');
      return result;
    }
  }

  /**
   * بررسی Magic Bytes فایل
   */
  async checkMagicBytes(filePath) {
    return new Promise((resolve) => {
      const buffer = Buffer.alloc(16);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 16, 0);
      fs.closeSync(fd);

      const hex = buffer.toString('hex').toLowerCase();

      for (const [signature, type] of Object.entries(FILE_SIGNATURES)) {
        if (hex.startsWith(signature)) {
          const dangerous = !type.startsWith('image/');
          resolve({ type, dangerous });
          return;
        }
      }

      resolve({ type: 'unknown', dangerous: false });
    });
  }

  /**
   * اسکن محتوای فایل برای الگوهای خطرناک
   */
  async scanFileContent(filePath) {
    return new Promise((resolve) => {
      const result = { safe: true, threats: [] };

      try {
        // فقط 1MB اول فایل را بررسی می‌کنیم
        const buffer = Buffer.alloc(1024 * 1024);
        const fd = fs.openSync(filePath, 'r');
        const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
        fs.closeSync(fd);

        const content = buffer.slice(0, bytesRead).toString('utf8', 0, bytesRead);

        for (const pattern of DANGEROUS_PATTERNS) {
          if (pattern.test(content)) {
            result.safe = false;
            result.threats.push(`الگوی خطرناک شناسایی شد: ${pattern.toString()}`);
          }
        }

        resolve(result);
      } catch (error) {
        resolve(result);
      }
    });
  }

  /**
   * بررسی پسوند دوگانه
   */
  hasDoubleExtension(filename) {
    const parts = filename.split('.');
    if (parts.length > 2) {
      const secondLast = '.' + parts[parts.length - 2].toLowerCase();
      if (DANGEROUS_EXTENSIONS.includes(secondLast)) {
        return true;
      }
    }
    return false;
  }

  /**
   * محاسبه هش SHA256 فایل
   */
  async calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * بررسی سریع فایل تصویر
   */
  async isValidImage(filePath, originalName) {
    const ext = path.extname(originalName).toLowerCase();
    
    if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
      return { valid: false, reason: 'پسوند فایل مجاز نیست' };
    }

    const magicResult = await this.checkMagicBytes(filePath);
    
    if (!magicResult.type.startsWith('image/')) {
      return { valid: false, reason: 'فایل یک تصویر معتبر نیست' };
    }

    return { valid: true };
  }

  /**
   * پاکسازی نام فایل
   */
  sanitizeFilename(filename) {
    // حذف کاراکترهای خطرناک
    let safe = filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
      .replace(/\.\./g, '')
      .replace(/^\.+/, '')
      .trim();

    // محدود کردن طول نام فایل
    if (safe.length > 200) {
      const ext = path.extname(safe);
      safe = safe.substring(0, 200 - ext.length) + ext;
    }

    return safe || 'unnamed_file';
  }
}

module.exports = new FileSecurityService();
