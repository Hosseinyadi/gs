import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import adminApi, { DiscountCode } from "@/services/admin-api";
import { Plus, Edit, Trash2, Loader2, Tag, Calendar, TrendingUp } from "lucide-react";
import { PersianDateInput } from "@/components/ui/persian-date-input";

const AdminDiscounts = () => {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    scope: 'all' as 'featured' | 'wallet' | 'all',
    max_usage: '',
    per_user_limit: '1',
    min_amount: '0',
    valid_from: '',
    valid_until: ''
  });

  const loadDiscounts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getDiscounts({ page: 1, limit: 50 });
      if (response.success && response.data) {
        setDiscounts(response.data.discounts || []);
      }
    } catch (error) {
      toast.error('خطا در بارگذاری کدهای تخفیف');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiscounts();
  }, [loadDiscounts]);

  const handleSubmit = async () => {
    if (!formData.code || !formData.value) {
      toast.error('لطفاً کد و مقدار تخفیف را وارد کنید');
      return;
    }

    try {
      const data = {
        code: formData.code,
        type: formData.type,
        value: parseFloat(formData.value),
        scope: formData.scope,
        max_usage: formData.max_usage ? parseInt(formData.max_usage) : undefined,
        per_user_limit: parseInt(formData.per_user_limit),
        min_amount: parseFloat(formData.min_amount),
        valid_from: formData.valid_from || undefined,
        valid_until: formData.valid_until || undefined
      };

      const response = editingDiscount
        ? await adminApi.updateDiscount(editingDiscount.id, { is_active: true })
        : await adminApi.createDiscount(data);

      if (response.success) {
        toast.success(editingDiscount ? 'کد تخفیف به‌روزرسانی شد' : 'کد تخفیف ایجاد شد');
        setShowDialog(false);
        resetForm();
        loadDiscounts();
      }
    } catch (error) {
      toast.error('خطا در ذخیره کد تخفیف');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این کد تخفیف اطمینان دارید؟')) return;

    try {
      const response = await adminApi.deleteDiscount(id);
      if (response.success) {
        toast.success('کد تخفیف حذف شد');
        loadDiscounts();
      }
    } catch (error) {
      toast.error('خطا در حذف کد تخفیف');
    }
  };

  const toggleStatus = async (id: number, isActive: boolean) => {
    try {
      const response = await adminApi.updateDiscount(id, { is_active: !isActive });
      if (response.success) {
        toast.success('وضعیت کد تخفیف تغییر کرد');
        loadDiscounts();
      }
    } catch (error) {
      toast.error('خطا در تغییر وضعیت');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      scope: 'all',
      max_usage: '',
      per_user_limit: '1',
      min_amount: '0',
      valid_from: '',
      valid_until: ''
    });
    setEditingDiscount(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>کدهای تخفیف ({discounts.length})</CardTitle>
            <Button onClick={() => { resetForm(); setShowDialog(true); }}>
              <Plus className="w-4 h-4 ml-2" />
              ایجاد کد جدید
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : discounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              کد تخفیفی یافت نشد
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-right p-4">کد</th>
                    <th className="text-right p-4">نوع</th>
                    <th className="text-right p-4">مقدار</th>
                    <th className="text-right p-4">محدوده</th>
                    <th className="text-right p-4">استفاده</th>
                    <th className="text-right p-4">اعتبار</th>
                    <th className="text-right p-4">وضعیت</th>
                    <th className="text-right p-4">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((discount) => (
                    <tr key={discount.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span className="font-mono font-bold">{discount.code}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {discount.type === 'percentage' ? 'درصدی' : 'مبلغ ثابت'}
                      </td>
                      <td className="p-4">
                        <span className="font-bold">
                          {discount.value}{discount.type === 'percentage' ? '%' : ' تومان'}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {discount.scope === 'all' ? 'همه' : discount.scope === 'featured' ? 'ویژه' : 'کیف پول'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          {discount.usage_count} / {discount.max_usage || '∞'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div>از: {formatDate(discount.valid_from)}</div>
                          <div>تا: {formatDate(discount.valid_until)}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={discount.is_active ? "default" : "secondary"}>
                          {discount.is_active ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStatus(discount.id, discount.is_active)}
                          >
                            {discount.is_active ? 'غیرفعال' : 'فعال'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(discount.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDiscount ? 'ویرایش' : 'ایجاد'} کد تخفیف</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">کد تخفیف:</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="مثال: SUMMER2024"
                />
              </div>
              <div>
                <label className="text-sm font-medium">نوع:</label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">مقدار:</label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={formData.type === 'percentage' ? '10' : '50000'}
                />
              </div>
              <div>
                <label className="text-sm font-medium">محدوده:</label>
                <Select value={formData.scope} onValueChange={(v: any) => setFormData({ ...formData, scope: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="featured">آگهی ویژه</SelectItem>
                    <SelectItem value="wallet">شارژ کیف پول</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">حداکثر استفاده:</label>
                <Input
                  type="number"
                  value={formData.max_usage}
                  onChange={(e) => setFormData({ ...formData, max_usage: e.target.value })}
                  placeholder="نامحدود"
                />
              </div>
              <div>
                <label className="text-sm font-medium">محدودیت هر کاربر:</label>
                <Input
                  type="number"
                  value={formData.per_user_limit}
                  onChange={(e) => setFormData({ ...formData, per_user_limit: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">حداقل مبلغ:</label>
                <Input
                  type="number"
                  value={formData.min_amount}
                  onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <PersianDateInput
                label="تاریخ شروع:"
                value={formData.valid_from}
                onChange={(value) => setFormData({ ...formData, valid_from: value })}
                placeholder="تاریخ شروع اعتبار"
              />
              <PersianDateInput
                label="تاریخ پایان:"
                value={formData.valid_until}
                onChange={(value) => setFormData({ ...formData, valid_until: value })}
                placeholder="تاریخ پایان اعتبار"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>انصراف</Button>
            <Button onClick={handleSubmit}>ذخیره</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDiscounts;
