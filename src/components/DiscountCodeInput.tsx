import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Tag, X, CheckCircle } from 'lucide-react';

interface DiscountCodeInputProps {
  planId: number;
  amount: number;
  onDiscountApplied: (discount: DiscountData) => void;
  onDiscountRemoved: () => void;
}

interface DiscountData {
  id: number;
  code: string;
  type: string;
  value: number;
  discountAmount: number;
  finalAmount: number;
  description?: string;
}

export const DiscountCodeInput: React.FC<DiscountCodeInputProps> = ({
  planId,
  amount,
  onDiscountApplied,
  onDiscountRemoved
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountData | null>(null);

  const handleApplyCode = async () => {
    if (!code.trim()) {
      toast.error('لطفا کد تخفیف را وارد کنید');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/discount-codes/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code.toUpperCase(),
          plan_id: planId,
          amount
        })
      });

      const data = await response.json();

      if (data.success) {
        setAppliedDiscount(data.data);
        onDiscountApplied(data.data);
        toast.success(data.message || 'کد تخفیف با موفقیت اعمال شد');
      } else {
        toast.error(data.error?.message || 'کد تخفیف نامعتبر است');
      }
    } catch (error) {
      console.error('Error applying discount code:', error);
      toast.error('خطا در اعمال کد تخفیف');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCode = () => {
    setAppliedDiscount(null);
    setCode('');
    onDiscountRemoved();
    toast.info('کد تخفیف حذف شد');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  if (appliedDiscount) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-green-900">
                  کد تخفیف: {appliedDiscount.code}
                </span>
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  {appliedDiscount.type === 'percentage' 
                    ? `${appliedDiscount.value}%` 
                    : `${formatPrice(appliedDiscount.value)} تومان`}
                </Badge>
              </div>
              {appliedDiscount.description && (
                <p className="text-sm text-green-700 mb-2">
                  {appliedDiscount.description}
                </p>
              )}
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">مبلغ اصلی:</span>
                  <span className="line-through text-gray-500">
                    {formatPrice(amount)} تومان
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">تخفیف:</span>
                  <span className="text-green-600 font-semibold">
                    {formatPrice(appliedDiscount.discountAmount)} تومان
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-green-200">
                  <span className="text-gray-900 font-semibold">مبلغ نهایی:</span>
                  <span className="text-green-600 font-bold text-lg">
                    {formatPrice(appliedDiscount.finalAmount)} تومان
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveCode}
            className="text-green-600 hover:text-green-700 hover:bg-green-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-5 h-5 text-gray-600" />
        <span className="font-medium text-gray-900">کد تخفیف دارید؟</span>
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="کد تخفیف را وارد کنید"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === 'Enter' && handleApplyCode()}
          className="flex-1 text-center font-mono tracking-wider"
          disabled={loading}
        />
        <Button
          onClick={handleApplyCode}
          disabled={loading || !code.trim()}
          className="px-6"
        >
          {loading ? 'در حال بررسی...' : 'اعمال'}
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        کد تخفیف را با حروف بزرگ وارد کنید
      </p>
    </div>
  );
};
