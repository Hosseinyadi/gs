import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import adminApi from "@/services/admin-api";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
  BarChart3,
  PieChart
} from "lucide-react";

interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  todayRevenue: number;
  totalPayments: number;
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
  averagePayment: number;
  growthRate: number;
}

interface DailyRevenue {
  date: string;
  amount: number;
  count: number;
}

function AdminFinancialReport() {
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    loadFinancialData();
  }, [period]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      // در اینجا باید API واقعی صدا زده بشه
      // فعلاً داده‌های نمونه استفاده می‌کنیم
      
      // شبیه‌سازی API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // داده‌های نمونه
      const mockStats: FinancialStats = {
        totalRevenue: 125000000,
        monthlyRevenue: 45000000,
        weeklyRevenue: 12500000,
        todayRevenue: 2500000,
        totalPayments: 156,
        pendingPayments: 12,
        approvedPayments: 138,
        rejectedPayments: 6,
        averagePayment: 801282,
        growthRate: 15.5
      };

      // داده‌های روزانه نمونه
      const mockDaily: DailyRevenue[] = [];
      const days = parseInt(period);
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        mockDaily.push({
          date: date.toISOString().split('T')[0],
          amount: Math.floor(Math.random() * 5000000) + 500000,
          count: Math.floor(Math.random() * 10) + 1
        });
      }

      setStats(mockStats);
      setDailyRevenue(mockDaily);
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast.error('خطا در بارگذاری گزارش مالی');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      month: 'short',
      day: 'numeric'
    });
  };

  const exportReport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      // ساخت CSV
      let csv = 'تاریخ,مبلغ,تعداد\n';
      dailyRevenue.forEach(day => {
        csv += `${day.date},${day.amount},${day.count}\n`;
      });
      
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success('گزارش CSV دانلود شد');
    } else {
      toast.info('گزارش PDF در حال آماده‌سازی...');
    }
  };

  // محاسبه حداکثر مقدار برای نمودار
  const maxAmount = Math.max(...dailyRevenue.map(d => d.amount), 1);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-green-600" />
          گزارش مالی تفصیلی
        </h2>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">۷ روز</SelectItem>
              <SelectItem value="30">۳۰ روز</SelectItem>
              <SelectItem value="90">۹۰ روز</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadFinancialData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportReport('csv')}>
            <Download className="w-4 h-4 ml-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">درآمد کل</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(stats?.totalRevenue || 0)}
                </p>
                <p className="text-xs text-gray-400">تومان</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">درآمد این ماه</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPrice(stats?.monthlyRevenue || 0)}
                </p>
                <p className="text-xs text-gray-400">تومان</p>
              </div>
              <Calendar className="w-10 h-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">میانگین پرداخت</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatPrice(stats?.averagePayment || 0)}
                </p>
                <p className="text-xs text-gray-400">تومان</p>
              </div>
              <CreditCard className="w-10 h-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">رشد نسبت به ماه قبل</p>
                <p className={`text-2xl font-bold ${(stats?.growthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats?.growthRate || 0}%
                </p>
                <p className="text-xs text-gray-400">
                  {(stats?.growthRate || 0) >= 0 ? 'افزایش' : 'کاهش'}
                </p>
              </div>
              {(stats?.growthRate || 0) >= 0 ? (
                <TrendingUp className="w-10 h-10 text-green-200" />
              ) : (
                <TrendingDown className="w-10 h-10 text-red-200" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نمودار درآمد روزانه */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            نمودار درآمد روزانه
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-1">
            {dailyRevenue.map((day, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group"
              >
                <div className="relative w-full">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500"
                    style={{
                      height: `${(day.amount / maxAmount) * 200}px`,
                      minHeight: '4px'
                    }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      <div>{formatPrice(day.amount)} تومان</div>
                      <div>{day.count} پرداخت</div>
                    </div>
                  </div>
                </div>
                {index % Math.ceil(dailyRevenue.length / 10) === 0 && (
                  <span className="text-xs text-gray-400 mt-1 transform -rotate-45">
                    {formatDate(day.date)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* آمار پرداخت‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              وضعیت پرداخت‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  تایید شده
                </span>
                <span className="font-bold">{stats?.approvedPayments || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  در انتظار
                </span>
                <span className="font-bold">{stats?.pendingPayments || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  رد شده
                </span>
                <span className="font-bold">{stats?.rejectedPayments || 0}</span>
              </div>
              <hr />
              <div className="flex items-center justify-between font-bold">
                <span>مجموع</span>
                <span>{stats?.totalPayments || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>خلاصه درآمد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">امروز</span>
                <span className="font-bold text-green-600">
                  {formatPrice(stats?.todayRevenue || 0)} تومان
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">این هفته</span>
                <span className="font-bold text-blue-600">
                  {formatPrice(stats?.weeklyRevenue || 0)} تومان
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">این ماه</span>
                <span className="font-bold text-purple-600">
                  {formatPrice(stats?.monthlyRevenue || 0)} تومان
                </span>
              </div>
              <hr />
              <div className="flex items-center justify-between">
                <span className="font-bold">کل درآمد</span>
                <span className="font-bold text-xl text-green-600">
                  {formatPrice(stats?.totalRevenue || 0)} تومان
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminFinancialReport;
