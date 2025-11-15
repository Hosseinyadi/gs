import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Cookie, Database, Mail, Phone } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen">
      <SEOHead 
        title="سیاست حریم خصوصی - گاراژ سنگین"
        description="سیاست حریم خصوصی گاراژ سنگین. نحوه جمع‌آوری، استفاده و محافظت از اطلاعات شخصی شما"
        keywords="حریم خصوصی، سیاست کوکی، محافظت اطلاعات، GDPR"
        url="https://garagesangin.com/privacy-policy"
      />
      <Header />
      
      <main className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold">سیاست حریم خصوصی</h1>
            </div>
            <p className="text-gray-600 text-lg">
              گاراژ سنگین متعهد به محافظت از حریم خصوصی و اطلاعات شخصی شماست
            </p>
            <p className="text-sm text-gray-500 mt-2">
              آخرین بروزرسانی: ۲۳ آبان ۱۴۰۳
            </p>
          </div>

          <div className="space-y-8">
            {/* مقدمه */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  مقدمه
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  این سیاست حریم خصوصی نحوه جمع‌آوری، استفاده، ذخیره‌سازی و محافظت از اطلاعات شخصی شما 
                  هنگام استفاده از وب‌سایت و خدمات گاراژ سنگین را توضیح می‌دهد.
                </p>
                <p>
                  با استفاده از خدمات ما، شما با شرایط این سیاست موافقت می‌کنید. اگر با هر بخشی از این سیاست 
                  موافق نیستید، لطفاً از خدمات ما استفاده نکنید.
                </p>
              </CardContent>
            </Card>

            {/* اطلاعات جمع‌آوری شده */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  اطلاعات جمع‌آوری شده
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">اطلاعات شخصی:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>نام و نام خانوادگی</li>
                    <li>شماره تلفن همراه</li>
                    <li>آدرس ایمیل (اختیاری)</li>
                    <li>آدرس محل سکونت یا کسب‌وکار</li>
                    <li>اطلاعات مربوط به آگهی‌ها و محصولات</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">اطلاعات فنی:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>آدرس IP</li>
                    <li>نوع مرورگر و سیستم عامل</li>
                    <li>صفحات بازدید شده و زمان بازدید</li>
                    <li>کوکی‌ها و فناوری‌های ردیابی</li>
                    <li>اطلاعات دستگاه (موبایل/دسکتاپ)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">اطلاعات پرداخت:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>اطلاعات تراکنش‌های پرداخت</li>
                    <li>تاریخچه خریدها</li>
                    <li>وضعیت پرداخت‌ها</li>
                    <li className="text-red-600 font-medium">
                      توجه: ما هیچ‌گاه اطلاعات کارت بانکی شما را ذخیره نمی‌کنیم
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* نحوه استفاده از اطلاعات */}
            <Card>
              <CardHeader>
                <CardTitle>نحوه استفاده از اطلاعات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">اهداف اصلی:</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>ارائه خدمات درخواستی</li>
                      <li>احراز هویت کاربران</li>
                      <li>پردازش پرداخت‌ها</li>
                      <li>ارتباط با مشتریان</li>
                      <li>بهبود کیفیت خدمات</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">اهداف فرعی:</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>تجزیه و تحلیل آماری</li>
                      <li>شخصی‌سازی تجربه کاربری</li>
                      <li>ارسال اطلاعیه‌های مهم</li>
                      <li>پیشگیری از تقلب</li>
                      <li>بهینه‌سازی عملکرد سایت</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* کوکی‌ها */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cookie className="w-5 h-5" />
                  کوکی‌ها و فناوری‌های ردیابی
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">انواع کوکی‌ها:</h3>
                    <div className="space-y-3">
                      <div className="border-l-4 border-green-500 pl-4">
                        <h4 className="font-medium text-green-700">کوکی‌های ضروری</h4>
                        <p className="text-sm text-gray-600">برای عملکرد اساسی سایت</p>
                      </div>
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-medium text-blue-700">کوکی‌های تحلیلی</h4>
                        <p className="text-sm text-gray-600">برای بهبود عملکرد سایت</p>
                      </div>
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h4 className="font-medium text-purple-700">کوکی‌های بازاریابی</h4>
                        <p className="text-sm text-gray-600">برای تبلیغات مرتبط</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">مدیریت کوکی‌ها:</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>می‌توانید کوکی‌ها را در مرورگر خود غیرفعال کنید</li>
                      <li>از تنظیمات سایت برای مدیریت کوکی‌ها استفاده کنید</li>
                      <li>برخی ویژگی‌ها ممکن است بدون کوکی کار نکنند</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* اشتراک‌گذاری اطلاعات */}
            <Card>
              <CardHeader>
                <CardTitle>اشتراک‌گذاری اطلاعات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">تعهد ما:</h3>
                  <p className="text-red-700">
                    ما هیچ‌گاه اطلاعات شخصی شما را بدون رضایت صریح شما به اشخاص ثالث نمی‌فروشیم یا اجاره نمی‌دهیم.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">موارد استثنا (فقط در صورت ضرورت):</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>ارائه‌دهندگان خدمات فنی (با قرارداد محرمانگی)</li>
                    <li>درگاه‌های پرداخت معتبر</li>
                    <li>مراجع قانونی (در صورت درخواست قضایی)</li>
                    <li>محافظت از حقوق و امنیت کاربران</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* حقوق کاربران */}
            <Card>
              <CardHeader>
                <CardTitle>حقوق شما</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">حقوق اساسی:</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>دسترسی به اطلاعات شخصی خود</li>
                      <li>تصحیح اطلاعات نادرست</li>
                      <li>حذف اطلاعات شخصی</li>
                      <li>محدود کردن پردازش اطلاعات</li>
                      <li>انتقال اطلاعات</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">نحوه اعمال حقوق:</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>ارسال درخواست به ایمیل پشتیبانی</li>
                      <li>تماس با شماره پشتیبانی</li>
                      <li>استفاده از بخش تنظیمات حساب کاربری</li>
                      <li>پاسخ ما ظرف ۷۲ ساعت</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* امنیت اطلاعات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  امنیت اطلاعات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  ما از روش‌های پیشرفته امنیتی برای محافظت از اطلاعات شما استفاده می‌کنیم:
                </p>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold">رمزگذاری SSL</h4>
                    <p className="text-sm text-gray-600">تمام اطلاعات رمزگذاری می‌شوند</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-semibold">پایگاه داده امن</h4>
                    <p className="text-sm text-gray-600">ذخیره‌سازی در سرورهای امن</p>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Eye className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold">نظارت مستمر</h4>
                    <p className="text-sm text-gray-600">کنترل دسترسی‌ها و فعالیت‌ها</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* تماس با ما */}
            <Card>
              <CardHeader>
                <CardTitle>تماس با ما</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  اگر سوال یا نگرانی‌ای درباره حریم خصوصی خود دارید، با ما تماس بگیرید:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">ایمیل پشتیبانی:</p>
                      <p className="text-blue-600">privacy@garagesangin.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">تلفن پشتیبانی:</p>
                      <p className="text-green-600">۰۲۱-۱۲۳۴۵۶۷۸</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>توجه:</strong> این سیاست ممکن است به‌روزرسانی شود. تغییرات مهم از طریق ایمیل یا اطلاعیه در سایت اعلام می‌شود.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;