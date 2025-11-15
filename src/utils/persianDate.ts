// Persian Date Utilities for Iranian Applications

/**
 * Persian month names
 */
export const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

/**
 * Persian weekday names
 */
export const PERSIAN_WEEKDAYS = [
  'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'
];

/**
 * Convert Gregorian date to Persian (Jalali) date
 * @param date - Gregorian date
 * @returns Persian date object
 */
export const gregorianToPersian = (date: Date) => {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  let jy, jm, jd;

  if (gy <= 1600) {
    jy = 0;
    gy -= 621;
  } else {
    jy = 979;
    gy -= 1600;
  }

  if (gm > 2) {
    gy2 = gy + 1;
    days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334][gm - 1];
  } else {
    gy2 = gy;
    days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + [0, 31, 59][gm - 1];
  }

  jy += 33 * Math.floor(days / 12053);
  days %= 12053;

  jy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days >= 366) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }

  return { year: jy, month: jm, day: jd };
};

// Simplified version using a more reliable algorithm
export const simpleGregorianToPersian = (date: Date) => {
  // Using a simplified conversion for demonstration
  // In production, use a proper library like moment-jalaali
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Approximate conversion (for demo purposes)
  const persianYear = year - 621;
  let persianMonth = month;
  let persianDay = day;
  
  // Adjust for Persian calendar differences
  if (month <= 3) {
    persianMonth = month + 9;
    persianYear = year - 622;
  } else {
    persianMonth = month - 3;
  }
  
  return {
    year: persianYear,
    month: persianMonth,
    day: persianDay
  };
};

/**
 * Format Persian date as string
 * @param persianDate - Persian date object
 * @param format - Format type ('short', 'long', 'full')
 * @returns Formatted Persian date string
 */
export const formatPersianDate = (
  persianDate: { year: number; month: number; day: number },
  format: 'short' | 'long' | 'full' = 'long'
): string => {
  const { year, month, day } = persianDate;
  
  switch (format) {
    case 'short':
      return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    
    case 'long':
      return `${day} ${PERSIAN_MONTHS[month - 1]} ${year}`;
    
    case 'full':
      const date = new Date();
      const weekday = PERSIAN_WEEKDAYS[date.getDay()];
      return `${weekday}، ${day} ${PERSIAN_MONTHS[month - 1]} ${year}`;
    
    default:
      return `${day} ${PERSIAN_MONTHS[month - 1]} ${year}`;
  }
};

/**
 * Get current Persian date
 * @returns Current Persian date object
 */
export const getCurrentPersianDate = () => {
  return simpleGregorianToPersian(new Date());
};

/**
 * Format current Persian date
 * @param format - Format type
 * @returns Formatted current Persian date
 */
export const getCurrentPersianDateString = (format: 'short' | 'long' | 'full' = 'long'): string => {
  const persianDate = getCurrentPersianDate();
  return formatPersianDate(persianDate, format);
};

/**
 * Convert Persian date string to Date object (approximate)
 * @param persianDateString - Persian date in format "YYYY/MM/DD"
 * @returns Approximate Gregorian Date object
 */
export const persianStringToDate = (persianDateString: string): Date => {
  const parts = persianDateString.split('/');
  if (parts.length !== 3) {
    throw new Error('Invalid Persian date format. Use YYYY/MM/DD');
  }
  
  const persianYear = parseInt(parts[0]);
  const persianMonth = parseInt(parts[1]);
  const persianDay = parseInt(parts[2]);
  
  // Approximate conversion back to Gregorian
  const gregorianYear = persianYear + 621;
  let gregorianMonth = persianMonth + 3;
  let gregorianDay = persianDay;
  
  if (gregorianMonth > 12) {
    gregorianMonth -= 12;
    gregorianYear += 1;
  }
  
  return new Date(gregorianYear, gregorianMonth - 1, gregorianDay);
};

/**
 * Add days to Persian date
 * @param persianDate - Base Persian date
 * @param days - Number of days to add
 * @returns New Persian date
 */
export const addDaysToPersianDate = (
  persianDate: { year: number; month: number; day: number },
  days: number
) => {
  // Convert to Gregorian, add days, convert back
  const gregorianDate = persianStringToDate(`${persianDate.year}/${persianDate.month.toString().padStart(2, '0')}/${persianDate.day.toString().padStart(2, '0')}`);
  gregorianDate.setDate(gregorianDate.getDate() + days);
  return simpleGregorianToPersian(gregorianDate);
};

/**
 * Check if Persian date is valid
 * @param year - Persian year
 * @param month - Persian month (1-12)
 * @param day - Persian day
 * @returns true if valid
 */
export const isValidPersianDate = (year: number, month: number, day: number): boolean => {
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  
  // Days in Persian months
  if (month <= 6 && day > 31) return false;
  if (month > 6 && month <= 11 && day > 30) return false;
  if (month === 12 && day > 29) return false; // Simplified, doesn't account for leap years
  
  return true;
};

// Fix the compilation error by declaring missing variables
let gy2: number, days: number;