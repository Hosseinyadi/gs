import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, Home, Eye } from "lucide-react";

const PaymentPending = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardContent className="p-12 text-center">
          {/* Pending Icon */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-yellow-500 rounded-full animate-pulse opacity-20"></div>
            <div className="relative bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full p-6">
              <Clock className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Pending Message */}
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            در انتظار تایید
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            رسید پرداخت شما با موفقیت ثبت شد
          </p>

          {/* Status Steps */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-right">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">رسید دریافت شد</p>
                  <p className="text-sm text-gray-600">رسید پرداخت شما با موفقیت ثبت شد</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">در حال بررسی</p>
                  <p className="text-sm text-gray-600">مدیر در حال بررسی رسید شماست</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right opacity-50">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">تایید و فعال‌سازی</p>
                  <p className="text-sm text-gray-600">آگهی شما ویژه خواهد شد</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8 text-right">
            <h3 className="font-bold text-blue-900 mb-3">چه اتفاقی می‌افتد؟</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>مدیر رسید پرداخت شما را بررسی می‌کند</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>در صورت تایید، آگهی شما به صورت خودکار ویژه می‌شود</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>یک نوتیفیکیشن برای شما ارسال خواهد شد</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>زمان تایید معمولاً کمتر از 2 ساعت است</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Eye className="w-5 h-5 ml-2" />
              مشاهده آگهی‌های من
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

          {/* Timeline */}
          <div className="mt-8 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
            <p className="text-sm text-gray-700">
              ⏱️ زمان تقریبی تایید: <span className="font-bold">کمتر از 2 ساعت</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPending;
