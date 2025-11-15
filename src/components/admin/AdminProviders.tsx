import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import adminApi, { ServiceProvider } from "@/services/admin-api";
import {
  CheckCircle,
  XCircle,
  Ban,
  Eye,
  Search,
  Loader2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Building,
  Plus
} from "lucide-react";

const AdminProviders = () => {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newProvider, setNewProvider] = useState({
    phone: '',
    business_name: '',
    business_type: 'parts' as 'parts' | 'services',
    email: '',
    address: '',
    description: ''
  });

  const loadProviders = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 20
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;

      const response = await adminApi.getProviders(params);
      if (response.success && response.data) {
        setProviders(response.data.providers || []);
        setTotalPages(response.data.pagination?.total_pages || 1);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      toast.error('خطا در بارگذاری ارائه‌دهندگان');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const handleApprove = async (id: number) => {
    try {
      const response = await adminApi.approveProvider(id);
      if (response.success) {
        setProviders(prev =>
          prev.map(p => p.id === id ? { ...p, status: 'approved' } : p)
        );
        toast.success('ارائه‌دهنده تأیید شد');
      }
    } catch (error) {
      toast.error('خطا در تأیید ارائه‌دهنده');
    }
  };

  const handleReject = async () => {
    if (!selectedProvider || !rejectReason.trim()) {
      toast.error('لطفاً دلیل رد را وارد کنید');
      return;
    }

    try {
      const response = await adminApi.rejectProvider(selectedProvider.id, rejectReason);
      if (response.success) {
        setProviders(prev =>
          prev.map(p => p.id === selectedProvider.id ? { ...p, status: 'rejected' } : p)
        );
        toast.success('ارائه‌دهنده رد شد');
        setShowRejectDialog(false);
        setSelectedProvider(null);
        setRejectReason('');
      }
    } catch (error) {
      toast.error('خطا در رد ارائه‌دهنده');
    }
  };

  const handleSuspend = async () => {
    if (!selectedProvider || !suspendReason.trim()) {
      toast.error('لطفاً دلیل تعلیق را وارد کنید');
      return;
    }

    try {
      const response = await adminApi.suspendProvider(selectedProvider.id, suspendReason);
      if (response.success) {
        setProviders(prev =>
          prev.map(p => p.id === selectedProvider.id ? { ...p, status: 'suspended' } : p)
        );
        toast.success('ارائه‌دهنده تعلیق شد');
        setShowSuspendDialog(false);
        setSelectedProvider(null);
        setSuspendReason('');
      }
    } catch (error) {
      toast.error('خطا در تعلیق ارائه‌دهنده');
    }
  };

  const viewDetails = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setShowDetailDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'در انتظار' },
      approved: { variant: 'default', label: 'تأیید شده' },
      rejected: { variant: 'destructive', label: 'رد شده' },
      suspended: { variant: 'destructive', label: 'تعلیق' }
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="جستجو بر اساس نام، تلفن یا ایمیل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="pending">در انتظار</SelectItem>
                <SelectItem value="approved">تأیید شده</SelectItem>
                <SelectItem value="rejected">رد شده</SelectItem>
                <SelectItem value="suspended">تعلیق</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="نوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="parts">قطعات</SelectItem>
                <SelectItem value="services">خدمات</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 ml-2" />
          افزودن ارائه‌دهنده
        </Button>
      </div>

      {/* Providers Table */}
      <Card>
        <CardHeader>
          <CardTitle>لیست ارائه‌دهندگان ({providers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              ارائه‌دهنده‌ای یافت نشد
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-right p-4">نام کسب‌وکار</th>
                    <th className="text-right p-4">نوع</th>
                    <th className="text-right p-4">تماس</th>
                    <th className="text-right p-4">وضعیت</th>
                    <th className="text-right p-4">تاریخ ثبت</th>
                    <th className="text-right p-4">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((provider) => (
                    <tr key={provider.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{provider.business_name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {provider.business_type === 'parts' ? 'قطعات' : 'خدمات'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {provider.phone}
                          </div>
                          {provider.email && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <Mail className="w-3 h-3" />
                              {provider.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(provider.status)}
                      </td>
                      <td className="p-4">
                        {formatDate(provider.created_at)}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewDetails(provider)}
                            title="مشاهده جزئیات"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {provider.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApprove(provider.id)}
                                title="تأیید"
                              >
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedProvider(provider);
                                  setShowRejectDialog(true);
                                }}
                                title="رد"
                              >
                                <XCircle className="w-4 h-4 text-red-500" />
                              </Button>
                            </>
                          )}
                          {provider.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProvider(provider);
                                setShowSuspendDialog(true);
                              }}
                              title="تعلیق"
                            >
                              <Ban className="w-4 h-4 text-orange-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                قبلی
              </Button>
              <span className="px-4 py-2">
                صفحه {currentPage} از {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                بعدی
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>جزئیات ارائه‌دهنده</DialogTitle>
          </DialogHeader>
          {selectedProvider && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg">{selectedProvider.business_name}</h3>
                <div className="flex gap-2 mt-2">
                  {getStatusBadge(selectedProvider.status)}
                  <Badge variant="outline">
                    {selectedProvider.business_type === 'parts' ? 'قطعات' : 'خدمات'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{selectedProvider.phone}</span>
                </div>
                {selectedProvider.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{selectedProvider.email}</span>
                  </div>
                )}
              </div>

              {selectedProvider.address && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    آدرس:
                  </h4>
                  <p className="text-gray-700">{selectedProvider.address}</p>
                </div>
              )}

              {selectedProvider.description && (
                <div>
                  <h4 className="font-semibold mb-2">توضیحات:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedProvider.description}</p>
                </div>
              )}

              {selectedProvider.documents && selectedProvider.documents.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    مدارک:
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProvider.documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border rounded hover:bg-gray-50 text-sm text-blue-600"
                      >
                        مشاهده مدرک {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedProvider.rejection_reason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                  <h4 className="font-semibold text-red-800 mb-2">دلیل رد:</h4>
                  <p className="text-red-700">{selectedProvider.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Provider Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>افزودن ارائه‌دهنده جدید</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newProvider.phone.trim() || !newProvider.business_name.trim()) {
                toast.error('شماره تماس و نام کسب‌وکار الزامی است');
                return;
              }
              try {
                setCreateLoading(true);
                const res = await adminApi.createProvider({
                  phone: newProvider.phone.trim(),
                  business_name: newProvider.business_name.trim(),
                  business_type: newProvider.business_type,
                  email: newProvider.email || undefined,
                  address: newProvider.address || undefined,
                  description: newProvider.description || undefined
                });
                if (res.success) {
                  toast.success('ارائه‌دهنده ایجاد شد');
                  setShowCreateDialog(false);
                  setNewProvider({ phone: '', business_name: '', business_type: 'parts', email: '', address: '', description: '' });
                  await loadProviders();
                }
              } catch (err) {
                toast.error('خطا در ایجاد ارائه‌دهنده');
              } finally {
                setCreateLoading(false);
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">شماره تماس</label>
                <Input
                  value={newProvider.phone}
                  onChange={(e) => setNewProvider({ ...newProvider, phone: e.target.value })}
                  placeholder="مثال: 0912..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">نام کسب‌وکار</label>
                <Input
                  value={newProvider.business_name}
                  onChange={(e) => setNewProvider({ ...newProvider, business_name: e.target.value })}
                  placeholder="نام فروشگاه/شرکت"
                />
              </div>
              <div>
                <label className="text-sm font-medium">نوع</label>
                <Select
                  value={newProvider.business_type}
                  onValueChange={(v: 'parts' | 'services') => setNewProvider({ ...newProvider, business_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parts">قطعات</SelectItem>
                    <SelectItem value="services">خدمات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">ایمیل (اختیاری)</label>
                <Input
                  type="email"
                  value={newProvider.email}
                  onChange={(e) => setNewProvider({ ...newProvider, email: e.target.value })}
                  placeholder="example@mail.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">آدرس (اختیاری)</label>
                <Input
                  value={newProvider.address}
                  onChange={(e) => setNewProvider({ ...newProvider, address: e.target.value })}
                  placeholder="آدرس را وارد کنید"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">توضیحات (اختیاری)</label>
                <Textarea
                  rows={4}
                  value={newProvider.description}
                  onChange={(e) => setNewProvider({ ...newProvider, description: e.target.value })}
                  placeholder="توضیحات درباره خدمات یا محصولات"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                انصراف
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    در حال ثبت...
                  </>
                ) : (
                  'ثبت'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رد ارائه‌دهنده</DialogTitle>
          </DialogHeader>
          {selectedProvider && (
            <div className="space-y-4">
              <p>آیا از رد <strong>{selectedProvider.business_name}</strong> اطمینان دارید؟</p>
              <div>
                <label className="text-sm font-medium">دلیل رد:</label>
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="دلیل رد را وارد کنید"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              رد کردن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعلیق ارائه‌دهنده</DialogTitle>
          </DialogHeader>
          {selectedProvider && (
            <div className="space-y-4">
              <p>آیا از تعلیق <strong>{selectedProvider.business_name}</strong> اطمینان دارید؟</p>
              <div>
                <label className="text-sm font-medium">دلیل تعلیق:</label>
                <Input
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="دلیل تعلیق را وارد کنید"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleSuspend}>
              تعلیق کردن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProviders;
