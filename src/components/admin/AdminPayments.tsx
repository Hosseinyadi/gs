import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  FileSpreadsheet
} from "lucide-react";
import { exportPaymentsToExcel } from "@/utils/exportData";

interface Payment {
  id: number;
  user_phone: string;
  listing_title: string;
  plan_name: string;
  amount: number;
  payment_method: string;
  gateway_name?: string;
  ref_id?: string;
  receipt_image?: string;
  status: string;
  rejection_reason?: string;
  created_at: string;
}

interface PaymentStats {
  total_payments: number;
  completed_payments: number;
  pending_payments: number;
  failed_payments: number;
  rejected_payments: number;
  total_revenue: number;
  average_payment: number;
  by_method: Array<{
    payment_method: string;
    count: number;
    revenue: number;
  }>;
}

const AdminPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');

  useEffect(() => {
    loadPayments();
    loadStats();
  }, [filterStatus, filterMethod]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      let url = `${import.meta.env.VITE_API_URL}/admin/payments?`;
      if (filterStatus !== 'all') url += `status=${filterStatus}&`;
      if (filterMethod !== 'all') url += `payment_method=${filterMethod}&`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setPayments(data.data || []);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('خطا در بارگذاری پرداخت‌ها');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/payments/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
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

  const handleApprove = async (paymentId: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('پرداخت با موفقیت تایید شد');
        loadPayments();
        loadStats();
        setSelectedPayment(null);
      } else {
        toast.error(data.error?.message || 'خطا در تایید پرداخت');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('خطا در تایید پرداخت');
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !rejectionReason.trim()) {
      toast.error('لطفا دلیل رد را وارد کنید');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/payments/${selectedPayment.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectionReason })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('پرداخت رد شد');
        loadPayments();
        loadStats();
        setShowRejectDialog(false);
        setSelectedPayment(null);
        setRejectionReason('');
      } else {
        toast.error(data.error?.message || 'خطا در رد پرداخت');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('خطا در رد پرداخت');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      completed: { label: 'تکمیل شده', className: 'bg-green-500', icon: CheckCircle },
      pending: { label: 'در انتظار', className: 'bg-yellow-500', icon: Clock },
      failed: { label: 'ناموفق', className: 'bg-red-500', icon: XCircle },
      rejected: { label: 'رد شده', className: 'bg-gray-500', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getMethodBadge = (method: string) => {
    const methodConfig: Record<string, { label: string; className: string }> = {
      gateway: { label: 'درگاه بانکی', className: 'bg-blue-500' },
      card_transfer: { label: 'کارت به کارت', className: 'bg-purple-500' },
      wallet: { label: 'کیف پول', className: 'bg-orange-500' }
    };

    const config = methodConfig[method] || { label: method, className: 'bg-gray-500' };

    return (
      <Badge className={`${config.className} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کل پرداخت‌ها</p>
                  <p className="text-2xl font-bold mt-1">{stats.total_payments}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کل درآمد</p>
                  <p className="text-2xl font-bold mt-1">{formatPrice(stats.total_revenue)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">در انتظار تایید</p>
                  <p className="text-2xl font-bold mt-1">{stats.pending_payments}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">میانگین پرداخت</p>
                  <p className="text-2xl font-bold mt-1">{formatPrice(stats.average_payment || 0)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            فیلترها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>وضعیت</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="completed">تکمیل شده</SelectItem>
                  <SelectItem value="failed">ناموفق</SelectItem>
                  <SelectItem value="rejected">رد شده</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>روش پرداخت</Label>
              <Select value={filterMethod} onValueChange={setFilterMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="gateway">درگاه بانکی</SelectItem>
                  <SelectItem value="card_transfer">کارت به کارت</SelectItem>
                  <SelectItem value="wallet">کیف پول</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={loadPayments} className="w-full">
                اعمال فیلتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              لیست پرداخت‌ها ({payments.length})
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (payments.length === 0) {
                  toast.error('داده‌ای برای خروجی وجود ندارد');
                  return;
                }
                exportPaymentsToExcel(payments);
                toast.success('فایل Excel دانلود شد');
              }}
            >
              <FileSpreadsheet className="w-4 h-4 ml-2" />
              خروجی Excel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>پرداختی یافت نشد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <Card key={payment.id} className="border-r-4 border-r-blue-500">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">شماره تراکنش</p>
                        <p className="font-bold">#{payment.id}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(payment.created_at)}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">کاربر</p>
                        <p className="font-medium">{payment.user_phone}</p>
                        <p className="text-xs text-gray-500 mt-1">{payment.listing_title}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">پلن</p>
                        <p className="font-medium">{payment.plan_name}</p>
                        <p className="text-sm font-bold text-green-600 mt-1">{formatPrice(payment.amount)}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-2">وضعیت</p>
                        {getStatusBadge(payment.status)}
                        <div className="mt-2">
                          {getMethodBadge(payment.payment_method)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          جزئیات
                        </Button>

                        {payment.status === 'pending' && payment.payment_method === 'card_transfer' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => handleApprove(payment.id)}
                            >
                              <CheckCircle className="w-4 h-4 ml-1" />
                              تایید
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="w-4 h-4 ml-1" />
                              رد
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      {selectedPayment && !showRejectDialog && (
        <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>جزئیات پرداخت #{selectedPayment.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>شماره تراکنش</Label>
                  <p className="font-bold">#{selectedPayment.id}</p>
                </div>
                <div>
                  <Label>تاریخ</Label>
                  <p>{formatDate(selectedPayment.created_at)}</p>
                </div>
                <div>
                  <Label>کاربر</Label>
                  <p>{selectedPayment.user_phone}</p>
                </div>
                <div>
                  <Label>آگهی</Label>
                  <p>{selectedPayment.listing_title}</p>
                </div>
                <div>
                  <Label>پلن</Label>
                  <p>{selectedPayment.plan_name}</p>
                </div>
                <div>
                  <Label>مبلغ</Label>
                  <p className="font-bold text-green-600">{formatPrice(selectedPayment.amount)}</p>
                </div>
                <div>
                  <Label>روش پرداخت</Label>
                  {getMethodBadge(selectedPayment.payment_method)}
                </div>
                <div>
                  <Label>وضعیت</Label>
                  {getStatusBadge(selectedPayment.status)}
                </div>
                {selectedPayment.gateway_name && (
                  <div>
                    <Label>درگاه</Label>
                    <p>{selectedPayment.gateway_name}</p>
                  </div>
                )}
                {selectedPayment.ref_id && (
                  <div>
                    <Label>شماره پیگیری</Label>
                    <p className="font-mono">{selectedPayment.ref_id}</p>
                  </div>
                )}
                {selectedPayment.rejection_reason && (
                  <div className="col-span-2">
                    <Label>دلیل رد</Label>
                    <p className="text-red-600">{selectedPayment.rejection_reason}</p>
                  </div>
                )}
              </div>

              {selectedPayment.receipt_image && (
                <div>
                  <Label>رسید پرداخت</Label>
                  <img
                    src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/${selectedPayment.receipt_image}`}
                    alt="رسید"
                    className="mt-2 max-w-full rounded-lg border"
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رد پرداخت</DialogTitle>
            <DialogDescription>
              لطفا دلیل رد پرداخت را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>دلیل رد</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="مثال: رسید نامعتبر است"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              رد پرداخت
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;
