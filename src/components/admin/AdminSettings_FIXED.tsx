import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Loader2, DollarSign, Settings as SettingsIcon, FileText, CheckCircle } from "lucide-react";

interface SettingItem {
  setting_key: string;
  setting_value: string;
  description: string;
}

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, SettingItem>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual API
      const mockSettings = {
        'pricing.featured_daily': { setting_key: 'pricing.featured_daily', setting_value: '50000', description: 'قیمت روزانه آگهی ویژه' },
        'pricing.featured_weekly': { setting_key: 'pricing.featured_weekly', setting_value: '300000', description: 'قیمت هفتگی آگهی ویژه' },
        'pricing.featured_monthly': { setting_key: 'pricing.featured_monthly', setting_value: '1000000', description: 'قیمت ماهانه آگهی ویژه' },
        'pricing.min_wallet_charge': { setting_key: 'pricing.min_wallet_charge', setting_value: '10000', description: 'حداقل شارژ کیف پول' },
        'general.site_name': { setting_key: 'general.site_name', setting_value: 'گاراژ سنگین', description: 'نام سایت' },
        'general.site_description': { setting_key: 'general.site_description', setting_value: 'پلتفرم خرید و فروش ماشین‌آلات سنگین', description: 'توضیحات سایت' },
        'general.support_email': { setting_key: 'general.support_email', setting_value: 'support@garazh.com', description: 'ایمیل پشتیبانی' },
        'general.support_phone': { setting_key: 'general.support_phone', setting_value: '021-12345678', description: 'شماره تماس پشتیبانی' },
        'general.office_address': { setting_key: 'general.office_address', setting_value: 'تهران، خیابان ولیعصر', description: 'آدرس دفتر' },
        'listings.max_images': { setting_key: 'listings.max_images', setting_value: '10', description: 'حداکثر تعداد تصاویر' },
        'listings.max_image_size': { setting_key: 'listings.max_image_size', setting_value: '5', description: 'حداکثر حجم تصویر' },
        'listings.min_title_length': { setting_key: 'listings.min_title_length', setting_value: '10', description: 'حداقل طول عنوان' },
        'listings.min_description_length': { setting_key: 'listings.min_description_length', setting_value: '50', description: 'حداقل طول توضیحات' },
        'listings.expiry_days': { setting_key: 'listings.expiry_days', setting_value: '90', description: 'مدت انقضای آگهی' },
        'listings.auto_approve': { setting_key: 'listings.auto_approve', setting_value: 'false', description: 'تأیید خودکار آگهی‌ها' }
      };
      setSettings(mockSettings);
      toast.success('تنظیمات بارگذاری شد');
    } catch (error) {
      toast.error('خطا در بارگذاری تنظیمات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (category: string) => {
    setSaving(true);
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const categorySettings = Object.values(settings).filter(
        s => s.setting_key.startsWith(category)
      );
      
      console.log(`Saving ${category} settings:`, categorySettings);
      
      // Here you would make the actual API call
      // const response = await adminApi.bulkUpdateSettings(updates);
      
      toast.success(`تنظیمات ${getCategoryName(category)} با موفقیت ذخیره شد`);
    } catch (error) {
      toast.error('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'pricing': return 'قیمت‌گذاری';
      case 'general': return 'عمومی';
      case 'listings': return 'آگهی‌ها';
      default: return category;
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], setting_value: value }
    }));
  };

  const getSetting = (key: string, defaultValue: string = '') => {
    return settings[key]?.setting_value || defaultValue;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-gray-600">در حال بارگذاری تنظیمات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="w-6 h-6 text-gray-600" />
        <h2 className="text-2xl font-bold">تنظیمات سیستم</h2>
      </div>

      <Tabs defaultValue="pricing" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pricing">
            <DollarSign className="w-4 h-4 ml-2" />
            قیمت‌گذاری
          </TabsTrigger>
          <TabsTrigger value="general">
            <SettingsIcon className="w-4 h-4 ml-2" />
            عمومی
          </TabsTrigger>
          <TabsTrigger value="listings">
            <FileText className="w-4 h-4 ml-2" />
            آگهی‌ها
          </TabsTrigger>
        </TabsList>

        {/* Pricing Settings - بدون کمیسیون */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                تنظیمات قیمت‌گذاری آگهی‌های ویژه
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">قیمت آگهی ویژه (روزانه - تومان):</label>
                  <Input
                    type="number"
                    value={getSetting('pricing.featured_daily', '50000')}
                    onChange={(e) => updateSetting('pricing.featured_daily', e.target.value)}
                    className="text-left"
                  />
                  <p className="text-xs text-gray-500">
                    هزینه روزانه برای قرار گرفتن در لیست آگهی‌های ویژه
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">قیمت آگهی ویژه (هفتگی - تومان):</label>
                  <Input
                    type="number"
                    value={getSetting('pricing.featured_weekly', '300000')}
                    onChange={(e) => updateSetting('pricing.featured_weekly', e.target.value)}
                    className="text-left"
                  />
                  <p className="text-xs text-gray-500">
                    هزینه هفتگی با تخفیف نسبت به روزانه
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">قیمت آگهی ویژه (ماهانه - تومان):</label>
                  <Input
                    type="number"
                    value={getSetting('pricing.featured_monthly', '1000000')}
                    onChange={(e) => updateSetting('pricing.featured_monthly', e.target.value)}
                    className="text-left"
                  />
                  <p className="text-xs text-gray-500">
                    هزینه ماهانه با تخفیف بیشتر
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">حداقل شارژ کیف پول (تومان):</label>
                  <Input
                    type="number"
                    value={getSetting('pricing.min_wallet_charge', '10000')}
                    onChange={(e) => updateSetting('pricing.min_wallet_charge', e.target.value)}
                    className="text-left"
                  />
                  <p className="text-xs text-gray-500">
                    حداقل مبلغ برای شارژ کیف پول کاربران
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">نکته مهم:</h4>
                <p className="text-sm text-blue-700">
                  در گاراژ سنگین، کمیسیون فروش وجود ندارد. تنها هزینه، آگهی‌های ویژه است که کاربران می‌توانند برای بهتر دیده شدن آگهی‌هایشان پرداخت کنند.
                </p>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSave('pricing')} 
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      ذخیره تنظیمات قیمت‌گذاری
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                تنظیمات عمومی سایت
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">نام سایت:</label>
                  <Input
                    value={getSetting('general.site_name', 'گاراژ سنگین')}
                    onChange={(e) => updateSetting('general.site_name', e.target.value)}
                    placeholder="نام سایت را وارد کنید"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">توضیحات سایت:</label>
                  <Textarea
                    value={getSetting('general.site_description', 'پلتفرم خرید و فروش ماشین‌آلات سنگین')}
                    onChange={(e) => updateSetting('general.site_description', e.target.value)}
                    rows={3}
                    placeholder="توضیحات کوتاه درباره سایت"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ایمیل پشتیبانی:</label>
                    <Input
                      type="email"
                      value={getSetting('general.support_email', 'support@garazh.com')}
                      onChange={(e) => updateSetting('general.support_email', e.target.value)}
                      placeholder="support@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">شماره تماس پشتیبانی:</label>
                    <Input
                      value={getSetting('general.support_phone', '021-12345678')}
                      onChange={(e) => updateSetting('general.support_phone', e.target.value)}
                      placeholder="021-12345678"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">آدرس دفتر:</label>
                  <Textarea
                    value={getSetting('general.office_address', 'تهران، خیابان ولیعصر')}
                    onChange={(e) => updateSetting('general.office_address', e.target.value)}
                    rows={2}
                    placeholder="آدرس کامل دفتر"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSave('general')} 
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      ذخیره تنظیمات عمومی
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Listings Settings */}
        <TabsContent value="listings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                تنظیمات آگهی‌ها
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">حداکثر تعداد تصاویر:</label>
                  <Input
                    type="number"
                    value={getSetting('listings.max_images', '10')}
                    onChange={(e) => updateSetting('listings.max_images', e.target.value)}
                    min="1"
                    max="20"
                  />
                  <p className="text-xs text-gray-500">
                    حداکثر تعداد تصاویر برای هر آگهی (1-20)
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">حداکثر حجم تصویر (مگابایت):</label>
                  <Input
                    type="number"
                    value={getSetting('listings.max_image_size', '5')}
                    onChange={(e) => updateSetting('listings.max_image_size', e.target.value)}
                    min="1"
                    max="10"
                  />
                  <p className="text-xs text-gray-500">
                    حداکثر حجم هر تصویر (1-10 مگابایت)
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">حداقل طول عنوان:</label>
                  <Input
                    type="number"
                    value={getSetting('listings.min_title_length', '10')}
                    onChange={(e) => updateSetting('listings.min_title_length', e.target.value)}
                    min="5"
                    max="50"
                  />
                  <p className="text-xs text-gray-500">
                    حداقل تعداد کاراکتر برای عنوان آگهی
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">حداقل طول توضیحات:</label>
                  <Input
                    type="number"
                    value={getSetting('listings.min_description_length', '50')}
                    onChange={(e) => updateSetting('listings.min_description_length', e.target.value)}
                    min="20"
                    max="200"
                  />
                  <p className="text-xs text-gray-500">
                    حداقل تعداد کاراکتر برای توضیحات آگهی
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">مدت انقضای آگهی (روز):</label>
                  <Input
                    type="number"
                    value={getSetting('listings.expiry_days', '90')}
                    onChange={(e) => updateSetting('listings.expiry_days', e.target.value)}
                    min="30"
                    max="365"
                  />
                  <p className="text-xs text-gray-500">
                    آگهی‌ها بعد از این مدت غیرفعال می‌شوند
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">تأیید خودکار آگهی‌ها:</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={getSetting('listings.auto_approve', 'false')}
                    onChange={(e) => updateSetting('listings.auto_approve', e.target.value)}
                  >
                    <option value="false">غیرفعال - نیاز به تأیید ادمین</option>
                    <option value="true">فعال - تأیید خودکار</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    آگهی‌ها بدون تأیید ادمین منتشر شوند یا خیر
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSave('listings')} 
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      ذخیره تنظیمات آگهی‌ها
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
