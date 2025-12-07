import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Target, 
  Award, 
  Shield, 
  Truck, 
  Clock,
  CheckCircle,
  Star
} from "lucide-react";

const About = () => {
  const stats = [
    { label: "سال تجربه", value: "۱۵+", icon: Clock },
    { label: "مشتری راضی", value: "۱۰۰۰+", icon: Users },
    { label: "آگهی ثبت شده", value: "۵۰۰۰+", icon: Truck },
    { label: "استان تحت پوشش", value: "۳۱", icon: Target },
  ];

  const values = [
    {
      icon: Shield,
      title: "امنیت و اعتماد",
      description: "تمامی آگهی‌ها توسط تیم ما بررسی و تایید می‌شوند تا از صحت اطلاعات اطمینان حاصل شود."
    },
    {
      icon: Award,
      title: "کیفیت خدمات",
      description: "ارائه بهترین خدمات به کاربران با پشتیبانی ۲۴ ساعته و پاسخگویی سریع."
    },
    {
      icon: Users,
      title: "جامعه حرفه‌ای",
      description: "ایجاد بستری برای ارتباط مستقیم بین خریداران، فروشندگان و اجاره‌دهندگان ماشین‌آلات."
    },
    {
      icon: Target,
      title: "هدفمندی",
      description: "تمرکز بر نیازهای واقعی صنعت ماشین‌آلات سنگین ایران و ارائه راه‌حل‌های کاربردی."
    },
  ];

  const team = [
    { name: "مدیریت فنی", role: "نظارت بر کیفیت آگهی‌ها" },
    { name: "پشتیبانی", role: "پاسخگویی به کاربران" },
    { name: "توسعه", role: "بهبود مستمر پلتفرم" },
    { name: "بازاریابی", role: "گسترش خدمات" },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 py-20">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              درباره ما
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              گاراژ سنگین
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              بزرگترین پلتفرم خرید، فروش و اجاره ماشین‌آلات سنگین در ایران.
              ما با هدف تسهیل معاملات در صنعت ماشین‌آلات سنگین، بستری امن و کارآمد برای 
              ارتباط مستقیم بین خریداران و فروشندگان ایجاد کرده‌ایم.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="text-center border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                      <div className="text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">ماموریت ما</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                ماموریت ما در گاراژ سنگین، ایجاد یک اکوسیستم دیجیتال برای صنعت ماشین‌آلات سنگین ایران است.
                ما می‌خواهیم با استفاده از فناوری، فرآیند خرید، فروش و اجاره ماشین‌آلات را ساده‌تر، 
                شفاف‌تر و امن‌تر کنیم.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 justify-center text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>معاملات امن</span>
                </div>
                <div className="flex items-center gap-2 justify-center text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>قیمت‌های منصفانه</span>
                </div>
                <div className="flex items-center gap-2 justify-center text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>پشتیبانی حرفه‌ای</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">ارزش‌های ما</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                      <p className="text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">تیم ما</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {team.map((member, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-bold mb-1">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-r from-primary to-secondary text-white">
          <div className="container mx-auto px-4 text-center">
            <Star className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h2 className="text-3xl font-bold mb-4">همین امروز شروع کنید</h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              به جمع هزاران کاربر گاراژ سنگین بپیوندید و از امکانات ویژه ما بهره‌مند شوید.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
