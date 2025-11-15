import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cookie, X, Settings, Shield, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // همیشه فعال
    analytics: false,
    marketing: false,
    functional: false
  });

  useEffect(() => {
    // چک کردن اینکه آیا کاربر قبلاً انتخاب کرده یا نه
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // تاخیر کوتاه برای بهتر نمایش دادن
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // بارگذاری تنظیمات ذخیره شده
      try {
        const savedPreferences = JSON.parse(consent);
        setPreferences(savedPreferences);
        applyCookieSettings(savedPreferences);
      } catch (error) {
        console.error('Error parsing cookie preferences:', error);
      }
    }
  }, []);

  const applyCookieSettings = (prefs: CookiePreferences) => {
    // اعمال تنظیمات کوکی
    if (prefs.analytics) {
      // فعال کردن Google Analytics
      enableGoogleAnalytics();
    }
    
    if (prefs.marketing) {
      // فعال کردن کوکی‌های بازاریابی
      enableMarketingCookies();
    }
    
    if (prefs.functional) {
      // فعال کردن کوکی‌های عملکردی
      enableFunctionalCookies();
    }
  };

  const enableGoogleAnalytics = () => {
    // پیاده‌سازی Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    }
  };

  const enableMarketingCookies = () => {
    // پیاده‌سازی کوکی‌های بازاریابی
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        ad_storage: 'granted'
      });
    }
  };

  const enableFunctionalCookies = () => {
    // پیاده‌سازی کوکی‌های عملکردی
    console.log('Functional cookies enabled');
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    
    setPreferences(allAccepted);
    localStorage.setItem('cookie-consent', JSON.stringify(allAccepted));
    applyCookieSettings(allAccepted);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    
    setPreferences(onlyNecessary);
    localStorage.setItem('cookie-consent', JSON.stringify(onlyNecessary));
    applyCookieSettings(onlyNecessary);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences));
    applyCookieSettings(preferences);
    setShowSettings(false);
    setShowBanner(false);
  };

  const handlePreferenceChange = (type: keyof CookiePreferences) => {
    if (type === 'necessary') return; // نمی‌توان غیرفعال کرد
    
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-md border-t shadow-lg">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Cookie className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">🍪 استفاده از کوکی‌ها</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    ما از کوکی‌ها برای بهبود تجربه شما، تجزیه و تحلیل ترافیک و ارائه محتوای شخصی‌سازی شده استفاده می‌کنیم. 
                    با ادامه استفاده از سایت، با استفاده از کوکی‌ها موافقت می‌کنید.
                  </p>
                  <div className="mt-2">
                    <button 
                      onClick={() => window.open('/privacy-policy', '_blank')}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      سیاست حریم خصوصی
                    </button>
                    {' • '}
                    <button 
                      onClick={() => window.open('/cookie-policy', '_blank')}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      سیاست کوکی‌ها
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  تنظیمات
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRejectAll}
                >
                  رد همه
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  پذیرش همه
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cookie Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5" />
              تنظیمات حریم خصوصی و کوکی‌ها
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <p className="text-gray-600">
              شما می‌توانید انواع کوکی‌هایی که می‌خواهید ذخیره شوند را انتخاب کنید. 
              این تنظیمات بر عملکرد سایت و خدماتی که ارائه می‌دهیم تأثیر می‌گذارد.
            </p>

            {/* Necessary Cookies */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold">کوکی‌های ضروری</h4>
                </div>
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  همیشه فعال
                </div>
              </div>
              <p className="text-sm text-gray-600">
                این کوکی‌ها برای عملکرد اساسی سایت ضروری هستند و نمی‌توانند غیرفعال شوند. 
                شامل احراز هویت، امنیت و تنظیمات اساسی.
              </p>
            </div>

            {/* Analytics Cookies */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold">کوکی‌های تجزیه و تحلیل</h4>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={() => handlePreferenceChange('analytics')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <p className="text-sm text-gray-600">
                این کوکی‌ها به ما کمک می‌کنند تا بفهمیم کاربران چگونه با سایت تعامل می‌کنند. 
                شامل Google Analytics و آمار بازدید.
              </p>
            </div>

            {/* Marketing Cookies */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cookie className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold">کوکی‌های بازاریابی</h4>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={() => handlePreferenceChange('marketing')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <p className="text-sm text-gray-600">
                این کوکی‌ها برای نمایش تبلیغات مرتبط و شخصی‌سازی شده استفاده می‌شوند. 
                شامل Facebook Pixel و سایر ابزارهای بازاریابی.
              </p>
            </div>

            {/* Functional Cookies */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-orange-600" />
                  <h4 className="font-semibold">کوکی‌های عملکردی</h4>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={() => handlePreferenceChange('functional')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <p className="text-sm text-gray-600">
                این کوکی‌ها ویژگی‌های پیشرفته‌ای مانند چت آنلاین، ذخیره تنظیمات و 
                شخصی‌سازی تجربه کاربری را فعال می‌کنند.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
              className="flex-1"
            >
              انصراف
            </Button>
            <Button
              onClick={handleSavePreferences}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              ذخیره تنظیمات
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;