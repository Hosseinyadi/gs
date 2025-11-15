import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { trackPayment, trackListing } from "@/utils/analytics";
import {
  CreditCard,
  CheckCircle,
  Star,
  Clock,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight
} from "lucide-react";

interface FeaturedPlan {
  id: number;
  name: string;
  name_en: string;
  duration_days: number;
  price: number;
  discount_percent: number;
  features: string[];
  is_active: boolean;
  pricing: {
    original_price: number;
    discount_percent: number;
    discount_amount: number;
    final_price: number;
  };
}

const MakeFeatured = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get('listing_id');

  const [plans, setPlans] = useState<FeaturedPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('gateway');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!listingId) {
      toast.error('شناسه آگهی یافت نشد');
      navigate('/');
      return;
    }
    loadPlans();
  }, [listingId, navigate]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/featured-plans/active`);
      const data = await response.json();

      if (data.success) {
        setPlans(data.data || []);
        if (data.data && data.data.length > 0) {
          setSelectedPlan(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('خطا در بارگذاری پلن‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan || !listingId) {
      toast.error('لطفا یک پلن انتخاب کنید');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      
      const selectedPlanData = plans.find(p => p.id === selectedPlan);

      // Track payment initiation
      trackPayment.initiated(
        selectedPlan, 
        selectedPlanData?.price || 0, 
        paymentMethod
      );

      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/initiate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listing_id: parseInt(listingId),
          plan_id: selectedPlan,
          payment_method: paymentMethod
        })
      });

      const data = await response.json();

      if (data.success) {
        if (paymentMethod === 'gateway' && data.data.payment_url) {
          // Redirect to payment gateway
          window.location.href = data.data.payment_url;
        } else if (paymentMethod === 'card_transfer') {
          toast.success('اطلاعات پرداخت دریافت شد');
          // Show card transfer info
          navigate(`/payment/card-transfer?payment_id=${data.data.payment_id}`);
        }
      } else {
        trackPayment.failed(data.error?.message || 'خطا در شروع پرداخت');
        toast.error(data.error?.message || 'خطا در شروع پرداخت');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      trackPayment.failed('خطا در شروع پرداخت');
      toast.error('خطا در شروع پرداخت');
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const getPlanIcon = (index: number) => {
    const icons = [Clock, TrendingUp, Star];
    return icons[index] || Star;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
            <Star className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ویژه کردن آگهی
          </h1>
          <p className="text-gray-600 text-lg">
            آگهی خود را ویژه کنید و دیده شدن بیشتری داشته باشید
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan, index) => {
            const Icon = getPlanIcon(index);
            const isSelected = selectedPlan === plan.id;
            const isPopular = index === 1; // Middle plan is popular

            return (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? 'ring-4 ring-blue-500 shadow-2xl scale-105'
                    : 'hover:shadow-xl hover:scale-102'
                } ${isPopular ? 'border-2 border-yellow-400' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1">
                      <Star className="w-3 h-3 ml-1" />
                      محبوب‌ترین
                    </Badge>
                  </div>
                )}

                <CardHeader className={`text-center ${isPopular ? 'pt-8' : ''}`}>
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 mx-auto ${
                    isSelected ? 'bg-blue-500' : 'bg-gray-200'
                  }`}>
                    <Icon className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <p className="text-4xl font-bold text-blue-600">
                      {formatPrice(plan.pricing.final_price)}
                      <span className="text-sm text-gray-500 mr-2">تومان</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      برای {plan.duration_days} روز
                    </p>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isSelected && (
                    <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">انتخاب شده</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment Method */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              روش پرداخت
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`flex items-center space-x-2 space-x-reverse p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'gateway'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('gateway')}
                >
                  <RadioGroupItem value="gateway" id="gateway" />
                  <Label htmlFor="gateway" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Shield className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">درگاه بانکی</p>
                        <p className="text-sm text-gray-500">پرداخت آنلاین امن</p>
                      </div>
                    </div>
                  </Label>
                </div>

                <div
                  className={`flex items-center space-x-2 space-x-reverse p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'card_transfer'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('card_transfer')}
                >
                  <RadioGroupItem value="card_transfer" id="card_transfer" />
                  <Label htmlFor="card_transfer" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <CreditCard className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">کارت به کارت</p>
                        <p className="text-sm text-gray-500">نیاز به تایید مدیر</p>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Summary & Action */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm opacity-90 mb-1">مبلغ قابل پرداخت</p>
                <p className="text-3xl font-bold">
                  {selectedPlan && formatPrice(plans.find(p => p.id === selectedPlan)?.pricing.final_price || 0)} تومان
                </p>
              </div>

              <Button
                size="lg"
                onClick={handlePayment}
                disabled={!selectedPlan || processing}
                className="bg-white text-blue-600 hover:bg-gray-100 px-8"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 ml-2"></div>
                    در حال پردازش...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 ml-2" />
                    پرداخت و ویژه کردن
                    <ArrowRight className="w-5 h-5 mr-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold mb-2">پرداخت امن</h3>
            <p className="text-sm text-gray-600">
              تمام پرداخت‌ها از طریق درگاه‌های معتبر بانکی انجام می‌شود
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold mb-2">فعال‌سازی سریع</h3>
            <p className="text-sm text-gray-600">
              آگهی شما بلافاصله بعد از پرداخت ویژه می‌شود
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold mb-2">افزایش بازدید</h3>
            <p className="text-sm text-gray-600">
              آگهی‌های ویژه تا 10 برابر بیشتر دیده می‌شوند
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MakeFeatured;
