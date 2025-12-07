import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Home, Truck, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const PostAdType = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mr-4">
            <ArrowLeft className="w-4 h-4 ml-2" />
            بازگشت
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ثبت آگهی</h1>
            <p className="text-muted-foreground">نوع آگهی خود را انتخاب کنید</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* فروش */}
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-green-300">
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-10 h-10 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-700">فروش ماشین‌آلات</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  ماشین‌آلات، قطعات یا تجهیزات خود را بفروشید
                </p>
                
                <div className="space-y-3 text-sm text-left mb-6">
                  <div className="flex items-center justify-between">
                    <span>✅ قیمت ثابت یا توافقی</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>✅ مشخصات کامل دستگاه</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>✅ وضعیت و سال ساخت</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>✅ برند و مدل</span>
                  </div>
                </div>

                <Button 
                  onClick={() => navigate('/post-ad', { state: { type: 'sale' } })}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <DollarSign className="w-5 h-5 ml-2" />
                  ثبت آگهی فروش
                </Button>
              </CardContent>
            </Card>

            {/* اجاره */}
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-300">
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-10 h-10 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-blue-700">اجاره ماشین‌آلات</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  ماشین‌آلات خود را برای اجاره قرار دهید
                </p>
                
                <div className="space-y-3 text-sm text-left mb-6">
                  <div className="flex items-center justify-between">
                    <span>✅ قیمت روزانه</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>✅ حداقل مدت اجاره</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>✅ شرایط تحویل</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>✅ هزینه حمل و نقل</span>
                  </div>
                </div>

                <Button 
                  onClick={() => navigate('/post-ad', { state: { type: 'rent' } })}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Truck className="w-5 h-5 ml-2" />
                  ثبت آگهی اجاره
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* راهنما */}
          <div className="mt-12 bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Home className="w-5 h-5 ml-2" />
              راهنمای ثبت آگهی
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium mb-2 text-green-700">برای فروش:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• عنوان جذاب و واضح انتخاب کنید</li>
                  <li>• قیمت واقعی یا "توافقی" وارد کنید</li>
                  <li>• مشخصات کامل دستگاه را بنویسید</li>
                  <li>• وضعیت و سال ساخت را ذکر کنید</li>
                  <li>• تصاویر با کیفیت آپلود کنید</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-blue-700">برای اجاره:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• قیمت روزانه را مشخص کنید</li>
                  <li>• حداقل مدت اجاره را بیان کنید</li>
                  <li>• شرایط تحویل و بازگشت را توضیح دهید</li>
                  <li>• هزینه حمل و نقل را ذکر کنید</li>
                  <li>• ساعات کاری و دسترسی را بنویسید</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostAdType;
