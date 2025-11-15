import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star, ArrowRight, Home } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refId = searchParams.get('ref_id');
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    // Confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Since particles fall down, start a bit higher than random
      if (typeof (window as any).confetti !== 'undefined') {
        (window as any).confetti(Object.assign({}, defaults, { 
          particleCount, 
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
        }));
        (window as any).confetti(Object.assign({}, defaults, { 
          particleCount, 
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
        }));
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardContent className="p-12 text-center">
          {/* Success Icon */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-6">
              <CheckCircle className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            پرداخت موفق!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            آگهی شما با موفقیت ویژه شد
          </p>

          {/* Payment Details */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
              {refId && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">شماره پیگیری</p>
                  <p className="font-bold text-lg font-mono">{refId}</p>
                </div>
              )}
              {paymentId && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">شماره تراکنش</p>
                  <p className="font-bold text-lg">#{paymentId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-white rounded-lg border-2 border-green-200">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm font-medium">آگهی ویژه شد</p>
            </div>
            <div className="p-4 bg-white rounded-lg border-2 border-green-200">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium">فعال‌سازی فوری</p>
            </div>
            <div className="p-4 bg-white rounded-lg border-2 border-green-200">
              <ArrowRight className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-medium">نمایش در بالای لیست</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <CheckCircle className="w-5 h-5 ml-2" />
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

          {/* Additional Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 آگهی شما اکنون در بالای لیست نمایش داده می‌شود و دیده شدن بیشتری خواهد داشت
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
