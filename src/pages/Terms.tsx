import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ScrollText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">قوانین و مقررات</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              لطفاً قبل از استفاده از خدمات گاراژ سنگین، این قوانین را مطالعه کنید
            </p>
            <Badge className="mt-4" variant="outline">آخرین بروزرسانی: آذر ۱۴۰۳</Badge>
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="space-y-8">

              {/* Section 1 */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm">۱</span>
                    پذیرش قوانین
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    با استفاده از سایت گاراژ سنگین، شما موافقت خود را با تمامی قوانین و مقررات این سایت اعلام می‌کنید.
                    در صورت عدم موافقت با هر یک از این قوانین، لطفاً از استفاده از خدمات ما خودداری کنید.
                  </p>
                </CardContent>
              </Card>

              {/* Section 2 */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm">۲</span>
                    شرایط ثبت آگهی
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">آگهی باید مربوط به ماشین‌آلات سنگین باشد</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">اطلاعات آگهی باید صحیح و کامل باشد</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">تصاویر باید واقعی و مربوط به کالا باشند</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">قیمت باید منطقی و واقعی باشد</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 3 */}
              <Card className="border-red-200">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm">۳</span>
                    موارد ممنوعه
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">ثبت آگهی کالای غیرقانونی یا مسروقه</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">درج اطلاعات نادرست یا گمراه‌کننده</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">استفاده از تصاویر جعلی یا متعلق به دیگران</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">هرگونه کلاهبرداری یا سوءاستفاده</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 4 */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm">۴</span>
                    مسئولیت‌ها
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    گاراژ سنگین صرفاً یک پلتفرم واسط است و مسئولیتی در قبال معاملات بین کاربران ندارد.
                    کاربران موظفند قبل از هر معامله، کالا را حضوری بررسی کنند.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-yellow-800 text-sm">
                        هرگز قبل از دیدن کالا پول پرداخت نکنید. گاراژ سنگین هیچ مسئولیتی در قبال کلاهبرداری‌های احتمالی ندارد.
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 5 */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm">۵</span>
                    حقوق مالکیت معنوی
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    تمامی محتوای سایت شامل لوگو، طراحی، متون و کدها متعلق به گاراژ سنگین است.
                    هرگونه کپی‌برداری بدون اجازه کتبی ممنوع است.
                  </p>
                </CardContent>
              </Card>

              {/* Section 6 */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm">۶</span>
                    تغییرات قوانین
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    گاراژ سنگین حق تغییر این قوانین را در هر زمان برای خود محفوظ می‌دارد.
                    تغییرات از طریق سایت اطلاع‌رسانی خواهد شد و ادامه استفاده از سایت به منزله پذیرش قوانین جدید است.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
