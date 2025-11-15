import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import apiService from '@/services/api';
import { Loader2, Phone, User, ArrowLeft, Lock, Eye, EyeOff, Home } from 'lucide-react';

interface AuthState {
  phone: string;
  otp: string;
  name: string;
  password: string;
  confirmPassword: string;
  step: 'phone' | 'otp';
  authMode: 'otp' | 'password';
}

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, sendOTP, isAuthenticated, isLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  
  const [state, setState] = useState<AuthState>({
    phone: '',
    otp: '',
    name: '',
    password: '',
    confirmPassword: '',
    step: 'phone',
    authMode: 'password'
  });

  useEffect(() => {
    if (isAuthenticated) {
      const redirect = location.state?.from?.pathname || '/';
      navigate(redirect);
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleInputChange = (field: keyof AuthState, value: string) => {
    setState(prev => ({ ...prev, [field]: value }));
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('09') && cleaned.length === 11) return cleaned;
    if (cleaned.startsWith('98') && cleaned.length === 12) return '0' + cleaned.substring(2);
    if (cleaned.startsWith('9') && cleaned.length === 10) return '0' + cleaned;
    return cleaned;
  };

  // ورود/ثبت‌نام با رمز عبور
  const handlePasswordAuth = async () => {
    if (!state.phone.trim()) {
      toast.error('شماره موبایل الزامی است');
      return;
    }

    const formattedPhone = formatPhoneNumber(state.phone);

    // اگر کاربر جدید است، باید نام و تایید رمز را چک کنیم
    if (isNewUser) {
      if (!state.name.trim()) {
        toast.error('نام الزامی است');
        return;
      }
      if (!state.password || state.password.length < 6) {
        toast.error('رمز عبور باید حداقل 6 کاراکتر باشد');
        return;
      }
      if (state.password !== state.confirmPassword) {
        toast.error('رمز عبور و تکرار آن یکسان نیستند');
        return;
      }
    } else {
      if (!state.password || state.password.length < 6) {
        toast.error('رمز عبور باید حداقل 6 کاراکتر باشد');
        return;
      }
    }

    setLoading(true);
    try {
      const response = await apiService.loginWithPassword(
        formattedPhone,
        state.password,
        isNewUser ? state.name : undefined
      );

      if (response.success && response.data) {
        toast.success(isNewUser ? 'ثبت‌نام موفقیت‌آمیز!' : 'ورود موفقیت‌آمیز!');
        // ذخیره token و اطلاعات کاربر
        const data = response.data as any;
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        if (data.user) {
          localStorage.setItem('user_data', JSON.stringify(data.user));
        }
        // Navigate using React Router instead of window.location
        const redirect = location.state?.from?.pathname || '/';
        navigate(redirect);
      } else {
        // اگر کاربر وجود نداشت، به حالت ثبت‌نام برویم
        if (response.message?.includes('یافت نشد') || response.message?.includes('not found')) {
          setIsNewUser(true);
          toast.info('کاربر جدید هستید. لطفاً نام خود را وارد کرده و رمز عبور تعیین کنید');
        } else {
          toast.error(response.message || 'خطا در ورود');
        }
      }
    } catch (error) {
      console.error('Password auth error:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  // ورود با OTP
  const handleSendOTP = async () => {
    if (!state.phone.trim()) {
      toast.error('شماره موبایل الزامی است');
      return;
    }

    const formattedPhone = formatPhoneNumber(state.phone);
    
    setLoading(true);
    try {
      const result = await sendOTP(formattedPhone);
      if (result.success) {
        setOtpSent(true);
        setState(prev => ({ ...prev, step: 'otp', phone: formattedPhone }));
        setOtpTimer(60); // کاهش از 90 به 60 ثانیه
        toast.success('کد تایید به شماره ' + formattedPhone + ' ارسال شد');
        console.log('[OTP] کد به شماره ارسال شد:', formattedPhone);
      } else {
        console.error('[OTP] Error:', result.message);
        toast.error(result.message || 'خطا در ارسال کد تایید');
      }
    } catch (error) {
      console.error('[OTP] Send error:', error);
      toast.error('خطا در ارسال کد تایید');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!state.otp.trim() || state.otp.length !== 6) {
      toast.error('کد تایید باید 6 رقم باشد');
      return;
    }

    setLoading(true);
    try {
      console.log('[OTP] Verifying:', { phone: state.phone, otp: state.otp, name: state.name });
      const result = await login(state.phone, state.otp, state.name);
      console.log('[OTP] Verify result:', result);
      
      if (result.success) {
        toast.success('ورود موفقیت‌آمیز!');
        // Navigate using React Router instead of window.location to avoid reload issues
        const redirect = location.state?.from?.pathname || '/';
        navigate(redirect);
      } else {
        if (result.message?.includes('نام') && result.message?.includes('الزامی')) {
          toast.error('لطفاً نام خود را وارد کنید');
          handleBackToPhone();
        } else {
          console.error('[OTP] Verify failed:', result.message);
          toast.error(result.message || 'کد تایید نامعتبر یا منقضی شده است');
        }
      }
    } catch (error) {
      console.error('[OTP] Verify error:', error);
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

  const handleBackToPhone = () => {
    setState(prev => ({ ...prev, step: 'phone', otp: '' }));
    setOtpSent(false);
    setOtpTimer(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* دکمه بازگشت به صفحه اصلی */}
        <div className="mb-4 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            <Home className="w-4 h-4 ml-2" />
            بازگشت به صفحه اصلی
          </Button>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold">
              ورود / ثبت‌نام
            </CardTitle>
            <CardDescription className="text-blue-100">
              گاراژ سنگین - بازارگاه ماشین آلات سنگین
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={state.authMode} onValueChange={(v) => setState(prev => ({ ...prev, authMode: v as 'otp' | 'password' }))}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="password">
                  <Lock className="w-4 h-4 ml-2" />
                  رمز عبور
                </TabsTrigger>
                <TabsTrigger value="otp">
                  <Phone className="w-4 h-4 ml-2" />
                  کد یکبار مصرف
                </TabsTrigger>
              </TabsList>

              {/* ورود با رمز عبور */}
              <TabsContent value="password" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone-pass">شماره موبایل</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone-pass"
                      type="tel"
                      placeholder="09123456789"
                      value={state.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="pl-10"
                      dir="ltr"
                    />
                  </div>
                </div>

                {isNewUser && (
                  <div className="space-y-2">
                    <Label htmlFor="name-pass">نام</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="name-pass"
                        type="text"
                        placeholder="نام شما"
                        value={state.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">{isNewUser ? 'رمز عبور (حداقل 6 کاراکتر)' : 'رمز عبور'}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="abc123"
                      value={state.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 pr-10"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">رمز عبور باید حداقل 6 کاراکتر باشد (حروف و اعداد)</p>
                </div>

                {isNewUser && (
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">تکرار رمز عبور</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="abc123"
                        value={state.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="pl-10 pr-10"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handlePasswordAuth}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="mr-2 h-4 w-4" />
                  )}
                  {isNewUser ? 'ثبت‌نام' : 'ورود'}
                </Button>

                {!isNewUser && (
                  <Button
                    variant="link"
                    onClick={() => setIsNewUser(true)}
                    className="w-full text-sm"
                  >
                    کاربر جدید هستید؟ ثبت‌نام کنید
                  </Button>
                )}

                {isNewUser && (
                  <Button
                    variant="link"
                    onClick={() => setIsNewUser(false)}
                    className="w-full text-sm"
                  >
                    قبلاً ثبت‌نام کرده‌اید؟ ورود
                  </Button>
                )}
              </TabsContent>

              {/* ورود با OTP */}
              <TabsContent value="otp" className="space-y-4">
                {state.step === 'phone' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="phone">شماره موبایل</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="09123456789"
                          value={state.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="pl-10"
                          dir="ltr"
                          onKeyPress={(e) => e.key === 'Enter' && handleSendOTP()}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">نام (اختیاری)</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="نام شما"
                          value={state.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="pl-10"
                          onKeyPress={(e) => e.key === 'Enter' && handleSendOTP()}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSendOTP}
                      disabled={loading || !state.phone.trim()}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Phone className="mr-2 h-4 w-4" />
                      )}
                      ارسال کد تایید
                    </Button>
                  </>
                )}

                {state.step === 'otp' && (
                  <>
                    <div className="text-center space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="otp">کد تایید</Label>
                        <Input
                          id="otp"
                          type="text"
                          placeholder="123456"
                          value={state.otp}
                          onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="text-center text-lg tracking-widest"
                          maxLength={6}
                          dir="ltr"
                        />
                        <p className="text-sm text-gray-500">
                          کد تایید به شماره {state.phone} ارسال شد
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleBackToPhone}
                          className="flex-1"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          تغییر شماره
                        </Button>
                        <Button
                          onClick={handleVerifyOTP}
                          disabled={loading || state.otp.length !== 6}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
                        >
                          {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            'تایید'
                          )}
                        </Button>
                      </div>

                      {otpTimer > 0 ? (
                        <p className="text-sm text-gray-500">
                          ارسال مجدد در {otpTimer} ثانیه
                        </p>
                      ) : (
                        <Button
                          variant="link"
                          onClick={handleResendOTP}
                          className="text-sm"
                        >
                          ارسال مجدد کد
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>

            <div className="text-center text-sm text-gray-500 pt-4 mt-4 border-t">
              با ورود یا ثبت‌نام، شما{' '}
              <Link to="/terms" className="text-blue-600 hover:underline">
                قوانین و مقررات
              </Link>
              {' '}را می‌پذیرید
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
