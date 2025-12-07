/**
 * Watermark Service
 * اضافه کردن واترمارک به تصاویر
 */

const fs = require('fs');
const path = require('path');

// آدرس سایت برای واترمارک
const WATERMARK_TEXT = 'garagesangin.ir';

class WatermarkService {
  constructor() {
    this.watermarkText = WATERMARK_TEXT;
  }

  /**
   * اضافه کردن واترمارک متنی به تصویر با استفاده از Canvas
   * نیاز به نصب پکیج canvas دارد
   */
  async addTextWatermark(inputPath, outputPath = null) {
    try {
      // اگر پکیج canvas نصب نیست، از روش جایگزین استفاده می‌کنیم
      let sharp;
      try {
        sharp = require('sharp');
      } catch (e) {
        console.log('Sharp not installed, using fallback watermark method');
        return this.addWatermarkFallback(inputPath, outputPath);
      }

      const output = outputPath || inputPath;
      
      // خواندن اطلاعات تصویر
      const metadata = await sharp(inputPath).metadata();
      const { width, height } = metadata;

      // محاسبه اندازه واترمارک (حدود 15% عرض تصویر)
      const fontSize = Math.max(12, Math.floor(width * 0.03));
      const padding = Math.floor(fontSize * 0.5);

      // ایجاد SVG برای واترمارک
      const svgWatermark = `
        <svg width="${width}" height="${height}">
          <style>
            .watermark {
              font-family: Arial, sans-serif;
              font-size: ${fontSize}px;
              fill: rgba(255, 255, 255, 0.7);
              text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
            }
          </style>
          <text 
            x="${width - padding}" 
            y="${height - padding}" 
            text-anchor="end" 
            class="watermark"
          >${this.watermarkText}</text>
        </svg>
      `;

      // ترکیب تصویر با واترمارک
      await sharp(inputPath)
        .composite([{
          input: Buffer.from(svgWatermark),
          gravity: 'southeast'
        }])
        .toFile(output + '.tmp');

      // جایگزینی فایل اصلی
      fs.renameSync(output + '.tmp', output);

      return {
        success: true,
        outputPath: output,
        watermarkText: this.watermarkText
      };

    } catch (error) {
      console.error('Watermark error:', error);
      // در صورت خطا، از روش جایگزین استفاده می‌کنیم
      return this.addWatermarkFallback(inputPath, outputPath);
    }
  }

  /**
   * روش جایگزین برای اضافه کردن واترمارک
   * بدون نیاز به پکیج‌های اضافی
   */
  async addWatermarkFallback(inputPath, outputPath = null) {
    try {
      const output = outputPath || inputPath;
      
      // خواندن فایل تصویر
      const imageBuffer = fs.readFileSync(inputPath);
      
      // بررسی نوع تصویر
      const ext = path.extname(inputPath).toLowerCase();
      
      if (ext === '.jpg' || ext === '.jpeg') {
        // اضافه کردن واترمارک به EXIF Comment
        const watermarkedBuffer = this.addJpegComment(imageBuffer, this.watermarkText);
        fs.writeFileSync(output, watermarkedBuffer);
      } else {
        // برای سایر فرمت‌ها، فقط کپی می‌کنیم
        if (inputPath !== output) {
          fs.copyFileSync(inputPath, output);
        }
      }

      return {
        success: true,
        outputPath: output,
        watermarkText: this.watermarkText,
        method: 'fallback'
      };

    } catch (error) {
      console.error('Fallback watermark error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * اضافه کردن کامنت به فایل JPEG
   */
  addJpegComment(buffer, comment) {
    // JPEG Comment marker: FF FE
    const commentMarker = Buffer.from([0xFF, 0xFE]);
    const commentBytes = Buffer.from(comment, 'utf8');
    const lengthBytes = Buffer.alloc(2);
    lengthBytes.writeUInt16BE(commentBytes.length + 2, 0);

    // پیدا کردن موقعیت بعد از SOI marker (FF D8)
    if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
      return buffer; // فایل JPEG معتبر نیست
    }

    // ایجاد بافر جدید با کامنت
    const newBuffer = Buffer.concat([
      buffer.slice(0, 2), // SOI marker
      commentMarker,
      lengthBytes,
      commentBytes,
      buffer.slice(2) // بقیه فایل
    ]);

    return newBuffer;
  }

  /**
   * ایجاد واترمارک تصویری (PNG شفاف)
   */
  async createWatermarkImage(outputPath, width = 200, height = 30) {
    try {
      let sharp;
      try {
        sharp = require('sharp');
      } catch (e) {
        console.log('Sharp not installed, cannot create watermark image');
        return { success: false, error: 'Sharp not installed' };
      }

      const svgWatermark = `
        <svg width="${width}" height="${height}">
          <style>
            .watermark {
              font-family: Arial, sans-serif;
              font-size: 14px;
              fill: rgba(255, 255, 255, 0.8);
            }
          </style>
          <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.3)" rx="5"/>
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" class="watermark">
            ${this.watermarkText}
          </text>
        </svg>
      `;

      await sharp(Buffer.from(svgWatermark))
        .png()
        .toFile(outputPath);

      return {
        success: true,
        outputPath
      };

    } catch (error) {
      console.error('Create watermark image error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * پردازش دسته‌ای تصاویر
   */
  async processImages(imagePaths) {
    const results = [];
    
    for (const imagePath of imagePaths) {
      const result = await this.addTextWatermark(imagePath);
      results.push({
        path: imagePath,
        ...result
      });
    }

    return results;
  }
}

module.exports = new WatermarkService();
