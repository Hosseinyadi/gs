import { useState, useEffect } from 'react';

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

const defaultSettings: BannerSettings = {
  hero_title: 'ماشین‌آلات و تجهیزات حرفه‌ای',
  hero_subtitle: 'اجاره • فروش • قطعات یدکی • خدمات تخصصی',
  hero_background: '/hero-bg.jpg',
  hero_button_text: 'مشاهده اجاره‌ها',
  hero_button_link: '/rent',
  banner_1_image: '/banner-1.jpg',
  banner_1_title: 'بیل مکانیکی',
  banner_1_link: '/search?category=excavator',
  banner_2_image: '/banner-2.jpg',
  banner_2_title: 'لودر',
  banner_2_link: '/search?category=loader',
  banner_3_image: '/banner-3.jpg',
  banner_3_title: 'بولدوزر',
  banner_3_link: '/search?category=bulldozer'
};

export const useBannerSettings = () => {
  const [settings, setSettings] = useState<BannerSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from API
      const response = await fetch('/api/admin/settings?category=banner');
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          // Not JSON, use defaults
          console.warn('Banner settings API returned non-JSON, using defaults');
          setSettings(defaultSettings);
          setLoading(false);
          return;
        }
        const data = await response.json();
        
        if (data.success && data.data?.settings) {
          const settingsMap = data.data.settings.reduce((acc: any, setting: any) => {
            acc[setting.setting_key] = setting.setting_value;
            return acc;
          }, {});

          // Merge with defaults
          const mergedSettings = { ...defaultSettings };
          Object.keys(defaultSettings).forEach(key => {
            if (settingsMap[key]) {
              mergedSettings[key as keyof BannerSettings] = settingsMap[key];
            }
          });

          setSettings(mergedSettings);
        } else {
          // Use defaults if no settings found
          setSettings(defaultSettings);
        }
      } else {
        // Use defaults if API fails
        console.warn('Failed to load banner settings, using defaults');
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.warn('Error loading banner settings:', error);
      setError('خطا در بارگذاری تنظیمات');
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = () => {
    loadSettings();
  };

  return {
    settings,
    loading,
    error,
    refreshSettings
  };
};