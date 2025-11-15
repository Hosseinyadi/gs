import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  formatIranianCardNumber, 
  validateIranianCardNumber, 
  getIranianBankName,
  handleIranianCardInput 
} from '@/utils/iranianCardValidation';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

interface IranianCardInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidation?: (isValid: boolean, bankName?: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

const IranianCardInput: React.FC<IranianCardInputProps> = ({
  value,
  onChange,
  onValidation,
  label = 'شماره کارت',
  placeholder = '0000-0000-0000-0000',
  className = '',
  disabled = false,
  required = false
}) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [bankName, setBankName] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length === 0) {
      setIsValid(null);
      setBankName('');
      onValidation?.(false);
      return;
    }

    if (cleaned.length === 16) {
      const valid = validateIranianCardNumber(value);
      const bank = getIranianBankName(value);
      
      setIsValid(valid);
      setBankName(bank);
      onValidation?.(valid, bank);
    } else {
      setIsValid(false);
      setBankName('');
      onValidation?.(false);
    }
  }, [value, onValidation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    handleIranianCardInput(inputValue, onChange, onValidation);
  };

  const getValidationIcon = () => {
    if (isValid === null) return null;
    
    return isValid ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <AlertCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getValidationMessage = () => {
    if (isValid === null) return null;
    
    if (isValid && bankName) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600 mt-1">
          <CheckCircle className="w-4 h-4" />
          <span>بانک {bankName} - شماره کارت معتبر است</span>
        </div>
      );
    }
    
    if (isValid === false && value.replace(/\D/g, '').length > 0) {
      return (
        <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
          <AlertCircle className="w-4 h-4" />
          <span>
            {value.replace(/\D/g, '').length !== 16 
              ? 'شماره کارت باید 16 رقم باشد' 
              : 'شماره کارت نامعتبر است'
            }
          </span>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor="card-input" className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-gray-400" />
          {getValidationIcon()}
        </div>
        
        <Input
          id="card-input"
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            pl-16 pr-4 font-mono text-lg tracking-wider
            ${isValid === true ? 'border-green-500 focus:border-green-500' : ''}
            ${isValid === false && value.length > 0 ? 'border-red-500 focus:border-red-500' : ''}
            ${isFocused ? 'ring-2 ring-blue-500/20' : ''}
          `}
          maxLength={19} // 16 digits + 3 dashes
          dir="ltr"
        />
      </div>
      
      {getValidationMessage()}
      
      {/* Helper text */}
      {!isFocused && value.length === 0 && (
        <p className="text-xs text-gray-500">
          شماره کارت 16 رقمی خود را وارد کنید
        </p>
      )}
      
      {/* Bank logo placeholder */}
      {bankName && bankName !== 'نامشخص' && (
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-md p-2">
          <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <span>بانک {bankName}</span>
        </div>
      )}
    </div>
  );
};

export default IranianCardInput;