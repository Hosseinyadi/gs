import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Phone, User, ArrowLeft, CheckCircle } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login, sendOTP } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    otp: ''
  });
  const [otpTimer, setOtpTimer] = useState(0);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    // Keep local Iran format: 09xxxxxxxxx
    if (cleaned.startsWith('09') && cleaned.length === 11) return cleaned;
    // Convert 989xxxxxxxxx or +989xxxxxxxxx to 09xxxxxxxxx
    if (cleaned.startsWith('98') && cleaned.length === 12) return '0' + cleaned.substring(2);
    // Convert 9xxxxxxxxx (10 digits) to 09xxxxxxxxx
    if (cleaned.startsWith('9') && cleaned.length === 10) return '0' + cleaned;
    // Fallback: return cleaned digits
    return cleaned;
  };

  const handleSendOTP = async () => {
    if (!formData.phone.trim()) {
      toast.error('شماره موبایل الزامی است');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('نام و نام خانوادگی الزامی است');
      return;
    }

    const formattedPhone = formatPhoneNumber(formData.phone);
    
    setLoading(true);
    try {
      const result = await sendOTP(formattedPhone);
      if (result.success) {
        setFormData(prev => ({ ...prev, phone: formattedPhone }));
        setStep('otp');
        setOtpTimer(300);
        toast.success('کد تایید به شماره شما ارسال شد');
      } else {
        toast.error(result.message || 'خطا در ارسال کد تایید');
      }
    } catch (error) {
      toast.error('خطا در ارسال کد تایید');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp.trim() || formData.otp.length !== 6) {
      toast.error('کد تایید باید 6 رقم باشد');
      return;
    }

    setLoading(true);
    try {
      const result = await login(formData.phone, formData.otp, formData.name);
      if (result.success) {
        toast.success('ثبت نام موفقیت‌آمیز! خوش آمدید');
        navigate('/dashboard');
      } else {
        toast.error(result.message || 'کد تایید اشتباه است');
      }
    } catch (error) {
      toast.error('خطا در تایید کد');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (otpTimer > 0) {
      toast.error(`لطفاً ${otpTimer} ثانیه صبر کنید`);
      return;
    }
    handleSendOTP();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="ml-2 h-4 w-4" />
          بازگشت
        </Button>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              ثبت نام
            </CardTitle>
            <CardDescription>
              عضویت در گاراژ سنگین
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 'info' && (
              <div className="space-y-4">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">نام و نام خانوادگی *</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="علی رضایی"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="pr-10"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="phone">شماره موبایل *</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="09123456789"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="pr-10"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSendOTP}
                  disabled={loading || !formData.phone.trim() || !formData.name.trim()}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      در حال ارسال...
                    </>
                  ) : (
                    <>
                      <Phone className="ml-2 h-4 w-4" />
                      ارسال کد تایید
                    </>
                  )}
                </Button>

                {/* Login Link */}
                <div className="text-center text-sm text-gray-600">
                  قبلاً ثبت نام کرده‌اید؟{' '}
                  <Link to="/auth" className="text-blue-600 hover:text-blue-700 font-semibold">
                    ورود
                  </Link>
                </div>
              </div>
            )}

            {step === 'otp' && (
              <div className="space-y-4">
                {/* Success Message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-800 font-semibold">
                    کد تایید به شماره {formData.phone} ارسال شد
                  </p>
                </div>

                {/* OTP Field */}
                <div className="space-y-2">
                  <Label htmlFor="otp">کد تایید 6 رقمی</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={formData.otp}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      otp: e.target.value.replace(/\D/g, '').slice(0, 6) 
                    }))}
                    className="text-center text-2xl tracking-widest font-bold"
                    maxLength={6}
                    disabled={loading}
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep('info')}
                    className="flex-1"
                    disabled={loading}
                  >
                    <ArrowLeft className="ml-2 h-4 w-4" />
                    تغییر شماره
                  </Button>
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={loading || formData.otp.length !== 6}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {loading ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      'تایید و ثبت نام'
                    )}
                  </Button>
                </div>

                {/* Resend OTP */}
                {otpTimer > 0 ? (
                  <p className="text-sm text-center text-gray-500">
                    ارسال مجدد در {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')} دقیقه
                  </p>
                ) : (
                  <Button
                    variant="link"
                    onClick={handleResendOTP}
                    className="w-full text-sm"
                    disabled={loading}
                  >
                    ارسال مجدد کد تایید
                  </Button>
                )}

                {/* Dev Mode Info */}
                {process.env.NODE_ENV !== 'production' && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs text-orange-800 font-semibold mb-1">
                      🛠️ حالت توسعه
                    </p>
                    <p className="text-xs text-orange-700">
                      کد OTP در Console سرور (Terminal پورت 8080) نمایش داده می‌شود
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
