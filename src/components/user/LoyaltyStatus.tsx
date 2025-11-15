import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Crown, 
  Star, 
  Award, 
  Gift, 
  TrendingUp,
  ShoppingBag,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import apiService from "@/services/api";

interface LoyaltyData {
  total_payments: number;
  total_spent: number;
  loyalty_score: number;
  customer_tier: string;
  available_discounts: Array<{
    code: string;
    discount_percent: number;
    valid_until: string;
  }>;
  next_tier: {
    name: string;
    required_spent: number;
    remaining: number;
  };
}

const LoyaltyStatus = () => {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      setLoading(true);
      const response = await apiService.request('/user/loyalty-status');
      
      if (response.success) {
        setLoyaltyData(response.data);
      }
    } catch (error) {
      console.error('Error loading loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'طلایی': return 'from-yellow-400 to-yellow-600';
      case 'نقره‌ای': return 'from-gray-300 to-gray-500';
      case 'برنزی': return 'from-orange-400 to-orange-600';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'طلایی': return <Crown className="w-8 h-8" />;
      case 'نقره‌ای': return <Award className="w-8 h-8" />;
      case 'برنزی': return <Star className="w-8 h-8" />;
      default: return <Sparkles className="w-8 h-8" />;
    }
  };

  const copyDiscountCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('کد تخفیف کپی شد');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!loyaltyData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">اطلاعات وفاداری در دسترس نیست</p>
        </CardContent>
      </Card>
    );
  }

  const progressPercent = loyaltyData.next_tier 
    ? ((loyaltyData.total_spent / loyaltyData.next_tier.required_spent) * 100)
    : 100;

  return (
    <div className="space-y-4">
      {/* Tier Status Card */}
      <Card className={`bg-gradient-to-br ${getTierColor(loyaltyData.customer_tier)} text-white`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {getTierIcon(loyaltyData.customer_tier)}
                <h3 className="text-2xl font-bold">سطح {loyaltyData.customer_tier}</h3>
              </div>
              <p className="text-white/90">مشتری ویژه گاراژ سنگین</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{loyaltyData.loyalty_score}</div>
              <div className="text-sm text-white/90">امتیاز وفاداری</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <ShoppingBag className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{loyaltyData.total_payments}</div>
            <div className="text-sm text-gray-600">خرید موفق</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-green-600">
              {formatPrice(loyaltyData.total_spent)}
            </div>
            <div className="text-sm text-gray-600">تومان خرید</div>
          </CardContent>
        </Card>
      </div>

      {/* Next Tier Progress */}
      {loyaltyData.next_tier && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5" />
              پیشرفت به سطح {loyaltyData.next_tier.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={progressPercent} className="h-3" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {formatPrice(loyaltyData.total_spent)} تومان
              </span>
              <span className="text-gray-600">
                {formatPrice(loyaltyData.next_tier.required_spent)} تومان
              </span>
            </div>
            <p className="text-sm text-center text-gray-600">
              تا سطح {loyaltyData.next_tier.name} فقط{' '}
              <span className="font-bold text-blue-600">
                {formatPrice(loyaltyData.next_tier.remaining)} تومان
              </span>{' '}
              باقی مانده!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Available Discounts */}
      {loyaltyData.available_discounts && loyaltyData.available_discounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-600" />
              کدهای تخفیف ویژه شما
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loyaltyData.available_discounts.map((discount, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-green-600 text-white">
                      {discount.discount_percent}% تخفیف
                    </Badge>
                    <span className="text-sm text-gray-600">
                      تا {formatDate(discount.valid_until)}
                    </span>
                  </div>
                  <div className="font-mono text-lg font-bold text-blue-600">
                    {discount.code}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyDiscountCode(discount.code)}
                >
                  کپی کد
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Benefits */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
            <Star className="w-5 h-5" />
            مزایای سطح {loyaltyData.customer_tier}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">✓</span>
              <span>دریافت کدهای تخفیف اختصاصی</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">✓</span>
              <span>اولویت در پشتیبانی</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">✓</span>
              <span>دسترسی زودهنگام به ویژگی‌های جدید</span>
            </li>
            {loyaltyData.customer_tier === 'طلایی' && (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>مشاوره رایگان خرید</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>ویژه‌سازی رایگان ماهانه</span>
                </li>
              </>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyStatus;