import { Input } from "./input";
import { Calendar } from "lucide-react";
import { useState } from "react";

interface PersianDateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function PersianDateInput({ value, onChange, placeholder, label }: PersianDateInputProps) {
  const [displayValue, setDisplayValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    onChange(newValue);
  };

  // تبدیل تاریخ میلادی به نمایش فارسی
  const getDisplayDate = () => {
    if (!value) return '';
    try {
      const date = new Date(value);
      return date.toLocaleDateString('fa-IR');
    } catch {
      return value;
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="relative">
        <Input
          type="date"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="pr-10"
          dir="ltr"
        />
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      {value && (
        <p className="text-xs text-gray-500 text-right">
          تاریخ انتخاب شده: {getDisplayDate()}
        </p>
      )}
    </div>
  );
}
