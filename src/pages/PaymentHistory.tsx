import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  Download,
  Filter,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Eye
} from "lucide-react";
import { TableSkeleton } from "@/components/ui/Skeleton";

interface Payment {
  id: number;
  listing_id: number;
  listing_title: string;
  plan_name: string;
  amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string;
  status: string;
  ref_id?: string;
  created_at: string;
  verified_at?: string;
}

const PaymentHistory = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    payment_method: 'all',
    search: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    loadPayments();
  }, [filters]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.payment_method !== 'all') params.append('payment_method', filters.payment_method);
      if (filters.search) params.append('search', filters.search);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/payments/history?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setPayments(data.data);
      } else {
        toast.error('خطا در بارگذاری تاریخچه پرداخت');
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('خطا در بارگذاری تاریخچه پرداخت');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.payment_method !== 'all') params.append('payment_method', filters.payment_method);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/payments/export?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('فایل با موفقیت دانلود شد');
      } else {
        toast.error('خطا در دانلود فایل');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('خطا در دانلود فایل');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      completed: { variant: 'default', label: 'تکمیل شده', icon: CheckCircle },
      pending: { variant: 'secondary', label: 'در انتظار', icon: Clock },
      failed: { variant: 'destructive', label: 'ناموفق', icon: XCircle },
      expired: { variant: 'outline', label: 'منقضی شده', icon: XCircle }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      gateway: 'درگاه پرداخت',
      card_transfer: 'کارت به کارت',
      admin_featured: 'ویژه توسط ادمین'
    };
    return labels[method] || method;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateStats = () => {
    const completed = payments.filter(p => p.status === 'completed');
    const totalPaid = completed.reduce((sum, p) => sum + p.final_amount, 0);
    const totalDiscount = completed.reduce((sum, p) => sum + (p.discount_amount || 0), 0);

    return {
      total: payments.length,
      completed: completed.length,
      totalPaid,
      totalDiscount
    };
  };

  const stats = calculateStats();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">تاریخچه پرداخت‌ها</h1>
        <p className="text-gray-600">مشاهده و مدیریت پرداخت‌های خود</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">کل پرداخت‌ها</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">موفق</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">مجموع پرداختی</p>
              <p className="text-xl font-bold">{formatPrice(stats.totalPaid)} تومان</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">تخفیف دریافتی</p>
              <p className="text-xl font-bold text-green-600">{formatPrice(stats.totalDiscount)} تومان</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            فیلترها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <Input
                placeholder="جستجو..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full"
              />
            </div>
            <div>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({...filters, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="completed">تکمیل شده</SelectItem>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="failed">ناموفق</SelectItem>
                  <SelectItem value="expired">منقضی شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={filters.payment_method}
                onValueChange={(value) => setFilters({...filters, payment_method: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="روش پرداخت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="gateway">درگاه پرداخت</SelectItem>
                  <SelectItem value="card_transfer">کارت به کارت</SelectItem>
                  <SelectItem value="admin_featured">ویژه ادمین</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                placeholder="از تاریخ"
              />
            </div>
            <div>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                placeholder="تا تاریخ"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setFilters({
                status: 'all',
                payment_method: 'all',
                search: '',
                date_from: '',
                date_to: ''
              })}
            >
              پاک کردن فیلترها
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              دانلود Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>لیست پرداخت‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">هیچ پرداختی یافت نشد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شناسه</TableHead>
                  <TableHead>آگهی</TableHead>
                  <TableHead>پلن</TableHead>
                  <TableHead>مبلغ</TableHead>
                  <TableHead>تخفیف</TableHead>
                  <TableHead>مبلغ نهایی</TableHead>
                  <TableHead>روش پرداخت</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono">#{payment.id}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={payment.listing_title}>
                        {payment.listing_title}
                      </div>
                    </TableCell>
                    <TableCell>{payment.plan_name}</TableCell>
                    <TableCell>{formatPrice(payment.amount)}</TableCell>
                    <TableCell>
                      {payment.discount_amount > 0 ? (
                        <span className="text-green-600">
                          -{formatPrice(payment.discount_amount)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(payment.final_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getPaymentMethodLabel(payment.payment_method)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(payment.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Navigate to payment detail
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistory;
