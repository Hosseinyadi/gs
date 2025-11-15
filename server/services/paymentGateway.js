const axios = require('axios');
const { retryWithBackoff } = require('../utils/retry');

/**
 * Base Payment Gateway Interface
 */
class PaymentGateway {
  constructor(config) {
    this.config = config;
  }

  /**
   * درخواست پرداخت
   * @param {number} amount - مبلغ به تومان
   * @param {string} callbackUrl - آدرس بازگشت
   * @param {Object} metadata - اطلاعات اضافی
   * @returns {Promise<{authority: string, paymentUrl: string}>}
   */
  async request(amount, callbackUrl, metadata = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * تایید پرداخت
   * @param {string} authority - کد authority از درگاه
   * @param {number} amount - مبلغ پرداخت شده
   * @returns {Promise<{success: boolean, refId: string}>}
   */
  async verify(authority, amount) {
    throw new Error('Method not implemented');
  }

  /**
   * نام درگاه
   * @returns {string}
   */
  getName() {
    throw new Error('Method not implemented');
  }
}

/**
 * ZarinPal Payment Gateway
 */
class ZarinPalGateway extends PaymentGateway {
  constructor(config) {
    super(config);
    this.merchantId = config.merchantId;
    this.sandbox = config.sandbox || false;
    this.baseUrl = this.sandbox 
      ? 'https://sandbox.zarinpal.com/pg/v4/payment'
      : 'https://payment.zarinpal.com/pg/v4/payment';
    this.startPayUrl = this.sandbox
      ? 'https://sandbox.zarinpal.com/pg/StartPay'
      : 'https://www.zarinpal.com/pg/StartPay';
  }

  getName() {
    return 'zarinpal';
  }

  async request(amount, callbackUrl, metadata = {}) {
    try {
      const response = await retryWithBackoff(
        async () => {
          return await axios.post(
            `${this.baseUrl}/request.json`,
            {
              merchant_id: this.merchantId,
              amount: amount,
              callback_url: callbackUrl,
              description: metadata.description || 'پرداخت ویژه‌سازی آگهی',
              metadata: {
                mobile: metadata.mobile || '',
                email: metadata.email || ''
              }
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              timeout: 10000
            }
          );
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt, error) => {
            console.log(`🔄 ZarinPal request retry ${attempt}/3: ${error.message}`);
          }
        }
      );

      if (response.data && response.data.data && response.data.data.code === 100) {
        return {
          success: true,
          authority: response.data.data.authority,
          paymentUrl: `${this.startPayUrl}/${response.data.data.authority}`
        };
      }

      return {
        success: false,
        error: response.data?.errors || 'خطا در ایجاد درخواست پرداخت'
      };
    } catch (error) {
      console.error('ZarinPal request error:', error.message);
      return {
        success: false,
        error: error.response?.data?.errors || error.message || 'خطا در ارتباط با درگاه پرداخت'
      };
    }
  }

  async verify(authority, amount) {
    try {
      const response = await retryWithBackoff(
        async () => {
          return await axios.post(
            `${this.baseUrl}/verify.json`,
            {
              merchant_id: this.merchantId,
              authority: authority,
              amount: amount
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              timeout: 10000
            }
          );
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt, error) => {
            console.log(`🔄 ZarinPal verify retry ${attempt}/3: ${error.message}`);
          }
        }
      );

      if (response.data && response.data.data && response.data.data.code === 100) {
        return {
          success: true,
          refId: response.data.data.ref_id.toString(),
          cardPan: response.data.data.card_pan || '',
          cardHash: response.data.data.card_hash || '',
          feeType: response.data.data.fee_type || '',
          fee: response.data.data.fee || 0
        };
      } else if (response.data && response.data.data && response.data.data.code === 101) {
        // Already verified
        return {
          success: true,
          refId: response.data.data.ref_id.toString(),
          message: 'این تراکنش قبلاً تایید شده است'
        };
      }

      return {
        success: false,
        message: response.data?.errors?.message || 'تایید پرداخت ناموفق بود'
      };
    } catch (error) {
      console.error('ZarinPal verify error:', error.message);
      return {
        success: false,
        message: error.response?.data?.errors?.message || error.message || 'خطا در تایید پرداخت'
      };
    }
  }
}

/**
 * PayPing Payment Gateway
 */
class PayPingGateway extends PaymentGateway {
  constructor(config) {
    super(config);
    this.token = config.token;
    this.baseUrl = 'https://api.payping.ir/v2/pay';
  }

  getName() {
    return 'payping';
  }

  async request(amount, callbackUrl, metadata = {}) {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          amount: amount,
          payerIdentity: metadata.mobile || metadata.email || '',
          payerName: metadata.name || '',
          description: metadata.description || 'پرداخت ویژه‌سازی آگهی',
          returnUrl: callbackUrl,
          clientRefId: metadata.clientRefId || Date.now().toString()
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.code) {
        return {
          authority: response.data.code,
          paymentUrl: `https://api.payping.ir/v2/pay/gotoipg/${response.data.code}`
        };
      } else {
        throw new Error('PayPing Error: Invalid response');
      }
    } catch (error) {
      console.error('PayPing request error:', error);
      if (error.response) {
        throw new Error(`خطا در اتصال به درگاه: ${error.response.data.message || error.message}`);
      }
      throw new Error('خطا در اتصال به درگاه پرداخت');
    }
  }

  async verify(authority, amount) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/verify`,
        {
          refId: authority,
          amount: amount
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.amount) {
        return {
          success: true,
          refId: response.data.refId || authority,
          cardNumber: response.data.cardNumber || ''
        };
      } else {
        return {
          success: false,
          message: 'تایید پرداخت ناموفق بود'
        };
      }
    } catch (error) {
      console.error('PayPing verify error:', error);
      if (error.response) {
        return {
          success: false,
          message: error.response.data.message || 'خطا در تایید پرداخت'
        };
      }
      throw new Error('خطا در اتصال به درگاه پرداخت');
    }
  }
}

/**
 * Payment Gateway Factory
 */
class PaymentGatewayFactory {
  constructor() {
    this.gateways = new Map();
  }

  /**
   * ثبت یک درگاه پرداخت
   * @param {string} name - نام درگاه
   * @param {PaymentGateway} gateway - نمونه درگاه
   */
  register(name, gateway) {
    this.gateways.set(name, gateway);
  }

  /**
   * دریافت یک درگاه پرداخت
   * @param {string} name - نام درگاه
   * @returns {PaymentGateway}
   */
  get(name) {
    const gateway = this.gateways.get(name);
    if (!gateway) {
      throw new Error(`درگاه پرداخت ${name} یافت نشد`);
    }
    return gateway;
  }

  /**
   * لیست درگاه‌های موجود
   * @returns {Array<string>}
   */
  list() {
    return Array.from(this.gateways.keys());
  }

  /**
   * بررسی وجود درگاه
   * @param {string} name - نام درگاه
   * @returns {boolean}
   */
  has(name) {
    return this.gateways.has(name);
  }
}

// Create singleton factory
const factory = new PaymentGatewayFactory();

// Initialize gateways from environment variables
function initializeGateways() {
  // ZarinPal
  if (process.env.ZARINPAL_MERCHANT_ID) {
    const zarinpal = new ZarinPalGateway({
      merchantId: process.env.ZARINPAL_MERCHANT_ID,
      sandbox: process.env.ZARINPAL_SANDBOX === 'true'
    });
    factory.register('zarinpal', zarinpal);
    console.log('✅ ZarinPal gateway initialized');
  }

  // PayPing
  if (process.env.PAYPING_TOKEN) {
    const payping = new PayPingGateway({
      token: process.env.PAYPING_TOKEN
    });
    factory.register('payping', payping);
    console.log('✅ PayPing gateway initialized');
  }

  if (factory.list().length === 0) {
    console.warn('⚠️  No payment gateways configured. Please set environment variables.');
  }
}

// Initialize on module load
initializeGateways();

module.exports = {
  PaymentGateway,
  ZarinPalGateway,
  PayPingGateway,
  PaymentGatewayFactory,
  factory
};
