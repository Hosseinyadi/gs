import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, TrendingUp, Users, MapPin } from "lucide-react";
import { useBannerSettings } from "@/hooks/useBannerSettings";
import { Link } from "react-router-dom";
import ProvinceSelect from "@/components/ui/ProvinceSelect";
import { Card, CardContent } from "@/components/ui/card";

const HeroSection = () => {
  const { settings, loading } = useBannerSettings();
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string>('');

  // Check if user has selected province before
  useEffect(() => {
    const saved = localStorage.getItem('selectedProvince');
    if (!saved) {
      // Show modal after 1 second if no province selected
      const timer = setTimeout(() => {
        setShowProvinceModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setSelectedProvince(saved);
    }
  }, []);

  const handleProvinceSelect = (province: string) => {
    setSelectedProvince(province);
    localStorage.setItem('selectedProvince', province);
    setShowProvinceModal(false);
  };

  if (loading) {
    return (
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gray-100">
        <div className="animate-pulse text-gray-400">در حال بارگذاری...</div>
      </section>
    );
  }

  return (
    <>
      {/* Province Selection Modal */}
      {showProvinceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">استان خود را انتخاب کنید</h3>
                <p className="text-muted-foreground text-sm">
                  برای نمایش آگهی‌های مرتبط با منطقه شما
                </p>
              </div>
              
              <div className="space-y-4">
                <ProvinceSelect
                  value={selectedProvince}
                  onValueChange={handleProvinceSelect}
                  placeholder="انتخاب استان"
                  className="w-full"
                  saveToLocalStorage={true}
                />
                
                <Button 
                  onClick={() => setShowProvinceModal(false)}
                  variant="outline"
                  className="w-full"
                >
                  بعداً انتخاب می‌کنم
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Dynamic Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${settings.hero_background})`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40"></div>
        </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white">
            {settings.hero_title}
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-200 leading-relaxed">
            {settings.hero_subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to={settings.hero_button_link}>
              <Button className="btn-hero text-lg px-8 py-4">
                {settings.hero_button_text}
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
            <Link to="/post-ad">
              <Button variant="outline" size="lg" className="btn-outline-warm text-lg px-8 py-4">
                <Play className="w-5 h-5 ml-2" />
                ثبت آگهی رایگان
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">۲۵۰+</div>
              <div className="text-gray-300">ماشین‌آلات فعال</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-secondary mb-2">۱۰۰+</div>
              <div className="text-gray-300">مشتری راضی</div>
            </div>
            <div className="text-center col-span-2 md:col-span-1">
              <div className="text-3xl md:text-4xl font-bold text-success mb-2">۱۵+</div>
              <div className="text-gray-300">سال تجربه</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cards */}
      <div className="absolute bottom-10 left-10 hidden lg:block">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white border border-white/20">
          <div className="flex items-center space-x-3 space-x-reverse">
            <TrendingUp className="w-6 h-6 text-primary" />
            <div>
              <div className="font-bold">رشد ۳۰٪</div>
              <div className="text-sm text-gray-300">اجاره‌های ماهانه</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 right-10 hidden lg:block">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-white border border-white/20">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Users className="w-6 h-6 text-secondary" />
            <div>
              <div className="font-bold">پشتیبانی ۲۴/۷</div>
              <div className="text-sm text-gray-300">خدمات مشتریان</div>
            </div>
          </div>
        </div>
      </div>
      </section>
    </>
  );
};

export default HeroSection;