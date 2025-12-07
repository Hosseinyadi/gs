import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// لیست کامل استان‌های ایران (31 استان + کل ایران)
const IRANIAN_PROVINCES = [
  'کل ایران',
  'تهران',
  'خوزستان',
  'بوشهر',
  'اصفهان',
  'خراسان رضوی',
  'فارس',
  'آذربایجان شرقی',
  'مازندران',
  'کرمان',
  'البرز',
  'گیلان',
  'کهگیلویه و بویراحمد',
  'آذربایجان غربی',
  'هرمزگان',
  'مرکزی',
  'یزد',
  'کرمانشاه',
  'قزوین',
  'سیستان و بلوچستان',
  'همدان',
  'ایلام',
  'گلستان',
  'لرستان',
  'زنجان',
  'اردبیل',
  'قم',
  'کردستان',
  'سمنان',
  'چهارمحال و بختیاری',
  'خراسان شمالی',
  'خراسان جنوبی'
];

// برای فیلتر کردن (با گزینه "تمام شهرها")
const IRANIAN_PROVINCES_WITH_ALL = ['تمام شهرها', ...IRANIAN_PROVINCES];

interface ProvinceSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  saveToLocalStorage?: boolean;
  showAllOption?: boolean; // آیا گزینه "تمام شهرها" نمایش داده شود؟
}

const ProvinceSelect = ({ 
  value, 
  onValueChange, 
  placeholder = "انتخاب استان",
  className,
  saveToLocalStorage = false,
  showAllOption = false // پیش‌فرض: گزینه "تمام شهرها" نمایش داده نمی‌شود
}: ProvinceSelectProps) => {
  const [selectedProvince, setSelectedProvince] = useState<string>(value || '');

  // انتخاب لیست مناسب بر اساس showAllOption
  const provinceList = showAllOption ? IRANIAN_PROVINCES_WITH_ALL : IRANIAN_PROVINCES;

  // Load from localStorage on mount
  useEffect(() => {
    if (saveToLocalStorage && !value) {
      const saved = localStorage.getItem('selectedProvince');
      if (saved && saved !== 'تمام شهرها') {
        setSelectedProvince(saved);
        onValueChange?.(saved);
      }
    }
  }, []);

  const handleChange = (newValue: string) => {
    setSelectedProvince(newValue);
    onValueChange?.(newValue);
    
    // Save to localStorage if enabled
    if (saveToLocalStorage) {
      localStorage.setItem('selectedProvince', newValue);
    }
  };

  return (
    <Select value={selectedProvince || value} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-[300px] overflow-y-auto">
        {provinceList.map((province) => (
          <SelectItem key={province} value={province}>
            {province}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ProvinceSelect;
export { IRANIAN_PROVINCES, IRANIAN_PROVINCES_WITH_ALL };
