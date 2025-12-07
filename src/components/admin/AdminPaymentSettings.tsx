import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CreditCard, Save, Shield, Phone, MessageCircle } from "lucide-react";
import adminApi from "@/services/admin-api";

interface PaymentSettings {
  card_number: string;
  cardholder_name: string;
  bank_name: string;
  price_per_day: number;
  payment_window_min: number;
  support_phone: string;
}

function AdminPaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettings>({
    card_number: '',
    cardholder_name: '',
    bank_name: '',
    price_per_day: 50000,
    payment_window_min: 30,
    support_phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getSettings('payment');
      if (response.success && response.data?.settings) {
        const settingsMap = response.data.settings.reduce((acc: any, setting: any) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {});

        setSettings({
          card_number: settingsMap.card_number || '',
          cardholder_name: settingsMap.cardholder_name || '',
          bank_name: settingsMap.bank_name || '',
          price_per_day: parseInt(settingsMap.price_per_day) || 50000,
          payment_window_min: parseInt(settingsMap.payment_window_min) || 30,
          support_phone: settingsMap.support_phone || ''
        });
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
      toast.error('خطا در بارگذاری تنظیمات پرداخت');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings.card_number || !settings.cardholder_name || !settings.bank_name) {
      toast.error('لطفاً تمام فیلدهای الزامی را پر کنید');
      return;
    }

    // Validate card number format
    const cleanCardNumber = settings.card_number.replace(/\D/g, '');
    if (cleanCardNumber.length !== 16) {
      toast.error('شماره کارت باید 16 رقم باشد');
      return;
    }

    setSaving(true);
    try {
      const settingsToUpdate = [
        { key: 'card_number', value: settings.card_number },
        { key: 'cardholder_name', value: settings.cardholder_name },
        { key: 'bank_name', value: settings.bank_name },
        { key: 'price_per_day', value: settings.price_per_day.toString() },
        { key: 'payment_window_min', value: settings.payment_window_min.toString() },
        { key: 'support_phone', value: settings.support_phone }
      ];

      const response = await adminApi.bulkUpdateSettings(settingsToUpdate);
      
      if (response.success) {
        toast.success('تنظیمات پرداخت با موفقیت ذخیره شد');
      } else {
        toast.error(response.message || 'خطا در ذخیره تنظیمات');
      }
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setSaving(false);
    }
  };

  // فرمت شماره کارت: 1234-5678-9012-3456
  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.substring(0, 16);
    // اضافه کردن خط تیره هر 4 رقم
    const parts = [];
    for (let i = 0; i < limited.length; i += 4) {
      parts.push(limited.substring(i, i + 4));
    }
    return parts.join('-');
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 16) {
      const formatted = formatCardNumber(cleaned);
      setSettings(prev => ({ ...prev, card_number: formatted }));
    }
  };

  // فرمت شماره تلفن: 09123456789
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      setSettings(prev => ({ ...prev, support_phone: cleaned }));
    }
  };

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          تنظیمات پرداخت کارت به کارت
          <Shield className="w-4 h-4 text-yellow-500" title="فقط سوپر ادمین" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <Shield className="w-4 h-4" />
            <span className="font-medium">دسترسی محدود</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            این بخش فقط برای سوپر ادمین قابل دسترسی است و تغییرات در آن بر روی تمام پرداخت‌های سیستم تأثیر می‌گذارد.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="card_number">شماره کارت *</Label>
              <Input
                id="card_number"
                type="text"
                value={settings.card_number}
                onChange={handleCardNumberChange}
                placeholder="1234-5678-9012-3456"
                className="font-mono text-lg tracking-wider text-left"
                style={{ direction: 'ltr', textAlign: 'left' }}
                maxLength={19}
              />
              <p className="text-xs text-gray-500 mt-1">شماره کارت 16 رقمی بانکی</p>
            </div>

            <div>
              <Label htmlFor="cardholder_name">نام دارنده کارت *</Label>
              <Input
                id="cardholder_name"
                value={settings.cardholder_name}
                onChange={(e) => setSettings(prev => ({ ...prev, cardholder_name: e.target.value }))}
                placeholder="نام و نام خانوادگی"
              />
            </div>

            <div>
              <Label htmlFor="bank_name">نام بانک *</Label>
              <Input
                id="bank_name"
                value={settings.bank_name}
                onChange={(e) => setSettings(prev => ({ ...prev, bank_name: e.target.value }))}
                placeholder="بانک ملی ایران"
              />
            </div>

            <div>
              <Label htmlFor="support_phone" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-500" />
                شماره پشتیبانی واتساپ
              </Label>
              <Input
                id="support_phone"
                type="text"
                value={settings.support_phone}
                onChange={handlePhoneChange}
                placeholder="09123456789"
                className="font-mono text-lg text-left"
                style={{ direction: 'ltr', textAlign: 'left' }}
                maxLength={11}
              />
              <p className="text-xs text-gray-500 mt-1">شماره موبایل برای پشتیبانی واتساپ (مثال: 09123456789)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="price_per_day">قیمت روزانه ویژه سازی (تومان) *</Label>
              <Input
                id="price_per_day"
                type="number"
                value={settings.price_per_day}
                onChange={(e) => setSettings(prev => ({ ...prev, price_per_day: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="payment_window_min">مهلت پرداخت (دقیقه) *</Label>
              <Input
                id="payment_window_min"
                type="number"
                value={settings.payment_window_min}
                onChange={(e) => setSettings(prev => ({ ...prev, payment_window_min: parseInt(e.target.value) || 0 }))}
                min="5"
                max="120"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">پیش‌نمایش اطلاعات پرداخت</h4>
              <div className="text-sm text-blue-700 space-y-2">
                <p className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <strong>کارت:</strong> 
                  <span className="font-mono" style={{ direction: 'ltr' }}>
                    {settings.card_number || 'تنظیم نشده'}
                  </span>
                </p>
                <p><strong>دارنده:</strong> {settings.cardholder_name || 'تنظیم نشده'}</p>
                <p><strong>بانک:</strong> {settings.bank_name || 'تنظیم نشده'}</p>
                <p><strong>قیمت روزانه:</strong> {settings.price_per_day.toLocaleString('fa-IR')} تومان</p>
                <p><strong>مهلت پرداخت:</strong> {settings.payment_window_min} دقیقه</p>
                {settings.support_phone && (
                  <p className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    <strong>پشتیبانی:</strong>
                    <a 
                      href={`https://wa.me/98${settings.support_phone.substring(1)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline font-mono"
                      style={{ direction: 'ltr' }}
                    >
                      {settings.support_phone}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
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
                ذخیره تنظیمات
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminPaymentSettings;
