import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PersianDatePicker from "@/components/ui/PersianDatePicker";
import { persianStringToDate } from "@/utils/persianDate";
import {
  Tag,
  Plus,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Users,
  Calendar,
  Loader2
} from "lucide-react";

interface DiscountCode {
  id: number;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount?: number;
  min_amount?: number;
  max_uses?: number;
  max_uses_per_user: number;
  used_count: number;
  actual_usage: number;
  expiry_date?: string;
  applicable_plans: number[];
  is_active: boolean;
  created_at: string;
  created_by_username?: string;
}

interface Stats {
  total_codes: number;
  active_codes: number;
  total_uses: number;
  expired_codes: number;
}

const AdminDiscountCodes = () => {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [creating, setCreating] = useState(false);


  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    max_discount: '',
    min_amount: '',
    max_uses: '',
    max_uses_per_user: '1',
    expiry_date: '', // فرمت فارسی: 1403/08/15
    applicable_plans: [] as number[]
  });

  const API_BASE = import.meta.env.VITE_API_URL || '/api';

  const getToken = () => {
    return localStorage.getItem('admin_token') || localStorage.getItem('auth_token');
  };

  useEffect(() => {
    loadCodes();
    loadStats();
  }, []);

  const loadCodes = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/admin/discount-codes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setCodes(data.data || []);
      } else {
        toast.error(data.message || 'خطا در بارگذاری کدهای تخفیف');
      }
    } catch (error) {
      console.error('Error loading codes:', error);
      toast.error('خطا در بارگذاری کدهای تخفیف');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/admin/discount-codes/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateCode = async () => {
    if (!formData.code.trim()) {
      toast.error('کد تخفیف الزامی است');
      return;
    }
    if (!formData.discount_value) {
      toast.error('مقدار تخفیف الزامی است');
      return;
    }

    setCreating(true);
    try {
      const token = getToken();
      
      // تبدیل تاریخ فارسی به میلادی
      let expiryDateISO = null;
      if (formData.expiry_date) {
        const gregorianDate = persianStringToDate(formData.expiry_date);
        if (gregorianDate) {
          expiryDateISO = gregorianDate.toISOString();
        }
      }

      const response = await fetch(`${API_BASE}/admin/discount-codes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          description: formData.description,
          discount_type: formData.discount_type,
          discount_value: parseInt(formData.discount_value),
          max_discount: formData.max_discount ? parseInt(formData.max_discount) : null,
          min_amount: formData.min_amount ? parseInt(formData.min_amount) : null,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
          max_uses_per_user: parseInt(formData.max_uses_per_user),
          expiry_date: expiryDateISO,
          applicable_plans: formData.applicable_plans
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('کد تخفیف با موفقیت ایجاد شد');
        setShowCreateDialog(false);
        loadCodes();
        loadStats();
        // Reset form
        setFormData({
          code: '',
          description: '',
          discount_type: 'percentage',
          discount_value: '',
          max_discount: '',
          min_amount: '',
          max_uses: '',
          max_uses_per_user: '1',
          expiry_date: '',
          applicable_plans: []
        });
      } else {
        toast.error(data.message || data.error?.message || 'خطا در ایجاد کد تخفیف');
      }
    } catch (error) {
      console.error('Error creating code:', error);
      toast.error('خطا در ایجاد کد تخفیف');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/admin/discount-codes/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !currentStatus
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(currentStatus ? 'کد تخفیف غیرفعال شد' : 'کد تخفیف فعال شد');
        loadCodes();
      } else {
        toast.error(data.message || 'خطا در تغییر وضعیت');
      }
    } catch (error) {
      console.error('Error toggling code:', error);
      toast.error('خطا در تغییر وضعیت');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fa-IR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">مدیریت کدهای تخفیف</h2>
          <p className="text-muted-foreground">ایجاد و مدیریت کدهای تخفیف</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              ایجاد کد تخفیف
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ایجاد کد تخفیف جدید</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>کد تخفیف *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="SUMMER1403"
                    className="font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label>نوع تخفیف *</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value) => setFormData({...formData, discount_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">درصدی</SelectItem>
                      <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>توضیحات</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="تخفیف ویژه تابستان"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>
                    {formData.discount_type === 'percentage' ? 'درصد تخفیف *' : 'مبلغ تخفیف (تومان) *'}
                  </Label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                    placeholder={formData.discount_type === 'percentage' ? '10' : '50000'}
                    dir="ltr"
                  />
                </div>
                {formData.discount_type === 'percentage' && (
                  <div>
                    <Label>حداکثر تخفیف (تومان)</Label>
                    <Input
                      type="number"
                      value={formData.max_discount}
                      onChange={(e) => setFormData({...formData, max_discount: e.target.value})}
                      placeholder="100000"
                      dir="ltr"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>حداقل مبلغ خرید (تومان)</Label>
                  <Input
                    type="number"
                    value={formData.min_amount}
                    onChange={(e) => setFormData({...formData, min_amount: e.target.value})}
                    placeholder="100000"
                    dir="ltr"
                  />
                </div>
                <div>
                  <PersianDatePicker
                    label="تاریخ انقضا"
                    value={formData.expiry_date}
                    onChange={(value) => setFormData({...formData, expiry_date: value})}
                    placeholder="انتخاب تاریخ انقضا"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>حداکثر تعداد استفاده</Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({...formData, max_uses: e.target.value})}
                    placeholder="100"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label>حداکثر استفاده هر کاربر *</Label>
                  <Input
                    type="number"
                    value={formData.max_uses_per_user}
                    onChange={(e) => setFormData({...formData, max_uses_per_user: e.target.value})}
                    placeholder="1"
                    dir="ltr"
                  />
                </div>
              </div>

              <Button onClick={handleCreateCode} className="w-full" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    در حال ایجاد...
                  </>
                ) : (
                  'ایجاد کد تخفیف'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">کل کدها</p>
                  <p className="text-2xl font-bold">{stats.total_codes}</p>
                </div>
                <Tag className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">کدهای فعال</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active_codes}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">کل استفاده</p>
                  <p className="text-2xl font-bold">{stats.total_uses}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">منقضی شده</p>
                  <p className="text-2xl font-bold text-red-600">{stats.expired_codes}</p>
                </div>
                <Calendar className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Codes List */}
      <Card>
        <CardHeader>
          <CardTitle>لیست کدهای تخفیف</CardTitle>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">هیچ کد تخفیفی ثبت نشده است</p>
            </div>
          ) : (
            <div className="space-y-4">
              {codes.map((code) => (
                <div
                  key={code.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono font-bold text-lg">{code.code}</span>
                      <Badge variant={code.is_active ? "default" : "secondary"}>
                        {code.is_active ? 'فعال' : 'غیرفعال'}
                      </Badge>
                      <Badge variant="outline">
                        {code.discount_type === 'percentage' 
                          ? `${code.discount_value}%` 
                          : `${formatPrice(code.discount_value)} تومان`}
                      </Badge>
                    </div>
                    {code.description && (
                      <p className="text-sm text-muted-foreground mb-2">{code.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>استفاده: {code.actual_usage || 0} / {code.max_uses || '∞'}</span>
                      {code.min_amount && (
                        <span>حداقل: {formatPrice(code.min_amount)} تومان</span>
                      )}
                      {code.expiry_date && (
                        <span>انقضا: {formatDate(code.expiry_date)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(code.id, code.is_active)}
                    >
                      {code.is_active ? (
                        <ToggleRight className="w-6 h-6 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDiscountCodes;
