import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  UserPlus, 
  FileText, 
  Star, 
  Search, 
  Shield,
  Phone,
  ArrowLeft,
  CheckCircle
} from "lucide-react";

const Help = () => {
  const guides = [
    {
      icon: UserPlus,
      title: "ثبت‌نام و ورود",
      description: "نحوه ایجاد حساب کاربری و ورود به سایت",
      steps: [
        "روی دکمه «ورود/ثبت‌نام» کلیک کنید",
        "شماره موبایل خود را وارد کنید",
        "کد تایید ارسال شده را وارد کنید",
        "اطلاعات پروفایل را تکمیل کنید"
      ]
    },
    {
      icon: FileText,
      title: "ثبت آگهی",
      description: "نحوه ثبت آگهی فروش یا اجاره",
      steps: [
        "وارد حساب کاربری شوید",
        "روی «ثبت آگهی» کلیک کنید",
        "نوع آگهی (فروش/اجاره) را انتخاب کنید",
        "اطلاعات و تصاویر را وارد کنید",
        "آگهی را ثبت کنید و منتظر تایید باشید"
      ]
    },
    {
      icon: Star,
      title: "ویژه کردن آگهی",
      description: "نحوه ویژه کردن آگهی برای دیده شدن بیشتر",
      steps: [
        "به پنل کاربری بروید",
        "آگهی مورد نظر را پیدا کنید",
        "روی «ویژه کردن» کلیک کنید",
        "مدت زمان را انتخاب و پرداخت کنید"
      ]
    },
    {
      icon: Search,
      title: "جستجوی آگهی",
      description: "نحوه پیدا کردن ماشین‌آلات مورد نظر",
      steps: [
        "از نوار جستجو استفاده کنید",
        "فیلترها را تنظیم کنید (نوع، دسته‌بندی، استان)",
        "نتایج را مرور کنید",
        "روی آگهی کلیک کنید برای جزئیات"
      ]
    },
    {
      icon: Shield,
      title: "امنیت معاملات",
      description: "نکات مهم برای معاملات امن",
      steps: [
        "همیشه کالا را حضوری ببینید",
        "قبل از دیدن کالا پول ندهید",
        "مدارک و سند را بررسی کنید",
        "در مکان عمومی قرار بگذارید"
      ]
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">راهنمای سایت</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              آموزش استفاده از امکانات گاراژ سنگین
            </p>
          </div>
        </section>

        {/* Guides */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((guide, index) => {
                const Icon = guide.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{guide.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{guide.description}</p>
                      <div className="space-y-2">
                        {guide.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="flex items-start gap-2">
                            <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                              {stepIndex + 1}
                            </span>
                            <span className="text-sm text-muted-foreground">{step}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">لینک‌های مفید</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <Link to="/faq">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <span>سوالات متداول</span>
                    <ArrowLeft className="w-4 h-4" />
                  </CardContent>
                </Card>
              </Link>
              <Link to="/terms">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <span>قوانین و مقررات</span>
                    <ArrowLeft className="w-4 h-4" />
                  </CardContent>
                </Card>
              </Link>
              <Link to="/contact">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <span>تماس با ما</span>
                    <ArrowLeft className="w-4 h-4" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <Phone className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">نیاز به کمک بیشتر دارید؟</h2>
            <p className="text-muted-foreground mb-6">تیم پشتیبانی ما آماده پاسخگویی است</p>
            <Link to="/contact">
              <Button size="lg">
                تماس با پشتیبانی
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Help;
