import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Image, Upload, Trash2, Eye, Save, Plus, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import adminApi from "@/services/admin-api";

interface BannerSettings {
  hero_title: string;
  hero_subtitle: string;
  hero_background: string;
  hero_button_text: string;
  hero_button_link: string;
  banner_1_image: string;
  banner_1_title: string;
  banner_1_link: string;
  banner_2_image: string;
  banner_2_title: string;
  banner_2_link: string;
  banner_3_image: string;
  banner_3_title: string;
  banner_3_link: string;
}

interface BannerItem {
  id: string;
  title: string;
  image: string;
  link: string;
  description: string;
}

function AdminBannerSettings() {
  const [settings, setSettings] = useState<BannerSettings>({
    hero_title: '',
    hero_subtitle: '',
    hero_background: '',
    hero_button_text: '',
    hero_button_link: '',
    banner_1_image: '',
    banner_1_title: '',
    banner_1_link: '',
    banner_2_image: '',
    banner_2_title: '',
    banner_2_link: '',
    banner_3_image: '',
    banner_3_title: '',
    banner_3_link: ''
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getSettings('banner');
      if (response.success && response.data?.settings) {
        const settingsMap = response.data.settings.reduce((acc: any, setting: any) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {});

        setSettings({
          hero_title: settingsMap.hero_title || 'ماشین‌آلات و تجهیزات حرفه‌ای',
          hero_subtitle: settingsMap.hero_subtitle || 'اجاره • فروش • قطعات یدکی • خدمات تخصصی',
          hero_background: settingsMap.hero_background || '/hero-bg.jpg',
          hero_button_text: settingsMap.hero_button_text || 'مشاهده اجاره‌ها',
          hero_button_link: settingsMap.hero_button_link || '/rent',
          banner_1_image: settingsMap.banner_1_image || '/banner-1.jpg',
          banner_1_title: settingsMap.banner_1_title || 'بیل مکانیکی',
          banner_1_link: settingsMap.banner_1_link || '/search?category=excavator',
          banner_2_image: settingsMap.banner_2_image || '/banner-2.jpg',
          banner_2_title: settingsMap.banner_2_title || 'لودر',
          banner_2_link: settingsMap.banner_2_link || '/search?category=loader',
          banner_3_image: settingsMap.banner_3_image || '/banner-3.jpg',
          banner_3_title: settingsMap.banner_3_title || 'بولدوزر',
          banner_3_link: settingsMap.banner_3_link || '/search?category=bulldozer'
        });
      }
    } catch (error) {
      console.error('Error loading banner settings:', error);
      toast.error('خطا در بارگذاری تنظیمات بنرها');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsToUpdate = Object.entries(settings).map(([key, value]) => ({
        key,
        value: value || ''
      }));

      const response = await adminApi.bulkUpdateSettings(settingsToUpdate);
      
      if (response.success) {
        toast.success('تنظیمات بنرها با موفقیت ذخیره شد');
      } else {
        toast.error(response.message || 'خطا در ذخیره تنظیمات');
      }
    } catch (error) {
      console.error('Error saving banner settings:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (field: keyof BannerSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const openImageDialog = (bannerKey: string) => {
    setSelectedBanner(bannerKey);
    setImageUrl(settings[bannerKey as keyof BannerSettings] || '');
    setShowImageDialog(true);
  };

  const handleImageSave = () => {
    if (selectedBanner && imageUrl) {
      handleImageChange(selectedBanner as keyof BannerSettings, imageUrl);
      setShowImageDialog(false);
      setImageUrl('');
      setSelectedBanner('');
    }
  };

  const bannerItems: BannerItem[] = [
    {
      id: 'hero_background',
      title: 'تصویر پس‌زمینه صفحه اصلی',
      image: settings.hero_background,
      link: settings.hero_button_link,
      description: 'تصویر اصلی که در پشت متن صفحه اول نمایش داده می‌شود'
    },
    {
      id: 'banner_1_image',
      title: 'بنر اول',
      image: settings.banner_1_image,
      link: settings.banner_1_link,
      description: settings.banner_1_title
    },
    {
      id: 'banner_2_image',
      title: 'بنر دوم',
      image: settings.banner_2_image,
      link: settings.banner_2_link,
      description: settings.banner_2_title
    },
    {
      id: 'banner_3_image',
      title: 'بنر سوم',
      image: settings.banner_3_image,
      link: settings.banner_3_link,
      description: settings.banner_3_title
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            مدیریت بنرها و تصاویر صفحه اصلی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              تصاویر و متن‌های نمایش داده شده در صفحه اصلی سایت را مدیریت کنید
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {previewMode ? 'حالت ویرایش' : 'پیش‌نمایش'}
              </Button>
              <Button
                onClick={saveSettings}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    ذخیره تغییرات
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hero Section Settings */}
      <Card>
        <CardHeader>
          <CardTitle>تنظیمات بخش اصلی (Hero Section)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hero_title">عنوان اصلی</Label>
              <Input
                id="hero_title"
                value={settings.hero_title}
                onChange={(e) => handleImageChange('hero_title', e.target.value)}
                placeholder="ماشین‌آلات و تجهیزات حرفه‌ای"
              />
            </div>
            <div>
              <Label htmlFor="hero_subtitle">زیرعنوان</Label>
              <Input
                id="hero_subtitle"
                value={settings.hero_subtitle}
                onChange={(e) => handleImageChange('hero_subtitle', e.target.value)}
                placeholder="اجاره • فروش • قطعات یدکی"
              />
            </div>
            <div>
              <Label htmlFor="hero_button_text">متن دکمه</Label>
              <Input
                id="hero_button_text"
                value={settings.hero_button_text}
                onChange={(e) => handleImageChange('hero_button_text', e.target.value)}
                placeholder="مشاهده اجاره‌ها"
              />
            </div>
            <div>
              <Label htmlFor="hero_button_link">لینک دکمه</Label>
              <Input
                id="hero_button_link"
                value={settings.hero_button_link}
                onChange={(e) => handleImageChange('hero_button_link', e.target.value)}
                placeholder="/rent"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banner Images */}
      <Card>
        <CardHeader>
          <CardTitle>تصاویر بنرها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bannerItems.map((banner) => (
              <div key={banner.id} className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">{banner.title}</h3>
                
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative group">
                  {banner.image ? (
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Image className="w-8 h-8" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      onClick={() => openImageDialog(banner.id)}
                      className="bg-white text-black hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4 ml-1" />
                      ویرایش
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600">{banner.description}</p>
                
                {banner.id !== 'hero_background' && (
                  <div className="space-y-2">
                    <Input
                      placeholder="عنوان بنر"
                      value={settings[`${banner.id.replace('_image', '_title')}` as keyof BannerSettings]}
                      onChange={(e) => handleImageChange(`${banner.id.replace('_image', '_title')}` as keyof BannerSettings, e.target.value)}
                      className="text-xs"
                    />
                    <Input
                      placeholder="لینک بنر"
                      value={settings[`${banner.id.replace('_image', '_link')}` as keyof BannerSettings]}
                      onChange={(e) => handleImageChange(`${banner.id.replace('_image', '_link')}` as keyof BannerSettings, e.target.value)}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview Mode */}
      {previewMode && (
        <Card>
          <CardHeader>
            <CardTitle>پیش‌نمایش</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Hero Preview */}
              <div 
                className="relative h-64 rounded-lg overflow-hidden flex items-center justify-center text-white"
                style={{
                  backgroundImage: `url(${settings.hero_background})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                <div className="relative text-center">
                  <h1 className="text-3xl font-bold mb-2">{settings.hero_title}</h1>
                  <p className="text-lg mb-4">{settings.hero_subtitle}</p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    {settings.hero_button_text}
                  </Button>
                </div>
              </div>

              {/* Banners Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="relative h-32 rounded-lg overflow-hidden">
                    <img
                      src={settings[`banner_${num}_image` as keyof BannerSettings]}
                      alt={settings[`banner_${num}_title` as keyof BannerSettings]}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <h3 className="text-white font-semibold">
                        {settings[`banner_${num}_title` as keyof BannerSettings]}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Upload Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر تصویر</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="image_url">آدرس تصویر (URL)</Label>
              <Input
                id="image_url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                dir="ltr"
              />
            </div>
            
            {imageUrl && (
              <div className="border rounded-lg p-2">
                <img
                  src={imageUrl}
                  alt="پیش‌نمایش"
                  className="w-full h-32 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <div className="text-sm text-gray-600">
              <p>نکات مهم:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>تصویر باید در فرمت JPG، PNG یا WebP باشد</li>
                <li>اندازه توصیه شده: 1200x600 پیکسل</li>
                <li>حجم فایل کمتر از 2 مگابایت</li>
                <li>از تصاویر با کیفیت بالا استفاده کنید</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>
              انصراف
            </Button>
            <Button onClick={handleImageSave} disabled={!imageUrl}>
              <Save className="w-4 h-4 ml-2" />
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminBannerSettings;