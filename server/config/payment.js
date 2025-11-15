const { dbHelpers } = require('./database');
const { factory } = require('../services/paymentGateway');

/**
 * Payment Configuration Manager
 */
class PaymentConfig {
  constructor() {
    this.settings = null;
    this.lastFetch = null;
    this.cacheDuration = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * دریافت تنظیمات پرداخت از دیتابیس
   * @param {boolean} forceRefresh - بارگذاری مجدد از دیتابیس
   * @returns {Promise<Object>}
   */
  async getSettings(forceRefresh = false) {
    try {
      // Check cache
      if (!forceRefresh && this.settings && this.lastFetch) {
        const now = Date.now();
        if (now - this.lastFetch < this.cacheDuration) {
          return this.settings;
        }
      }

      // Fetch from database
      const rows = await dbHelpers.all('SELECT setting_key, setting_value FROM payment_settings');
      
      const settings = {};
      rows.forEach(row => {
        try {
          // Try to parse JSON values
          settings[row.setting_key] = JSON.parse(row.setting_value);
        } catch (e) {
          // If not JSON, use as string
          settings[row.setting_key] = row.setting_value;
        }
      });

      // Set defaults if not exists
      const defaults = {
        gateway_enabled: true,
        card_transfer_enabled: true,
        wallet_enabled: false,
        default_gateway: 'zarinpal',
        auto_approve_gateway: true,
        card_number: '',
        card_holder_name: '',
        bank_name: '',
        min_payment_amount: 10000,
        max_payment_amount: 50000000
      };

      this.settings = { ...defaults, ...settings };
      this.lastFetch = Date.now();

      return this.settings;
    } catch (error) {
      console.error('Error getting payment settings:', error);
      throw new Error('خطا در دریافت تنظیمات پرداخت');
    }
  }

  /**
   * بروزرسانی یک تنظیم
   * @param {string} key - کلید تنظیم
   * @param {any} value - مقدار جدید
   * @param {number} adminId - شناسه مدیر
   * @returns {Promise<void>}
   */
  async updateSetting(key, value, adminId) {
    try {
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      await dbHelpers.run(
        `INSERT INTO payment_settings (setting_key, setting_value, updated_by, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(setting_key) 
         DO UPDATE SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP`,
        [key, valueStr, adminId, valueStr, adminId]
      );

      // Clear cache
      this.settings = null;
      this.lastFetch = null;
    } catch (error) {
      console.error('Error updating payment setting:', error);
      throw new Error('خطا در بروزرسانی تنظیمات');
    }
  }

  /**
   * بروزرسانی چند تنظیم به صورت همزمان
   * @param {Object} settings - تنظیمات جدید
   * @param {number} adminId - شناسه مدیر
   * @returns {Promise<void>}
   */
  async updateSettings(settings, adminId) {
    try {
      for (const [key, value] of Object.entries(settings)) {
        await this.updateSetting(key, value, adminId);
      }
    } catch (error) {
      console.error('Error updating payment settings:', error);
      throw error;
    }
  }

  /**
   * دریافت درگاه پیش‌فرض
   * @returns {Promise<string>}
   */
  async getDefaultGateway() {
    const settings = await this.getSettings();
    return settings.default_gateway || 'zarinpal';
  }

  /**
   * بررسی فعال بودن یک روش پرداخت
   * @param {string} method - نوع پرداخت (gateway, card_transfer, wallet)
   * @returns {Promise<boolean>}
   */
  async isPaymentMethodEnabled(method) {
    const settings = await this.getSettings();
    
    switch (method) {
      case 'gateway':
        return settings.gateway_enabled === true || settings.gateway_enabled === 'true';
      case 'card_transfer':
        return settings.card_transfer_enabled === true || settings.card_transfer_enabled === 'true';
      case 'wallet':
        return settings.wallet_enabled === true || settings.wallet_enabled === 'true';
      default:
        return false;
    }
  }

  /**
   * دریافت اطلاعات کارت برای کارت به کارت
   * @returns {Promise<Object>}
   */
  async getCardTransferInfo() {
    const settings = await this.getSettings();
    return {
      card_number: settings.card_number || '',
      card_holder_name: settings.card_holder_name || '',
      bank_name: settings.bank_name || ''
    };
  }

  /**
   * اعتبارسنجی مبلغ پرداخت
   * @param {number} amount - مبلغ
   * @returns {Promise<{valid: boolean, message?: string}>}
   */
  async validateAmount(amount) {
    const settings = await this.getSettings();
    const minAmount = settings.min_payment_amount || 10000;
    const maxAmount = settings.max_payment_amount || 50000000;

    if (amount < minAmount) {
      return {
        valid: false,
        message: `حداقل مبلغ پرداخت ${minAmount.toLocaleString('fa-IR')} تومان است`
      };
    }

    if (amount > maxAmount) {
      return {
        valid: false,
        message: `حداکثر مبلغ پرداخت ${maxAmount.toLocaleString('fa-IR')} تومان است`
      };
    }

    return { valid: true };
  }

  /**
   * دریافت درگاه پرداخت
   * @param {string} gatewayName - نام درگاه (اختیاری)
   * @returns {Promise<PaymentGateway>}
   */
  async getGateway(gatewayName = null) {
    const name = gatewayName || await this.getDefaultGateway();
    
    if (!factory.has(name)) {
      throw new Error(`درگاه ${name} پیکربندی نشده است`);
    }

    return factory.get(name);
  }

  /**
   * لیست درگاه‌های موجود
   * @returns {Array<string>}
   */
  getAvailableGateways() {
    return factory.list();
  }

  /**
   * دریافت URL بازگشت پرداخت
   * @returns {string}
   */
  getCallbackUrl() {
    return process.env.PAYMENT_CALLBACK_URL || 
           `${process.env.BACKEND_URL || 'http://localhost:8080'}/api/payments/verify`;
  }

  /**
   * دریافت URL فرانت‌اند
   * @returns {string}
   */
  getFrontendUrl() {
    return process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  /**
   * بررسی تایید خودکار پرداخت درگاهی
   * @returns {Promise<boolean>}
   */
  async isAutoApproveEnabled() {
    const settings = await this.getSettings();
    return settings.auto_approve_gateway === true || settings.auto_approve_gateway === 'true';
  }
}

// Create singleton instance
const paymentConfig = new PaymentConfig();

module.exports = paymentConfig;

