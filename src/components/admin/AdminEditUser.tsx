import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import adminApi from "@/services/admin-api";
import { Loader2, Save, ArrowRight, Phone, Mail, User, Wallet } from "lucide-react";

interface UserData {
  id: number;
  phone: string;
  name?: string;
  email?: string;
  wallet_balance?: number;
  is_verified?: boolean;
  is_blocked?: boolean;
  created_at?: string;
}

const AdminEditUser = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getUserDetails(parseInt(id!));
      if (response.success && response.data) {
        setUserData(response.data);
        setFormData({
          name: response.data.name || '',
          email: response.data.email || '',
          phone: response.data.phone
        });
      }
    } catch (error) {
      toast.error('خطا در بارگذاری اطلاعات کاربر');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('نام کاربر الزامی است');
      return;
    }

    setSaving(true);
    try {
      const response = await adminApi.updateUser(parseInt(id!), {
        name: formData.name,
        email: formData.email
      });

      if (response.success) {
        toast.success('اطلاعات کاربر به‌روزرسانی شد');
        loadUser();
      }
    } catch (error) {
      toast.error('خطا در به‌روزرسانی اطلاعات');
    } finally {
      setSaving(false);
    }
  };

  const handleSendOTP = async () => {
    if (!newPhone || newPhone.length !== 11) {
      toast.error('شماره تلفن معتبر وارد کنید');
      return;
    }

    try {
      const response = await adminApi.sendPhoneChangeOTP(parseInt(id!), newPhone);
      if (response.success) {
        setOtpSent(true);
        toast.success('کد تأیید ارسال شد');
      }
    } catch (error) {
      toast.error('خطا در ارسال کد تأیید');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error('کد تأیید 6 رقمی وارد کنید');
      return;
    }

    try {
      const response = await adminApi.verifyPhoneChange(parseInt(id!), newPhone, otpCode);
      if (response.success) {
        toast.success('شماره تلفن با موفقیت تغییر کرد');
        setShowPhoneDialog(false);
        setNewPhone('');
        setOtpCode('');
        setOtpSent(false);
        loadUser();
      }
    } catch (error) {
      toast.error('کد تأیید نامعتبر است');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">کاربر یافت نشد</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ویرایش کاربر #{id}</h1>
        <Button variant="outline" onClick={() => navigate('/admin')}>
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت
        </Button>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Wallet className="w-4 h-4" />
              <span className="text-sm">موجودی کیف پول</span>
            </div>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('fa-IR').format(userData.wallet_balance || 0)} تومان
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <User className="w-4 h-4" />
              <span className="text-sm">وضعیت</span>
            </div>
            <div className="flex gap-2">
              {userData.is_verified && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">تأیید شده</span>
              )}
              {userData.is_blocked && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">مسدود</span>
              )}
              {!userData.is_verified && !userData.is_blocked && (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">عادی</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <Phone className="w-4 h-4" />
              <span className="text-sm">تاریخ عضویت</span>
            </div>
            <p className="text-sm">
              {userData.created_at ? new Date(userData.created_at).toLocaleDateString('fa-IR') : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات پروفایل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                نام کاربر *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="نام کاربر"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                ایمیل
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ایمیل کاربر"
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4" />
                شماره تلفن
              </label>
              <div className="flex gap-2">
                <Input
                  value={formData.phone}
                  disabled
                  className="bg-gray-100"
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowPhoneDialog(true)}
                >
                  تغییر شماره
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                برای تغییر شماره تلفن، از دکمه "تغییر شماره" استفاده کنید
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/admin')}>
                انصراف
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
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
          </CardContent>
        </Card>
      </form>

      {/* Phone Change Dialog */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر شماره تلفن</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">شماره تلفن جدید</label>
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="09123456789"
                maxLength={11}
                disabled={otpSent}
              />
            </div>

            {otpSent && (
              <div>
                <label className="text-sm font-medium">کد تأیید</label>
                <Input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="کد 6 رقمی"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  کد تأیید به شماره {newPhone} ارسال شد
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPhoneDialog(false);
                setNewPhone('');
                setOtpCode('');
                setOtpSent(false);
              }}
            >
              انصراف
            </Button>
            {!otpSent ? (
              <Button onClick={handleSendOTP}>
                ارسال کد تأیید
              </Button>
            ) : (
              <Button onClick={handleVerifyOTP}>
                تأیید و تغییر شماره
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEditUser;
