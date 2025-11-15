import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  getCurrentPersianDate, 
  formatPersianDate, 
  PERSIAN_MONTHS,
  isValidPersianDate,
  persianStringToDate
} from '@/utils/persianDate';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface PersianDatePickerProps {
  value?: string; // Format: YYYY/MM/DD
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
}

const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
  value = '',
  onChange,
  label = 'تاریخ',
  placeholder = 'انتخاب تاریخ',
  className = '',
  disabled = false,
  required = false,
  minDate,
  maxDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState(getCurrentPersianDate());
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleDateSelect = (year: number, month: number, day: number) => {
    if (!isValidPersianDate(year, month, day)) return;
    
    const dateString = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    setInputValue(dateString);
    onChange(dateString);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Validate and update if complete date
    const parts = newValue.split('/');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      
      if (isValidPersianDate(year, month, day)) {
        onChange(newValue);
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setDisplayDate(prev => {
      let newMonth = prev.month + (direction === 'next' ? 1 : -1);
      let newYear = prev.year;
      
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }
      
      return { ...prev, year: newYear, month: newMonth };
    });
  };

  const getDaysInMonth = (year: number, month: number): number => {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    return 29; // Simplified for month 12
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(displayDate.year, displayDate.month);
    const days = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = inputValue === `${displayDate.year}/${displayDate.month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
      const isToday = (() => {
        const today = getCurrentPersianDate();
        return today.year === displayDate.year && 
               today.month === displayDate.month && 
               today.day === day;
      })();
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(displayDate.year, displayDate.month, day)}
          className={`
            w-8 h-8 text-sm rounded-md hover:bg-blue-100 transition-colors
            ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
            ${isToday && !isSelected ? 'bg-blue-100 text-blue-600 font-semibold' : ''}
          `}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  const getDisplayValue = () => {
    if (!inputValue) return '';
    
    try {
      const parts = inputValue.split('/');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        
        if (isValidPersianDate(year, month, day)) {
          return formatPersianDate({ year, month, day }, 'long');
        }
      }
    } catch (error) {
      // Invalid date format
    }
    
    return inputValue;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </Label>
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-start text-right font-normal ${!inputValue ? 'text-muted-foreground' : ''}`}
            disabled={disabled}
          >
            <Calendar className="ml-2 h-4 w-4" />
            {getDisplayValue() || placeholder}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <div className="text-center">
                <div className="font-semibold">
                  {PERSIAN_MONTHS[displayDate.month - 1]} {displayDate.year}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Weekday headers */}
              {['ش', 'ج', 'پ', 'چ', 'س', 'د', 'ی'].map(day => (
                <div key={day} className="w-8 h-8 text-xs font-medium text-gray-500 flex items-center justify-center">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {renderCalendar()}
            </div>
            
            {/* Manual input */}
            <div className="mt-4 pt-4 border-t">
              <Label className="text-xs text-gray-600 mb-2 block">
                ورود دستی (مثال: 1403/08/15)
              </Label>
              <Input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="1403/08/15"
                className="text-sm"
                dir="ltr"
              />
            </div>
            
            {/* Quick actions */}
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = getCurrentPersianDate();
                  handleDateSelect(today.year, today.month, today.day);
                }}
                className="text-xs"
              >
                امروز
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setInputValue('');
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-xs"
              >
                پاک کردن
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default PersianDatePicker;