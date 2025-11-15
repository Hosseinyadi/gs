// Iranian Card Number Validation Utilities

/**
 * Format Iranian card number with proper spacing
 * @param cardNumber - Raw card number (16 digits)
 * @returns Formatted card number (XXXX-XXXX-XXXX-XXXX)
 */
export const formatIranianCardNumber = (cardNumber: string): string => {
  // Remove all non-digit characters
  const cleaned = cardNumber.replace(/\D/g, '');
  
  // Limit to 16 digits
  const limited = cleaned.substring(0, 16);
  
  // Add dashes every 4 digits
  return limited.replace(/(\d{4})(?=\d)/g, '$1-');
};

/**
 * Validate Iranian card number using Luhn algorithm
 * @param cardNumber - Card number to validate
 * @returns true if valid, false otherwise
 */
export const validateIranianCardNumber = (cardNumber: string): boolean => {
  // Remove all non-digit characters
  const cleaned = cardNumber.replace(/\D/g, '');
  
  // Must be exactly 16 digits
  if (cleaned.length !== 16) {
    return false;
  }
  
  // Check if all digits are the same (invalid)
  if (/^(\d)\1{15}$/.test(cleaned)) {
    return false;
  }
  
  // Luhn algorithm validation
  let sum = 0;
  let isEven = false;
  
  // Loop through digits from right to left
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

/**
 * Get Iranian bank name from card number
 * @param cardNumber - Card number
 * @returns Bank name in Persian
 */
export const getIranianBankName = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  const bin = cleaned.substring(0, 6);
  
  const bankMap: { [key: string]: string } = {
    // ملی ایران
    '627760': 'پست بانک ایران',
    '627648': 'توسعه تعاون',
    '627593': 'ایران زمین',
    '627381': 'انصار',
    '627353': 'تجارت',
    '627648': 'توسعه تعاون',
    '627760': 'پست بانک',
    '627412': 'اقتصاد نوین',
    '622106': 'پارسیان',
    '627884': 'پارسیان',
    '639607': 'صنعت و معدن',
    '627381': 'انصار',
    '505785': 'ایران زمین',
    '627593': 'ایران زمین',
    '627381': 'انصار',
    '639607': 'صنعت و معدن',
    '627760': 'پست بانک',
    '627412': 'اقتصاد نوین',
    '622106': 'پارسیان',
    '627884': 'پارسیان',
    '639607': 'صنعت و معدن',
    
    // بانک‌های اصلی
    '627353': 'تجارت',
    '627760': 'پست بانک ایران',
    '627412': 'اقتصاد نوین',
    '622106': 'پارسیان',
    '627884': 'پارسیان',
    '639607': 'صنعت و معدن',
    '627648': 'توسعه تعاون',
    '627593': 'ایران زمین',
    '627381': 'انصار',
    '505785': 'ایران زمین',
    '627353': 'تجارت',
    '639607': 'صنعت و معدن',
    '627412': 'اقتصاد نوین',
    '622106': 'پارسیان',
    '627884': 'پارسیان',
    '627760': 'پست بانک ایران',
    '627648': 'توسعه تعاون',
    '627593': 'ایران زمین',
    '627381': 'انصار',
    
    // ملت
    '610433': 'ملت',
    '991975': 'ملت',
    
    // ملی
    '603770': 'ملی ایران',
    '639607': 'ملی ایران',
    
    // صادرات
    '627648': 'صادرات ایران',
    '505785': 'صادرات ایران',
    
    // سپه
    '589210': 'قرض‌الحسنه مهر ایران',
    '627648': 'سپه',
    
    // رفاه
    '627381': 'رفاه کارگران',
    
    // کشاورزی
    '639607': 'کشاورزی',
    '505785': 'کشاورزی',
    
    // مسکن
    '628023': 'مسکن',
    '627760': 'مسکن',
    
    // شهر
    '502908': 'شهر',
    '504706': 'شهر',
    
    // دی
    '627412': 'دی',
    
    // سامان
    '621986': 'سامان',
    
    // سینا
    '639607': 'سینا',
    
    // کارآفرین
    '627412': 'کارآفرین',
    
    // پاسارگاد
    '639347': 'پاسارگاد',
    '502229': 'پاسارگاد'
  };
  
  // Check exact match first
  if (bankMap[bin]) {
    return bankMap[bin];
  }
  
  // Check partial matches
  for (const [key, value] of Object.entries(bankMap)) {
    if (bin.startsWith(key.substring(0, 4))) {
      return value;
    }
  }
  
  return 'نامشخص';
};

/**
 * Mask Iranian card number for display
 * @param cardNumber - Full card number
 * @returns Masked card number (XXXX-XXXX-XXXX-1234)
 */
export const maskIranianCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length !== 16) {
    return cardNumber;
  }
  
  const masked = 'XXXX-XXXX-XXXX-' + cleaned.substring(12);
  return masked;
};

/**
 * Iranian card number input component props
 */
export interface IranianCardInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidation?: (isValid: boolean) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Handle Iranian card number input with real-time formatting
 */
export const handleIranianCardInput = (
  value: string,
  onChange: (value: string) => void,
  onValidation?: (isValid: boolean, bankName?: string) => void
) => {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');
  
  // Limit to 16 digits maximum
  const limited = cleaned.substring(0, 16);
  
  // Format with dashes
  const formatted = limited.replace(/(\d{4})(?=\d)/g, '$1-');
  
  onChange(formatted);
  
  if (onValidation) {
    const isValid = validateIranianCardNumber(formatted);
    const bankName = getIranianBankName(formatted);
    onValidation(isValid, bankName);
  }
};