import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw, Home, HelpCircle } from "lucide-react";

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  const getErrorMessage = () => {
    if (message) return decodeURIComponent(message);
    
    switch (error) {
      case 'no_authority':
        return 'کد تراکنش یافت نشد';
      case 'server_error':
        return 'خطای سرور در پردازش پرداخت';
      case 'cancelled':
        return 'پرداخت توسط کاربر لغو شد';
      default:
        return 'پرداخت ناموفق بود';
    }
  };

  const handleRetry = () => {
    navigate(-2); // Go back to payment page
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardContent className="p-12 text-center">
          {/* Error Icon */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse opacity-20"></div>
            <div className="relative bg-gradient-to-br from-red-500 to-orange-600 rounded-full p-6">
              <XCircle className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            پرداخت ناموفق
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {getErrorMessage()}
          </p>

          {/* Error Details */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 mb-8">
            <div className="text-right space-y-3">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">پرداخت تکمیل نشد</p>
                  <p className="text-sm text-gray-600">مبلغی از حساب شما کسر نشده است</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">دلایل احتمالی</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside text-right">
                    <li>لغو پرداخت توسط کاربر</li>
                    <li>موجودی ناکافی</li>
                    <li>مشکل در اتصال به درگاه</li>
                    <li>اطلاعات کارت نادرست</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              onClick={handleRetry}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <RefreshCw className="w-5 h-5 ml-2" />
              تلاش مجدد
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/')}
            >
              <Home className="w-5 h-5 ml-2" />
              بازگشت به صفحه اصلی
            </Button>
          </div>

          {/* Help Section */}
          <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <p className="text-sm text-blue-900 font-medium mb-2">
              نیاز به کمک دارید؟
            </p>
            <p className="text-sm text-blue-700">
              در صورت بروز مشکل، با پشتیبانی تماس بگیرید یا از روش پرداخت کارت به کارت استفاده کنید
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFailed;
