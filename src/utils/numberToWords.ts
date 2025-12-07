// تبدیل عدد به حروف فارسی
export const numberToWords = (num: number): string => {
  if (num === 0) return 'صفر';
  
  const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  const hundreds = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
  const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
  
  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    
    let result = '';
    
    // صدها
    const h = Math.floor(n / 100);
    if (h > 0) {
      result += hundreds[h];
      n %= 100;
      if (n > 0) result += ' و ';
    }
    
    // دهگان و یکان
    if (n >= 10 && n < 20) {
      result += teens[n - 10];
    } else {
      const t = Math.floor(n / 10);
      const o = n % 10;
      
      if (t > 0) {
        result += tens[t];
        if (o > 0) result += ' و ';
      }
      
      if (o > 0) {
        result += ones[o];
      }
    }
    
    return result;
  };
  
  if (num < 0) return 'منفی ' + numberToWords(-num);
  
  // میلیاردها
  const billions = Math.floor(num / 1000000000);
  num %= 1000000000;
  
  // میلیون‌ها
  const millions = Math.floor(num / 1000000);
  num %= 1000000;
  
  // هزارها
  const thousands = Math.floor(num / 1000);
  num %= 1000;
  
  // باقیمانده
  const remainder = num;
  
  let result = '';
  
  if (billions > 0) {
    result += convertLessThanThousand(billions) + ' میلیارد';
    if (millions > 0 || thousands > 0 || remainder > 0) result += ' و ';
  }
  
  if (millions > 0) {
    result += convertLessThanThousand(millions) + ' میلیون';
    if (thousands > 0 || remainder > 0) result += ' و ';
  }
  
  if (thousands > 0) {
    result += convertLessThanThousand(thousands) + ' هزار';
    if (remainder > 0) result += ' و ';
  }
  
  if (remainder > 0) {
    result += convertLessThanThousand(remainder);
  }
  
  return result.trim();
};

// فرمت قیمت با تبدیل به حروف
export const formatPriceWithWords = (price: number | string): { numeric: string; words: string } => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice) || numPrice === 0) {
    return { numeric: '0 تومان', words: '' };
  }
  
  const numeric = new Intl.NumberFormat('fa-IR').format(numPrice) + ' تومان';
  const words = numberToWords(numPrice) + ' تومان';
  
  return { numeric, words };
};
